import type { NextApiRequest, NextApiResponse } from 'next';
import { runBullishAnalysis } from '../../../lib/analysisEngine';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { ticker, min_dte, max_dte } = req.body;

    // Validate input
    if (!ticker || !min_dte || !max_dte) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Run analysis using frontend engine
    const result = await runBullishAnalysis(ticker, min_dte, max_dte);
    
    res.status(200).json({ result });
  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 