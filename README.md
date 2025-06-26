# VegaEdge - Option Strategy Analyzer

A professional options analysis tool that runs entirely in the browser, providing real-time strategy recommendations for bullish and bearish risk reversals.

## Features

- **Frontend-Only Architecture**: All calculations run in the browser using TypeScript
- **Real-Time Data**: Fetches live options data from Yahoo Finance API
- **Black-Scholes Calculations**: Accurate option pricing and Greeks calculations
- **Strategy Analysis**: Bullish and bearish risk reversal strategies
- **Modern UI**: Beautiful, responsive interface built with Next.js and Tailwind CSS
- **Vercel Deployment**: Optimized for serverless deployment

## Technology Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS 4
- **Data**: Yahoo Finance API
- **Deployment**: Vercel
- **Calculations**: Custom Black-Scholes implementation

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd VegaEdgeFrontEnd-main
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building for Production

```bash
npm run build
npm start
```

## Deployment on Vercel

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Deploy to Vercel:
```bash
vercel
```

3. Follow the prompts to connect your repository and deploy.

### Environment Variables

No environment variables are required for this frontend-only application.

## How It Works

### Analysis Engine

The application uses a custom TypeScript implementation of option pricing models:

- **Black-Scholes Model**: Calculates option prices and Greeks
- **Risk Reversal Strategies**: Analyzes bullish and bearish positions
- **Data Processing**: Filters and validates options data
- **Strategy Ranking**: Scores combinations based on efficiency, IV advantage, and cost

### Data Flow

1. User enters ticker symbol and parameters
2. Application fetches stock price and expiration dates from Yahoo Finance
3. Options data is retrieved for each expiration date
4. Black-Scholes calculations are performed for all option combinations
5. Valid strategies are filtered and ranked
6. Results are displayed with detailed analysis

### Strategy Types

#### Bullish Risk Reversal
- Long OTM Call + Short OTM Put
- Profits from upward price movement
- Limited risk to the downside

#### Bearish Risk Reversal  
- Long OTM Put + Short OTM Call
- Profits from downward price movement
- Limited risk to the upside

## API Endpoints

The application includes Next.js API routes for server-side processing:

- `POST /api/analyze/bullish` - Analyze bullish strategies
- `POST /api/analyze/bearish` - Analyze bearish strategies

## Performance Optimizations

- **Client-Side Processing**: Reduces server load and latency
- **Caching**: Browser caching for repeated requests
- **Efficient Calculations**: Optimized mathematical functions
- **Responsive Design**: Works on all device sizes

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Disclaimer

This tool is for educational and informational purposes only. Options trading involves substantial risk and is not suitable for all investors. Always consult with a financial advisor before making investment decisions.
