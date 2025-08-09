import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";

const client = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || "" 
});

function sanitizeResult(raw: any) {
  const res = raw ? { ...raw } : {};
  if (res.estimatedBOM) {
    let low = Number(res.estimatedBOM.lowUSD ?? 0);
    let high = Number(res.estimatedBOM.highUSD ?? low);
    if (Number.isNaN(low)) low = 0;
    if (Number.isNaN(high)) high = low;
    // clamp & order
    low = Math.max(0, low);
    high = Math.max(low, high);
    res.estimatedBOM = { ...res.estimatedBOM, lowUSD: low, highUSD: high };
  }
  return res;
}

export async function POST(req: NextRequest) {
  try {
    console.log("API called - starting analysis");
    
    if (!process.env.OPENAI_API_KEY) {
      console.error("OpenAI API key not found");
      return NextResponse.json({ error: "OpenAI API key not configured" }, { status: 500 });
    }
    
    const { imageBase64 } = await req.json();
    if (!imageBase64) {
      console.log("No image provided");
      return NextResponse.json({ error: "No image" }, { status: 400 });
    }
    console.log("Image received, length:", imageBase64.length);

    const system = `You are TrueCost AI, an expert in product identification and cost analysis. Your job is to:

1. IDENTIFY the exact product name and brand from the image
2. ESTIMATE the real manufacturing cost (BOM - Bill of Materials) in USD
3. ESTIMATE the current market retail price in USD
4. Provide realistic, market-based cost estimates

Return a JSON object with this exact structure:
{
  "productName": "Exact product name and brand (e.g., 'iPhone 15 Pro 256GB', 'MacBook Air M2 13-inch')",
  "category": "Product category (e.g., 'Smartphone', 'Laptop', 'Headphones')",
  "materials": ["List of main materials/components"],
  "estimatedBOM": {
    "lowUSD": number (realistic low estimate),
    "highUSD": number (realistic high estimate),
    "methodology": "Brief explanation of how you estimated the manufacturing cost"
  },
  "marketPrice": {
    "lowUSD": number (estimated low retail price),
    "highUSD": number (estimated high retail price),
    "currency": "USD",
    "notes": "Brief explanation of market price estimate"
  },
  "environmentalImpact": {
    "carbonFootprint": {
      "kgCO2e": number (estimated carbon footprint in kg CO2 equivalent),
      "methodology": "Explanation of carbon footprint calculation"
    },
    "sustainabilityScore": number (0-100, higher is more sustainable),
    "recyclability": {
      "percentage": number (0-100, percentage of materials that can be recycled),
      "notes": "Recycling information and recommendations"
    },
    "environmentalNotes": "Additional environmental impact considerations"
  },
  "confidence": number (0-1, how confident you are in the identification),
  "caution": "Any important notes about the estimate"
}

IMPORTANT: 
- Be specific with product names (include model numbers if visible)
- Give realistic BOM estimates based on actual component prices
- Provide current market retail prices based on recent market data
- Focus on materials and manufacturing costs for BOM, retail prices for market price
- Calculate environmental impact based on materials used, manufacturing processes, and typical lifecycle emissions
- Consider carbon footprint from raw material extraction, manufacturing, transportation, and end-of-life disposal
- Assess recyclability based on material composition and current recycling infrastructure
- If you can't identify the product clearly, say so

If a human face or person is clearly visible in the image, return: {"productName": "Human detected! 😄", "category": "Human", "materials": ["Carbon-based lifeform", "Water", "Oxygen", "Dreams and aspirations"], "estimatedBOM": {"lowUSD": 0, "highUSD": 0, "methodology": "Humans are priceless! But if you're curious, the raw materials in a human body are worth about $160 in chemicals."}, "marketPrice": {"lowUSD": 0, "highUSD": 0, "currency": "USD", "notes": "Humans are not for sale! (That would be illegal and unethical)"}, "environmentalImpact": {"carbonFootprint": {"kgCO2e": 0, "methodology": "Humans are carbon-neutral when breathing normally"}, "sustainabilityScore": 100, "recyclability": {"percentage": 100, "notes": "Humans are 100% biodegradable and return to nature"}, "environmentalNotes": "Humans are actually pretty eco-friendly when you think about it!"}, "confidence": 1, "caution": "Hey there, beautiful human! 👋 This app is for analyzing products, not people. But you look great today!"}

If no clear product is visible, return: {"productName": "No product detected", "estimatedBOM": {"lowUSD": 0, "highUSD": 0, "methodology": "No product visible in frame"}, "marketPrice": {"lowUSD": 0, "highUSD": 0, "currency": "USD", "notes": "No product visible"}, "environmentalImpact": {"carbonFootprint": {"kgCO2e": 0, "methodology": "No product visible"}, "sustainabilityScore": 0, "recyclability": {"percentage": 0, "notes": "No product visible"}, "environmentalNotes": "No product visible"}}`;

    console.log("Calling OpenAI API...");
    const response = await client.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.1,
      messages: [
        { role: "system", content: system },
        { role: "user", content: [
          { type: "text", text: "Look at this product image carefully. Identify the exact product name and brand, then estimate the real manufacturing cost (BOM) in USD. Be specific and realistic with your cost estimates based on actual component prices. Return the JSON object with detailed product information and cost breakdown." },
          { type: "image_url", image_url: { url: imageBase64 } }
        ] }
      ],
      response_format: { type: "json_object" },
    });
    console.log("OpenAI API response received");

    const text = response.choices[0]?.message?.content || "{}";
    console.log("GPT Response:", text);
    
    let parsed;
    try { 
      parsed = JSON.parse(text); 
      console.log("Parsed JSON:", parsed);
    } catch (parseError) { 
      console.error("JSON Parse Error:", parseError);
      parsed = { 
        productName: "Parse Error", 
        estimatedBOM: { lowUSD: 0, highUSD: 0, methodology: "Failed to parse response" },
        caution: "Non-JSON output received" 
      }; 
    }
    
    // sanitize just like client
    parsed = sanitizeResult(parsed);
    console.log("Final result:", parsed);
    return NextResponse.json(parsed, { status: 200 });
  } catch (e: any) {
    console.error("API Error:", e);
    console.error("Error details:", {
      message: e?.message,
      status: e?.status,
      code: e?.code,
      type: e?.type
    });
    return NextResponse.json({ 
      error: e?.message || "Unknown error",
      details: {
        status: e?.status,
        code: e?.code,
        type: e?.type
      }
    }, { status: 500 });
  }
}
