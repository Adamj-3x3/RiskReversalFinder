import { useState } from "react";
import { useRouter } from "next/router";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import ResultsSummary from "@/components/ResultsSummary";
import ResultsTable from "@/components/ResultsTable";
import ProfitLossChart from "@/components/ProfitLossChart";
import ErrorAlert from "@/components/ErrorAlert";

export default function AnalyzerPage() {
  const router = useRouter();
  const { strategy } = router.query as { strategy: "bullish" | "bearish" };

  const [ticker, setTicker] = useState("");
  const [minDte, setMinDte] = useState(30);
  const [maxDte, setMaxDte] = useState(180);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  const handleAnalyze = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticker,
          min_dte: minDte,
          max_dte: maxDte,
          strategy,
        }),
      });
      const data = await res.json();
      if (data.error) setError(data.error);
      else setResult(data);
    } catch (e: any) {
      setError(e.message || "Network error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-zinc-950 text-white px-4 py-8 flex flex-col items-center">
      <h2 className="text-2xl font-bold mb-6 capitalize">{strategy} Analysis</h2>
      <form
        className="w-full max-w-md flex flex-col gap-4 mb-8"
        onSubmit={e => {
          e.preventDefault();
          handleAnalyze();
        }}
      >
        <Input
          placeholder="Ticker (e.g. AAPL)"
          value={ticker}
          onChange={e => setTicker(e.target.value.toUpperCase())}
          required
        />
        <div className="flex gap-2">
          <Input
            type="number"
            min={1}
            value={minDte}
            onChange={e => setMinDte(Number(e.target.value))}
            className="w-1/2"
            placeholder="Min DTE"
            required
          />
          <Input
            type="number"
            min={1}
            value={maxDte}
            onChange={e => setMaxDte(Number(e.target.value))}
            className="w-1/2"
            placeholder="Max DTE"
            required
          />
        </div>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Analyzing..." : "Run Analysis"}
        </Button>
      </form>
      {isLoading && (
        <div className="w-full max-w-md flex flex-col gap-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      )}
      {error && <ErrorAlert message={error} />}
      {result && (
        <div className="w-full max-w-md flex flex-col gap-6">
          <ResultsSummary summary={result.summary} />
          <ResultsTable rows={result.top_5} />
          <ProfitLossChart data={result.chartData} />
        </div>
      )}
    </main>
  );
} 