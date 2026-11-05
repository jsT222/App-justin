"use client";

import { Bar, BarChart, CartesianGrid, Legend, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

type S = { semaine: string; linkedin: number; appels: number; emails: number };
const COLS = [
  { cle: "linkedin", label: "LinkedIn", couleur: "var(--color-chart-1)" },
  { cle: "appels", label: "Appels", couleur: "var(--color-chart-2)" },
  { cle: "emails", label: "Emails", couleur: "var(--color-chart-3)" },
] as const;

export function HistoriqueSemaines({ semaines, cibles }: { semaines: S[]; cibles: Record<"linkedin" | "appels" | "emails", number> }) {
  return (
    <div className="grid gap-4">
      <div className="h-56" role="img" aria-label="Activité de prospection par semaine">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={semaines} margin={{ top: 4, right: 4, bottom: 0, left: -24 }}>
            <CartesianGrid vertical={false} stroke="var(--border)" />
            <XAxis dataKey="semaine" tickLine={false} axisLine={false} fontSize={12} stroke="var(--muted-foreground)" />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} stroke="var(--muted-foreground)" />
            <Tooltip cursor={{ fill: "var(--muted)", opacity: 0.5 }} contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
            <ReferenceLine y={cibles.linkedin} stroke="var(--color-chart-1)" strokeDasharray="4 4" />
            {COLS.map((c) => <Bar key={c.cle} dataKey={c.cle} name={c.label} fill={c.couleur} radius={[3, 3, 0, 0]} maxBarSize={16} />)}
          </BarChart>
        </ResponsiveContainer>
      </div>
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Semaine du</TableHead>
            {COLS.map((c) => <TableHead key={c.cle} className="text-right">{c.label} <span className="font-normal">/ {cibles[c.cle]}</span></TableHead>)}
          </TableRow>
        </TableHeader>
        <TableBody>
          {[...semaines].reverse().map((s) => (
            <TableRow key={s.semaine}>
              <TableCell>{s.semaine}</TableCell>
              {COLS.map((c) => (
                <TableCell key={c.cle} className={cn("text-right tabular-nums", s[c.cle] >= cibles[c.cle] && cibles[c.cle] > 0 && "font-medium text-success")}>{s[c.cle]}</TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
