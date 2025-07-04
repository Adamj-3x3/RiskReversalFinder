import React from "react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, ReferenceLine, CartesianGrid } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ChartPoint {
  price: number;
  profit: number;
}

export default function ProfitLossChart({ data }: { data: { price: number; profit: number }[] }) {
  if (!data?.length) return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Profit/Loss Chart</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="w-full h-64 bg-zinc-950/80 rounded-xl border border-cyan-700/40 shadow-inner p-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
              <CartesianGrid stroke="#23304a" strokeDasharray="3 3" />
              <XAxis dataKey="price" stroke="#64FFDA" tick={{ fill: '#64FFDA', fontSize: 12, fontFamily: 'monospace' }} />
              <YAxis stroke="#3A86FF" tick={{ fill: '#3A86FF', fontSize: 12, fontFamily: 'monospace' }} />
              <Tooltip contentStyle={{ background: '#0A192F', border: '1px solid #3A86FF', color: '#64FFDA', fontFamily: 'monospace' }} />
              <Line type="monotone" dataKey="profit" stroke="#64FFDA" strokeWidth={3} dot={false} isAnimationActive={true} />
              <ReferenceLine y={0} stroke="#3A86FF" strokeDasharray="2 2" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
} 