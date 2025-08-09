"use client";

import React, { useEffect, useRef, useState } from "react";

// Gen Z facts for loading screen
const funFacts = [
  "No cap, that iPhone probably cost like $50 to make but they're charging you $1000+ 💀",
  "Bestie, your Starbucks cup is literally just paper but they're making bank on it ☕️",
  "Fr fr, that designer bag is just leather and thread but they're taxing you $500+ 💼",
  "Periodt, some brands be having 1000%+ markup and we're just eating it up 😭",
  "Slay, the fashion industry be marking up clothes by 400-800% and we still buy it 👗",
  "No lie, electronics have the highest profit margins and we're all falling for it 📱",
  "Fr, that $200 sneaker probably cost $20 to make and we're still copping it 👟",
  "Literally, luxury brands be having 10x markup and we're still obsessed ✨",
  "Periodt, bottled water has 4000% markup and we're still buying it 💧",
  "Bestie, some products are literally just repackaged versions of cheaper stuff 🤡"
];

// ----------------------------------------------
// Helpers + Lightweight Tests
// ----------------------------------------------
function sanitizeResult(raw: any) {
  const res = raw ? { ...raw } : {};
  
  // Sanitize estimatedBOM
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
  
  // Sanitize marketPrice
  if (res.marketPrice) {
    let low = Number(res.marketPrice.lowUSD ?? 0);
    let high = Number(res.marketPrice.highUSD ?? low);
    if (Number.isNaN(low)) low = 0;
    if (Number.isNaN(high)) high = low;
    // clamp & order
    low = Math.max(0, low);
    high = Math.max(low, high);
    res.marketPrice = { 
      ...res.marketPrice, 
      lowUSD: low, 
      highUSD: high,
      currency: res.marketPrice.currency || 'USD',
      notes: res.marketPrice.notes || ''
    };
  }
  
  return res;
}

function runSanitizeResultTests() {
  const cases = [
    {
      name: "orders high >= low",
      input: { estimatedBOM: { lowUSD: 12, highUSD: 5 } },
      check: (out: any) => out.estimatedBOM.lowUSD === 12 && out.estimatedBOM.highUSD === 12,
    },
    {
      name: "clamps negatives to 0",
      input: { estimatedBOM: { lowUSD: -3, highUSD: -1 } },
      check: (out: any) => out.estimatedBOM.lowUSD === 0 && out.estimatedBOM.highUSD === 0,
    },
    {
      name: "missing high uses low",
      input: { estimatedBOM: { lowUSD: 7 } },
      check: (out: any) => out.estimatedBOM.lowUSD === 7 && out.estimatedBOM.highUSD === 7,
    },
    {
      name: "NaN becomes 0",
      input: { estimatedBOM: { lowUSD: "nope", highUSD: "nah" } },
      check: (out: any) => out.estimatedBOM.lowUSD === 0 && out.estimatedBOM.highUSD === 0,
    },
  ];
  let passed = 0;
  for (const c of cases) {
    const out = sanitizeResult(c.input);
    if (!c.check(out)) {
      console.error("[sanitizeResult test failed]", c.name, out);
    } else {
      passed += 1;
    }
  }
  console.log(`[sanitizeResult] ${passed}/${cases.length} tests passed`);
}

if (typeof window !== "undefined") {
  try { runSanitizeResultTests(); } catch (e) { /* ignore */ }
}

// ----------------------------------------------
// Component
// ----------------------------------------------
export default function TrueCostAI() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [streaming, setStreaming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [currentFact, setCurrentFact] = useState(0);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [bannerText, setBannerText] = useState(0);
  const [showExitPopup, setShowExitPopup] = useState(false);

  // Exit intent popup
  useEffect(() => {
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0) {
        setShowExitPopup(true);
      }
    };

    document.addEventListener('mouseleave', handleMouseLeave);
    return () => document.removeEventListener('mouseleave', handleMouseLeave);
  }, []);

  // Rotate banner text with different timings
  useEffect(() => {
    let timeoutId1: NodeJS.Timeout;
    let timeoutId2: NodeJS.Timeout;
    let timeoutId3: NodeJS.Timeout;
    
    const startRotation = () => {
      // Show personal brand slide for 5 seconds
      setBannerText(0);
      
      timeoutId1 = setTimeout(() => {
        // Show conversion slide for 10 seconds
        setBannerText(1);
        
        timeoutId2 = setTimeout(() => {
          // Show KORA slide for 10 seconds
          setBannerText(2);
          
          timeoutId3 = setTimeout(() => {
            // Restart the cycle
            startRotation();
          }, 10000);
        }, 10000);
      }, 5000);
    };

    startRotation();

    return () => {
      if (timeoutId1) clearTimeout(timeoutId1);
      if (timeoutId2) clearTimeout(timeoutId2);
      if (timeoutId3) clearTimeout(timeoutId3);
    };
  }, []);

  useEffect(() => {
    let activeStream: MediaStream | undefined;
    const getCam = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: "environment",
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }, 
          audio: false 
        });
        activeStream = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setStreaming(true);
        }
      } catch (e: any) {
        setError((e && e.message) || "Could not access camera");
      }
    };
    getCam();
    return () => {
      try {
        const s = activeStream || (videoRef.current && videoRef.current.srcObject);
        if (s && 'getTracks' in s) {
          Array.from(s.getTracks()).forEach((t: MediaStreamTrack) => t.stop());
        }
      } catch (_) {}
    };
  }, []);

  const analyzeFrame = async () => {
    if (!videoRef.current || !canvasRef.current || loading) return;
    
    let progressInterval: NodeJS.Timeout | undefined;
    let factInterval: NodeJS.Timeout | undefined;
    
    try {
      setLoading(true);
      setError(null);
      setLoadingProgress(0);
      setCurrentFact(0);
      
      // Start progress animation
      progressInterval = setInterval(() => {
        setLoadingProgress(prev => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 15;
        });
      }, 500);
      
      // Rotate through fun facts
      factInterval = setInterval(() => {
        setCurrentFact(prev => (prev + 1) % funFacts.length);
      }, 3000);
      
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const w = video.videoWidth || 720;
      const h = video.videoHeight || 1280;
      
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      
      ctx.drawImage(video, 0, 0, w, h);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
      console.log("Image captured, size:", dataUrl.length);
      
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: dataUrl }),
      });
      
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const json = await res.json();
      console.log("Frontend received:", json);
      const cleaned = sanitizeResult(json);
      console.log("Cleaned result:", cleaned);
      setResult(cleaned);
    } catch (e: any) {
      console.error("Analysis error:", e);
      setError((e && e.message) || "Analysis failed");
    } finally {
      if (progressInterval) clearInterval(progressInterval);
      if (factInterval) clearInterval(factInterval);
      setLoadingProgress(100);
      setTimeout(() => {
        setLoading(false);
        setLoadingProgress(0);
      }, 500);
    }
  };

  const reset = () => {
    setResult(null);
    setError(null);
  };

  return (
    <div className="min-h-screen w-full flex flex-col p-4 gap-4 bg-white pb-20">
      <header className="w-full flex flex-col sm:flex-row sm:justify-between items-start sm:items-center">
        <h1 className="text-xl sm:text-2xl font-bold">TrueCost AI 💸</h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-1 sm:mt-0">Exposing the real cost of your faves</p>
      </header>

      <section className="w-full flex flex-col gap-4 flex-1">
        <div className="rounded-xl overflow-hidden border border-gray-200 bg-white p-3 flex flex-col items-center relative">
          <div className="relative w-full">
            <video ref={videoRef} className="w-full rounded-lg aspect-video object-cover" playsInline muted />
            {loading && (
              <div className="absolute inset-0 bg-black/80 flex items-center justify-center rounded-lg">
                <div className="text-white text-center p-6 max-w-sm">
                                     {/* Simple logo */}
                   <div className="mb-6">
                     <div className="text-sm text-gray-300">Exposing the tea on your product</div>
                   </div>
                  
                  {/* Progress bar */}
                  <div className="mb-6">
                    <div className="flex justify-between text-xs mb-2">
                      <span>Progress</span>
                      <span>{Math.round(loadingProgress)}%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-1 overflow-hidden">
                      <div 
                        className="h-full bg-white rounded-full transition-all duration-300 ease-out"
                        style={{ width: `${loadingProgress}%` }}
                      ></div>
                    </div>
                  </div>
                  
                                     {/* Fact */}
                   <div className="mb-6">
                     <div className="text-xs text-gray-400 mb-2">💡 The tea</div>
                     <div className="text-sm leading-relaxed">
                       {funFacts[currentFact]}
                     </div>
                   </div>
                  
                  {/* Simple loading dots */}
                  <div className="flex justify-center space-x-2">
                    <div className="w-1 h-1 bg-white rounded-full animate-pulse"></div>
                    <div className="w-1 h-1 bg-white rounded-full animate-pulse" style={{ animationDelay: '200ms' }}></div>
                    <div className="w-1 h-1 bg-white rounded-full animate-pulse" style={{ animationDelay: '400ms' }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="w-full mt-3 flex gap-2">
            <button 
              onClick={analyzeFrame} 
              disabled={!streaming || loading} 
              className="flex-1 px-4 py-3 rounded-lg border border-gray-300 text-black bg-white hover:bg-gray-50 disabled:opacity-50 transition-all duration-200 font-medium"
            >
              {loading ? "Exposing the tea..." : "Spill the tea ☕️"}
            </button>
            {result && (
              <button 
                onClick={reset} 
                className="px-4 py-3 rounded-lg border border-gray-300 text-black bg-white hover:bg-gray-50 transition-colors"
              >
                Reset
              </button>
            )}
          </div>
        </div>

                 <div className="rounded-xl overflow-hidden shadow bg-white p-4">
           <h2 className="font-semibold mb-2 text-base sm:text-lg">The Tea ☕️</h2>
           {error && <div className="text-red-600 text-sm">{error}</div>}
           {!result && !error && <div className="text-gray-500 text-sm">Point your camera at something and click "Spill the tea" to see what's really going on.</div>}
          {result && (
            <div className="space-y-3 text-sm">
              {result.productName && (
                <div>
                  <div className="text-gray-500">Product</div>
                  <div className="text-base font-semibold">{result.productName}</div>
                </div>
              )}
              {result.category && (
                <div>
                  <div className="text-gray-500">Category</div>
                  <div>{result.category}</div>
                </div>
              )}
              {Array.isArray(result.materials) && result.materials.length > 0 && (
                <div>
                  <div className="text-gray-500">Likely Materials</div>
                  <ul className="list-disc ml-5">
                    {result.materials.map((m: string, i: number) => (
                      <li key={i}>{m}</li>
                    ))}
                  </ul>
                </div>
              )}
                             {result.estimatedBOM && (
                 <div className="p-3 rounded-lg bg-gray-50">
                   <div className="text-gray-500">💸 What it actually costs to make</div>
                   <div className="text-base font-semibold">
                     ${result.estimatedBOM.lowUSD.toFixed(2)} – ${result.estimatedBOM.highUSD.toFixed(2)}
                   </div>
                   <div className="text-xs text-gray-600 mt-1 whitespace-pre-wrap">{result.estimatedBOM.methodology}</div>
                 </div>
               )}
              {result.marketPrice && result.marketPrice.lowUSD !== undefined && result.marketPrice.highUSD !== undefined && (
                                 <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                   <div className="text-blue-700 font-medium mb-2">💰 What they're charging you</div>
                   <div className="text-lg font-bold text-blue-800">
                     ${Number(result.marketPrice.lowUSD || 0).toFixed(2)} – ${Number(result.marketPrice.highUSD || 0).toFixed(2)}
                   </div>
                   <div className="text-xs text-blue-600 mt-1 whitespace-pre-wrap">{result.marketPrice.notes || ''}</div>
                 </div>
              )}
              {result.estimatedBOM && result.marketPrice && result.estimatedBOM.lowUSD !== undefined && result.estimatedBOM.highUSD !== undefined && result.marketPrice.lowUSD !== undefined && result.marketPrice.highUSD !== undefined && (
                                 <div className="p-3 rounded-lg bg-green-50 border border-green-200">
                   <div className="text-green-700 font-medium mb-2">💀 The markup is crazy</div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Low BOM Cost:</span>
                      <span className="font-medium">${Number(result.estimatedBOM.lowUSD || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>High BOM Cost:</span>
                      <span className="font-medium">${Number(result.estimatedBOM.highUSD || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Low Market Price:</span>
                      <span className="font-medium">${Number(result.marketPrice.lowUSD || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>High Market Price:</span>
                      <span className="font-medium">${Number(result.marketPrice.highUSD || 0).toFixed(2)}</span>
                    </div>
                                         <div className="border-t pt-1 mt-2">
                       <div className="flex justify-between font-semibold">
                         <span>They're taxing you:</span>
                         <span className="text-green-700">
                          {(() => {
                            const lowBOM = Number(result.estimatedBOM.lowUSD || 0);
                            const highBOM = Number(result.estimatedBOM.highUSD || 0);
                            const lowMarket = Number(result.marketPrice.lowUSD || 0);
                            const highMarket = Number(result.marketPrice.highUSD || 0);
                            
                            if (lowMarket <= 0 || highMarket <= 0) return 'N/A';
                            
                            const lowMargin = lowMarket > highBOM ? ((lowMarket - highBOM) / lowMarket * 100) : 0;
                            const highMargin = highMarket > lowBOM ? ((highMarket - lowBOM) / highMarket * 100) : 0;
                            
                            return `${lowMargin.toFixed(1)}% - ${highMargin.toFixed(1)}%`;
                          })()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {result.environmentalImpact && (
                <div className="p-3 rounded-lg bg-green-50 border border-green-200">
                  <div className="text-green-700 font-medium mb-2">🌱 Environmental Impact</div>
                  <div className="space-y-3">
                    {result.environmentalImpact.carbonFootprint && result.environmentalImpact.carbonFootprint.kgCO2e !== undefined && (
                      <div>
                        <div className="text-sm text-green-600 mb-1">Carbon Footprint</div>
                        <div className="text-lg font-semibold text-green-800">
                          {Number(result.environmentalImpact.carbonFootprint.kgCO2e || 0).toFixed(1)} kg CO₂e
                        </div>
                        <div className="text-xs text-green-600 mt-1">
                          {result.environmentalImpact.carbonFootprint.methodology || ''}
                        </div>
                      </div>
                    )}
                    {result.environmentalImpact.sustainabilityScore !== undefined && (
                      <div>
                        <div className="text-sm text-green-600 mb-1">Sustainability Score</div>
                        <div className="flex items-center gap-2">
                          <div className="text-lg font-semibold text-green-800">
                            {Number(result.environmentalImpact.sustainabilityScore || 0).toFixed(0)}/100
                          </div>
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-green-500 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${Math.min(100, Math.max(0, Number(result.environmentalImpact.sustainabilityScore || 0)))}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    )}
                    {result.environmentalImpact.recyclability && result.environmentalImpact.recyclability.percentage !== undefined && (
                      <div>
                        <div className="text-sm text-green-600 mb-1">Recyclability</div>
                        <div className="flex items-center gap-2">
                          <div className="text-lg font-semibold text-green-800">
                            {Number(result.environmentalImpact.recyclability.percentage || 0).toFixed(0)}%
                          </div>
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${Math.min(100, Math.max(0, Number(result.environmentalImpact.recyclability.percentage || 0)))}%` }}
                            ></div>
                          </div>
                        </div>
                        <div className="text-xs text-green-600 mt-1">
                          {result.environmentalImpact.recyclability.notes || ''}
                        </div>
                      </div>
                    )}
                    {result.environmentalImpact.environmentalNotes && (
                      <div className="text-xs text-green-700 bg-green-100 p-2 rounded">
                        {result.environmentalImpact.environmentalNotes}
                      </div>
                    )}
                  </div>
                </div>
              )}
              {result.retailEstimates && (
                <div>
                  <div className="text-gray-500">Retail Context</div>
                  <div className="text-xs text-gray-700 whitespace-pre-wrap">{result.retailEstimates.commentary}</div>
                </div>
              )}
              {typeof result.confidence === "number" && (
                <div>
                  <div className="text-gray-500">Confidence</div>
                  <div>{Math.round(result.confidence * 100)}%</div>
                </div>
              )}
              {result.caution && (
                <div className="text-xs text-amber-700 bg-amber-50 p-2 rounded-lg">{result.caution}</div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="w-full bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-3 mt-4">
        <div className="text-center mb-3">
          <h3 className="font-bold text-base text-gray-800 mb-1">Trusted by 10,000+ Users</h3>
          <p className="text-xs text-gray-600">Built by Sirio with love</p>
        </div>
        <div className="flex justify-center space-x-3">
          <a 
            href="https://enhancor.ai" 
            target="_blank" 
            rel="noopener noreferrer"
            className="bg-white hover:bg-gray-50 text-gray-800 px-3 py-1.5 rounded-md font-semibold shadow-sm transition-colors text-xs"
          >
            Try Enhancor.ai
          </a>
          <a 
            href="https://kora.enhancor.ai" 
            target="_blank" 
            rel="noopener noreferrer"
            className="bg-white hover:bg-gray-50 text-gray-800 px-3 py-1.5 rounded-md font-semibold shadow-sm transition-colors text-xs"
          >
            Create with KORA
          </a>
        </div>
      </section>

      <canvas ref={canvasRef} className="hidden" />
      
      {/* Floating CTA Button */}
      <div className="fixed top-4 right-4 z-[9998]">
        <a 
          href="https://enhancor.ai" 
          target="_blank" 
          rel="noopener noreferrer"
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full font-bold shadow-lg hover:shadow-xl transition-all duration-300 text-sm"
        >
          Fix AI Photos
        </a>
      </div>
      
      {/* Sticky bottom banner */}
      <div className="fixed bottom-0 left-0 right-0 bg-black text-white p-4 border-t border-gray-800 z-[9999]" style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 9999 }}>
        <div className="flex justify-between items-center max-w-md mx-auto text-base">
          {bannerText === 0 ? (
            <div className="flex items-center space-x-2">
              <span>by</span>
              <a 
                href="https://instagram.com/heysirio" 
                target="_blank" 
                rel="noopener noreferrer"
                className="font-bold hover:underline transition-colors text-blue-300 hover:text-blue-200"
              >
                @heysirio
              </a>
            </div>
          ) : bannerText === 1 ? (
            <div className="flex items-center space-x-2">
              <span className="text-gray-400">⚡ Try</span>
              <a 
                href="https://enhancor.ai" 
                target="_blank" 
                rel="noopener noreferrer"
                className="font-bold hover:underline transition-colors text-blue-300 hover:text-blue-200"
              >
                Enhancor.ai
              </a>
              <span className="text-gray-400">fix AI photos now</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <span className="text-gray-400">🎨 Generate realistic AI images</span>
            </div>
          )}
                    {bannerText === 0 ? (
            <div className="flex items-center space-x-2">
              <span className="text-gray-400">🔥 10k+ users love</span>
              <a 
                href="https://enhancor.ai" 
                target="_blank" 
                rel="noopener noreferrer"
                className="font-bold hover:underline transition-colors text-blue-300 hover:text-blue-200"
              >
                Enhancor.ai
              </a>
            </div>
          ) : bannerText === 1 ? (
            <a 
              href="https://enhancor.ai" 
              target="_blank" 
              rel="noopener noreferrer"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold transition-colors text-sm"
            >
              Try Now →
            </a>
          ) : (
            <a 
              href="https://kora.enhancor.ai" 
              target="_blank" 
              rel="noopener noreferrer"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold transition-all duration-300 text-sm shadow-lg hover:shadow-xl shadow-blue-500/50 hover:shadow-blue-500/70"
            >
              Try KORA
            </a>
          )}
        </div>
      </div>
      
      {/* Exit Intent Popup */}
      {showExitPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[10000] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full text-center">
            <h3 className="font-bold text-xl mb-2">Wait! 🚀</h3>
            <p className="text-gray-600 mb-4">Don't leave without trying our AI photo tools!</p>
            <div className="space-y-3">
              <a 
                href="https://enhancor.ai" 
                target="_blank" 
                rel="noopener noreferrer"
                className="block w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-bold transition-colors"
              >
                Fix AI Photos Now
              </a>
              <a 
                href="https://kora.enhancor.ai" 
                target="_blank" 
                rel="noopener noreferrer"
                className="block w-full bg-purple-600 hover:bg-purple-700 text-white py-3 px-4 rounded-lg font-bold transition-colors"
              >
                Create with KORA
              </a>
              <button 
                onClick={() => setShowExitPopup(false)}
                className="block w-full text-gray-500 hover:text-gray-700 py-2"
              >
                Maybe later
              </button>
            </div>
          </div>
        </div>
      )}
      
             <footer className="text-xs text-gray-400 mt-6 text-center pb-20">
         Fr fr, this is just the materials cost. They're still making bank on labor, shipping, and marketing 💸
       </footer>
    </div>
  );
}
