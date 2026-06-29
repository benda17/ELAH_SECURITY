"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Row = {
  date: string;
  label: string;
  debit: number;
  credit: number;
  debitCount: number;
  creditCount: number;
};

const fmt = (v: number) =>
  new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(v);

export function TransactionVolumeChart({ data }: { data: Row[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 8, right: 12, left: -6, bottom: 0 }}>
        <defs>
          <linearGradient id="gDebit" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fb7185" stopOpacity={0.55} />
            <stop offset="100%" stopColor="#fb7185" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gCredit" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#34d399" stopOpacity={0.55} />
            <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="label" tickLine={false} axisLine={false} />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={48}
          tickFormatter={(v) => `$${fmt(v)}`}
        />
        <Tooltip
          contentStyle={{
            background: "#111a2c",
            border: "1px solid #1f2b45",
            borderRadius: 10,
            fontSize: 12,
          }}
          formatter={(value: number) => `$${value.toLocaleString()}`}
        />
        <Area
          type="monotone"
          dataKey="credit"
          name="Credits (in)"
          stroke="#34d399"
          fill="url(#gCredit)"
          strokeWidth={2}
        />
        <Area
          type="monotone"
          dataKey="debit"
          name="Debits (out)"
          stroke="#fb7185"
          fill="url(#gDebit)"
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
