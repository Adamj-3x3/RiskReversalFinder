import React from "react";
import { Card } from "@/components/ui/card";

interface MetricWidgetProps {
  label: string;
  value: string | number;
  accent?: "green" | "blue";
}

export const MetricWidget: React.FC<MetricWidgetProps> = ({ label, value, accent = "blue" }) => (
  <Card className={`backdrop-blur-md bg-zinc-950/80 border-2 rounded-xl px-6 py-4 flex flex-col items-center shadow-md ${accent === "green" ? "border-lime-400/70" : "border-cyan-500/70"}`}>
    <span className="text-xs uppercase tracking-widest text-cyan-400 font-semibold mb-1">{label}</span>
    <span className={`text-2xl font-mono font-bold ${accent === "green" ? "text-lime-400" : "text-cyan-400"}`}>{value}</span>
  </Card>
); 