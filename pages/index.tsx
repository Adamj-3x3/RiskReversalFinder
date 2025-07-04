import React, { useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";

type StrategyType = "bullish" | "bearish";

interface AnalysisResult {
  summary: string;
  risk: string;
  pricing_comparison: string;
  top_5: Array<[string, string, string, string, string, string, string]>;
}

export default function Home() {
  const [ticker, setTicker] = useState("");
  const [minDte, setMinDte] = useState(30);
  const [maxDte, setMaxDte] = useState(90);
  const [strategyType, setStrategyType] = useState<StrategyType>("bullish");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    setError(null);
    setResult(null);
    if (!ticker.trim()) {
      setError("Please enter a ticker symbol.");
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch(`/api/analyze/${strategyType}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticker: ticker.trim().toUpperCase(),
          min_dte: minDte,
          max_dte: maxDte,
        }),
      });
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }
      const data = await response.json();
      setResult(data.result);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "An unknown error occurred during analysis."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const clearResults = () => {
    setResult(null);
    setError(null);
  };

  const parseSummary = (summary: string) => {
    const lines = summary.split("\n").filter(Boolean);
    return lines
      .map((line) => {
        const [label, ...rest] = line.split(":");
        if (!rest.length) return null;
        return { label: label.trim(), value: rest.join(":").trim() };
      })
      .filter(Boolean) as { label: string; value: string }[];
  };

  return (
    <div className="min-h-screen w-full bg-zinc-900 text-slate-400 font-sans">
      {/* Header */}
      <header className="w-full py-6 mb-8 bg-zinc-950 border-b border-zinc-800 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-lime-400 to-green-500 rounded-lg flex items-center justify-center">
              <span className="text-zinc-900 font-bold text-lg">VE</span>
            </div>
            <span className="text-slate-50 text-xl font-bold tracking-tight">VegaEdge</span>
            <span className="text-lime-400 text-sm font-semibold ml-2">Risk Reversal Finder</span>
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Left: Form Card */}
        <div className="flex justify-center lg:block">
          <Card className="bg-zinc-950 border-zinc-800 shadow-lg w-full max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="text-slate-50 text-2xl mb-1">Analysis Parameters</CardTitle>
              <CardDescription className="text-slate-400">Enter your criteria to find the best risk reversal trades.</CardDescription>
            </CardHeader>
            <CardContent>
              <form
                className="space-y-6"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleAnalyze();
                }}
              >
                <div className="space-y-2">
                  <Label htmlFor="ticker" className="text-slate-200 font-medium">Ticker Symbol</Label>
                  <Input
                    id="ticker"
                    value={ticker}
                    onChange={(e) => setTicker(e.target.value.toUpperCase())}
                    placeholder="e.g. AAPL"
                    className="bg-zinc-900 border-zinc-700 text-slate-50 placeholder:text-slate-500"
                    autoComplete="off"
                  />
                </div>
                <div className="flex gap-4">
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="minDte" className="text-slate-200 font-medium">Min Days to Expiry</Label>
                    <Input
                      id="minDte"
                      type="number"
                      min={1}
                      value={minDte}
                      onChange={(e) => setMinDte(Number(e.target.value))}
                      className="bg-zinc-900 border-zinc-700 text-slate-50 placeholder:text-slate-500"
                    />
                  </div>
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="maxDte" className="text-slate-200 font-medium">Max Days to Expiry</Label>
                    <Input
                      id="maxDte"
                      type="number"
                      min={1}
                      value={maxDte}
                      onChange={(e) => setMaxDte(Number(e.target.value))}
                      className="bg-zinc-900 border-zinc-700 text-slate-50 placeholder:text-slate-500"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="strategyType" className="text-slate-200 font-medium">Strategy Type</Label>
                  <Select
                    value={strategyType}
                    onValueChange={(v) => setStrategyType(v as StrategyType)}
                  >
                    <SelectTrigger className="bg-zinc-900 border-zinc-700 text-slate-50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bullish">Bullish</SelectItem>
                      <SelectItem value="bearish">Bearish</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-3 pt-2">
                  <Button
                    type="submit"
                    variant="default"
                    className="bg-lime-400 text-zinc-900 font-bold hover:bg-lime-300 transition w-1/2"
                    disabled={isLoading}
                  >
                    {isLoading ? "Analyzing..." : "Run Analysis"}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={clearResults}
                    className="text-slate-400 border border-zinc-700 w-1/2"
                    disabled={isLoading}
                  >
                    Clear Results
                  </Button>
                </div>
                {error && (
                  <div className="text-red-400 font-medium pt-2">{error}</div>
                )}
              </form>
            </CardContent>
          </Card>
        </div>
        {/* Right: Results */}
        <div className="flex flex-col gap-8">
          {/* Top Recommended Trade */}
          <Card className="bg-zinc-950 border-zinc-800 shadow-lg flex-1 min-h-[220px]">
            <CardHeader>
              <CardTitle className="text-slate-50 text-xl">Top Recommended Trade</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-32 w-full rounded-lg bg-zinc-800" />
              ) : !result ? (
                <div className="text-slate-500 italic text-center py-8">
                  {error
                    ? "No results to display."
                    : "Enter parameters and run analysis to see results here."}
                </div>
              ) : result.summary && result.summary.includes(":") ? (
                <Table>
                  <TableBody>
                    {parseSummary(result.summary).map((row) => (
                      <TableRow key={row.label}>
                        <TableCell className="font-semibold text-slate-200 w-1/2">
                          {row.label}
                        </TableCell>
                        <TableCell className="text-lime-400 font-mono w-1/2">
                          {row.value}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-slate-500 italic text-center py-8">
                  No trades found for the specified criteria.
                </div>
              )}
            </CardContent>
          </Card>
          {/* Strategy Overview & Risk */}
          <Card className="bg-zinc-950 border-zinc-800 shadow-lg flex-1 min-h-[180px]">
            <CardHeader>
              <CardTitle className="text-slate-50 text-xl">Strategy Overview & Risk</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-24 w-full rounded-lg bg-zinc-800" />
              ) : result && result.risk ? (
                <div className="whitespace-pre-line text-slate-300 text-base leading-relaxed">
                  {result.risk}
                </div>
              ) : (
                <div className="text-slate-500 italic text-center py-8">
                  {error
                    ? "No risk analysis to display."
                    : "Run analysis to see strategy details and risk profile."}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
