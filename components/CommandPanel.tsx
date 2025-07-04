import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import Image from 'next/image';

type StrategyType = "bullish" | "bearish";

interface CompanyInfo {
  logoUrl?: string;
  name?: string;
}

interface CommandPanelProps {
  ticker: string;
  setTicker: (v: string) => void;
  minDte: number;
  setMinDte: (v: number) => void;
  maxDte: number;
  setMaxDte: (v: number) => void;
  strategyType: StrategyType;
  setStrategyType: (v: StrategyType) => void;
  onAnalyze: () => void;
  isLoading: boolean;
  error: string | null;
  companyInfo: CompanyInfo;
}

export const CommandPanel: React.FC<CommandPanelProps> = ({
  ticker,
  setTicker,
  minDte,
  setMinDte,
  maxDte,
  setMaxDte,
  strategyType,
  setStrategyType,
  onAnalyze,
  isLoading,
  error,
  companyInfo,
}) => (
  <aside className="w-full max-w-xs bg-zinc-950/80 border border-cyan-700/40 rounded-2xl shadow-xl p-6 flex flex-col gap-6 backdrop-blur-md">
    <Card className="bg-transparent border-none shadow-none p-0">
      <CardHeader className="p-0 mb-4">
        <CardTitle className="text-slate-50 text-xl font-bold tracking-tight flex items-center gap-3">
          <Image
            src={companyInfo.logoUrl || "/placeholder-logo.png"}
            alt={companyInfo.name || "Company Logo"}
            width={40}
            height={40}
            className="w-8 h-8 rounded bg-white/10"
          />
          {companyInfo.name || "Analysis Parameters"}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <form
          className="space-y-5"
          onSubmit={e => { e.preventDefault(); onAnalyze(); }}
        >
          <div className="space-y-1">
            <Label htmlFor="ticker" className="text-slate-200 font-medium">Ticker Symbol</Label>
            <Input
              id="ticker"
              value={ticker}
              onChange={e => setTicker(e.target.value.toUpperCase())}
              placeholder="e.g. AAPL"
              className="bg-zinc-900 border-cyan-700/40 text-slate-50 placeholder:text-slate-500"
              autoComplete="off"
            />
          </div>
          <div className="flex gap-3">
            <div className="flex-1 space-y-1">
              <Label htmlFor="minDte" className="text-slate-200 font-medium">Min DTE</Label>
              <Input
                id="minDte"
                type="number"
                min={1}
                value={minDte}
                onChange={e => setMinDte(Number(e.target.value))}
                className="bg-zinc-900 border-cyan-700/40 text-slate-50 placeholder:text-slate-500"
              />
            </div>
            <div className="flex-1 space-y-1">
              <Label htmlFor="maxDte" className="text-slate-200 font-medium">Max DTE</Label>
              <Input
                id="maxDte"
                type="number"
                min={1}
                value={maxDte}
                onChange={e => setMaxDte(Number(e.target.value))}
                className="bg-zinc-900 border-cyan-700/40 text-slate-50 placeholder:text-slate-500"
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="strategyType" className="text-slate-200 font-medium">Strategy Type</Label>
            <Select value={strategyType} onValueChange={v => setStrategyType(v as StrategyType)}>
              <SelectTrigger className="bg-zinc-900 border-cyan-700/40 text-slate-50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bullish">Bullish</SelectItem>
                <SelectItem value="bearish">Bearish</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            type="submit"
            variant="default"
            className="w-full mt-2 bg-lime-400 text-zinc-900 font-bold text-lg shadow-lg hover:shadow-lime-400/30 hover:bg-lime-300 focus:ring-2 focus:ring-lime-400 focus:ring-offset-2 transition border border-lime-400/40"
            disabled={isLoading}
            style={{ boxShadow: '0 0 12px 2px #64FFDA55' }}
          >
            {isLoading ? "Analyzing..." : "Run Analysis"}
          </Button>
          {error && <div className="text-red-400 font-medium pt-2 text-sm">{error}</div>}
        </form>
      </CardContent>
    </Card>
  </aside>
); 