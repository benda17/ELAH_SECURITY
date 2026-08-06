#!/usr/bin/env python3
"""Copy rows from prisma/dev.db → Neon Postgres (tables that exist on both sides)."""

from __future__ import annotations

import os
import re
import sqlite3
import sys
from datetime import datetime, timezone
from pathlib import Path

import psycopg

ROOT = Path(__file__).resolve().parents[1]
SQLITE_PATH = ROOT / "prisma" / "dev.db"

# Parents → children
TABLE_ORDER = [
    "User",
    "CustomerProfile",
    "Session",
    "BankAccount",
    "Transaction",
    "Document",
    "CardRequest",
    "LoanRequest",
    "SupportTicket",
    "ManagerNote",
    "ApprovalRequest",
    "AuditLog",
    "AgentActionLog",
    "RiskEvent",
    "AgentConversation",
    "AgentMessage",
    "AgentPendingAction",
    "AgentEventLog",
    "IntentMatrixSeed",
    "AgentIntentEvent",
    "AgentIntentAggregate",
    "ElahTrainingEvent",
    "PromptInjectionScenario",
]


def log(msg: str) -> None:
    print(msg, flush=True)


def load_database_url() -> str:
    env = os.environ.get("DATABASE_URL")
    if env and env.startswith("postgres"):
        return env
    text = (ROOT / ".env").read_text()
    m = re.search(r'^DATABASE_URL=["\']?([^"\'\n]+)["\']?', text, re.M)
    if not m:
        raise SystemExit("DATABASE_URL not found")
    return m.group(1)


def quote_ident(name: str) -> str:
    return '"' + name.replace('"', '""') + '"'


def coerce(value, data_type: str):
    if value is None:
        return None
    if data_type == "boolean":
        if isinstance(value, bool):
            return value
        if isinstance(value, (int, float)):
            return bool(value)
        if isinstance(value, str):
            return value.strip().lower() in {"1", "true", "t", "yes"}
        return bool(value)
    if data_type in {
        "timestamp without time zone",
        "timestamp with time zone",
        "date",
    }:
        if isinstance(value, datetime):
            return value.replace(tzinfo=None) if value.tzinfo else value
        if isinstance(value, (int, float)):
            ts = float(value)
            # Prisma SQLite DateTime is ms since epoch (including older DOBs).
            if abs(ts) >= 1e11:
                ts /= 1000.0
            return datetime.fromtimestamp(ts, tz=timezone.utc).replace(tzinfo=None)
        if isinstance(value, str):
            text = value.strip().replace("Z", "+00:00")
            try:
                dt = datetime.fromisoformat(text)
                return dt.replace(tzinfo=None) if dt.tzinfo else dt
            except ValueError:
                return value
    return value


def main() -> None:
    url = load_database_url()
    sqlite = sqlite3.connect(SQLITE_PATH)
    sqlite.row_factory = sqlite3.Row

    sqlite_tables = {
        r[0]
        for r in sqlite.execute(
            "SELECT name FROM sqlite_master WHERE type='table' "
            "AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_prisma%'"
        )
    }

    with psycopg.connect(url) as pg:
        with pg.cursor() as cur:
            cur.execute(
                """
                SELECT table_name
                FROM information_schema.tables
                WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
                """
            )
            pg_tables = {r[0] for r in cur.fetchall()}

            cur.execute(
                """
                SELECT table_name, column_name, data_type
                FROM information_schema.columns
                WHERE table_schema = 'public'
                ORDER BY ordinal_position
                """
            )
            col_types: dict[tuple[str, str], str] = {}
            pg_cols: dict[str, list[str]] = {}
            for table, column, data_type in cur.fetchall():
                col_types[(table, column)] = data_type
                pg_cols.setdefault(table, []).append(column)

            ordered = [t for t in TABLE_ORDER if t in sqlite_tables and t in pg_tables]
            extras = sorted((sqlite_tables & pg_tables) - set(ordered))
            ordered.extend(extras)
            skipped = sorted(sqlite_tables - pg_tables)
            if skipped:
                log(f"Skipping SQLite-only tables: {', '.join(skipped)}")

            log(f"Truncating {len(ordered)} tables…")
            # Children first for truncate without needing CASCADE mid-migration.
            for table in reversed(ordered):
                cur.execute(f"TRUNCATE TABLE {quote_ident(table)} CASCADE")
            pg.commit()

            log(f"Copying {len(ordered)} tables…")
            for table in ordered:
                cols = [c for c in pg_cols[table]]
                # Keep only columns present in SQLite row
                sample = sqlite.execute(f"SELECT * FROM {quote_ident(table)} LIMIT 1").fetchone()
                if sample is None:
                    log(f"  {table}: 0 rows")
                    continue
                sqlite_cols = set(sample.keys())
                cols = [c for c in cols if c in sqlite_cols]
                col_list = ", ".join(quote_ident(c) for c in cols)
                select_list = ", ".join(quote_ident(c) for c in cols)

                count = sqlite.execute(
                    f"SELECT COUNT(*) FROM {quote_ident(table)}"
                ).fetchone()[0]
                log(f"  {table}: copying {count} rows…")

                rows = sqlite.execute(
                    f"SELECT {select_list} FROM {quote_ident(table)}"
                )

                with cur.copy(
                    f"COPY {quote_ident(table)} ({col_list}) FROM STDIN"
                ) as copy:
                    n = 0
                    for row in rows:
                        copy.write_row(
                            [
                                coerce(row[c], col_types.get((table, c), "text"))
                                for c in cols
                            ]
                        )
                        n += 1
                        if n % 5000 == 0:
                            log(f"    …{n}/{count}")
                log(f"  {table}: {n} rows")
                pg.commit()

    sqlite.close()
    log("Migration complete.")


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        log(f"ERROR: {exc}")
        sys.exit(1)
