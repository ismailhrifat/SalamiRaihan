import React, { useState, useRef, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { toJpeg } from 'html-to-image';
import piexif from 'piexifjs';
import { Gift, Download, RefreshCw, Clock, ArrowLeft, Moon, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SalamiRecord {
  amount: number;
  date: string;
}

const toBengaliNumber = (num: number | string) => {
  const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return num.toString().replace(/\d/g, x => bengaliDigits[parseInt(x)]);
};

const generateVerificationCode = (amount: number, date: string) => {
  const secret = "RIFAT_EID_SALAMI_2024";
  const str = `${amount}-${date}-${secret}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).toUpperCase().padStart(8, '0');
};

const SalamiCard = ({ amount, date, cardRef, isDownload = false }: { amount: number | null, date: string, cardRef?: React.RefObject<HTMLDivElement | null>, isDownload?: boolean }) => {
  return (
    <div
      ref={cardRef}
      className="relative overflow-hidden bg-white border border-stone-200 rounded-2xl p-8 shadow-sm text-center"
    >
      {/* Decorative minimalist elements */}
      <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-500 to-teal-400"></div>
      <div className="absolute -top-16 -right-16 w-40 h-40 bg-emerald-50 rounded-full opacity-60"></div>
      <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-amber-50 rounded-full opacity-60"></div>
      
      <Moon className="absolute top-6 right-6 w-16 h-16 text-emerald-600/5 rotate-12" />
      <Star className="absolute bottom-10 left-8 w-8 h-8 text-amber-500/10" />

      <div className="relative z-10">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
          <p className="text-[11px] font-bold tracking-widest text-emerald-700 uppercase">
            ঈদ মোবারক
          </p>
          <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
        </div>
        
        <h2 className="text-6xl font-bold text-stone-900 mb-3 tracking-tighter flex items-center justify-center">
          <span className="text-3xl text-stone-400 font-medium mr-1">৳</span>
          {toBengaliNumber(amount || 0)}
        </h2>
        <p className="text-stone-600 text-sm mb-2 max-w-[220px] mx-auto leading-relaxed">
          রায়হানের পক্ষ থেকে আপনার জন্য ঈদ সেলামি। সেলামি বুঝে পেতে এই কার্ডটি প্রদর্শন করুন।
        </p>

        {isDownload && (
          <div className="mt-6 pt-4 border-t border-stone-100 flex flex-col items-center gap-1">
            <p className="text-[10px] font-bold text-emerald-600/60 uppercase tracking-[0.2em]">
              Valid Card • অথেনটিক সেলামি কার্ড
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default function App() {
  const [salami, setSalami] = useState<number | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [history, setHistory] = useState<SalamiRecord[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Load history from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem('salami_history');
    const hasCookie = document.cookie.includes('salami_claimed=true');
    
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setHistory(parsed);
        if (parsed.length > 0) {
          setSalami(parsed[0].amount);
        }
      } catch (e) {
        console.error('Failed to parse history');
      }
    } else if (hasCookie) {
      // Fallback if local storage was cleared but cookie remains
      setSalami(10); // Minimum amount as fallback to prevent regeneration
    }
  }, []);

  const generateSalami = () => {
    // Prevent multiple generations
    if (history.length > 0 || document.cookie.includes('salami_claimed=true') || salami !== null) {
      return; 
    }

    setIsGenerating(true);
    
    setTimeout(() => {
      const rand = Math.random();
      let amount = 5;
      
      if (rand < 0.02) {
        // 1 out of 50 (2%) will cross 90 (91 to 100)
        amount = Math.floor(Math.random() * 10) + 91; 
      } else if (rand < 0.07) {
        // 1 out of 20 (5%) will be between 51 and 90
        amount = Math.floor(Math.random() * 40) + 51; 
      } else if (rand < 0.27) {
        // 1 out of 5 (20%) will be between 21 and 50
        amount = Math.floor(Math.random() * 30) + 21; 
      } else {
        // Remaining (73%) will be between 5 and 20
        amount = Math.floor(Math.random() * 16) + 5; 
      }
      
      const newRecord: SalamiRecord = {
        amount,
        date: new Date().toLocaleString('bn-BD', { 
          year: 'numeric', month: 'long', day: 'numeric', 
          hour: '2-digit', minute: '2-digit' 
        })
      };

      // Update history state and local storage (only keep 1 record)
      const updatedHistory = [newRecord];
      setHistory(updatedHistory);
      localStorage.setItem('salami_history', JSON.stringify(updatedHistory));
      
      // Set a cookie that expires in 1 year to add another layer of restriction
      document.cookie = "salami_claimed=true; max-age=31536000; path=/";

      setSalami(amount);
      setIsGenerating(false);
    }, 1200);
  };

  const downloadCard = async () => {
    if (salami === null) return;
    
    try {
      // Create a temporary container off-screen to prevent capturing tampered DOM
      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'absolute';
      tempContainer.style.left = '-9999px';
      tempContainer.style.top = '-9999px';
      // Match the width of the visible card to ensure identical layout
      tempContainer.style.width = cardRef.current ? `${cardRef.current.offsetWidth}px` : '384px';
      document.body.appendChild(tempContainer);

      // Render the authentic card from React state
      const root = createRoot(tempContainer);
      const record = history[0];
      const dateStr = record?.date || "";
      flushSync(() => {
        root.render(<SalamiCard amount={salami} date={dateStr} isDownload={true} />);
      });

      // Wait a brief moment to ensure styles and fonts are applied
      await new Promise(resolve => setTimeout(resolve, 100));

      const dataUrl = await toJpeg(tempContainer.firstChild as HTMLElement, {
        pixelRatio: 3,
        backgroundColor: '#ffffff',
        quality: 0.95,
      });

      // Inject EXIF metadata
      const vCode = generateVerificationCode(salami, dateStr);
      const exifObj = { "0th": {}, "Exif": {}, "GPS": {} };
      
      // Use a simple ASCII date for metadata to avoid btoa errors with Bengali characters
      const asciiDate = record?.date ? new Date().toISOString() : new Date().toISOString();

      // @ts-ignore
      exifObj["0th"][piexif.ImageIFD.Make] = "Rifat Eid Salami";
      // @ts-ignore
      exifObj["0th"][piexif.ImageIFD.ImageDescription] = `AUTHENTIC_SALAMI_CARD|AMOUNT:${salami}|DATE_ISO:${asciiDate}|VERIFICATION_HASH:${vCode}`;
      // @ts-ignore
      exifObj["0th"][piexif.ImageIFD.Software] = "Rifat Salami App v2.0";
      
      const exifStr = piexif.dump(exifObj);
      const dataUrlWithExif = piexif.insert(exifStr, dataUrl);

      // Cleanup
      root.unmount();
      document.body.removeChild(tempContainer);

      const link = document.createElement('a');
      link.href = dataUrlWithExif;
      link.download = `eid-salami-${salami}.jpg`;
      link.click();
    } catch (error) {
      console.error('Error generating image:', error);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F9F8] flex items-center justify-center p-4 font-sans text-stone-900 selection:bg-emerald-100">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-stone-100 p-8 text-center relative overflow-hidden"
      >
        <div className="flex justify-between items-start mb-2">
          <h1 className="text-2xl font-bold tracking-tight text-left text-emerald-900">রায়হানের ঈদ সেলামি</h1>
          <button 
            onClick={() => setShowHistory(!showHistory)} 
            className="p-2 -mr-2 -mt-2 text-stone-400 hover:text-emerald-700 transition-colors rounded-full hover:bg-emerald-50"
            title={showHistory ? "পেছনে ফিরুন" : "পূর্বের সেলামি"}
          >
            {showHistory ? <ArrowLeft className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
          </button>
        </div>
        
        <p className="text-stone-500 mb-8 text-sm text-left leading-relaxed">
          {showHistory ? 'আপনার পূর্বে সংগ্রহ করা সেলামির তালিকা।' : 'বোতাম চেপে জেনে নিন এবারের ঈদে আপনার ভাগ্যে কত সেলামি আছে!'}
        </p>

        <AnimatePresence mode="wait">
          {showHistory ? (
            <motion.div
              key="history"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="min-h-[300px] flex flex-col"
            >
              <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1 pb-4">
                {history.length === 0 ? (
                  <div className="py-12 flex flex-col items-center justify-center text-stone-400">
                    <Clock className="w-8 h-8 mb-3 opacity-20" />
                    <p className="text-sm">এখনো কোনো সেলামি সংগ্রহ করা হয়নি।</p>
                  </div>
                ) : (
                  history.map((record, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border border-stone-100 rounded-2xl bg-stone-50/50 hover:bg-stone-50 transition-colors">
                      <div className="text-left">
                        <p className="text-lg font-bold text-emerald-900 mb-0.5">
                          <span className="text-emerald-600/70 font-medium text-sm mr-1">৳</span>
                          {toBengaliNumber(record.amount)}
                        </p>
                        <p className="text-xs text-stone-500">{toBengaliNumber(record.date)}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="generator"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
            >
              <div className="min-h-[220px] flex flex-col justify-center mb-8">
                <AnimatePresence mode="wait">
                  {salami === null ? (
                    <motion.div 
                      key="placeholder"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="py-12 flex flex-col items-center justify-center border-2 border-dashed border-stone-200 rounded-2xl bg-stone-50/50 relative overflow-hidden"
                    >
                      <Moon className="absolute -top-4 -right-4 w-24 h-24 text-stone-100 opacity-50 rotate-12" />
                      <motion.div
                        animate={isGenerating ? { rotate: [0, -10, 10, -10, 10, 0] } : {}}
                        transition={{ duration: 0.5, repeat: isGenerating ? Infinity : 0 }}
                        className="relative z-10"
                      >
                        <Gift className={`w-12 h-12 mb-4 ${isGenerating ? 'text-emerald-600' : 'text-stone-300'}`} />
                      </motion.div>
                      <p className="text-stone-500 font-medium relative z-10">
                        {isGenerating ? 'আপনার ভাগ্য গণনা চলছে...' : 'আপনার সেলামি অপেক্ষা করছে...'}
                      </p>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="card"
                      initial={{ opacity: 0, scale: 0.9, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    >
                      <SalamiCard amount={salami} date={history[0]?.date || ""} cardRef={cardRef} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="space-y-3">
                {salami === null ? (
                  <button
                    onClick={generateSalami}
                    disabled={isGenerating}
                    className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-medium py-3.5 px-4 rounded-xl transition-all flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed active:scale-[0.98] shadow-sm"
                  >
                    {isGenerating ? (
                      <RefreshCw className="w-5 h-5 animate-spin" />
                    ) : (
                      'সেলামি সংগ্রহ করুন'
                    )}
                  </button>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="space-y-3"
                  >
                    <button
                      onClick={downloadCard}
                      className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-medium py-3.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 active:scale-[0.98] shadow-sm"
                    >
                      <Download className="w-5 h-5" />
                      কার্ড ডাউনলোড করুন
                    </button>
                    <p className="text-stone-400 text-[11px] pt-2">
                      * একজন ব্যবহারকারী কেবল একবারই সেলামি সংগ্রহ করতে পারবেন।
                    </p>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
