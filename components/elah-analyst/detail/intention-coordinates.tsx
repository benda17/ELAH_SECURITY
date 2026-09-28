import { Card, CardHeader } from "@/components/ui/card";
import { Table, THead, TR, TH, TD } from "@/components/ui/table";
import type { ElahScoreSnapshot } from "@/lib/elah/score-read";
import { Banner } from "./primitives";
import {
  AXES,
  DEFAULT_PLOT,
  axisLevel,
  projectPoint,
  regionReading,
  toPlotX,
  toPlotY,
} from "./coordinates";

const TICKS = [0, 0.25, 0.5, 0.75, 1];

function fmt(value: number | null): string {
  return value == null ? "—" : value.toFixed(3);
}

export function IntentionCoordinates({ snapshot }: { snapshot: ElahScoreSnapshot | null }) {
  const scored = snapshot?.kind === "scored" ? snapshot : null;
  const coordinates = scored?.coordinates ?? null;
  const abstained = scored?.status === "abstained";
  const point = projectPoint(coordinates, { confidence: scored?.confidence, abstained });
  const region = regionReading(coordinates);
  const g = DEFAULT_PLOT;
  const x0 = toPlotX(0);
  const x1 = toPlotX(1);
  const y0 = toPlotY(0);
  const y1 = toPlotY(1);
  const mid = { x: toPlotX(0.5), y: toPlotY(0.5) };

  const summary = point
    ? `Intention point: Human Agency ${fmt(coordinates!.humanAgency)}, Financial Risk ${fmt(
        coordinates!.financialRisk,
      )}, Emotional Urgency ${fmt(coordinates!.emotionalUrgency)}${abstained ? ", abstained" : ""}.`
    : "No intention point to plot.";

  return (
    <Card>
      <CardHeader
        title="Intention coordinates"
        description="Stored snapshot point on the Phase 7 cube: X = Human Agency, Y = Financial Risk, bubble size = Emotional Urgency, opacity = confidence. Coordinates explain; they never allow or block. elahScore is not an axis."
      />

      {!snapshot ? (
        <p className="text-sm text-ink-muted">Not scored — no point to plot.</p>
      ) : snapshot.kind === "unavailable" ? (
        <p className="text-sm text-ink-muted">Score unavailable — no point is drawn and none is invented.</p>
      ) : !coordinates || !point ? (
        <p className="text-sm text-ink-muted">
          This snapshot has no coordinates (or is missing Human Agency / Financial Risk). Nothing is plotted.
        </p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
          <figure className="mx-auto w-full max-w-[320px]">
            <svg
              viewBox={`0 0 ${g.width} ${g.height}`}
              role="img"
              aria-label={summary}
              className="h-auto w-full text-ink-subtle"
            >
              <rect
                x={x0}
                y={y1}
                width={x1 - x0}
                height={y0 - y1}
                className="fill-bg-panel/40 stroke-current"
                strokeWidth={1}
              />
              {TICKS.map((t) => (
                <g key={t}>
                  <line x1={toPlotX(t)} x2={toPlotX(t)} y1={y1} y2={y0} className="stroke-current" strokeOpacity={0.15} />
                  <line x1={x0} x2={x1} y1={toPlotY(t)} y2={toPlotY(t)} className="stroke-current" strokeOpacity={0.15} />
                  <text x={toPlotX(t)} y={y0 + 14} textAnchor="middle" className="fill-current text-[9px]">
                    {t}
                  </text>
                  <text x={x0 - 6} y={toPlotY(t) + 3} textAnchor="end" className="fill-current text-[9px]">
                    {t}
                  </text>
                </g>
              ))}
              <line x1={mid.x} x2={mid.x} y1={y1} y2={y0} className="stroke-current" strokeOpacity={0.35} strokeDasharray="3 3" />
              <line x1={x0} x2={x1} y1={mid.y} y2={mid.y} className="stroke-current" strokeOpacity={0.35} strokeDasharray="3 3" />
              <text x={x0 + 4} y={y1 + 12} className="fill-current text-[8px]">steered / hostile high-harm</text>
              <text x={x1 - 4} y={y1 + 12} textAnchor="end" className="fill-current text-[8px]">deliberate high-impact</text>
              <text x={x0 + 4} y={y0 - 6} className="fill-current text-[8px]">off-domain / empty</text>
              <text x={x1 - 4} y={y0 - 6} textAnchor="end" className="fill-current text-[8px]">deliberate read</text>
              <text x={(x0 + x1) / 2} y={g.height - 6} textAnchor="middle" className="fill-current text-[10px]">
                Human Agency (X)
              </text>
              <text
                x={12}
                y={(y0 + y1) / 2}
                textAnchor="middle"
                transform={`rotate(-90 12 ${(y0 + y1) / 2})`}
                className="fill-current text-[10px]"
              >
                Financial Risk (Y)
              </text>
              <circle
                cx={point.cx}
                cy={point.cy}
                r={point.r}
                className={point.hollow ? "fill-none stroke-accent-cyan" : "fill-accent-cyan stroke-accent-cyan"}
                strokeWidth={point.hollow ? 2.5 : 1}
                strokeDasharray={point.hollow ? "4 2" : undefined}
                fillOpacity={point.hollow ? undefined : point.opacity}
                strokeOpacity={point.opacity}
              />
            </svg>
            <figcaption className="mt-2 text-xs text-ink-subtle">
              {abstained ? "Hollow dashed ring = abstained (point not moved). " : null}
              {point.zMissing ? "Emotional Urgency not reported; default bubble size. " : null}
              {point.clamped ? "A stored value is outside 0–1 and was clamped for drawing only. " : null}
              Region labels are axis readings, not verdicts.
            </figcaption>
          </figure>

          <div className="min-w-0 space-y-4">
            <Table>
              <caption className="sr-only">Intention coordinates (text fallback for the plot)</caption>
              <THead>
                <TR>
                  <TH>Axis</TH>
                  <TH>Value</TH>
                  <TH>Level</TH>
                  <TH className="hidden sm:table-cell">Low ↔ high meaning</TH>
                </TR>
              </THead>
              <tbody>
                {AXES.map((axis) => {
                  const value = coordinates[axis.key];
                  return (
                    <TR key={axis.key}>
                      <TD>
                        <div className="text-ink">{axis.label}</div>
                        <div className="text-xs text-ink-subtle">
                          {axis.short} · {axis.plot}
                        </div>
                      </TD>
                      <TD className="font-mono">{fmt(value)}</TD>
                      <TD className="text-ink-muted">{axisLevel(value) ?? "—"}</TD>
                      <TD className="hidden text-xs text-ink-muted sm:table-cell">
                        {axis.low} ↔ {axis.high}
                      </TD>
                    </TR>
                  );
                })}
              </tbody>
            </Table>
            {region ? (
              <Banner title="Axis reading (display only)" tone="info">
                {region} High Financial Risk means harm if the tool ran — not fraud, and not a deny.
              </Banner>
            ) : null}
          </div>
        </div>
      )}
    </Card>
  );
}
