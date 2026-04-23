import { useMemo } from "react";
import { motion } from "framer-motion";
import { formatBRL } from "@/lib/finance-data";

interface FlowPoint {
  day: number;
  actual: number | null;
  projected: number;
  isToday: boolean;
}

interface FlowStreamgraphProps {
  data: FlowPoint[];
  currentBalance: number;
  projectedBalance: number;
  warning?: boolean;
}

export function FlowStreamgraph({ data, currentBalance, projectedBalance, warning }: FlowStreamgraphProps) {
  const width = 720;
  const height = 220;
  const pad = { top: 20, right: 16, bottom: 28, left: 16 };

  const { actualPath, projectedPath, projectedArea, zeroY, points } = useMemo(() => {
    const all = data.flatMap((d) => [d.projected, d.actual ?? 0]);
    const max = Math.max(...all, 100);
    const min = Math.min(...all, 0);
    const span = max - min || 1;

    const xStep = (width - pad.left - pad.right) / Math.max(1, data.length - 1);
    const y = (v: number) =>
      pad.top + (height - pad.top - pad.bottom) * (1 - (v - min) / span);
    const x = (i: number) => pad.left + i * xStep;

    const projectedPath = data
      .map((d, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(d.projected)}`)
      .join(" ");

    const projectedArea =
      `${projectedPath} L ${x(data.length - 1)} ${y(0)} L ${x(0)} ${y(0)} Z`;

    const actualPts = data.filter((d) => d.actual !== null);
    const actualPath = actualPts
      .map((d, i) => {
        const idx = data.indexOf(d);
        return `${i === 0 ? "M" : "L"} ${x(idx)} ${y(d.actual as number)}`;
      })
      .join(" ");

    return {
      actualPath,
      projectedPath,
      projectedArea,
      zeroY: y(0),
      points: data.map((d, i) => ({ ...d, cx: x(i), cy: y(d.projected) })),
    };
  }, [data]);

  const stroke = warning ? "url(#warningGradient)" : "url(#primaryGradient)";
  const strokeProjected = warning ? "oklch(0.78 0.16 70 / 0.4)" : "oklch(0.72 0.16 195 / 0.4)";

  return (
    <div className="relative w-full">
      <div className="mb-4 flex items-end justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Saldo atual</p>
          <motion.p
            key={currentBalance}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-semibold tracking-tight text-gradient-primary"
          >
            {formatBRL(currentBalance)}
          </motion.p>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Previsto fim do mês</p>
          <p className="text-xl font-medium text-foreground/80">{formatBRL(projectedBalance)}</p>
        </div>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} className="h-[220px] w-full">
        <defs>
          <linearGradient id="primaryGradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="oklch(0.72 0.16 195)" />
            <stop offset="100%" stopColor="oklch(0.78 0.18 175)" />
          </linearGradient>
          <linearGradient id="primaryArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="oklch(0.72 0.16 195 / 0.35)" />
            <stop offset="100%" stopColor="oklch(0.72 0.16 195 / 0)" />
          </linearGradient>
          <linearGradient id="warningGradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="oklch(0.78 0.16 70)" />
            <stop offset="100%" stopColor="oklch(0.7 0.2 45)" />
          </linearGradient>
          <linearGradient id="warningArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="oklch(0.78 0.16 70 / 0.32)" />
            <stop offset="100%" stopColor="oklch(0.78 0.16 70 / 0)" />
          </linearGradient>
        </defs>

        {/* zero line */}
        <line
          x1={pad.left}
          x2={width - pad.right}
          y1={zeroY}
          y2={zeroY}
          stroke="oklch(1 0 0 / 0.08)"
          strokeDasharray="4 6"
        />

        {/* projected area (faded "wave") */}
        <motion.path
          d={projectedArea}
          fill={warning ? "url(#warningArea)" : "url(#primaryArea)"}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        />

        {/* projected line (dashed) */}
        <motion.path
          d={projectedPath}
          fill="none"
          stroke={strokeProjected}
          strokeWidth={2}
          strokeDasharray="5 5"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />

        {/* actual line (solid bold) */}
        <motion.path
          d={actualPath}
          fill="none"
          stroke={stroke}
          strokeWidth={3.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.4, ease: "easeOut" }}
        />

        {/* today dot */}
        {points
          .filter((p) => p.isToday && p.actual !== null)
          .map((p) => (
            <g key={p.day}>
              <motion.circle
                cx={p.cx}
                cy={p.cy}
                r={6}
                fill={warning ? "oklch(0.78 0.16 70)" : "oklch(0.78 0.18 175)"}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 1.2, type: "spring", stiffness: 240 }}
              />
              <motion.circle
                cx={p.cx}
                cy={p.cy}
                r={12}
                fill="none"
                stroke={warning ? "oklch(0.78 0.16 70 / 0.4)" : "oklch(0.78 0.18 175 / 0.4)"}
                strokeWidth={2}
                animate={{ r: [10, 18, 10], opacity: [0.6, 0, 0.6] }}
                transition={{ duration: 2.4, repeat: Infinity }}
              />
            </g>
          ))}

        {/* day axis ticks */}
        {[1, 8, 15, 22, points.length].map((d) => {
          const p = points[d - 1];
          if (!p) return null;
          return (
            <text
              key={d}
              x={p.cx}
              y={height - 8}
              textAnchor="middle"
              className="fill-muted-foreground"
              style={{ fontSize: 10 }}
            >
              {d}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
