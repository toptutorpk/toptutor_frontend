/* Lightweight, dependency-free SVG charts for the admin portal. Theme-aware:
   grid/labels use currentColor via text-* utilities; series use explicit brand colors. */

export interface Series {
  label: string;
  color: string;
  data: number[];
}

/** Multi-series area + line trend chart. Responsive (scales with container width). */
export function AreaChart({
  series,
  labels,
  height = 240,
  format = (v: number) => String(v),
}: {
  series: Series[];
  labels: string[];
  height?: number;
  format?: (v: number) => string;
}) {
  const w = 720;
  const h = height;
  const pad = { t: 16, r: 16, b: 28, l: 44 };
  const iw = w - pad.l - pad.r;
  const ih = h - pad.t - pad.b;
  const n = labels.length;
  const max = Math.max(...series.flatMap((s) => s.data), 1) * 1.1;
  const x = (i: number) => pad.l + (n <= 1 ? iw / 2 : (i / (n - 1)) * iw);
  const y = (v: number) => pad.t + ih - (v / max) * ih;
  const gridLines = [0, 0.25, 0.5, 0.75, 1];

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" role="img">
      <defs>
        {series.map((s, i) => (
          <linearGradient key={i} id={`area-${i}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={s.color} stopOpacity="0.28" />
            <stop offset="100%" stopColor={s.color} stopOpacity="0" />
          </linearGradient>
        ))}
      </defs>

      {/* grid + y labels */}
      {gridLines.map((g, i) => {
        const yy = pad.t + ih - g * ih;
        return (
          <g key={i} className="text-border">
            <line x1={pad.l} y1={yy} x2={w - pad.r} y2={yy} stroke="currentColor" strokeWidth="1" />
            <text
              x={pad.l - 8}
              y={yy + 3}
              textAnchor="end"
              fill="currentColor"
              className="text-muted-foreground text-[10px]"
            >
              {format(Math.round(g * max))}
            </text>
          </g>
        );
      })}

      {/* x labels (thin out if many) */}
      {labels.map((l, i) => {
        const showEvery = n > 8 ? 2 : 1;
        if (i % showEvery !== 0 && i !== n - 1) return null;
        return (
          <text
            key={i}
            x={x(i)}
            y={h - 8}
            textAnchor="middle"
            fill="currentColor"
            className="text-muted-foreground text-[10px]"
          >
            {l}
          </text>
        );
      })}

      {/* series */}
      {series.map((s, si) => {
        const line = s.data.map((v, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(v)}`).join(' ');
        const area = `${line} L ${x(n - 1)} ${pad.t + ih} L ${x(0)} ${pad.t + ih} Z`;
        return (
          <g key={si}>
            <path d={area} fill={`url(#area-${si})`} />
            <path d={line} fill="none" stroke={s.color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
            {s.data.map((v, i) => (
              <circle key={i} cx={x(i)} cy={y(v)} r="3" fill={s.color} className="opacity-0 hover:opacity-100">
                <title>{`${labels[i]}: ${format(v)}`}</title>
              </circle>
            ))}
          </g>
        );
      })}
    </svg>
  );
}

/** Donut chart with a center total and a legend. */
export function Donut({
  data,
  size = 200,
  thickness = 26,
  centerLabel = 'Total',
  format = (v: number) => v.toLocaleString(),
}: {
  data: { label: string; value: number; color: string }[];
  size?: number;
  thickness?: number;
  centerLabel?: string;
  format?: (v: number) => string;
}) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center sm:gap-6">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
        {/* Arcs start at 12 o'clock via a rotate on each ring; text stays upright. */}
        <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={thickness} className="stroke-secondary" />
          {data.map((d, i) => {
            const len = (d.value / total) * c;
            const el = (
              <circle
                key={i}
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                stroke={d.color}
                strokeWidth={thickness}
                strokeDasharray={`${len} ${c - len}`}
                strokeDashoffset={-offset}
                strokeLinecap="butt"
              />
            );
            offset += len;
            return el;
          })}
        </g>
        <text x={size / 2} y={size / 2 - 2} textAnchor="middle" className="fill-foreground text-lg font-bold">
          {format(total)}
        </text>
        <text x={size / 2} y={size / 2 + 14} textAnchor="middle" className="fill-muted-foreground text-[10px]">
          {centerLabel}
        </text>
      </svg>
      <ul className="w-full space-y-2">
        {data.map((d) => (
          <li key={d.label} className="flex items-center gap-2.5 text-sm">
            <span className="h-3 w-3 shrink-0 rounded-sm" style={{ backgroundColor: d.color }} />
            <span className="flex-1 text-muted-foreground">{d.label}</span>
            <span className="font-semibold">{format(d.value)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Horizontal bar list — great for rankings (top subjects, revenue by stream). */
export function HBarList({
  items,
  format = (v: number) => v.toLocaleString(),
}: {
  items: { label: string; value: number; color?: string }[];
  format?: (v: number) => string;
}) {
  const max = Math.max(...items.map((i) => i.value), 1);
  return (
    <ul className="space-y-3">
      {items.map((it) => (
        <li key={it.label}>
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="font-medium">{it.label}</span>
            <span className="text-muted-foreground">{format(it.value)}</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-[3px] bg-secondary">
            <div
              className="h-full rounded-[3px]"
              style={{ width: `${(it.value / max) * 100}%`, backgroundColor: it.color ?? '#2563eb' }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
