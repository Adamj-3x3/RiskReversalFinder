import React, { useState } from "react";
import Head from "next/head";
import { CommandPanel } from "@/components/CommandPanel";
import { MetricWidget } from "@/components/MetricWidget";
import { ProfitLossChart } from "@/components/ProfitLossChart";
import { TradeDetailsTable } from "@/components/TradeDetailsTable";
import { LoadingScanner } from "@/components/LoadingScanner";

type StrategyType = "bullish" | "bearish";

interface AnalysisResult {
  summary: string;
  risk: string;
  pricing_comparison: string;
  top_5: Array<[string, string, string, string, string, string, string]>;
  chartData?: { price: number; profit: number }[];
  breakeven?: number[];
  maxProfit?: number;
  maxLoss?: number;
  details?: { label: string; value: string | number }[];
}

// Mock company info lookup (replace with real API if desired)
const getCompanyInfo = (ticker: string) => {
  if (!ticker) return { logoUrl: undefined, name: "Analysis Parameters" };
  return {
    logoUrl: `https://logo.clearbit.com/${ticker.toLowerCase()}.com`,
    name: ticker.toUpperCase(),
  };
};

export default function Home() {
  const [ticker, setTicker] = useState("");
  const [minDte, setMinDte] = useState(30);
  const [maxDte, setMaxDte] = useState(90);
  const [strategyType, setStrategyType] = useState<StrategyType>("bullish");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // For demo: parse summary into key metrics and details
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

  // Extract key metrics for widgets (mock logic)
  const getMetricWidgets = (summary: string) => {
    const parsed = parseSummary(summary);
    const find = (label: string) => parsed.find((row) => row.label.toLowerCase().includes(label));
    return [
      { label: "Max Profit", value: find("profit")?.value || "-", accent: "green" },
      { label: "Net Cost", value: find("net cost")?.value || "-", accent: "blue" },
      { label: "IV Advantage", value: find("iv advantage")?.value || "-", accent: "blue" },
    ];
  };

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

  // Dynamic page title
  const pageTitle = ticker
    ? `${ticker.toUpperCase()} // ${strategyType.charAt(0).toUpperCase() + strategyType.slice(1)} Risk Reversal`
    : "VegaEdge - Trader's Cockpit";

  // HUD background overlay
  const HudBackground = () => (
    <div className="fixed inset-0 pointer-events-none z-0">
      <div className="absolute inset-0 bg-[repeating-linear-gradient(90deg,#23304a_0_2px,transparent_2px_40px)] opacity-10" />
      <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,#23304a_0_2px,transparent_2px_40px)] opacity-10" />
    </div>
  );

  return (
    <div className="min-h-screen w-full bg-[#0A192F] text-slate-200 font-sans relative overflow-x-hidden">
      <Head>
        <title>{pageTitle}</title>
      </Head>
      <HudBackground />
      <div className="relative z-10 flex flex-col lg:flex-row max-w-7xl mx-auto py-10 gap-10">
        {/* Command Panel (Sidebar) */}
        <div className="flex-shrink-0 w-full lg:w-80">
          <CommandPanel
            ticker={ticker}
            setTicker={setTicker}
            minDte={minDte}
            setMinDte={setMinDte}
            maxDte={maxDte}
            setMaxDte={setMaxDte}
            strategyType={strategyType}
            setStrategyType={setStrategyType}
            onAnalyze={handleAnalyze}
            isLoading={isLoading}
            error={error}
            companyInfo={getCompanyInfo(ticker)}
          />
        </div>
        {/* Main Display */}
        <main className="flex-1 flex flex-col gap-8">
          {/* Metric Widgets */}
          {isLoading ? (
            <div className="flex gap-6">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex-1"><LoadingScanner /></div>
              ))}
            </div>
          ) : result && result.summary ? (
            <div className="flex gap-6">
              {getMetricWidgets(result.summary).map((w, i) => (
                <MetricWidget key={i} label={w.label} value={w.value} accent={w.accent as 'green' | 'blue'} />
              ))}
            </div>
          ) : null}

          {/* Profit/Loss Chart */}
          <div>
            {isLoading ? (
              <LoadingScanner />
            ) : result && result.chartData ? (
              <ProfitLossChart
                data={result.chartData}
                breakeven={result.breakeven || []}
                maxProfit={result.maxProfit || 0}
                maxLoss={result.maxLoss || 0}
              />
            ) : (
              <div className="h-64 flex items-center justify-center text-cyan-400/60 font-mono text-lg bg-zinc-950/60 rounded-xl border border-cyan-700/30">
                {result ? "No chart data available." : "Welcome to the Trader's Cockpit. Enter parameters and run analysis."}
              </div>
            )}
          </div>

          {/* Trade Details Table */}
          <div>
            {isLoading ? (
              <LoadingScanner />
            ) : result && result.details ? (
              <TradeDetailsTable rows={result.details} />
            ) : result && result.summary ? (
              <TradeDetailsTable rows={parseSummary(result.summary)} />
            ) : null}
          </div>
        </main>
      </div>
    </div>
  );
}
