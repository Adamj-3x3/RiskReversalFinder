// Analysis Engine - TypeScript version of the Python backend
// This handles all option calculations and strategy analysis

interface OptionData {
  strike: number;
  bid: number;
  ask: number;
  impliedVolatility: number;
  volume: number;
  openInterest: number;
  expiration: string;
  optionType: 'call' | 'put';
  vega?: number;
  delta?: number;
}

interface StrategyCombination {
  strategy_type: string;
  expiration: string;
  days_to_exp: number;
  net_cost: number;
  iv_advantage: number;
  net_delta: number;
  net_vega: number;
  efficiency: number;
  pricing_comparison: PricingComparison;
  long_call_strike?: number;
  short_put_strike?: number;
  long_put_strike?: number;
  short_call_strike?: number;
  max_loss_down?: number;
  max_loss_up?: number;
  breakeven?: number;
  score?: number;
}

interface PricingComparison {
  mid_price: number;
  bid_ask_spread: number;
}

interface AnalysisResult {
  summary: string;
  risk: string;
  pricing_comparison: string;
  top_5: Array<[string, string, string, string, string, string, string]>;
}

const FINNHUB_API_KEY = "d1epc69r01qghj42aj4gd1epc69r01qghj42aj50";

// Black-Scholes and Data Functions
function d1(S: number, K: number, T: number, r: number, sigma: number, q: number = 0.0): number {
  if (T <= 0 || sigma <= 0) return S > K ? Infinity : -Infinity;
  return (Math.log(S / K) + (r - q + 0.5 * sigma ** 2) * T) / (sigma * Math.sqrt(T));
}

function bs_vega(S: number, K: number, T: number, r: number, sigma: number, q: number = 0.0): number {
  if (T <= 0 || sigma <= 0) return 0;
  const D1 = d1(S, K, T, r, sigma, q);
  return S * Math.exp(-q * T) * normalPDF(D1) * Math.sqrt(T) / 100;
}

function bs_delta(S: number, K: number, T: number, r: number, sigma: number, optionType: 'call' | 'put', q: number = 0.0): number {
  if (T <= 0) {
    if (optionType === 'call') return S > K ? 1.0 : 0.0;
    return S < K ? -1.0 : 0.0;
  }
  const D1 = d1(S, K, T, r, sigma, q);
  return Math.exp(-q * T) * normalCDF(D1) * (optionType === 'call' ? 1 : -1) + (optionType === 'put' ? -Math.exp(-q * T) : 0);
}

// Normal distribution functions
function normalPDF(x: number): number {
  return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
}

function normalCDF(x: number): number {
  return 0.5 * (1 + erf(x / Math.sqrt(2)));
}

function erf(x: number): number {
  // Approximation of error function
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = x >= 0 ? 1 : -1;
  x = Math.abs(x);

  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

  return sign * y;
}

// Get options data (calls and puts) for a specific expiration from Finnhub
async function getOptionsData(
  ticker: string,
  expiration: string,
  underlyingPrice: number
): Promise<{ calls: OptionData[]; puts: OptionData[] }> {
  try {
    const response = await fetch(
      `https://finnhub.io/api/v1/stock/option-chain?symbol=${ticker}&token=${FINNHUB_API_KEY}`
    );
    const data = await response.json();
    if (!data.data || !Array.isArray(data.data)) {
      console.error("Finnhub API response missing expected fields for option chain:", data);
      return { calls: [], puts: [] };
    }
    // Find the object with the matching expirationDate
    const expObj = data.data.find((item: any) => item.expirationDate === expiration);
    if (!expObj || typeof expObj.options !== "object") {
      console.error("No options found for expiration:", expiration, expObj);
      return { calls: [], puts: [] };
    }
    const calls: OptionData[] = [];
    const puts: OptionData[] = [];
    // Process CALL options
    if (Array.isArray(expObj.options.CALL)) {
      for (const contract of expObj.options.CALL) {
        if (!contract.strike) continue;
        calls.push({
          strike: contract.strike,
          bid: contract.bid || 0,
          ask: contract.ask || 0,
          impliedVolatility: contract.impliedVolatility || 0,
          volume: contract.volume || 0,
          openInterest: contract.openInterest || 0,
          expiration: expiration,
          optionType: "call",
        });
      }
    }
    // Process PUT options
    if (Array.isArray(expObj.options.PUT)) {
      for (const contract of expObj.options.PUT) {
        if (!contract.strike) continue;
        puts.push({
          strike: contract.strike,
          bid: contract.bid || 0,
          ask: contract.ask || 0,
          impliedVolatility: contract.impliedVolatility || 0,
          volume: contract.volume || 0,
          openInterest: contract.openInterest || 0,
          expiration: expiration,
          optionType: "put",
        });
      }
    }
    return { calls, puts };
  } catch (error) {
    console.error("Error fetching options data from Finnhub:", error);
    return { calls: [], puts: [] };
  }
}

// Get stock price
async function getStockPrice(ticker: string): Promise<number> {
  try {
    const response = await fetch(`https://query2.finance.yahoo.com/v8/finance/chart/${ticker}`);
    const data = await response.json();
    return data.chart.result[0].meta.regularMarketPrice;
  } catch (error) {
    console.error('Error fetching stock price:', error);
    throw new Error('Failed to fetch stock price');
  }
}

// Get available expiration dates from Finnhub
async function getExpirationDates(ticker: string): Promise<string[]> {
  try {
    const response = await fetch(`https://finnhub.io/api/v1/stock/option-chain?symbol=${ticker}&token=${FINNHUB_API_KEY}`);
    const data = await response.json();
    if (!data.data || !Array.isArray(data.data)) {
      console.error("Finnhub API response missing expected fields:", data);
      return [];
    }
    // Extract all expirationDate values
    return data.data.map((item: any) => item.expirationDate);
  } catch (error) {
    console.error('Error fetching expiration dates from Finnhub:', error);
    return [];
  }
}

// Analyze bullish risk reversal
function analyzeBullishRiskReversal(
  calls: OptionData[], 
  puts: OptionData[], 
  underlyingPrice: number, 
  expirationDate: string, 
  riskFreeRate: number = 0.045,
  dividendYield: number = 0.0
): StrategyCombination[] {
  const today = new Date();
  const expDate = new Date(expirationDate);
  const T = Math.max((expDate.getTime() - today.getTime()) / (365 * 24 * 60 * 60 * 1000), 1 / (365 * 24));
  const daysToExp = Math.ceil((expDate.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));

  // Calculate Greeks
  calls.forEach(call => {
    call.vega = bs_vega(underlyingPrice, call.strike, T, riskFreeRate, call.impliedVolatility, dividendYield);
    call.delta = bs_delta(underlyingPrice, call.strike, T, riskFreeRate, call.impliedVolatility, 'call', dividendYield);
  });

  puts.forEach(put => {
    put.vega = bs_vega(underlyingPrice, put.strike, T, riskFreeRate, put.impliedVolatility, dividendYield);
    put.delta = bs_delta(underlyingPrice, put.strike, T, riskFreeRate, put.impliedVolatility, 'put', dividendYield);
  });

  const otmCalls = calls.filter(call => call.strike > underlyingPrice);
  const otmPuts = puts.filter(put => put.strike < underlyingPrice);

  const maxStrikeDistance = underlyingPrice * 0.75;
  const filteredCalls = otmCalls.filter(call => call.strike < underlyingPrice + maxStrikeDistance);
  const filteredPuts = otmPuts.filter(put => put.strike > underlyingPrice - maxStrikeDistance);

  if (filteredCalls.length === 0 || filteredPuts.length === 0) {
    return [];
  }

  const combinations: StrategyCombination[] = [];
  
  for (const call of filteredCalls) {
    for (const put of filteredPuts) {
      if (call.strike <= put.strike) continue;
      
      const combo = createBullishStrategyCombination(call, put);
      if (combo && isValidBullishCombo(combo)) {
        combo.strategy_type = 'Bullish Risk Reversal';
        combo.expiration = expirationDate;
        combo.days_to_exp = daysToExp;
        combinations.push(combo);
      }
    }
  }

  return combinations;
}

// Analyze bearish risk reversal
function analyzeBearishRiskReversal(
  calls: OptionData[], 
  puts: OptionData[], 
  underlyingPrice: number, 
  expirationDate: string, 
  riskFreeRate: number = 0.045,
  dividendYield: number = 0.0
): StrategyCombination[] {
  const today = new Date();
  const expDate = new Date(expirationDate);
  const T = Math.max((expDate.getTime() - today.getTime()) / (365 * 24 * 60 * 60 * 1000), 1 / (365 * 24));
  const daysToExp = Math.ceil((expDate.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));

  // Calculate Greeks
  calls.forEach(call => {
    call.vega = bs_vega(underlyingPrice, call.strike, T, riskFreeRate, call.impliedVolatility, dividendYield);
    call.delta = bs_delta(underlyingPrice, call.strike, T, riskFreeRate, call.impliedVolatility, 'call', dividendYield);
  });

  puts.forEach(put => {
    put.vega = bs_vega(underlyingPrice, put.strike, T, riskFreeRate, put.impliedVolatility, dividendYield);
    put.delta = bs_delta(underlyingPrice, put.strike, T, riskFreeRate, put.impliedVolatility, 'put', dividendYield);
  });

  const otmCalls = calls.filter(call => call.strike > underlyingPrice);
  const otmPuts = puts.filter(put => put.strike < underlyingPrice);

  const maxStrikeDistance = underlyingPrice * 0.75;
  const filteredCalls = otmCalls.filter(call => call.strike < underlyingPrice + maxStrikeDistance);
  const filteredPuts = otmPuts.filter(put => put.strike > underlyingPrice - maxStrikeDistance);

  if (filteredCalls.length === 0 || filteredPuts.length === 0) {
    return [];
  }

  const combinations: StrategyCombination[] = [];
  
  for (const put of filteredPuts) {
    for (const call of filteredCalls) {
      if (put.strike >= call.strike) continue;
      
      const combo = createBearishStrategyCombination(put, call);
      if (combo && isValidBearishCombo(combo)) {
        combo.strategy_type = 'Bearish Risk Reversal';
        combo.expiration = expirationDate;
        combo.days_to_exp = daysToExp;
        combinations.push(combo);
      }
    }
  }

  return combinations;
}

// Create bullish strategy combination
function createBullishStrategyCombination(callRow: OptionData, putRow: OptionData): StrategyCombination | null {
  try {
    const netCost = callRow.ask - putRow.bid;
    const strikeDiff = callRow.strike - putRow.strike;
    const efficiency = strikeDiff > 0 ? -netCost / strikeDiff : 0;

    return {
      long_call_strike: callRow.strike,
      short_put_strike: putRow.strike,
      net_cost: netCost,
      iv_advantage: putRow.impliedVolatility - callRow.impliedVolatility,
      net_delta: (callRow.delta || 0) - (putRow.delta || 0),
      net_vega: (callRow.vega || 0) - (putRow.vega || 0),
      max_loss_down: putRow.strike - (putRow.bid - callRow.ask),
      breakeven: callRow.strike + netCost,
      efficiency,
      pricing_comparison: calculateAlternativePricing(callRow, putRow, 'bullish'),
      strategy_type: '',
      expiration: '',
      days_to_exp: 0
    };
  } catch (error) {
    console.error('Error creating bullish combination:', error);
    return null;
  }
}

// Create bearish strategy combination
function createBearishStrategyCombination(putRow: OptionData, callRow: OptionData): StrategyCombination | null {
  try {
    const netCost = putRow.ask - callRow.bid;
    const strikeDiff = callRow.strike - putRow.strike;
    const efficiency = strikeDiff > 0 ? -netCost / strikeDiff : 0;

    return {
      long_put_strike: putRow.strike,
      short_call_strike: callRow.strike,
      net_cost: netCost,
      iv_advantage: callRow.impliedVolatility - putRow.impliedVolatility,
      net_delta: (putRow.delta || 0) - (callRow.delta || 0),
      net_vega: (putRow.vega || 0) - (callRow.vega || 0),
      max_loss_up: callRow.strike + (callRow.bid - putRow.ask),
      breakeven: putRow.strike - netCost,
      efficiency,
      pricing_comparison: calculateAlternativePricing(callRow, putRow, 'bearish'),
      strategy_type: '',
      expiration: '',
      days_to_exp: 0
    };
  } catch (error) {
    console.error('Error creating bearish combination:', error);
    return null;
  }
}

// Validation functions
function isValidBullishCombo(combo: StrategyCombination): boolean {
  return combo.net_cost < 0 && combo.efficiency > 0.1 && combo.iv_advantage > 0.02;
}

function isValidBearishCombo(combo: StrategyCombination): boolean {
  return combo.net_cost < 0 && combo.efficiency > 0.1 && combo.iv_advantage > 0.02;
}

// Rank combinations
function rankCombinations(combinations: StrategyCombination[]): StrategyCombination[] {
  if (combinations.length === 0) return [];

  const df = combinations.map(combo => ({
    ...combo,
    efficiency_score: combo.efficiency,
    iv_score: combo.iv_advantage,
    cost_score: -combo.net_cost
  }));

  // Normalize scores
  const maxEfficiency = Math.max(...df.map(d => d.efficiency_score));
  const maxIv = Math.max(...df.map(d => d.iv_score));
  const maxCost = Math.max(...df.map(d => d.cost_score));

  df.forEach(d => {
    d.efficiency_score = maxEfficiency > 0 ? d.efficiency_score / maxEfficiency : 0;
    d.iv_score = maxIv > 0 ? d.iv_score / maxIv : 0;
    d.cost_score = maxCost > 0 ? d.cost_score / maxCost : 0;
  });

  // Calculate composite score
  df.forEach(d => {
    d.score = d.efficiency_score * 0.4 + d.iv_score * 0.3 + d.cost_score * 0.3;
  });

  return df.sort((a, b) => (b.score || 0) - (a.score || 0));
}

// Calculate alternative pricing
function calculateAlternativePricing(callRow: OptionData, putRow: OptionData, strategyType: 'bullish' | 'bearish'): PricingComparison {
  const callMid = (callRow.bid + callRow.ask) / 2;
  const putMid = (putRow.bid + putRow.ask) / 2;
  
  if (strategyType === 'bullish') {
    return {
      mid_price: callMid - putMid,
      bid_ask_spread: (callRow.ask - callRow.bid) + (putRow.ask - putRow.bid)
    };
  } else {
    return {
      mid_price: putMid - callMid,
      bid_ask_spread: (putRow.ask - putRow.bid) + (callRow.ask - callRow.bid)
    };
  }
}

// Format text report
function formatTextReport(results: StrategyCombination[], analysisSummary: string, ticker: string, strategyType: string): AnalysisResult {
  if (results.length === 0) {
    return {
      summary: `No valid ${strategyType} strategies found for ${ticker} with the given parameters.`,
      risk: '',
      pricing_comparison: '',
      top_5: []
    };
  }

  const topResult = results[0];
  const summary = `TOP RECOMMENDED TRADE\n\n` +
    `${strategyType === 'bullish' ? 'Long Call' : 'Long Put'}: ${strategyType === 'bullish' ? topResult.long_call_strike : topResult.long_put_strike} Strike\n` +
    `${strategyType === 'bullish' ? 'Short Put' : 'Short Call'}: ${strategyType === 'bullish' ? topResult.short_put_strike : topResult.short_call_strike} Strike\n` +
    `Net Cost: $${topResult.net_cost.toFixed(2)}\n` +
    `IV Advantage: ${(topResult.iv_advantage * 100).toFixed(1)}%\n` +
    `Efficiency: ${(topResult.efficiency * 100).toFixed(1)}%\n` +
    `Breakeven: $${topResult.breakeven?.toFixed(2)}\n` +
    `Expiration: ${topResult.expiration} (${topResult.days_to_exp} days)`;

  const risk = `STRATEGY OVERVIEW\n\n` +
    `This ${strategyType} risk reversal strategy involves:\n` +
    `• ${strategyType === 'bullish' ? 'Buying an OTM call and selling an OTM put' : 'Buying an OTM put and selling an OTM call'}\n` +
    `• Net cost: $${topResult.net_cost.toFixed(2)} (credit received)\n` +
    `• Maximum risk: ${strategyType === 'bullish' ? `$${topResult.max_loss_down?.toFixed(2)} if stock falls below ${topResult.short_put_strike}` : `$${topResult.max_loss_up?.toFixed(2)} if stock rises above ${topResult.short_call_strike}` }\n` +
    `• Profit potential: Unlimited ${strategyType === 'bullish' ? 'upside' : 'downside'}\n` +
    `• Breakeven: $${topResult.breakeven?.toFixed(2)}`;

  const pricingComparison = `PRICING COMPARISON\n\n` +
    `Current Pricing:\n` +
    `• Net Cost: $${topResult.net_cost.toFixed(2)}\n` +
    `• Mid-price: $${topResult.pricing_comparison.mid_price.toFixed(2)}\n` +
    `• Bid-Ask Spread: $${topResult.pricing_comparison.bid_ask_spread.toFixed(2)}\n\n` +
    `Greeks:\n` +
    `• Net Delta: ${topResult.net_delta.toFixed(3)}\n` +
    `• Net Vega: ${topResult.net_vega.toFixed(3)}`;

  const top5 = results.slice(0, 5).map((result, index) => [
    `${index + 1}`,
    result.expiration,
    `${strategyType === 'bullish' ? result.long_call_strike : result.long_put_strike}/${strategyType === 'bullish' ? result.short_put_strike : result.short_call_strike}`,
    `$${result.net_cost.toFixed(2)}`,
    `${result.net_vega.toFixed(3)}`,
    `${(result.efficiency * 100).toFixed(1)}%`,
    `${(result.score || 0).toFixed(2)}`
  ] as [string, string, string, string, string, string, string]);

  return {
    summary,
    risk,
    pricing_comparison: pricingComparison,
    top_5: top5
  };
}

// Main analysis functions
export async function runBullishAnalysis(ticker: string, minDte: number, maxDte: number): Promise<AnalysisResult> {
  try {
    const stockPrice = await getStockPrice(ticker);
    const expirationDates = await getExpirationDates(ticker);
    
    // Filter expiration dates based on DTE requirements
    const today = new Date();
    const filteredDates = expirationDates.filter(date => {
      const expDate = new Date(date);
      const dte = Math.ceil((expDate.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
      return dte >= minDte && dte <= maxDte;
    });

    if (filteredDates.length === 0) {
      return {
        summary: `No expiration dates found for ${ticker} within ${minDte}-${maxDte} days.`,
        risk: '',
        pricing_comparison: '',
        top_5: []
      };
    }

    const allCombinations: StrategyCombination[] = [];

    // Analyze each expiration date
    for (const expiration of filteredDates.slice(0, 5)) { // Limit to first 5 expirations
      const { calls, puts } = await getOptionsData(ticker, expiration, stockPrice);
      const combinations = analyzeBullishRiskReversal(calls, puts, stockPrice, expiration);
      allCombinations.push(...combinations);
    }

    const rankedCombinations = rankCombinations(allCombinations);
    return formatTextReport(rankedCombinations, '', ticker, 'bullish');

  } catch (error) {
    console.error('Error in bullish analysis:', error);
    return {
      summary: `Analysis Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      risk: '',
      pricing_comparison: '',
      top_5: []
    };
  }
}

export async function runBearishAnalysis(ticker: string, minDte: number, maxDte: number): Promise<AnalysisResult> {
  try {
    const stockPrice = await getStockPrice(ticker);
    const expirationDates = await getExpirationDates(ticker);
    
    // Filter expiration dates based on DTE requirements
    const today = new Date();
    const filteredDates = expirationDates.filter(date => {
      const expDate = new Date(date);
      const dte = Math.ceil((expDate.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
      return dte >= minDte && dte <= maxDte;
    });

    if (filteredDates.length === 0) {
      return {
        summary: `No expiration dates found for ${ticker} within ${minDte}-${maxDte} days.`,
        risk: '',
        pricing_comparison: '',
        top_5: []
      };
    }

    const allCombinations: StrategyCombination[] = [];

    // Analyze each expiration date
    for (const expiration of filteredDates.slice(0, 5)) { // Limit to first 5 expirations
      const { calls, puts } = await getOptionsData(ticker, expiration, stockPrice);
      const combinations = analyzeBearishRiskReversal(calls, puts, stockPrice, expiration);
      allCombinations.push(...combinations);
    }

    const rankedCombinations = rankCombinations(allCombinations);
    return formatTextReport(rankedCombinations, '', ticker, 'bearish');

  } catch (error) {
    console.error('Error in bearish analysis:', error);
    return {
      summary: `Analysis Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      risk: '',
      pricing_comparison: '',
      top_5: []
    };
  }
}
