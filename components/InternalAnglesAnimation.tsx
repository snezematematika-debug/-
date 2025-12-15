
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Play, RefreshCw, Maximize2, Minimize2, X, Scissors } from 'lucide-react';

const InternalAnglesAnimation: React.FC = () => {
  const [step, setStep] = useState(0); // 0: Init, 1: Tear, 2: Move, 3: Text
  const [isExpanded, setIsExpanded] = useState(false);
  const [caption, setCaption] = useState("Да разгледаме еден произволен триаголник.");

  const runAnimation = () => {
    setStep(0);
    setCaption("Имаме триаголник со агли α, β и γ.");
    
    setTimeout(() => {
        setStep(1);
        setCaption("Ако ги 'искинеме' аглите...");
    }, 1500); 
    
    setTimeout(() => {
        setStep(2);
        setCaption("...и ги споиме нивните темиња во една точка...");
    }, 3000); 
    
    setTimeout(() => {
        setStep(3);
        setCaption("...гледаме дека тие формираат права линија (Рамен агол = 180°).");
    }, 5000);
  };

  useEffect(() => {
    // Auto start on mount
    const timer = setTimeout(() => {
        runAnimation();
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const toggleExpand = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  // Triangle Coordinates
  const pathA = "M 50 250 L 100 250 A 50 50 0 0 0 75 208 Z"; 
  const pathB = "M 350 250 L 325 208 A 50 50 0 0 0 300 250 Z"; 
  const pathC = "M 200 50 L 175 92 A 50 50 0 0 0 225 92 Z"; 

  const renderContent = (expanded: boolean) => (
    <div className={`flex flex-col items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-xl my-6 w-full mx-auto relative overflow-hidden ${expanded ? 'max-w-4xl h-full justify-center' : 'max-w-xl'}`}>
      
      {/* Header with Expand Button */}
      <div className="w-full flex justify-between items-center mb-4 relative z-10">
          <div className="flex items-center gap-2">
            <div className="bg-emerald-100 p-2 rounded-lg text-emerald-600">
                <Scissors size={20} />
            </div>
            <h3 className="text-lg font-bold text-slate-700">Визуелен доказ</h3>
          </div>
          <button 
            onClick={toggleExpand}
            className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 hover:text-blue-600 transition shadow-sm"
            title={expanded ? "Намали" : "Зголеми"}
          >
            {expanded ? <Minimize2 size={24} /> : <Maximize2 size={18} />}
          </button>
      </div>
      
      <div className={`relative w-full bg-slate-50 rounded-2xl overflow-hidden border border-slate-200 mt-2 shadow-inner ${expanded ? 'flex-1 min-h-0' : 'aspect-[16/10]'}`}>
        <svg viewBox="0 0 400 300" className="w-full h-full">
            <defs>
                 <pattern id="grid-dots" width="20" height="20" patternUnits="userSpaceOnUse">
                    <circle cx="2" cy="2" r="1" fill="#cbd5e1" />
                </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid-dots)" />

            <path d="M 50 250 L 350 250 L 200 50 Z" fill="white" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="5,5" />

            {/* Labels before animation moves them */}
            <g style={{ opacity: step >= 2 ? 0 : 1, transition: 'opacity 0.5s' }}>
                 <text x="200" y="120" textAnchor="middle" fill="#059669" className="text-sm font-bold">γ</text>
                 <text x="80" y="240" textAnchor="middle" fill="#7f1d1d" className="text-sm font-bold">α</text>
                 <text x="320" y="240" textAnchor="middle" fill="#1e3a8a" className="text-sm font-bold">β</text>
            </g>

            {/* Green Wedge (Top) - Static position */}
            <path d={pathC} fill="#10b981" fillOpacity="0.8" stroke="#059669" strokeWidth="2" />
            
            {/* Red Wedge (Left/Alpha) - Moves */}
            <g 
                className="transition-all duration-1000 ease-in-out"
                style={{
                    transformOrigin: '50px 250px',
                    transform: step >= 2 ? 'translate(150px, -200px) rotate(-180deg)' : step === 1 ? 'translate(-10px, 10px)' : 'none'
                }}
            >
                <path d={pathA} fill="#ef4444" fillOpacity="0.8" stroke="#b91c1c" strokeWidth="2" />
            </g>

            {/* Blue Wedge (Right/Beta) - Moves */}
            <g 
                className="transition-all duration-1000 ease-in-out"
                style={{
                    transformOrigin: '350px 250px',
                    transform: step >= 2 ? 'translate(-150px, -200px) rotate(180deg)' : step === 1 ? 'translate(10px, 10px)' : 'none'
                }}
            >
                <path d={pathB} fill="#3b82f6" fillOpacity="0.8" stroke="#1d4ed8" strokeWidth="2" />
            </g>

            {/* Final State Labels & Decoration */}
            {step >= 2 && (
                <g className="animate-fade-in">
                    <line x1="50" y1="50" x2="350" y2="50" stroke="#64748b" strokeWidth="2" strokeDasharray="4,4" />
                    {/* Adjusted coordinates to be INSIDE the wedges */}
                    <text x="165" y="42" className="text-sm font-bold fill-white drop-shadow-md">α</text>
                    <text x="200" y="80" className="text-sm font-bold fill-white drop-shadow-md">γ</text>
                    <text x="235" y="42" className="text-sm font-bold fill-white drop-shadow-md">β</text>
                    
                    <path d="M 150 50 A 50 50 0 0 1 250 50" fill="none" stroke="#f59e0b" strokeWidth="3" />
                </g>
            )}
        </svg>

        <div className="absolute bottom-2 left-4 text-slate-400 font-bold text-xs">A</div>
        <div className="absolute bottom-2 right-4 text-slate-400 font-bold text-xs">B</div>
        <div className="absolute top-2 left-1/2 -translate-x-1/2 text-slate-400 font-bold text-xs">C</div>
      </div>

      {/* Dynamic Text Container */}
      <div className="mt-4 w-full min-h-[80px] flex flex-col items-center justify-center bg-blue-50/50 rounded-xl p-4 border border-blue-100 transition-all">
         <p className="text-lg text-slate-800 font-medium text-center animate-fade-in key={step}">
            {caption}
         </p>
         
         {step === 3 && (
            <div className="mt-2 text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-emerald-600 animate-pulse">
                α + β + γ = 180°
            </div>
         )}
      </div>

      <button 
        onClick={runAnimation}
        className="mt-4 flex items-center gap-2 text-slate-500 hover:text-blue-600 font-bold text-sm px-4 py-2 hover:bg-slate-50 rounded-full transition border border-transparent hover:border-slate-200"
      >
        <RefreshCw size={16} /> Повтори
      </button>
    </div>
  );

  if (isExpanded) {
    return createPortal(
        <div className="fixed inset-0 z-[2000] bg-white/95 backdrop-blur-md flex items-center justify-center p-4 md:p-8 animate-fade-in">
             <div className="absolute top-4 right-4 z-50">
                <button onClick={toggleExpand} className="p-3 bg-slate-100 hover:bg-red-100 text-slate-600 hover:text-red-600 rounded-full shadow-lg transition">
                    <X size={24}/>
                </button>
             </div>
             {renderContent(true)}
        </div>,
        document.body
    );
  }

  return renderContent(false);
};

export default InternalAnglesAnimation;
