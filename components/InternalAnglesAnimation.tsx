import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Play, RefreshCw, Maximize2, Minimize2, X } from 'lucide-react';

const InternalAnglesAnimation: React.FC = () => {
  const [step, setStep] = useState(0); // 0: Init, 1: Tear, 2: Move, 3: Text
  const [isExpanded, setIsExpanded] = useState(false);

  const runAnimation = () => {
    setStep(0);
    setTimeout(() => setStep(1), 100); // Small delay to reset
    setTimeout(() => setStep(2), 1000); // Move to top
    setTimeout(() => setStep(3), 2500); // Show text
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
    <div className={`flex flex-col items-center bg-white p-6 rounded-xl border-2 border-slate-100 shadow-lg my-6 w-full mx-auto relative ${expanded ? 'max-w-4xl h-full justify-center' : 'max-w-md'}`}>
      
      {/* Header with Expand Button */}
      <div className="w-full flex justify-between items-center mb-4 absolute top-4 px-6 z-10">
          <h3 className="text-lg font-bold text-slate-700">Визуелен доказ</h3>
          <button 
            onClick={toggleExpand}
            className="p-2 bg-white/80 hover:bg-slate-100 rounded-full text-slate-500 hover:text-blue-600 transition shadow-sm"
            title={expanded ? "Намали" : "Зголеми"}
          >
            {expanded ? <Minimize2 size={24} /> : <Maximize2 size={18} />}
          </button>
      </div>
      
      <div className={`relative w-full bg-slate-50 rounded-lg overflow-hidden border border-slate-200 mt-8 ${expanded ? 'flex-1 min-h-0' : 'aspect-[4/3]'}`}>
        <svg viewBox="0 0 400 300" className="w-full h-full">
            <path d="M 50 250 L 350 250 L 200 50 Z" fill="none" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="5,5" />

            <path d={pathC} fill="#10b981" fillOpacity="0.8" stroke="#059669" strokeWidth="2" />
            <text x="200" y="120" textAnchor="middle" fill="#059669" className="text-sm font-bold">γ</text>

            <g 
                className="transition-all duration-1000 ease-in-out"
                style={{
                    transformOrigin: '50px 250px',
                    transform: step >= 2 ? 'translate(150px, -200px) rotate(-180deg)' : step === 1 ? 'translate(-10px, 10px)' : 'none'
                }}
            >
                <path d={pathA} fill="#ef4444" fillOpacity="0.8" stroke="#b91c1c" strokeWidth="2" />
                <text x="80" y="240" textAnchor="middle" fill="#7f1d1d" className="text-sm font-bold">α</text>
            </g>

            <g 
                className="transition-all duration-1000 ease-in-out"
                style={{
                    transformOrigin: '350px 250px',
                    transform: step >= 2 ? 'translate(-150px, -200px) rotate(180deg)' : step === 1 ? 'translate(10px, 10px)' : 'none'
                }}
            >
                <path d={pathB} fill="#3b82f6" fillOpacity="0.8" stroke="#1d4ed8" strokeWidth="2" />
                <text x="320" y="240" textAnchor="middle" fill="#1e3a8a" className="text-sm font-bold">β</text>
            </g>

            {step >= 2 && (
                <line x1="100" y1="50" x2="300" y2="50" stroke="#64748b" strokeWidth="2" strokeDasharray="4,2" className="animate-fade-in" />
            )}
        </svg>

        <div className="absolute bottom-2 left-4 text-slate-400 font-bold">A</div>
        <div className="absolute bottom-2 right-4 text-slate-400 font-bold">B</div>
        <div className="absolute top-2 left-1/2 -translate-x-1/2 text-slate-400 font-bold">C</div>
      </div>

      <div className={`mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl text-center transition-all duration-700 w-full ${step >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <p className="text-lg text-slate-800 font-bold">
          Збирот на внатрешните агли во секој триаголник е <span className="text-blue-600 text-2xl">180°</span>.
        </p>
        <p className="text-sm text-slate-500 mt-1">
            α + β + γ = 180° (рамен агол)
        </p>
      </div>

      <button 
        onClick={runAnimation}
        className="mt-4 flex items-center gap-2 text-blue-600 hover:text-blue-800 font-semibold px-4 py-2 hover:bg-blue-50 rounded-lg transition"
      >
        <RefreshCw size={18} /> Повтори анимација
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