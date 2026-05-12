"use client";

type Slice = { label: string; value: number; color: string };
type Props = {
  total: number;
  centerLabel: string;
  slices: Slice[];
  size?: number;
};

export default function Donut({ total, centerLabel, slices, size = 220 }: Props) {
  const radius = (size - 30) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const sumValues = slices.reduce((s, x) => s + x.value, 0) || 1;

  // half-circle (gauge style) like screenshot
  const startAngle = Math.PI; // 180°
  const endAngle = 2 * Math.PI; // 360° (top side)
  const totalArc = endAngle - startAngle;

  let cursor = startAngle;
  const arcs = slices.map((s) => {
    const a0 = cursor;
    const a1 = cursor + (s.value / sumValues) * totalArc;
    cursor = a1;
    return { ...s, a0, a1 };
  });

  const pointFor = (angle: number, r: number) => [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];

  const arcPath = (a0: number, a1: number, rOuter: number, rInner: number) => {
    const [x1, y1] = pointFor(a0, rOuter);
    const [x2, y2] = pointFor(a1, rOuter);
    const [x3, y3] = pointFor(a1, rInner);
    const [x4, y4] = pointFor(a0, rInner);
    const large = a1 - a0 > Math.PI ? 1 : 0;
    return `M ${x1} ${y1} A ${rOuter} ${rOuter} 0 ${large} 1 ${x2} ${y2} L ${x3} ${y3} A ${rInner} ${rInner} 0 ${large} 0 ${x4} ${y4} Z`;
  };

  return (
    <div className="flex flex-col items-center">
      <svg viewBox={`0 0 ${size} ${size * 0.62}`} className="w-full h-auto" style={{ overflow: "visible" }}>
        {arcs.map((a, i) => (
          <path key={i} d={arcPath(a.a0 + 0.012, a.a1 - 0.012, radius, radius - 28)} fill={a.color} />
        ))}
        <text x={cx} y={cy - 6} textAnchor="middle" fontSize="34" fontWeight={800} fill="#0f1115">{total}</text>
        <text x={cx} y={cy + 14} textAnchor="middle" fontSize="11" fill="#5b6370">{centerLabel}</text>
      </svg>
    </div>
  );
}
