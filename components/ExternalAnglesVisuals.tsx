
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { RefreshCw, Maximize2, X, Minimize2, PlayCircle, Info } from 'lucide-react';

interface Props {
  mode: 'supplementary' | 'sum_360' | 'theorem' | 'definition';
}

const ExternalAnglesVisuals: React.FC<Props> = ({ mode }) => {
  const [step, setStep] = useState(0);
  const [activeVertex, setActiveVertex] = useState<0 | 1 | 2>(0); // 0=B (Beta), 1=C (Gamma), 2=A (Alpha)
  const [isExpanded, setIsExpanded] = useState(false);
  const [playTrigger, setPlayTrigger] = useState(0);
  const [hasStarted, setHasStarted] = useState(mode !== 'supplementary' && mode !== 'definition');
  const [isFinished, setIsFinished] = useState(false);
  
  // Dynamic caption state
  const [caption, setCaption] = useState("");

  // Animation Loop Logic
  useEffect(() => {
    let timeoutIds: ReturnType<typeof setTimeout>[] = [];

    const runSequence = () => {
      if (mode === 'supplementary') {
        if (!hasStarted) {
            setStep(0);
            setCaption("Кликни на 'Провери' за да започнеш.");
            return;
        }

        const PHASE_DURATION = 5000;
        const animateVertex = (vertexIdx: 0 | 1 | 2) => {
           setActiveVertex(vertexIdx);
           setStep(0); 
           setCaption("Го набљудуваме темето...");
           
           timeoutIds.push(setTimeout(() => {
               setStep(1);
               setCaption("Внатрешниот и надворешниот агол лежат на иста права.");
           }, 1000));
           
           timeoutIds.push(setTimeout(() => {
               setStep(2);
               setCaption("Заедно формираат полукруг (рамен агол).");
           }, 2500));
           
           timeoutIds.push(setTimeout(() => {
               setStep(3);
               setCaption("Затоа нивниот збир е секогаш 180°.");
           }, 4000));
        };
        
        animateVertex(0);
        timeoutIds.push(setTimeout(() => animateVertex(1), PHASE_DURATION));
        timeoutIds.push(setTimeout(() => {
            animateVertex(2);
            timeoutIds.push(setTimeout(() => {
                setIsFinished(true);
                setCaption("Ова важи за секое теме од триаголникот!");
            }, PHASE_DURATION));
        }, PHASE_DURATION * 2));

      } else if (mode === 'definition') {
         if (!hasStarted) {
            setStep(0);
            setCaption("Кликни на 'Провери' за да видиш како се добиваат.");
            return;
         }

         setStep(0);
         setCaption("Започнуваме со страната AB...");
         
         timeoutIds.push(setTimeout(() => {
             setStep(1);
             setCaption("Ја продолжуваме страната AB преку темето B.");
         }, 1000));
         
         timeoutIds.push(setTimeout(() => {
             setStep(2);
             setCaption("Аголот помеѓу продолжението и страната BC е надворешен агол (β₁).");
         }, 2500));
         
         timeoutIds.push(setTimeout(() => {
             setStep(3);
             setCaption("Сега ја продолжуваме страната BC преку темето C.");
         }, 4500));
         
         timeoutIds.push(setTimeout(() => {
             setStep(4);
             setCaption("Добиваме надворешен агол γ₁.");
         }, 6000));
         
         timeoutIds.push(setTimeout(() => {
             setStep(5);
             setCaption("На крај, ја продолжуваме CA преку A.");
         }, 7500));
         
         timeoutIds.push(setTimeout(() => {
             setStep(6);
             setCaption("Го добивме и надворешниот агол α₁.");
         }, 9000));

         timeoutIds.push(setTimeout(() => {
             setIsFinished(true);
             setCaption("Надворешните агли секогаш се формираат со продолжување на страните.");
         }, 10500));

      } else if (mode === 'theorem') {
         const PHASE_DURATION = 6000; 
         
         const animateTheoremPhase = (vertexIdx: 0 | 1 | 2) => {
            setActiveVertex(vertexIdx);
            setStep(0);
            const targetName = vertexIdx === 0 ? "β₁" : vertexIdx === 1 ? "γ₁" : "α₁";
            const sourceNames = vertexIdx === 0 ? "α и γ" : vertexIdx === 1 ? "α и β" : "β и γ";
            
            setCaption(`Да го разгледаме надворешниот агол ${targetName}.`);

            timeoutIds.push(setTimeout(() => {
                setStep(1);
                setCaption(`Ги земаме двата внатрешни несоседни агли (${sourceNames})...`);
            }, 1500));
            
            timeoutIds.push(setTimeout(() => {
                setStep(2);
                setCaption(`...и ги преместуваме во надворешниот агол.`);
            }, 3000));
            
            timeoutIds.push(setTimeout(() => {
                setStep(3);
                setCaption(`Гледаме дека точно го пополнуваат! ${targetName} = Збир на несоседните.`);
            }, 4500));
         };

         animateTheoremPhase(2); // Alpha 1
         timeoutIds.push(setTimeout(() => animateTheoremPhase(0), PHASE_DURATION)); // Beta 1
         timeoutIds.push(setTimeout(() => {
             animateTheoremPhase(1); // Gamma 1
             timeoutIds.push(setTimeout(() => {
                 setIsFinished(true);
                 setCaption("Надворешен агол = Збир на двата внатрешни несоседни агли.");
             }, PHASE_DURATION));
         }, PHASE_DURATION * 2)); 

      } else if (mode === 'sum_360') {
         setStep(0);
         setCaption("Да ги набљудуваме само надворешните агли.");
         
         timeoutIds.push(setTimeout(() => {
             setStep(1);
             setCaption("Ако го смалуваме триаголникот до точка...");
         }, 2000));
         
         timeoutIds.push(setTimeout(() => {
             setStep(2);
             setCaption("...аглите се приближуваат еден до друг...");
         }, 4000));
         
         timeoutIds.push(setTimeout(() => {
             setStep(3);
             setCaption("Заедно формираат полн круг (360°)! Ова важи за секој триаголник.");
         }, 6000));
      }
    };

    runSequence();

    return () => {
      timeoutIds.forEach(clearTimeout);
    };
  }, [mode, playTrigger, hasStarted]);

  // Handle Escape key to close
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
        if (e.key === 'Escape') setIsExpanded(false);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  const toggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  const handleStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    setHasStarted(true);
    setIsFinished(false);
    setPlayTrigger(prev => prev + 1);
  };

  const handleRepeat = (e: React.MouseEvent) => {
      e.stopPropagation();
      setHasStarted(true);
      setIsFinished(false);
      setPlayTrigger(prev => prev + 1);
  };

  // --- RENDERERS (SVG CONTENT) ---
  // (Identical to previous logic, keeping drawing code exactly the same)

  const renderDefinition = () => {
    const A = { x: 80, y: 220 };
    const B = { x: 300, y: 220 };
    const C = { x: 190, y: 60 };
    const vec = (p1: {x:number, y:number}, p2: {x:number, y:number}) => ({ x: p2.x - p1.x, y: p2.y - p1.y });
    const len = (v: {x:number, y:number}) => Math.sqrt(v.x*v.x + v.y*v.y);
    const unit = (v: {x:number, y:number}) => { const l = len(v); return { x: v.x/l, y: v.y/l }; };
    const add = (p: {x:number, y:number}, v: {x:number, y:number}) => ({ x: p.x + v.x, y: p.y + v.y });
    const mul = (v: {x:number, y:number}, s: number) => ({ x: v.x * s, y: v.y * s });
    const bisect = (u1: {x:number, y:number}, u2: {x:number, y:number}) => {
        const s = { x: u1.x + u2.x, y: u1.y + u2.y };
        return unit(s);
    };
    const radius = 45;
    const labelRadius = 28;
    const extLen = 90;

    const vAB = vec(A, B); const uAB = unit(vAB); const extB_end = add(B, mul(uAB, extLen));
    const vBC = vec(B, C); const uBC = unit(vBC);
    const arcB_start = add(B, mul(uAB, radius)); const arcB_end = add(B, mul(uBC, radius));
    const dirB = bisect(uAB, uBC); const labelB_pos = add(B, mul(dirB, labelRadius));
    
    const extC_end = add(C, mul(uBC, extLen));
    const vCA = vec(C, A); const uCA = unit(vCA);
    const arcC_start = add(C, mul(uBC, radius)); const arcC_end = add(C, mul(uCA, radius));
    const dirC = bisect(uBC, uCA); const labelC_pos = add(C, mul(dirC, labelRadius));

    const extA_end = add(A, mul(uCA, extLen));
    const arcA_start = add(A, mul(uCA, radius)); const arcA_end = add(A, mul(uAB, radius));
    const dirA = bisect(uCA, uAB); const labelA_pos = add(A, mul(dirA, labelRadius));

    return (
      <svg viewBox="0 0 450 300" className="w-full h-full">
         <defs>
             <marker id="arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto" markerUnits="strokeWidth">
                 <path d="M0,0 L0,6 L6,3 z" fill="#f59e0b" />
             </marker>
         </defs>
         <path d={`M ${A.x} ${A.y} L ${B.x} ${B.y} L ${C.x} ${C.y} Z`} fill="white" stroke="#334155" strokeWidth="3" strokeLinejoin="round" />
         <text x={A.x - 20} y={A.y + 10} className="text-xs font-bold fill-slate-400">A</text>
         <text x={B.x + 10} y={B.y + 10} className="text-xs font-bold fill-slate-400">B</text>
         <text x={C.x} y={C.y - 15} className="text-xs font-bold fill-slate-400">C</text>
         <path d={`M ${A.x + 30} ${A.y} A 30 30 0 0 0 ${A.x + 23} ${A.y - 20}`} fill="none" stroke="#e2e8f0" strokeWidth="2" />
         <path d={`M ${B.x - 30} ${B.y} A 30 30 0 0 1 ${B.x - 17} ${B.y - 24}`} fill="none" stroke="#e2e8f0" strokeWidth="2" />
         <path d={`M ${C.x - 13} ${C.y + 27} A 30 30 0 0 0 ${C.x + 15} ${C.y + 26}`} fill="none" stroke="#e2e8f0" strokeWidth="2" />

         <g style={{ opacity: step >= 1 ? 1 : 0, transition: 'opacity 0.5s' }}>
             <line x1={B.x} y1={B.y} x2={extB_end.x} y2={extB_end.y} stroke="#f59e0b" strokeWidth="3" strokeDasharray="8,6" markerEnd="url(#arrow)" />
         </g>
         <g style={{ opacity: step >= 2 ? 1 : 0, transition: 'opacity 0.5s' }}>
             <path d={`M ${arcB_start.x} ${arcB_start.y} A ${radius} ${radius} 0 0 0 ${arcB_end.x} ${arcB_end.y}`} fill="none" stroke="#3b82f6" strokeWidth="3" />
             <text x={labelB_pos.x} y={labelB_pos.y} textAnchor="middle" dominantBaseline="middle" className="text-sm font-bold fill-blue-600">β₁</text>
         </g>
         <g style={{ opacity: step >= 3 ? 1 : 0, transition: 'opacity 0.5s' }}>
             <line x1={C.x} y1={C.y} x2={extC_end.x} y2={extC_end.y} stroke="#f59e0b" strokeWidth="3" strokeDasharray="8,6" markerEnd="url(#arrow)" />
         </g>
         <g style={{ opacity: step >= 4 ? 1 : 0, transition: 'opacity 0.5s' }}>
             <path d={`M ${arcC_start.x} ${arcC_start.y} A ${radius} ${radius} 0 0 0 ${arcC_end.x} ${arcC_end.y}`} fill="none" stroke="#22c55e" strokeWidth="3" />
             <text x={labelC_pos.x} y={labelC_pos.y} textAnchor="middle" dominantBaseline="middle" className="text-sm font-bold fill-green-600">γ₁</text>
         </g>
         <g style={{ opacity: step >= 5 ? 1 : 0, transition: 'opacity 0.5s' }}>
             <line x1={A.x} y1={A.y} x2={extA_end.x} y2={extA_end.y} stroke="#f59e0b" strokeWidth="3" strokeDasharray="8,6" markerEnd="url(#arrow)" />
         </g>
         <g style={{ opacity: step >= 6 ? 1 : 0, transition: 'opacity 0.5s' }}>
             <path d={`M ${arcA_start.x} ${arcA_start.y} A ${radius} ${radius} 0 0 0 ${arcA_end.x} ${arcA_end.y}`} fill="none" stroke="#ef4444" strokeWidth="3" />
             <text x={labelA_pos.x} y={labelA_pos.y} textAnchor="middle" dominantBaseline="middle" className="text-sm font-bold fill-red-600">α₁</text>
         </g>
      </svg>
    );
  };

  const renderSupplementary = () => {
    const arcLen = 190;
    const configB = {
        center: {x: 250, y: 200},
        extLine: { x1: 250, y1: 200, x2: 380, y2: 200, labelX: 320, labelY: 220 },
        internalArc: "M 200 200 A 50 50 0 0 1 222 158",
        externalArc: "M 300 200 A 50 50 0 0 0 222 158",
        bigArc: "M 190 200 A 60 60 0 0 1 310 200",
        labelInt: { x: 215, y: 190, text: "β" },
        labelExt: { x: 260, y: 180, text: "β₁" },
        equation: { i: "β", e: "β₁" }
    };
    const configC = {
        center: {x: 150, y: 50},
        extLine: { x1: 150, y1: 50, x2: 210, y2: -40, labelX: 190, labelY: 0 }, 
        internalArc: "M 122 92 A 50 50 0 0 0 178 92", 
        externalArc: "M 178 8 A 50 50 0 0 1 178 92",
        bigArc: "M 183 0 A 60 60 0 0 1 117 100",
        labelInt: { x: 150, y: 100, text: "γ" },
        labelExt: { x: 195, y: 50, text: "γ₁" },
        equation: { i: "γ", e: "γ₁" }
    };
    const configA = {
        center: {x: 50, y: 200},
        extLine: { x1: 50, y1: 200, x2: -50, y2: 200, labelX: 0, labelY: 220 },
        internalArc: "M 100 200 A 50 50 0 0 0 78 158",
        externalArc: "M 0 200 A 50 50 0 0 1 78 158",
        bigArc: "M 110 200 A 60 60 0 0 0 -10 200",
        labelInt: { x: 70, y: 190, text: "α" },
        labelExt: { x: 30, y: 170, text: "α₁" },
        equation: { i: "α", e: "α₁" }
    };
    const config = activeVertex === 0 ? configB : activeVertex === 1 ? configC : configA;
    return (
      <svg viewBox="-60 -50 500 350" className="w-full h-full">
        <g className="animate-fade-in">
             <line x1={config.extLine.x1} y1={config.extLine.y1} x2={config.extLine.x2} y2={config.extLine.y2} stroke="#94a3b8" strokeWidth="3" strokeDasharray="8,6" />
             <text x={config.extLine.labelX} y={config.extLine.labelY} className="text-xs fill-slate-400 italic">продолжение</text>
        </g>
        <path d="M 50 200 L 250 200 L 150 50 Z" fill="none" stroke="#334155" strokeWidth="3" strokeLinejoin="round"/>
        <text x="35" y="220" className={`text-xs font-bold ${activeVertex === 2 ? 'fill-blue-600 scale-125' : 'fill-slate-400'}`}>A</text>
        <text x="145" y="35" className={`text-xs font-bold ${activeVertex === 1 ? 'fill-blue-600 scale-125' : 'fill-slate-400'}`}>C</text>
        <text x="255" y="220" className={`text-xs font-bold ${activeVertex === 0 ? 'fill-blue-600 scale-125' : 'fill-slate-400'}`}>B</text>
        <g style={{ opacity: step >= 1 ? 1 : 0, transition: 'opacity 0.5s' }}>
            <path d={config.internalArc} fill="none" stroke="#ef4444" strokeWidth="3" />
            <text x={config.labelInt.x} y={config.labelInt.y} className="text-sm font-bold fill-red-600">{config.labelInt.text}</text>
        </g>
        <g style={{ opacity: step >= 1 ? 1 : 0, transition: 'opacity 0.5s' }}>
            <path d={config.externalArc} fill="none" stroke="#3b82f6" strokeWidth="3" />
            <text x={config.labelExt.x} y={config.labelExt.y} className="text-sm font-bold fill-blue-600">{config.labelExt.text}</text>
        </g>
        <path 
            d={config.bigArc}
            fill="none" 
            stroke="#f59e0b" 
            strokeWidth="4" 
            strokeLinecap="round"
            style={{
                strokeDasharray: arcLen,
                strokeDashoffset: step >= 2 ? 0 : arcLen,
                transition: step >= 2 ? 'stroke-dashoffset 1.5s ease-in-out' : 'none',
                opacity: step >= 2 ? 1 : 0
            }}
        />
      </svg>
    );
  };

  const renderSum360 = () => {
    const A = { x: 70, y: 220 };
    const B = { x: 210, y: 220 };
    const C = { x: 140, y: 80 };
    const O = { x: 340, y: 150 };
    const wedgePath = "M 0 0 L 40 0 A 40 40 0 0 0 -20 -34.6 Z";
    const transB = step >= 2 ? `translate(${O.x}px, ${O.y}px) rotate(0deg)` : `translate(${B.x}px, ${B.y}px) rotate(0deg)`;
    const transC = step >= 2 ? `translate(${O.x}px, ${O.y}px) rotate(-120deg)` : `translate(${C.x}px, ${C.y}px) rotate(-120deg)`;
    const transA = step >= 2 ? `translate(${O.x}px, ${O.y}px) rotate(-240deg)` : `translate(${A.x}px, ${A.y}px) rotate(-240deg)`;
    return (
      <svg viewBox="0 0 450 300" className="w-full h-full">
         <g style={{ opacity: step >= 2 ? 0.3 : 1, transition: 'opacity 1s' }}>
             <line x1={A.x} y1={A.y} x2={A.x - 50} y2={A.y} stroke="#cbd5e1" strokeWidth="2" strokeDasharray="4" />
             <line x1={B.x} y1={B.y} x2={B.x + 50} y2={B.y} stroke="#cbd5e1" strokeWidth="2" strokeDasharray="4" />
             <line x1={C.x} y1={C.y} x2={C.x - 30} y2={C.y - 40} stroke="#cbd5e1" strokeWidth="2" strokeDasharray="4" />
             <path d={`M ${A.x} ${A.y} L ${B.x} ${B.y} L ${C.x} ${C.y} Z`} fill="none" stroke="#475569" strokeWidth="3" />
             <text x={A.x - 20} y={A.y + 20} className="text-xs font-bold fill-slate-400">A</text>
             <text x={B.x + 10} y={B.y + 20} className="text-xs font-bold fill-slate-400">B</text>
             <text x={C.x} y={C.y - 15} className="text-xs font-bold fill-slate-400">C</text>
         </g>
         <g style={{ opacity: step >= 2 ? 1 : 0, transition: 'opacity 1s' }}>
            <circle cx={O.x} cy={O.y} r="3" fill="#0f172a" />
            <text x={O.x + 10} y={O.y + 5} className="text-sm font-bold fill-slate-800">O</text>
         </g>
         <g style={{ transform: transB, transition: 'transform 1.5s cubic-bezier(0.4, 0, 0.2, 1)' }}>
            <path d={wedgePath} fill="rgba(59, 130, 246, 0.6)" stroke="#2563eb" strokeWidth="2" />
            <text x="25" y="-12" fontSize="12" fill="#1e3a8a" fontWeight="bold" textAnchor="middle" dominantBaseline="middle" style={{ transformBox: 'fill-box', transformOrigin: 'center', transition: 'transform 1.5s cubic-bezier(0.4, 0, 0.2, 1)', transform: 'rotate(0deg)' }}>β'</text>
         </g>
         <g style={{ transform: transC, transition: 'transform 1.5s cubic-bezier(0.4, 0, 0.2, 1)' }}>
            <path d={wedgePath} fill="rgba(34, 197, 94, 0.6)" stroke="#16a34a" strokeWidth="2" />
            <text x="25" y="-12" fontSize="12" fill="#14532d" fontWeight="bold" textAnchor="middle" dominantBaseline="middle" style={{ transformBox: 'fill-box', transformOrigin: 'center', transition: 'transform 1.5s cubic-bezier(0.4, 0, 0.2, 1)', transform: 'rotate(120deg)' }}>γ'</text>
         </g>
         <g style={{ transform: transA, transition: 'transform 1.5s cubic-bezier(0.4, 0, 0.2, 1)' }}>
            <path d={wedgePath} fill="rgba(239, 68, 68, 0.6)" stroke="#dc2626" strokeWidth="2" />
            <text x="25" y="-12" fontSize="12" fill="#7f1d1d" fontWeight="bold" textAnchor="middle" dominantBaseline="middle" style={{ transformBox: 'fill-box', transformOrigin: 'center', transition: 'transform 1.5s cubic-bezier(0.4, 0, 0.2, 1)', transform: 'rotate(240deg)' }}>α'</text>
         </g>
         {step >= 3 && (
            <g className="animate-fade-in">
                <circle cx={O.x} cy={O.y} r="45" fill="none" stroke="#0ea5e9" strokeWidth="2" strokeDasharray="4" className="animate-spin-slow" />
            </g>
         )}
      </svg>
    );
  };

  const renderTheorem = () => {
    const pA = { x: 50, y: 250 };
    const pB = { x: 300, y: 250 };
    const pC = { x: 150, y: 50 };
    const wA_path = "M 0 0 L 40 0 A 40 40 0 0 0 18 -36 Z"; 
    const wB_path = "M 0 0 L 40 0 A 40 40 0 0 1 24 32 Z"; 
    const wC_path = "M 0 0 L 40 0 A 40 40 0 0 1 18 36 Z"; 
    const isB = activeVertex === 0;
    const isC = activeVertex === 1;
    const isA = activeVertex === 2;
    const getRotation = (source: 'A'|'B'|'C', target: 'A'|'B'|'C') => {
        let rot = 0;
        if (step < 2) {
            if (source === 'A') rot = 0; 
            if (source === 'B') rot = 180;
            if (source === 'C') rot = 53.1;
        } else {
            if (target === 'B') {
                if (source === 'A') rot = 0; 
                if (source === 'C') rot = -127;
            }
            else if (target === 'C') {
                if (source === 'B') rot = 180;
                if (source === 'A') rot = 180;
            }
            else if (target === 'A') {
                if (source === 'B') rot = 180;
                if (source === 'C') rot = 233.1;
            }
        }
        return rot;
    };
    const getTransform = (source: 'A'|'B'|'C', target: 'A'|'B'|'C') => {
        const pSource = source === 'A' ? pA : source === 'B' ? pB : pC;
        const pTarget = target === 'A' ? pA : target === 'B' ? pB : pC;
        const pos = step < 2 ? pSource : pTarget;
        const rot = getRotation(source, target);
        return `translate(${pos.x}px, ${pos.y}px) rotate(${rot}deg)`;
    };
    const getTextStyle = (source: 'A'|'B'|'C', target: 'A'|'B'|'C') => {
        const rot = getRotation(source, target);
        return { transformBox: 'fill-box' as const, transformOrigin: 'center', transform: `rotate(${-rot}deg)` };
    };

    return (
      <svg viewBox="0 0 450 350" className="w-full h-full">
         <g style={{ opacity: isB ? 1 : 0.2 }}>
            <line x1={pB.x} y1={pB.y} x2={pB.x + 100} y2={pB.y} stroke="#94a3b8" strokeWidth="2" strokeDasharray="4" />
            {isB && <text x={pB.x + 80} y={pB.y + 20} className="text-xs font-bold fill-slate-400">β₁</text>}
         </g>
         <g style={{ opacity: isC ? 1 : 0.2 }}>
            <line x1={pC.x} y1={pC.y} x2={pC.x - 60} y2={pC.y - 80} stroke="#94a3b8" strokeWidth="2" strokeDasharray="4" />
            {isC && <text x={pC.x - 40} y={pC.y - 40} className="text-xs font-bold fill-slate-400">γ₁</text>}
         </g>
         <g style={{ opacity: isA ? 1 : 0.2 }}>
             <line x1={pA.x} y1={pA.y} x2={pA.x - 100} y2={pA.y} stroke="#94a3b8" strokeWidth="2" strokeDasharray="4" />
             {isA && <text x={pA.x - 80} y={pA.y + 20} className="text-xs font-bold fill-slate-400">α₁</text>}
         </g>
         <path d={`M ${pA.x} ${pA.y} L ${pB.x} ${pB.y} L ${pC.x} ${pC.y} Z`} fill="none" stroke="#cbd5e1" strokeWidth="2" />
         <text x={pA.x - 20} y={pA.y + 10} className="text-xs font-bold fill-slate-400">A</text>
         <text x={pB.x + 10} y={pB.y + 10} className="text-xs font-bold fill-slate-400">B</text>
         <text x={pC.x} y={pC.y - 15} className="text-xs font-bold fill-slate-400">C</text>
         {step >= 2 && (
             <g style={{ opacity: 0.3 }}>
                 {(isB || isC) && <path d={wA_path} transform={`translate(${pA.x}, ${pA.y}) rotate(0)`} fill="none" stroke="#ef4444" strokeDasharray="2" />}
                 {(isA || isC) && <path d={wB_path} transform={`translate(${pB.x}, ${pB.y}) rotate(180)`} fill="none" stroke="#3b82f6" strokeDasharray="2" />}
                 {(isA || isB) && <path d={wC_path} transform={`translate(${pC.x}, ${pC.y}) rotate(53.1)`} fill="none" stroke="#22c55e" strokeDasharray="2" />}
             </g>
         )}
         {(isB || isC) && (
            <g style={{ transform: isB ? getTransform('A', 'B') : getTransform('A', 'C'), transition: 'transform 2s ease-in-out', opacity: step >= 1 ? 1 : 0 }}>
                <path d={wA_path} fill="rgba(239, 68, 68, 0.6)" stroke="#ef4444" />
                <text x="25" y="-10" fontSize="12" fill="white" fontWeight="bold" style={getTextStyle('A', isB ? 'B' : 'C')}>α</text>
            </g>
         )}
         {(isA || isC) && (
            <g style={{ transform: isA ? getTransform('B', 'A') : getTransform('B', 'C'), transition: 'transform 2s ease-in-out', opacity: step >= 1 ? 1 : 0 }}>
                <path d={wB_path} fill="rgba(59, 130, 246, 0.6)" stroke="#3b82f6" />
                <text x="25" y="20" fontSize="12" fill="white" fontWeight="bold" style={getTextStyle('B', isA ? 'A' : 'C')}>β</text>
            </g>
         )}
         {(isA || isB) && (
            <g style={{ transform: isB ? getTransform('C', 'B') : getTransform('C', 'A'), transition: 'transform 2s ease-in-out', opacity: step >= 1 ? 1 : 0 }}>
                <path d={wC_path} fill="rgba(34, 197, 94, 0.6)" stroke="#16a34a" />
                <text x="25" y="20" fontSize="12" fill="white" fontWeight="bold" style={getTextStyle('C', isB ? 'B' : 'A')}>γ</text>
            </g>
         )}
      </svg>
    );
  };

  const svgContent = (
    <div className={isExpanded ? "relative w-full max-w-5xl h-[60vh] bg-slate-50 rounded-2xl overflow-hidden border border-slate-100 shadow-inner" : "relative w-full aspect-[2/1] bg-slate-50 rounded-2xl overflow-hidden border border-slate-100 shadow-inner cursor-zoom-in"}>
        {mode === 'definition' && renderDefinition()}
        {mode === 'supplementary' && renderSupplementary()}
        {mode === 'sum_360' && renderSum360()}
        {mode === 'theorem' && renderTheorem()}
    </div>
  );

  const controls = (
    <div className="flex gap-4">
        {!hasStarted && (mode === 'supplementary' || mode === 'definition') ? (
           <button 
             onClick={handleStart}
             className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 font-bold bg-blue-50 px-4 py-2 rounded-full transition border border-blue-100 hover:bg-blue-100"
           >
              <PlayCircle size={18} /> Провери
           </button>
        ) : (
           <button 
             onClick={handleRepeat}
             className="flex items-center gap-2 text-sm text-slate-500 hover:text-blue-600 font-bold bg-slate-50 px-4 py-2 rounded-full transition border border-transparent hover:border-slate-200"
           >
             <RefreshCw size={14} /> Повтори
           </button>
        )}

        {isExpanded && (
            <button 
                onClick={toggleExpand}
                className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 font-bold bg-slate-100 px-4 py-2 rounded-full transition"
            >
                <Minimize2 size={14} /> Намали
            </button>
        )}
    </div>
  );

  if (isExpanded) {
    return createPortal(
        <div 
            className="fixed inset-0 z-[2000] bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center p-8 transition-all duration-300 animate-fade-in"
            onClick={(e) => { e.stopPropagation(); toggleExpand(e); }}
        >
            <div className="w-full flex flex-col items-center relative max-w-5xl" onClick={(e) => e.stopPropagation()}>
                    <div className="absolute -top-12 right-0 md:top-4 md:right-4 z-10">
                    <button 
                        onClick={toggleExpand}
                        className="p-3 bg-slate-100 hover:bg-red-100 text-slate-600 hover:text-red-600 rounded-full transition shadow-md"
                    >
                        <X size={24} />
                    </button>
                    </div>
                    {svgContent}
                    
                    {/* Expanded Caption */}
                    <div className="my-6 text-2xl font-medium text-slate-800 text-center max-w-3xl">
                        {caption}
                    </div>

                    {controls}
            </div>
        </div>,
        document.body
    );
  }

  return (
    <div 
        className="flex flex-col items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-xl my-6 w-full relative transition-all duration-300 hover:shadow-2xl hover:border-blue-300 group max-w-2xl mx-auto"
        onClick={toggleExpand}
    >
      <div className="w-full flex justify-between items-center mb-4">
        <h4 className="font-bold text-slate-700 flex items-center gap-2">
            <Info size={18} className="text-blue-500"/>
            Интеракција
        </h4>
        <div className="p-1.5 bg-slate-100 rounded-full text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
             <Maximize2 size={16} />
        </div>
      </div>

      {svgContent}

      {/* Inline Caption */}
      <div className="mb-4 w-full text-center min-h-[40px] flex items-center justify-center">
         <p className="text-lg text-slate-800 font-medium animate-fade-in key={step}">
            {caption}
         </p>
      </div>

      {controls}
    </div>
  );
};

export default ExternalAnglesVisuals;
