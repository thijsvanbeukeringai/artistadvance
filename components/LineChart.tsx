"use client";

type Series = { label: string; values: number[]; color: string; faded?: boolean };
type Props = {
  months: string[];
  series: Series[];
  height?: number;
  highlightIndex?: number;
};

export default function LineChart({ months, series, height = 260, highlightIndex = 7 }: Props) {
  const padX = 32;
  const padY = 20;
  const width = 720;
  const max = Math.max(...series.flatMap((s) => s.values), 10);
  const yTicks = 7;
  const stepY = max / yTicks;

  const x = (i: number) => padX + (i * (width - padX * 2)) / (months.length - 1);
  const y = (v: number) => height - padY - (v / max) * (height - padY * 2);

  const path = (vals: number[]) =>
    vals
      .map((v, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${y(v).toFixed(1)}`)
      .join(" ");

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
        {/* y-axis grid + labels */}
        {Array.from({ length: yTicks + 1 }, (_, i) => {
          const val = Math.round(stepY * i);
          const yy = y(val);
          return (
            <g key={i}>
              <line x1={padX} x2={width - padX} y1={yy} y2={yy} stroke="#eef0f4" />
              <text x={padX - 8} y={yy + 4} textAnchor="end" fontSize="11" fill="#8a92a0">{val}</text>
            </g>
          );
        })}

        {/* x-axis labels */}
        {months.map((m, i) => (
          <text key={m} x={x(i)} y={height - 4} textAnchor="middle" fontSize="11" fill="#8a92a0">{m}</text>
        ))}

        {/* series */}
        {series.map((s) => (
          <g key={s.label}>
            <path d={path(s.values)} fill="none" stroke={s.color} strokeWidth={s.faded ? 2 : 2.5} strokeLinecap="round" strokeLinejoin="round" opacity={s.faded ? 0.35 : 1} />
            {s.values.map((v, i) => (
              <circle key={i} cx={x(i)} cy={y(v)} r={i === highlightIndex && !s.faded ? 5 : 3.5} fill="white" stroke={s.color} strokeWidth={2} opacity={s.faded ? 0.45 : 1} />
            ))}
          </g>
        ))}

        {/* highlight tooltip */}
        {(() => {
          const main = series[0];
          if (!main) return null;
          const cx = x(highlightIndex);
          const cy = y(main.values[highlightIndex]);
          return (
            <g>
              <line x1={cx} x2={cx} y1={padY} y2={height - padY} stroke="#0f1115" strokeDasharray="3 3" opacity="0.15" />
              <g transform={`translate(${cx + 12}, ${cy - 38})`}>
                <rect width="148" height="58" rx="8" fill="white" stroke="#e3e6eb" />
                <text x="12" y="20" fontSize="11" fontWeight={600} fill="#0f1115">{months[highlightIndex]} 2026</text>
                {series.map((s, i) => (
                  <g key={s.label} transform={`translate(12, ${36 + i * 14})`}>
                    <circle cx="3" cy="-3" r="3" fill={s.color} />
                    <text x="12" fontSize="10" fill="#5b6370">{s.label} : {s.values[highlightIndex]}</text>
                  </g>
                ))}
              </g>
            </g>
          );
        })()}
      </svg>
    </div>
  );
}
