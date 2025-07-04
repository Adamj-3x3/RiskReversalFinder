import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-zinc-950 text-white px-4">
      <h1 className="text-3xl font-bold mb-4">VegaEdge</h1>
      <p className="mb-8 text-center text-zinc-300">Professional Options Analysis. Mobile-first. Powered by Next.js + Finnhub.</p>
      <div className="w-full max-w-md flex flex-col gap-6">
        <Link href="/analyzer/bullish">
          <Card className="hover:scale-105 transition cursor-pointer">
            <CardHeader>
              <CardTitle>Bullish Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Find the best bullish risk reversals.</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/analyzer/bearish">
          <Card className="hover:scale-105 transition cursor-pointer">
            <CardHeader>
              <CardTitle>Bearish Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Find the best bearish risk reversals.</p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </main>
  );
}
