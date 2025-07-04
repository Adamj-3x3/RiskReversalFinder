import { useState } from "react";
import { useRouter } from "next/router";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import ResultsSummary from "@/components/ResultsSummary";
import ResultsTable from "@/components/ResultsTable";
import ProfitLossChart from "@/components/ProfitLossChart";
import ErrorAlert from "@/components/ErrorAlert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type AnalysisResult = {
  summary: string;
  top_5: string[][];
  chartData: { price: number; profit: number }[];
};

export default function AnalyzerPage() {
  const router = useRouter();
  const { strategy } = router.query as { strategy: "bullish" | "bearish" };

  const [ticker, setTicker] = useState("");
  const [minDte, setMinDte] = useState(30);
  const [maxDte, setMaxDte] = useState(180);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);

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
    } catch (e: unknown) {
      if (e instanceof Error) setError(e.message);
      else setError("Network error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-zinc-950 text-white px-2 py-6 flex flex-col items-center">
      <Card className="w-full max-w-md mx-auto p-4 shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold capitalize text-center">{strategy} Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="flex flex-col gap-4 mb-4"
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
            <Button type="submit" disabled={isLoading} className="w-full h-12 text-lg font-semibold">
              {isLoading ? "Analyzing..." : "Run Analysis"}
            </Button>
          </form>
          {isLoading && (
            <div className="flex flex-col gap-4">
              <Skeleton className="h-24 w-full rounded-lg" />
              <Skeleton className="h-32 w-full rounded-lg" />
              <Skeleton className="h-48 w-full rounded-lg" />
            </div>
          )}
          {error && <ErrorAlert message={error} />}
          {result && (
            <div className="flex flex-col gap-6 mt-4">
              <ResultsSummary summary={result.summary} />
              <ResultsTable rows={result.top_5} />
              <ProfitLossChart data={result.chartData} />
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
} 