# TrueCost AI - Real-Time Product Cost Analysis From TX10

http://truecostai.netlify.app is a mobile-first web application that uses your device's camera to provide real-time analysis of products using GPT-5. It continuously analyzes the camera feed to identify products and estimate the true cost of materials (BOM - Bill of Materials) excluding labor, overhead, shipping, and marketing costs.

## Features

- 📸 **Real-Time Camera Analysis**: Continuously analyzes live camera feed
- 🤖 **AI Analysis**: Uses GPT-5 (latest model) to identify products and estimate material costs
- 📱 **Mobile-First Design**: Optimized for mobile devices with responsive UI
- 💰 **Cost Breakdown**: Shows estimated low-high BOM costs in USD
- 🏷️ **Product Identification**: Identifies product name, category, and materials
- ⚡ **Live Updates**: Automatic analysis every 3 seconds with manual trigger option

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- OpenAI API key (already configured)

### Installation

1. Clone or navigate to the project directory:
```bash
cd true-cost-ai
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Usage

1. **Allow Camera Access**: When prompted, allow the app to access your device's camera
2. **Start Analysis**: Tap "Start Analysis" to begin real-time product analysis
3. **Point Camera**: Point your camera at any product to see live analysis
4. **View Results**: See real-time updates showing product details and cost estimates
5. **Manual Analysis**: Use "Analyze Now" for immediate analysis of current frame

## API Configuration

The app uses your OpenAI API key to analyze images. The key is configured in the API route and will work immediately.

## Technical Details

- **Frontend**: Next.js 14 with TypeScript and Tailwind CSS
- **AI Model**: GPT-5 (latest model) for image analysis
- **Camera**: Uses WebRTC getUserMedia API
- **Image Processing**: Canvas-based image capture and conversion

## Cost Estimation Methodology

The app estimates costs based on:
- Material identification and quantities
- Current market prices for raw materials
- Component costs (electronics, plastics, metals, etc.)
- Manufacturing complexity factors

**Note**: Estimates exclude:
- Labor costs
- Overhead expenses
- Shipping and logistics
- Marketing and branding
- Retail markup

## Mobile Optimization

- Responsive design for all screen sizes
- Touch-friendly interface
- Optimized for portrait orientation
- Safe area handling for notched devices
- Sticky bottom action bar

## Development

To modify the app:

1. Edit `src/app/page.tsx` for the main UI component
2. Edit `src/app/api/analyze/route.ts` for the AI analysis logic
3. Update `src/app/layout.tsx` for global layout changes

## License

This project is for educational and demonstration purposes.
