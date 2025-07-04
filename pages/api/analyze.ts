import type { NextApiRequest, NextApiResponse } from 'next';

const FINNHUB_API_KEY = 'd1epc69r01qghj42aj4gd1epc69r01qghj42aj50';
const FINNHUB_BASE = 'https://finnhub.io/api/v1';

type Option = {
  symbol: string;
  strike: number;
  lastPrice: number;
  impliedVolatility: number;
  openInterest: number;
  volume: number;
  type: string;
};

type ChartPoint = { price: number; profit: number };

type ApiResponse = {
  summary: string;
  top_5: string[][];
  chartData: ChartPoint[];
  error?: string;
};

async function fetchOptions(symbol: string): Promise<{ expiry: string; options: Option[] } | null> {
  const expRes = await fetch(`${FINNHUB_BASE}/stock/option-chain?symbol=${symbol}&token=${FINNHUB_API_KEY}`);
  if (!expRes.ok) return null;
  const expData = await expRes.json();
  if (!expData.data || !expData.data.length) return null;
  // Use the first expiration date for demo
  const expiryObj = expData.data[0];
  const expiry = expiryObj.expirationDate;
  const options = Array.isArray(expiryObj.options) ? expiryObj.options : [];
  if (!options.length) return null;
  return { expiry, options: options as Option[] };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<ApiResponse | { error: string }>) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Only POST allowed' });
    return;
  }
  try {
    const { ticker, strategy } = req.body;
    if (!ticker || !['bullish', 'bearish'].includes(strategy)) {
      res.status(400).json({ error: 'Invalid input' });
      return;
    }
    const symbol = ticker.toUpperCase();
    const result = await fetchOptions(symbol);
    if (!result) {
      res.status(200).json({ summary: '', top_5: [], chartData: [], error: 'No options data found for this symbol.' });
      return;
    }
    const { expiry, options } = result;
    let filtered = options.filter((opt) => opt.type === (strategy === 'bullish' ? 'CALL' : 'PUT'));
    filtered = filtered.filter((opt) => opt.impliedVolatility && opt.strike && opt.lastPrice);
    filtered.sort((a, b) => b.impliedVolatility - a.impliedVolatility);
    const top5 = filtered.slice(0, 5);
    if (top5.length === 0) {
      res.status(200).json({ summary: '', top_5: [], chartData: [], error: 'No suitable options found for this strategy.' });
      return;
    }
    const top_5 = top5.map((opt) => [
      opt.symbol,
      String(opt.strike),
      String(opt.lastPrice),
      String(opt.impliedVolatility),
      String(opt.openInterest),
      String(opt.volume),
      expiry
    ]);
    const strikes = top5.map((opt) => Number(opt.strike));
    const chartData: ChartPoint[] = [];
    for (let i = 0; i < 20; ++i) {
      const price = Math.round((Math.min(...strikes) * 0.9 + (Math.max(...strikes) * 1.1 - Math.min(...strikes) * 0.9) * (i / 19)) * 100) / 100;
      const profit = strategy === 'bullish'
        ? (price - strikes[0]) * 10
        : (strikes[0] - price) * 10;
      chartData.push({ price, profit: Math.round(profit * 100) / 100 });
    }
    const summary = `Top ${strategy.charAt(0).toUpperCase() + strategy.slice(1)} trade for ${symbol}: ${top_5[0][0]} (Strike ${top_5[0][1]}, IV ${top_5[0][3]})`;
    res.status(200).json({ summary, top_5, chartData });
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Internal error' });
  }
} 