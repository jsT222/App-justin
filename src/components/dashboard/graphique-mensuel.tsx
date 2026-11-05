"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const SERIES = [
  { cle: "prospects", label: "Prospects ajoutés", couleur: "var(--color-chart-1)" },
  { cle: "rdv", label: "RDV obtenus", couleur: "var(--color-chart-2)" },
  { cle: "signatures", label: "Signatures", couleur: "var(--color-chart-3)" },
];

export function GraphiqueMensuel({ donnees }: { donnees: { mois: string; prospects: number; rdv: number; signatures: number }[] }) {
  return (
    <div className="h-64 w-full" role="img" aria-label="Prospects ajoutés, RDV obtenus et signatures par mois">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={donnees} barGap={2} margin={{ top: 4, right: 4, bottom: 0, left: -24 }}>
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis dataKey="mois" tickLine={false} axisLine={false} fontSize={12} stroke="var(--muted-foreground)" />
          <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} stroke="var(--muted-foreground)" />
          <Tooltip
            cursor={{ fill: "var(--muted)", opacity: 0.5 }}
            contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12, color: "var(--popover-foreground)" }}
          />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
          {SERIES.map((s) => (
            <Bar key={s.cle} dataKey={s.cle} name={s.label} fill={s.couleur} radius={[3, 3, 0, 0]} maxBarSize={18} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
