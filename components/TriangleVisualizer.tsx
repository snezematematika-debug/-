import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Point, ModuleId } from '../types';
import { Maximize2, Minimize2, X, RotateCcw, PenTool, Move, Hand, Lock } from 'lucide-react';

interface Props {
  moduleId: ModuleId;
}

// Helper to calculate distance
const dist = (p1: Point, p2: Point) => Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));

// Helper to convert radians to degrees
const toDeg = (rad: number) => (rad * 180) / Math.PI;

// Law of Cosines to find angle at p1 given p1, p2, p3
const calculateAngle = (p1: Point, p2: Point, p3: Point): number => {
  const a = dist(p2, p3); // side opposite to p1
  const b = dist(p1, p3); // side adjacent
  const c = dist(p1, p2); // side adjacent
  
  const cosA = (Math.pow(b, 2) + Math.pow(c, 2) - Math.pow(a, 2)) / (2 * b * c);
  const clampedCos = Math.max(-1, Math.min(1, cosA));
  return toDeg(Math.acos(clampedCos));
};

type ToolMode = 'MOVE' | 'DRAW';

const TriangleVisualizer: React.FC<Props> = ({ moduleId }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Active Tool State (Move vs Draw)
  const [tool, setTool] = useState<ToolMode>('MOVE');

  // --- EXISTENCE MODULE STATE ---
  const [baseLen] = useState(240); // Fixed base length (pixels)
  const [armLeftLen, setArmLeftLen] = useState(80);
  const [armRightLen, setArmRightLen] = useState(100);
  const [armLeftAngle, setArmLeftAngle] = useState(-45); // Degrees, relative to base
  const [armRightAngle, setArmRightAngle] = useState(-135); // Degrees
  const [isTriangleFormed, setIsTriangleFormed] = useState(false);

  // Set default tool based on module type
  useEffect(() => {
    if (moduleId === ModuleId.CENTROID || moduleId === ModuleId.ORTHOCENTER || moduleId === ModuleId.CIRCUMCIRCLE || moduleId === ModuleId.INCIRCLE) {
        setTool('DRAW'); // Default to drawing for construction modules
    } else {
        setTool('MOVE'); // Default to moving for exploration modules
    }
    
    // Reset Existence state when entering module
    if (moduleId === ModuleId.EXISTENCE) {
        setArmLeftLen(80);
        setArmRightLen(100);
        setIsTriangleFormed(false);
    }
  }, [moduleId]);

  // Initial state
  const [points, setPoints] = useState<{ A: Point; B: Point; C: Point }>({
    A: { x: 200, y: 50 },
    B: { x: 100, y: 300 },
    C: { x: 300, y: 300 },
  });

  const [dragging, setDragging] = useState<'A' | 'B' | 'C' | 'ARM_LEFT' | 'ARM_RIGHT' | null>(null);

  // --- Centroid Drawing State ---
  const [drawnMedians, setDrawnMedians] = useState<{A: boolean, B: boolean, C: boolean}>({
    A: false, B: false, C: false
  });
  // --- Orthocenter Drawing State ---
  const [drawnAltitudes, setDrawnAltitudes] = useState<{A: boolean, B: boolean, C: boolean}>({
    A: false, B: false, C: false
  });
  // --- Circumcircle Drawing State ---
  const [drawnBisectors, setDrawnBisectors] = useState<{A: boolean, B: boolean, C: boolean}>({
    A: false, B: false, C: false
  });
  // --- Incircle Drawing State ---
  // Bisecting Angle A, Angle B, Angle C
  const [drawnAngleBisectors, setDrawnAngleBisectors] = useState<{A: boolean, B: boolean, C: boolean}>({
    A: false, B: false, C: false
  });

  // Tracks selection for connecting dots
  const [drawSelection, setDrawSelection] = useState<string | null>(null);

  // Reset drawing state when module changes
  useEffect(() => {
    setDrawnMedians({ A: false, B: false, C: false });
    setDrawnAltitudes({ A: false, B: false, C: false });
    setDrawnBisectors({ A: false, B: false, C: false });
    setDrawnAngleBisectors({ A: false, B: false, C: false });
    setDrawSelection(null);
  }, [moduleId]);

  // Geometry calculations
  const sideA = dist(points.B, points.C); // Side a (opposite A)
  const sideB = dist(points.A, points.C); // Side b (opposite B)
  const sideC = dist(points.A, points.B); // Side c (opposite C)

  const angleA = calculateAngle(points.A, points.B, points.C);
  const angleB = calculateAngle(points.B, points.A, points.C);
  const angleC = calculateAngle(points.C, points.A, points.B);

  const centroid = {
    x: (points.A.x + points.B.x + points.C.x) / 3,
    y: (points.A.y + points.B.y + points.C.y) / 3,
  };

  const getVertexLabelPos = (p: Point) => {
    const dx = p.x - centroid.x;
    const dy = p.y - centroid.y;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const offset = 30;
    return {
        x: p.x + (dx / len) * offset,
        y: p.y + (dy / len) * offset
    };
  };

  const midAB = { x: (points.A.x + points.B.x) / 2, y: (points.A.y + points.B.y) / 2 };
  const midBC = { x: (points.B.x + points.C.x) / 2, y: (points.B.y + points.C.y) / 2 };
  const midAC = { x: (points.A.x + points.C.x) / 2, y: (points.A.y + points.C.y) / 2 };

  // Helper to get foot of altitude
  const getAltitudeFoot = (p: Point, a: Point, b: Point) => {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy);
    return {
      x: a.x + t * dx,
      y: a.y + t * dy,
      t: t
    };
  };

  const altFootA = getAltitudeFoot(points.A, points.B, points.C);
  const altFootB = getAltitudeFoot(points.B, points.A, points.C);
  const altFootC = getAltitudeFoot(points.C, points.A, points.B);
  
  // Calculate Orthocenter
  const getLineIntersection = (p1: Point, p2: Point, p3: Point, p4: Point) => {
      const d = (p1.x - p2.x) * (p3.y - p4.y) - (p1.y - p2.y) * (p3.x - p4.x);
      if (d === 0) return centroid; 
      const t = ((p1.x - p3.x) * (p3.y - p4.y) - (p1.y - p3.y) * (p3.x - p4.x)) / d;
      return {
          x: p1.x + t * (p2.x - p1.x),
          y: p1.y + t * (p2.y - p1.y)
      };
  };
  const orthocenter = getLineIntersection(points.A, altFootA, points.B, altFootB);

  // Helper to get perpendicular bisector visualization points (far ends of the line)
  const getPerpBisectorPoints = (p1: Point, p2: Point) => {
      const mid = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
      // Vector p1->p2
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      // Perpendicular vector (-dy, dx)
      // Normalize approximately to extend line
      const len = Math.sqrt(dx*dx + dy*dy);
      const nx = -dy / len * 400; 
      const ny = dx / len * 400;
      
      return {
          x1: mid.x - nx, y1: mid.y - ny,
          x2: mid.x + nx, y2: mid.y + ny
      };
  };

  const pbAB = getPerpBisectorPoints(points.A, points.B);
  const pbBC = getPerpBisectorPoints(points.B, points.C);
  const pbAC = getPerpBisectorPoints(points.A, points.C);

  // Calculate Circumcenter
  const getCircumcenter = (a: Point, b: Point, c: Point) => {
      const D = 2 * (a.x * (b.y - c.y) + b.x * (c.y - a.y) + c.x * (a.y - b.y));
      if (Math.abs(D) < 0.0001) return centroid; // Collinear safety
      const Ux = (1 / D) * ((a.x**2 + a.y**2) * (b.y - c.y) + (b.x**2 + b.y**2) * (c.y - a.y) + (c.x**2 + c.y**2) * (a.y - b.y));
      const Uy = (1 / D) * ((a.x**2 + a.y**2) * (c.x - b.x) + (b.x**2 + b.y**2) * (a.x - c.x) + (c.x**2 + c.y**2) * (b.x - a.x));
      return { x: Ux, y: Uy };
  };
  const circumcenter = getCircumcenter(points.A, points.B, points.C);
  const circumRadius = dist(circumcenter, points.A);

  // --- INCIRCLE CALCULATIONS ---
  // Incenter = (aA + bB + cC) / (a+b+c)
  const perimeter = sideA + sideB + sideC;
  const incenter = {
      x: (sideA * points.A.x + sideB * points.B.x + sideC * points.C.x) / perimeter,
      y: (sideA * points.A.y + sideB * points.B.y + sideC * points.C.y) / perimeter
  };
  // Semi-perimeter s
  const s = perimeter / 2;
  // Area (Heron's Formula)
  const area = Math.sqrt(s * (s - sideA) * (s - sideB) * (s - sideC));
  // Inradius r = Area / s
  const inradius = area / s;

  // Angle Bisector Foot on Opposite Side
  // D on BC splits BC in ratio c:b. D = (bB + cC) / (b+c)
  const getBisectorFoot = (vA: Point, vB: Point, vC: Point, lenB: number, lenC: number) => {
      return {
          x: (lenB * vB.x + lenC * vC.x) / (lenB + lenC),
          y: (lenB * vB.y + lenC * vC.y) / (lenB + lenC)
      };
  };
  const bisectFootA = getBisectorFoot(points.A, points.B, points.C, sideB, sideC);
  const bisectFootB = getBisectorFoot(points.B, points.A, points.C, sideA, sideC);
  const bisectFootC = getBisectorFoot(points.C, points.A, points.B, sideA, sideB);


  const distMidLine = dist(midAC, midBC);
  const displayLen = (px: number) => (px / 30).toFixed(1);

  const isEquilateral = sideA > 0 && Math.abs(sideA - sideB) < 5 && Math.abs(sideB - sideC) < 5;
  const isIsosceles = !isEquilateral && (Math.abs(sideA - sideB) < 5 || Math.abs(sideB - sideC) < 5 || Math.abs(sideA - sideC) < 5);
  const isRight = Math.abs(angleA - 90) < 2 || Math.abs(angleB - 90) < 2 || Math.abs(angleC - 90) < 2;
  const isObtuse = angleA > 92 || angleB > 92 || angleC > 92;

  // --- EXISTENCE HELPERS ---
  const existBaseA = { x: 80, y: 300 };
  const existBaseB = { x: 80 + baseLen, y: 300 };
  
  const getArmTip = (origin: Point, len: number, angleDeg: number) => {
      const rad = (angleDeg * Math.PI) / 180;
      return {
          x: origin.x + len * Math.cos(rad),
          y: origin.y + len * Math.sin(rad)
      };
  };
  
  const tipLeft = getArmTip(existBaseA, armLeftLen, armLeftAngle);
  const tipRight = getArmTip(existBaseB, armRightLen, armRightAngle);
  
  // Calculate gap
  const tipDist = dist(tipLeft, tipRight);
  const canFormTriangle = (armLeftLen + armRightLen) > baseLen;

  // Auto-snap logic
  useEffect(() => {
      if (moduleId === ModuleId.EXISTENCE && canFormTriangle && tipDist < 15) {
          setIsTriangleFormed(true);
      } else {
          setIsTriangleFormed(false);
      }
  }, [tipDist, canFormTriangle, moduleId]);

  // --- RELATION MODULE HELPERS ---
  // Find Largest/Smallest Angle/Side Indices
  // 0=A(opp a), 1=B(opp b), 2=C(opp c)
  const angles = [angleA, angleB, angleC];
  const sides = [sideA, sideB, sideC];
  
  const maxAngleIdx = angles.indexOf(Math.max(...angles));
  const minAngleIdx = angles.indexOf(Math.min(...angles));
  
  // Corresponding colors
  const getColor = (idx: number) => {
      if (moduleId !== ModuleId.SIDE_ANGLE_RELATION) return "#0ea5e9";
      if (idx === maxAngleIdx) return "#ef4444"; // Red for Max
      if (idx === minAngleIdx) return "#3b82f6"; // Blue for Min
      return "#94a3b8"; // Gray for Mid
  };

  const getSector = (center: Point, p1: Point, p2: Point, r: number) => {
      const d1 = dist(center, p1);
      const d2 = dist(center, p2);
      if (d1 === 0 || d2 === 0) return "";
      
      const x1 = center.x + (p1.x - center.x) * (r / d1);
      const y1 = center.y + (p1.y - center.y) * (r / d1);
      const x2 = center.x + (p2.x - center.x) * (r / d2);
      const y2 = center.y + (p2.y - center.y) * (r / d2);
      
      const cp = (p1.x - center.x)*(p2.y - center.y) - (p1.y - center.y)*(p2.x - center.x);
      const sweep = cp > 0 ? 1 : 0;
      
      return `M ${center.x} ${center.y} L ${x1} ${y1} A ${r} ${r} 0 0 ${sweep} ${x2} ${y2} Z`;
  };


  // --- INTERACTION HANDLERS ---

  const handleVertexClick = (v: 'A' | 'B' | 'C') => (e: React.MouseEvent) => {
    e.stopPropagation(); 
    
    // Only allow drawing selection if in DRAW mode
    if (tool !== 'DRAW') return;
    
    const relevantModules = [ModuleId.CENTROID, ModuleId.ORTHOCENTER, ModuleId.CIRCUMCIRCLE, ModuleId.INCIRCLE];
    if (!relevantModules.includes(moduleId)) return;
    
    // Check if drawing is already done
    if (moduleId === ModuleId.CENTROID && drawnMedians[v]) return;
    if (moduleId === ModuleId.ORTHOCENTER && drawnAltitudes[v]) return;
    if (moduleId === ModuleId.INCIRCLE) {
        // Direct interaction: Click vertex -> draw bisector
        if (!drawnAngleBisectors[v]) {
            setDrawnAngleBisectors(prev => ({...prev, [v]: true}));
        }
        return;
    }

    if (moduleId === ModuleId.CIRCUMCIRCLE) return; // Vertex clicking not used for bisectors

    if (drawSelection === v) {
        setDrawSelection(null); 
    } else {
        setDrawSelection(v); 
    }
  };

  const handleTargetClick = (targetId: 'A' | 'B' | 'C') => (e: React.MouseEvent) => {
      e.stopPropagation();
      if (tool !== 'DRAW') return;
      if (moduleId !== ModuleId.CENTROID && moduleId !== ModuleId.ORTHOCENTER) return;

      if (drawSelection === targetId) {
          if (moduleId === ModuleId.CENTROID) {
              setDrawnMedians(prev => ({ ...prev, [targetId]: true }));
          } else {
              setDrawnAltitudes(prev => ({ ...prev, [targetId]: true }));
          }
          setDrawSelection(null);
      }
  };

  const handleBisectorClick = (sideId: 'A' | 'B' | 'C') => (e: React.MouseEvent) => {
      e.stopPropagation();
      if (tool !== 'DRAW' || moduleId !== ModuleId.CIRCUMCIRCLE) return;
      
      setDrawnBisectors(prev => ({ ...prev, [sideId]: true }));
  };

  // --- MOUSE EVENTS ---
  const handleMouseDown = (obj: 'A' | 'B' | 'C' | 'ARM_LEFT' | 'ARM_RIGHT') => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(obj);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging || !svgRef.current) return;
    
    const CTM = svgRef.current.getScreenCTM();
    if (!CTM) return;

    const x = (e.clientX - CTM.e) / CTM.a;
    const y = (e.clientY - CTM.f) / CTM.d;

    // Standard Triangle Move
    if (tool === 'MOVE' && moduleId !== ModuleId.EXISTENCE) {
        const constrainedX = Math.max(10, Math.min(390, x));
        const constrainedY = Math.max(10, Math.min(390, y));
        if (dragging === 'A' || dragging === 'B' || dragging === 'C') {
            setPoints(prev => ({
                ...prev,
                [dragging]: { x: constrainedX, y: constrainedY }
            }));
        }
    }

    // Existence Arms Rotate
    if (moduleId === ModuleId.EXISTENCE) {
        if (dragging === 'ARM_LEFT') {
            const dx = x - existBaseA.x;
            const dy = y - existBaseA.y;
            let ang = Math.atan2(dy, dx) * 180 / Math.PI;
            setArmLeftAngle(ang);
        }
        if (dragging === 'ARM_RIGHT') {
            const dx = x - existBaseB.x;
            const dy = y - existBaseB.y;
            let ang = Math.atan2(dy, dx) * 180 / Math.PI;
            setArmRightAngle(ang);
        }
    }
  };

  const handleMouseUp = () => {
    setDragging(null);
  };

  // --- TOUCH EVENTS (Mobile) ---
  const handleTouchStart = (obj: 'A' | 'B' | 'C' | 'ARM_LEFT' | 'ARM_RIGHT') => (e: React.TouchEvent) => {
    e.preventDefault(); 
    e.stopPropagation();
    setDragging(obj);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!dragging || !svgRef.current) return;
    
    const touch = e.touches[0];
    const CTM = svgRef.current.getScreenCTM();
    if (!CTM) return;

    const x = (touch.clientX - CTM.e) / CTM.a;
    const y = (touch.clientY - CTM.f) / CTM.d;

    if (tool === 'MOVE' && moduleId !== ModuleId.EXISTENCE) {
        const constrainedX = Math.max(10, Math.min(390, x));
        const constrainedY = Math.max(10, Math.min(390, y));
        if (dragging === 'A' || dragging === 'B' || dragging === 'C') {
            setPoints(prev => ({
                ...prev,
                [dragging]: { x: constrainedX, y: constrainedY }
            }));
        }
    }

    if (moduleId === ModuleId.EXISTENCE) {
        if (dragging === 'ARM_LEFT') {
            const dx = x - existBaseA.x;
            const dy = y - existBaseA.y;
            let ang = Math.atan2(dy, dx) * 180 / Math.PI;
            setArmLeftAngle(ang);
        }
        if (dragging === 'ARM_RIGHT') {
            const dx = x - existBaseB.x;
            const dy = y - existBaseB.y;
            let ang = Math.atan2(dy, dx) * 180 / Math.PI;
            setArmRightAngle(ang);
        }
    }
  };

  useEffect(() => {
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchend', handleMouseUp); // Reuse mouseup logic for touch end
    return () => {
        window.removeEventListener('mouseup', handleMouseUp);
        window.removeEventListener('touchend', handleMouseUp);
    };
  }, []);

  const typeColor = isEquilateral ? 'text-purple-600' : isIsosceles ? 'text-blue-600' : 'text-slate-600';
  const angleTypeColor = isRight ? 'text-red-600' : isObtuse ? 'text-orange-600' : 'text-green-600';

  const toggleExpand = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  const resetDrawing = () => {
      setDrawnMedians({ A: false, B: false, C: false });
      setDrawnAltitudes({ A: false, B: false, C: false });
      setDrawnBisectors({ A: false, B: false, C: false });
      setDrawnAngleBisectors({ A: false, B: false, C: false });
      setDrawSelection(null);
  };

  // Determine if drawing features are available for this module
  const hasDrawingFeatures = moduleId === ModuleId.CENTROID || moduleId === ModuleId.ORTHOCENTER || moduleId === ModuleId.CIRCUMCIRCLE || moduleId === ModuleId.INCIRCLE;

  // Render Tool Toggle
  const renderToolbar = () => {
      if (moduleId === ModuleId.EXISTENCE) {
          return (
            <div className="flex items-center gap-2 text-slate-500 text-sm bg-slate-100 px-3 py-1.5 rounded-lg">
                <PenTool size={16} /> Режим: Конструкција
            </div>
          )
      }

      if (!hasDrawingFeatures) return (
        <div className="flex items-center gap-2 text-slate-500 text-sm bg-slate-100 px-3 py-1.5 rounded-lg">
             <Move size={16} /> Режим: Движење
        </div>
      );

      return (
          <div className="flex bg-slate-100 p-1 rounded-lg">
              <button 
                onClick={() => setTool('MOVE')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition ${tool === 'MOVE' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
              >
                  <Hand size={14} /> Мести
              </button>
              <button 
                onClick={() => setTool('DRAW')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition ${tool === 'DRAW' ? 'bg-blue-600 shadow text-white' : 'text-slate-500 hover:text-slate-700'}`}
              >
                  <PenTool size={14} /> Цртај
              </button>
          </div>
      );
  };

  // Content Renderer
  const renderContent = (expanded: boolean) => (
    <div className={`flex flex-col items-center bg-white p-4 rounded-xl shadow-lg border border-slate-200 w-full ${expanded ? 'h-full justify-center max-w-4xl' : 'max-w-md'}`}>
      
      {/* Header */}
      <div className="w-full flex justify-between items-center mb-4 border-b border-slate-100 pb-2">
          <div className="flex items-center gap-4">
              <h3 className="text-lg font-bold text-slate-700 hidden sm:block">Интерактивна табла</h3>
              {renderToolbar()}
          </div>
          <div className="flex gap-2">
            {hasDrawingFeatures && (
                <button 
                    onClick={resetDrawing}
                    className="p-2 hover:bg-slate-100 rounded-full text-slate-500 hover:text-red-600 transition"
                    title="Избриши линии"
                >
                    <RotateCcw size={20} />
                </button>
            )}
            <button 
                onClick={toggleExpand}
                className="p-2 hover:bg-slate-100 rounded-full text-slate-500 hover:text-blue-600 transition"
                title={expanded ? "Намали" : "Зголеми"}
            >
                {expanded ? <Minimize2 size={24} /> : <Maximize2 size={20} />}
            </button>
          </div>
      </div>
      
      {/* Helper Message based on Tool */}
      <div className="w-full mb-2 text-center">
          {moduleId === ModuleId.EXISTENCE ? (
              <p className="text-xs text-slate-500 animate-fade-in">👉 Промени ги должините на слајдерите, па со влечење на кругови спој ги линиите.</p>
          ) : tool === 'MOVE' ? (
              <p className="text-xs text-slate-500 animate-fade-in">👉 Фати ги темињата и влечи за да го смениш триаголникот.</p>
          ) : (
              moduleId === ModuleId.CIRCUMCIRCLE 
                ? <p className="text-xs text-cyan-600 font-bold animate-fade-in">✏️ Кликни на средините на страните (точките) за да повлечеш симетрала.</p>
                : moduleId === ModuleId.INCIRCLE
                    ? <p className="text-xs text-orange-600 font-bold animate-fade-in">✏️ Кликни на секое теме (агол) за да повлечеш симетрала.</p>
                    : <p className="text-xs text-blue-600 font-bold animate-fade-in">✏️ Кликни на теме (сино), па на целта за да повлечеш линија.</p>
          )}
      </div>

      <div className={`relative w-full ${expanded ? 'flex-1 min-h-0' : 'aspect-square'}`}>
        <svg 
            ref={svgRef}
            viewBox="0 0 400 400" 
            className={`w-full h-full bg-gradient-to-br from-slate-50 to-blue-50 rounded-lg touch-none border border-slate-200 select-none ${tool === 'DRAW' ? 'cursor-default' : 'cursor-default'}`}
            onMouseMove={handleMouseMove}
            onTouchMove={handleTouchMove}
        >
            <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e2e8f0" strokeWidth="1"/>
            </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />

            {/* --- EXISTENCE MODULE RENDER --- */}
            {moduleId === ModuleId.EXISTENCE ? (
                <g>
                    {/* Fixed Base */}
                    <line x1={existBaseA.x} y1={existBaseA.y} x2={existBaseB.x} y2={existBaseB.y} stroke="#334155" strokeWidth="4" />
                    <circle cx={existBaseA.x} cy={existBaseA.y} r="6" fill="#334155" />
                    <circle cx={existBaseB.x} cy={existBaseB.y} r="6" fill="#334155" />
                    <text x={existBaseA.x - 20} y={existBaseA.y + 10} className="font-bold fill-slate-600">A</text>
                    <text x={existBaseB.x + 10} y={existBaseB.y + 10} className="font-bold fill-slate-600">B</text>
                    <text x={existBaseA.x + baseLen/2} y={existBaseA.y + 20} textAnchor="middle" className="text-xs font-bold fill-slate-400">c (фиксна)</text>

                    {/* Triangle formed feedback */}
                    {isTriangleFormed && (
                        <path d={`M ${existBaseA.x} ${existBaseA.y} L ${existBaseB.x} ${existBaseB.y} L ${tipLeft.x} ${tipLeft.y} Z`} fill="rgba(34, 197, 94, 0.2)" stroke="none" className="animate-fade-in" />
                    )}

                    {/* Left Arm */}
                    <g>
                        <line x1={existBaseA.x} y1={existBaseA.y} x2={tipLeft.x} y2={tipLeft.y} stroke="#3b82f6" strokeWidth="4" strokeLinecap="round" />
                        <circle 
                            cx={tipLeft.x} cy={tipLeft.y} r="12" fill={isTriangleFormed ? "#22c55e" : "#3b82f6"} stroke="white" strokeWidth="2" 
                            style={{ cursor: 'pointer' }}
                            onMouseDown={handleMouseDown('ARM_LEFT')}
                            onTouchStart={handleTouchStart('ARM_LEFT')}
                        />
                        <text x={(existBaseA.x + tipLeft.x)/2 - 10} y={(existBaseA.y + tipLeft.y)/2 - 10} className="text-xs font-bold fill-blue-600">b</text>
                    </g>

                    {/* Right Arm */}
                    <g>
                        <line x1={existBaseB.x} y1={existBaseB.y} x2={tipRight.x} y2={tipRight.y} stroke="#ef4444" strokeWidth="4" strokeLinecap="round" />
                        <circle 
                            cx={tipRight.x} cy={tipRight.y} r="12" fill={isTriangleFormed ? "#22c55e" : "#ef4444"} stroke="white" strokeWidth="2"
                            style={{ cursor: 'pointer' }}
                            onMouseDown={handleMouseDown('ARM_RIGHT')}
                            onTouchStart={handleTouchStart('ARM_RIGHT')}
                        />
                        <text x={(existBaseB.x + tipRight.x)/2 + 10} y={(existBaseB.y + tipRight.y)/2 - 10} className="text-xs font-bold fill-red-600">a</text>
                    </g>

                    {/* Feedback Line/Cross if close but not enough */}
                    {!isTriangleFormed && !canFormTriangle && (
                        <g opacity="0.5">
                             <line x1={tipLeft.x} y1={tipLeft.y} x2={tipRight.x} y2={tipRight.y} stroke="#94a3b8" strokeDasharray="4" />
                             <text x={(tipLeft.x + tipRight.x)/2} y={(tipLeft.y + tipRight.y)/2 - 10} textAnchor="middle" className="text-[10px] fill-slate-400">Дупка!</text>
                        </g>
                    )}
                </g>
            ) : (
            // --- STANDARD MODULE RENDER ---
            <>
            {moduleId !== ModuleId.EXISTENCE && moduleId !== ModuleId.SIDE_ANGLE_RELATION && (
                <path 
                d={`M ${points.A.x} ${points.A.y} L ${points.B.x} ${points.B.y} L ${points.C.x} ${points.C.y} Z`} 
                fill="rgba(14, 165, 233, 0.2)" 
                stroke="#0ea5e9" 
                strokeWidth="3"
                />
            )}

            {/* Standard Angle/Side Labels */}
            {moduleId !== ModuleId.MIDDLE_LINE && moduleId !== ModuleId.CENTROID && moduleId !== ModuleId.ORTHOCENTER && moduleId !== ModuleId.CIRCUMCIRCLE && moduleId !== ModuleId.INCIRCLE && moduleId !== ModuleId.EXISTENCE && moduleId !== ModuleId.SIDE_ANGLE_RELATION && (
                <g className="pointer-events-none select-none">
                    <text x={points.A.x + (centroid.x - points.A.x)*0.15} y={points.A.y + (centroid.y - points.A.y)*0.15 + 5} textAnchor="middle" fill="#0284c7" className="text-xs font-bold">{Math.round(angleA)}°</text>
                    <text x={points.B.x + (centroid.x - points.B.x)*0.15} y={points.B.y + (centroid.y - points.B.y)*0.15 + 5} textAnchor="middle" fill="#0284c7" className="text-xs font-bold">{Math.round(angleB)}°</text>
                    <text x={points.C.x + (centroid.x - points.C.x)*0.15} y={points.C.y + (centroid.y - points.C.y)*0.15 + 5} textAnchor="middle" fill="#0284c7" className="text-xs font-bold">{Math.round(angleC)}°</text>
                </g>
            )}

            {/* Side Labels (Types) */}
            {moduleId === ModuleId.TYPES && (
                <g className="pointer-events-none select-none">
                    <rect x={midAB.x - 16} y={midAB.y - 10} width="32" height="20" rx="4" fill="white" fillOpacity="0.8" />
                    <text x={midAB.x} y={midAB.y + 4} textAnchor="middle" className="text-xs font-bold fill-slate-500">{displayLen(sideC)}</text>
                    <rect x={midBC.x - 16} y={midBC.y - 10} width="32" height="20" rx="4" fill="white" fillOpacity="0.8" />
                    <text x={midBC.x} y={midBC.y + 4} textAnchor="middle" className="text-xs font-bold fill-slate-500">{displayLen(sideA)}</text>
                    <rect x={midAC.x - 16} y={midAC.y - 10} width="32" height="20" rx="4" fill="white" fillOpacity="0.8" />
                    <text x={midAC.x} y={midAC.y + 4} textAnchor="middle" className="text-xs font-bold fill-slate-500">{displayLen(sideB)}</text>
                </g>
            )}

            {/* RELATION MODULE VISUALS */}
            {moduleId === ModuleId.SIDE_ANGLE_RELATION && (
                <g className="pointer-events-none">
                    {/* Fill */}
                    <path d={`M ${points.A.x} ${points.A.y} L ${points.B.x} ${points.B.y} L ${points.C.x} ${points.C.y} Z`} fill="rgba(241, 245, 249, 0.5)" stroke="none" />

                    {/* Sides - Highlighted - SOLID COLORED LINES */}
                    {/* Side A (BC) */}
                    <line x1={points.B.x} y1={points.B.y} x2={points.C.x} y2={points.C.y} stroke={getColor(0)} strokeWidth="4" strokeLinecap="round" />
                    {/* Side B (AC) */}
                    <line x1={points.A.x} y1={points.A.y} x2={points.C.x} y2={points.C.y} stroke={getColor(1)} strokeWidth="4" strokeLinecap="round" />
                    {/* Side C (AB) */}
                    <line x1={points.A.x} y1={points.A.y} x2={points.B.x} y2={points.B.y} stroke={getColor(2)} strokeWidth="4" strokeLinecap="round" />

                    {/* Angle Sectors - Filled with white border */}
                    {/* A - Opp side A (BC) */}
                    <path d={getSector(points.A, points.B, points.C, 40)} fill={getColor(0)} stroke="white" strokeWidth="2" fillOpacity="1" />
                    <text x={points.A.x + (centroid.x - points.A.x)*0.25} y={points.A.y + (centroid.y - points.A.y)*0.25} textAnchor="middle" fill="white" className="text-xs font-bold shadow-black drop-shadow-md">α</text>
                    
                    {/* B - Opp side B (AC) */}
                    <path d={getSector(points.B, points.C, points.A, 40)} fill={getColor(1)} stroke="white" strokeWidth="2" fillOpacity="1" />
                    <text x={points.B.x + (centroid.x - points.B.x)*0.25} y={points.B.y + (centroid.y - points.B.y)*0.25} textAnchor="middle" fill="white" className="text-xs font-bold shadow-black drop-shadow-md">β</text>

                    {/* C - Opp side C (AB) */}
                    <path d={getSector(points.C, points.A, points.B, 40)} fill={getColor(2)} stroke="white" strokeWidth="2" fillOpacity="1" />
                    <text x={points.C.x + (centroid.x - points.C.x)*0.25} y={points.C.y + (centroid.y - points.C.y)*0.25} textAnchor="middle" fill="white" className="text-xs font-bold shadow-black drop-shadow-md">γ</text>

                    {/* Side Labels with matching background */}
                    <g>
                        <rect x={midBC.x - 14} y={midBC.y - 10} width="28" height="20" rx="4" fill={getColor(0)} />
                        <text x={midBC.x} y={midBC.y + 4} textAnchor="middle" fill="white" className="text-xs font-bold">a</text>
                    </g>
                    <g>
                        <rect x={midAC.x - 14} y={midAC.y - 10} width="28" height="20" rx="4" fill={getColor(1)} />
                        <text x={midAC.x} y={midAC.y + 4} textAnchor="middle" fill="white" className="text-xs font-bold">b</text>
                    </g>
                    <g>
                        <rect x={midAB.x - 14} y={midAB.y - 10} width="28" height="20" rx="4" fill={getColor(2)} />
                        <text x={midAB.x} y={midAB.y + 4} textAnchor="middle" fill="white" className="text-xs font-bold">c</text>
                    </g>
                </g>
            )}

            {/* MIDDLE LINE VISUALS */}
            {moduleId === ModuleId.MIDDLE_LINE && (
                <g>
                    {/* The Line */}
                    <line x1={midAC.x} y1={midAC.y} x2={midBC.x} y2={midBC.y} stroke="#ef4444" strokeWidth="4" />
                    <circle cx={midAC.x} cy={midAC.y} r="5" fill="#ef4444" stroke="white" />
                    <circle cx={midBC.x} cy={midBC.y} r="5" fill="#ef4444" stroke="white" />
                    <text x={midAC.x - 15} y={midAC.y - 10} className="text-xs font-bold fill-red-600">D</text>
                    <text x={midBC.x + 15} y={midBC.y - 10} className="text-xs font-bold fill-red-600">E</text>

                    {/* Dimensions */}
                    <g className="pointer-events-none select-none">
                        <rect x={(midAC.x+midBC.x)/2 - 18} y={(midAC.y+midBC.y)/2 - 12} width="36" height="20" rx="4" fill="white" stroke="#ef4444" />
                        <text x={(midAC.x+midBC.x)/2} y={(midAC.y+midBC.y)/2 + 3} textAnchor="middle" className="text-xs font-bold fill-red-600">{displayLen(distMidLine)}</text>
                        <rect x={midAB.x - 18} y={midAB.y - 12} width="36" height="20" rx="4" fill="white" stroke="#0ea5e9" />
                        <text x={midAB.x} y={midAB.y + 3} textAnchor="middle" className="text-xs font-bold fill-blue-600">{displayLen(sideC)}</text>
                    </g>
                </g>
            )}

            {/* CENTROID VISUALS */}
            {moduleId === ModuleId.CENTROID && (
                <g>
                    {/* Draw existing lines (base dashed lines) */}
                    {drawnMedians.A && <line x1={points.A.x} y1={points.A.y} x2={midBC.x} y2={midBC.y} stroke="#cbd5e1" strokeWidth="2" strokeDasharray="5,3" />}
                    {drawnMedians.B && <line x1={points.B.x} y1={points.B.y} x2={midAC.x} y2={midAC.y} stroke="#cbd5e1" strokeWidth="2" strokeDasharray="5,3" />}
                    {drawnMedians.C && <line x1={points.C.x} y1={points.C.y} x2={midAB.x} y2={midAB.y} stroke="#cbd5e1" strokeWidth="2" strokeDasharray="5,3" />}

                    {/* Ratio Highlight (If all drawn) - Overlay on Median A */}
                    {drawnMedians.A && drawnMedians.B && drawnMedians.C && (
                         <g className="animate-fade-in">
                            <line x1={points.A.x} y1={points.A.y} x2={centroid.x} y2={centroid.y} stroke="#dc2626" strokeWidth="4" />
                            <line x1={centroid.x} y1={centroid.y} x2={midBC.x} y2={midBC.y} stroke="#f97316" strokeWidth="4" />
                            
                            <g transform={`translate(${(points.A.x + centroid.x)/2}, ${(points.A.y + centroid.y)/2})`}>
                                <circle r="10" fill="white" stroke="#dc2626" strokeWidth="1"/>
                                <text dy="3" textAnchor="middle" className="text-xs font-bold fill-red-600">2</text>
                            </g>
                            
                            <g transform={`translate(${(centroid.x + midBC.x)/2}, ${(centroid.y + midBC.y)/2})`}>
                                <circle r="10" fill="white" stroke="#f97316" strokeWidth="1"/>
                                <text dy="3" textAnchor="middle" className="text-xs font-bold fill-orange-500">1</text>
                            </g>
                         </g>
                    )}

                    {/* Render Targets (Only in Draw Mode) */}
                    {tool === 'DRAW' && [
                        { pt: midBC, id: 'A' },
                        { pt: midAC, id: 'B' },
                        { pt: midAB, id: 'C' }
                    ].map((m) => {
                        const isTarget = drawSelection === m.id && !drawnMedians[m.id as 'A'|'B'|'C'];
                        const allDone = drawnMedians.A && drawnMedians.B && drawnMedians.C;
                        if (allDone) return null; 

                        return (
                            <g key={m.id} onClick={handleTargetClick(m.id as 'A'|'B'|'C')} style={{ cursor: isTarget ? 'pointer' : 'default' }}>
                                <circle 
                                    cx={m.pt.x} cy={m.pt.y} 
                                    r={isTarget ? 14 : 8} 
                                    fill={isTarget ? '#22c55e' : '#94a3b8'} 
                                    fillOpacity={0.6}
                                    className={isTarget ? 'animate-pulse' : ''}
                                />
                                {isTarget && <circle cx={m.pt.x} cy={m.pt.y} r="20" fill="transparent" stroke="#22c55e" strokeWidth="2" className="animate-ping" />}
                            </g>
                        );
                    })}

                    {drawnMedians.A && drawnMedians.B && drawnMedians.C && (
                        <g className="animate-bounce-in">
                            <circle cx={centroid.x} cy={centroid.y} r="8" fill="#1e293b" stroke="white" strokeWidth="2" />
                            <text x={centroid.x + 12} y={centroid.y - 12} className="text-lg font-bold fill-slate-800">T</text>
                        </g>
                    )}
                </g>
            )}

            {/* ORTHOCENTER VISUALS */}
            {moduleId === ModuleId.ORTHOCENTER && (
                <g>
                    {/* Render Targets (Only in Draw Mode) */}
                     {tool === 'DRAW' && [
                        { pt: altFootA, id: 'A' },
                        { pt: altFootB, id: 'B' }, 
                        { pt: altFootC, id: 'C' } 
                    ].map((m) => {
                        const isTarget = drawSelection === m.id && !drawnAltitudes[m.id as 'A'|'B'|'C'];
                        const allDone = drawnAltitudes.A && drawnAltitudes.B && drawnAltitudes.C;
                        if (allDone) return null;

                        return (
                            <g key={m.id} onClick={handleTargetClick(m.id as 'A'|'B'|'C')} style={{ cursor: isTarget ? 'pointer' : 'default' }}>
                                <rect x={m.pt.x - 8} y={m.pt.y - 8} width="16" height="16" fill={isTarget ? '#8b5cf6' : '#94a3b8'} fillOpacity={0.6} className={isTarget ? 'animate-pulse' : ''} />
                                {isTarget && <circle cx={m.pt.x} cy={m.pt.y} r="20" fill="transparent" stroke="#8b5cf6" strokeWidth="2" className="animate-ping" />}
                            </g>
                        );
                    })}

                    {drawnAltitudes.A && drawnAltitudes.B && drawnAltitudes.C && (
                        <g className="animate-fade-in">
                            <line x1={points.A.x} y1={points.A.y} x2={orthocenter.x} y2={orthocenter.y} stroke="#8b5cf6" strokeWidth="2" strokeDasharray="4,4" opacity="0.6" />
                            <line x1={points.B.x} y1={points.B.y} x2={orthocenter.x} y2={orthocenter.y} stroke="#8b5cf6" strokeWidth="2" strokeDasharray="4,4" opacity="0.6" />
                            <line x1={points.C.x} y1={points.C.y} x2={orthocenter.x} y2={orthocenter.y} stroke="#8b5cf6" strokeWidth="2" strokeDasharray="4,4" opacity="0.6" />
                        </g>
                    )}

                    {drawnAltitudes.A && (
                         <g>
                             {(altFootA.t < 0) && <line x1={altFootA.x} y1={altFootA.y} x2={points.B.x} y2={points.B.y} stroke="#94a3b8" strokeWidth="2" strokeDasharray="4,4" />}
                             {(altFootA.t > 1) && <line x1={points.C.x} y1={points.C.y} x2={altFootA.x} y2={altFootA.y} stroke="#94a3b8" strokeWidth="2" strokeDasharray="4,4" />}
                             <line x1={points.A.x} y1={points.A.y} x2={altFootA.x} y2={altFootA.y} stroke="#8b5cf6" strokeWidth="2" />
                             <rect x={altFootA.x - 4} y={altFootA.y - 4} width="8" height="8" fill="#8b5cf6" />
                         </g>
                    )}
                    {drawnAltitudes.B && (
                         <g>
                             {(altFootB.t < 0) && <line x1={altFootB.x} y1={altFootB.y} x2={points.A.x} y2={points.A.y} stroke="#94a3b8" strokeWidth="2" strokeDasharray="4,4" />}
                             {(altFootB.t > 1) && <line x1={points.C.x} y1={points.C.y} x2={altFootB.x} y2={altFootB.y} stroke="#94a3b8" strokeWidth="2" strokeDasharray="4,4" />}
                             <line x1={points.B.x} y1={points.B.y} x2={altFootB.x} y2={altFootB.y} stroke="#8b5cf6" strokeWidth="2" />
                             <rect x={altFootB.x - 4} y={altFootB.y - 4} width="8" height="8" fill="#8b5cf6" />
                         </g>
                    )}
                    {drawnAltitudes.C && (
                         <g>
                             {(altFootC.t < 0) && <line x1={altFootC.x} y1={altFootC.y} x2={points.A.x} y2={points.A.y} stroke="#94a3b8" strokeWidth="2" strokeDasharray="4,4" />}
                             {(altFootC.t > 1) && <line x1={points.B.x} y1={points.B.y} x2={altFootC.x} y2={altFootC.y} stroke="#94a3b8" strokeWidth="2" strokeDasharray="4,4" />}
                             <line x1={points.C.x} y1={points.C.y} x2={altFootC.x} y2={altFootC.y} stroke="#8b5cf6" strokeWidth="2" />
                             <rect x={altFootC.x - 4} y={altFootC.y - 4} width="8" height="8" fill="#8b5cf6" />
                         </g>
                    )}

                    {drawnAltitudes.A && drawnAltitudes.B && drawnAltitudes.C && (
                        <g className="animate-bounce-in">
                            <circle cx={orthocenter.x} cy={orthocenter.y} r="8" fill="#5b21b6" stroke="white" strokeWidth="2" />
                            <text x={orthocenter.x + 12} y={orthocenter.y - 12} className="text-lg font-bold fill-violet-900">H</text>
                        </g>
                    )}
                </g>
            )}

            {/* CIRCUMCIRCLE VISUALS */}
            {moduleId === ModuleId.CIRCUMCIRCLE && (
                <g>
                    {/* Render Targets for Bisectors (Midpoints) */}
                    {tool === 'DRAW' && [
                         { pt: midBC, id: 'A' }, // Side A (opp A)
                         { pt: midAC, id: 'B' }, // Side B (opp B)
                         { pt: midAB, id: 'C' }  // Side C (opp C)
                    ].map((m) => {
                        const isDone = drawnBisectors[m.id as 'A'|'B'|'C'];
                        if (isDone) return null;

                        return (
                            <g key={m.id} onClick={handleBisectorClick(m.id as 'A'|'B'|'C')} style={{ cursor: 'pointer' }}>
                                <rect x={m.pt.x - 6} y={m.pt.y - 6} width="12" height="12" fill='#06b6d4' className="animate-pulse" />
                                <circle cx={m.pt.x} cy={m.pt.y} r="18" fill="transparent" stroke="#06b6d4" strokeWidth="2" className="animate-ping" />
                            </g>
                        )
                    })}

                    {/* Drawn Bisectors */}
                    {drawnBisectors.A && (
                         <line x1={pbBC.x1} y1={pbBC.y1} x2={pbBC.x2} y2={pbBC.y2} stroke="#06b6d4" strokeWidth="1" strokeDasharray="4,4" />
                    )}
                    {drawnBisectors.B && (
                         <line x1={pbAC.x1} y1={pbAC.y1} x2={pbAC.x2} y2={pbAC.y2} stroke="#06b6d4" strokeWidth="1" strokeDasharray="4,4" />
                    )}
                    {drawnBisectors.C && (
                         <line x1={pbAB.x1} y1={pbAB.y1} x2={pbAB.x2} y2={pbAB.y2} stroke="#06b6d4" strokeWidth="1" strokeDasharray="4,4" />
                    )}

                    {/* The Circumcircle (If all drawn) */}
                    {drawnBisectors.A && drawnBisectors.B && drawnBisectors.C && (
                        <g className="animate-fade-in">
                            <circle cx={circumcenter.x} cy={circumcenter.y} r={circumRadius} fill="none" stroke="#06b6d4" strokeWidth="3" opacity="0.5" />
                            <g className="animate-bounce-in">
                                <circle cx={circumcenter.x} cy={circumcenter.y} r="8" fill="#06b6d4" stroke="white" strokeWidth="2" />
                                <text x={circumcenter.x + 12} y={circumcenter.y - 12} className="text-lg font-bold fill-cyan-800">O</text>
                            </g>
                        </g>
                    )}
                </g>
            )}

            {/* INCIRCLE VISUALS */}
            {moduleId === ModuleId.INCIRCLE && (
                <g>
                     {/* Drawn Angle Bisectors */}
                     {drawnAngleBisectors.A && (
                         <line x1={points.A.x} y1={points.A.y} x2={bisectFootA.x} y2={bisectFootA.y} stroke="#f97316" strokeWidth="1.5" strokeDasharray="5,2" />
                     )}
                     {drawnAngleBisectors.B && (
                         <line x1={points.B.x} y1={points.B.y} x2={bisectFootB.x} y2={bisectFootB.y} stroke="#f97316" strokeWidth="1.5" strokeDasharray="5,2" />
                     )}
                     {drawnAngleBisectors.C && (
                         <line x1={points.C.x} y1={points.C.y} x2={bisectFootC.x} y2={bisectFootC.y} stroke="#f97316" strokeWidth="1.5" strokeDasharray="5,2" />
                     )}

                     {/* The Incircle (If all drawn) */}
                     {drawnAngleBisectors.A && drawnAngleBisectors.B && drawnAngleBisectors.C && (
                        <g className="animate-fade-in">
                            <circle cx={incenter.x} cy={incenter.y} r={inradius} fill="rgba(249, 115, 22, 0.1)" stroke="#f97316" strokeWidth="3" />
                            <g className="animate-bounce-in">
                                <circle cx={incenter.x} cy={incenter.y} r="6" fill="#f97316" stroke="white" strokeWidth="2" />
                                <text x={incenter.x + 10} y={incenter.y - 10} className="text-lg font-bold fill-orange-700">V</text>
                            </g>
                        </g>
                    )}
                </g>
            )}

            {(Object.entries(points) as [string, Point][]).map(([key, p]) => {
                const labelPos = getVertexLabelPos(p);
                const isSelected = drawSelection === key;
                
                // Interaction State Logic
                let cursorStyle = 'default';
                let radius = 8;
                let strokeColor = 'white';
                
                if (tool === 'MOVE') {
                    cursorStyle = 'move';
                    radius = 12; // Big touch target
                } else if (tool === 'DRAW') {
                    // Check if drawing is done for this vertex
                    let isCompleted = false;
                    if (moduleId === ModuleId.CENTROID) isCompleted = drawnMedians[key as 'A'|'B'|'C'];
                    if (moduleId === ModuleId.ORTHOCENTER) isCompleted = drawnAltitudes[key as 'A'|'B'|'C'];
                    if (moduleId === ModuleId.INCIRCLE) isCompleted = drawnAngleBisectors[key as 'A'|'B'|'C'];
                    
                    if (moduleId !== ModuleId.CIRCUMCIRCLE) { // Vertices not clickable in Circumcircle draw mode
                        if (isCompleted) {
                            cursorStyle = 'not-allowed';
                        } else {
                            cursorStyle = 'pointer';
                            radius = isSelected ? 12 : 10;
                            if (moduleId === ModuleId.INCIRCLE && !isCompleted) {
                                radius = 12; // Slightly larger for click target
                                strokeColor = '#f97316'; // Orange outline hint
                            }
                            if (isSelected) strokeColor = '#f59e0b'; // Amber ring
                        }
                    }
                }

                // Invisible large hit area for easier clicking
                return (
                    <g key={key}>
                        {/* Drag/Click Handle (Invisible Large Ring) */}
                        <circle 
                            cx={p.x} cy={p.y} r="30" fill="transparent" 
                            onMouseDown={handleMouseDown(key as 'A'|'B'|'C')}
                            onTouchStart={handleTouchStart(key as 'A'|'B'|'C')}
                            onClick={handleVertexClick(key as 'A'|'B'|'C')}
                            style={{ cursor: cursorStyle }}
                        />
                        
                        {/* Visible Vertex */}
                        <circle 
                            cx={p.x} cy={p.y} r={radius} 
                            fill={isSelected ? '#f59e0b' : '#0ea5e9'} 
                            stroke={strokeColor} strokeWidth="2" 
                            className="transition-all duration-200"
                            style={{ pointerEvents: 'none' }} // Let the invisible ring handle events
                        />
                        <text x={labelPos.x} y={labelPos.y} textAnchor="middle" dominantBaseline="middle" className="text-base font-bold fill-slate-700 select-none">{key}</text>
                    </g>
                );
            })}
            
            {moduleId === ModuleId.EXTERNAL_ANGLES && (
                <>
                <line x1={points.B.x} y1={points.B.y} x2={points.B.x - (points.C.x - points.B.x)} y2={points.B.y - (points.C.y - points.B.y)} stroke="red" strokeDasharray="4" />
                <text x={points.B.x - 40} y={points.B.y} fill="red" className="text-xs">Надворешен</text>
                </>
            )}
            </>
            )}
        </svg>
      </div>

      <div className="mt-4 p-4 w-full bg-slate-100 rounded-lg flex flex-wrap justify-around gap-4 shadow-inner">
        {moduleId === ModuleId.TYPES && (
            <>
                <div className="text-center">
                    <p className="text-xs text-slate-500 uppercase font-bold">Според страни</p>
                    <p className={`text-xl font-bold ${typeColor}`}>
                        {isEquilateral ? 'Рамностран' : isIsosceles ? 'Рамнокрак' : 'Разностран'}
                    </p>
                </div>
                <div className="text-center">
                    <p className="text-xs text-slate-500 uppercase font-bold">Според агли</p>
                    <p className={`text-xl font-bold ${angleTypeColor}`}>
                        {isRight ? 'Правоаголен' : isObtuse ? 'Тапоаголен' : 'Остроаголен'}
                    </p>
                </div>
            </>
        )}

        {moduleId === ModuleId.INTERNAL_ANGLES && (
            <div className="text-center">
                <p className="text-xs text-slate-500 uppercase font-bold">Збир на агли</p>
                <p className="text-xl font-bold text-slate-800">
                    {Math.round(angleA)}° + {Math.round(angleB)}° + {Math.round(angleC)}° ≈ 180°
                </p>
            </div>
        )}
        
         {moduleId === ModuleId.EXTERNAL_ANGLES && (
            <div className="text-center">
                <p className="text-xs text-slate-500 uppercase font-bold">Инфо</p>
                <p className="text-sm text-slate-700">
                   Надворешниот агол и внатрешниот агол при исто теме формираат 180°.
                </p>
            </div>
        )}

        {moduleId === ModuleId.MIDDLE_LINE && (
            <div className="text-center w-full">
                <p className="text-xs text-slate-500 uppercase font-bold mb-1">Сооднос на должини</p>
                <div className="flex justify-center items-center gap-4">
                     <div className="bg-red-50 border border-red-200 px-3 py-1 rounded-lg">
                        <span className="text-red-800 font-bold">DE = {displayLen(distMidLine)}</span>
                     </div>
                     <span className="text-slate-400">=</span>
                     <div className="bg-blue-50 border border-blue-200 px-3 py-1 rounded-lg">
                        <span className="text-blue-800 font-bold">AB / 2 = {(parseFloat(displayLen(sideC)) / 2).toFixed(1)}</span>
                     </div>
                </div>
                <p className="text-xs text-slate-500 mt-2 italic">Средната линија е секогаш половина од основата.</p>
            </div>
        )}

        {moduleId === ModuleId.CENTROID && (
             <div className="text-center w-full">
                {drawnMedians.A && drawnMedians.B && drawnMedians.C ? (
                    <div className="animate-fade-in">
                        <p className="text-xs text-slate-500 uppercase font-bold mb-1">Магичен сооднос 2:1</p>
                        <div className="flex justify-center items-center gap-2 text-sm">
                             <span className="text-red-600 font-bold">AT (Теме-Тежиште)</span>
                             <span>:</span>
                             <span className="text-orange-600 font-bold">TM (Тежиште-Страна)</span>
                             <span>=</span>
                             <span className="bg-slate-800 text-white px-2 py-0.5 rounded font-bold">2 : 1</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-2">Тежиштето T ја дели медијаната на два дела.</p>
                    </div>
                ) : (
                    <div>
                        <p className="text-sm font-bold text-slate-700 mb-1">Конструирај ги тежишните линии!</p>
                        <p className="text-xs text-slate-500">Избери ја алатката <span className="font-bold text-blue-600">✏️ Цртај</span> погоре.</p>
                    </div>
                )}
             </div>
        )}

        {moduleId === ModuleId.ORTHOCENTER && (
             <div className="text-center w-full">
                {drawnAltitudes.A && drawnAltitudes.B && drawnAltitudes.C ? (
                    <div className="animate-fade-in">
                        <p className="text-sm font-bold text-violet-800 mb-1">Точка H е Ортоцентар</p>
                         <p className="text-xs text-slate-500 mt-2">Избери <span className="font-bold">✋ Мести</span> и помести ги темињата за да видиш како H се движи.</p>
                    </div>
                ) : (
                    <div>
                        <p className="text-sm font-bold text-slate-700 mb-1">Повлечи ги висините!</p>
                        <p className="text-xs text-slate-500">1. Избери <span className="font-bold text-blue-600">✏️ Цртај</span>. 2. Кликни на теме. 3. Кликни на спротивната страна.</p>
                    </div>
                )}
             </div>
        )}

        {moduleId === ModuleId.CIRCUMCIRCLE && (
             <div className="text-center w-full">
                {drawnBisectors.A && drawnBisectors.B && drawnBisectors.C ? (
                    <div className="animate-fade-in">
                        <p className="text-sm font-bold text-cyan-800 mb-1">О е Центар на опишана кружница</p>
                        <p className="text-xs text-slate-500 mt-2">Избери <span className="font-bold">✋ Мести</span> и пробај да направиш тапоаголен триаголник. Каде отиде центарот?</p>
                    </div>
                ) : (
                    <div>
                        <p className="text-sm font-bold text-slate-700 mb-1">Повлечи ги симетралите на страните!</p>
                        <p className="text-xs text-slate-500">1. Избери <span className="font-bold text-blue-600">✏️ Цртај</span>. 2. Кликни на точките на средината на секоја страна.</p>
                    </div>
                )}
             </div>
        )}

        {moduleId === ModuleId.INCIRCLE && (
             <div className="text-center w-full">
                {drawnAngleBisectors.A && drawnAngleBisectors.B && drawnAngleBisectors.C ? (
                    <div className="animate-fade-in">
                        <p className="text-sm font-bold text-orange-700 mb-1">V е Центар на впишана кружница</p>
                        <p className="text-xs text-slate-500 mt-2">Примети дека центарот е секогаш внатре, без разлика на формата.</p>
                    </div>
                ) : (
                    <div>
                        <p className="text-sm font-bold text-slate-700 mb-1">Повлечи ги симетралите на аглите!</p>
                        <p className="text-xs text-slate-500">1. Избери <span className="font-bold text-orange-600">✏️ Цртај</span>. 2. Кликни на сите три темиња (А, B, C).</p>
                    </div>
                )}
             </div>
        )}

        {moduleId === ModuleId.EXISTENCE && (
            <div className="w-full flex flex-col gap-3 text-sm">
                {/* Sliders */}
                <div className="flex justify-between items-center bg-white p-2 rounded-lg border border-slate-200">
                    <div className="flex flex-col flex-1 px-2">
                        <label className="text-xs font-bold text-blue-600 mb-1 flex justify-between">
                            Страна b: <span>{displayLen(armLeftLen)}</span>
                        </label>
                        <input 
                            type="range" min="30" max="200" step="10"
                            value={armLeftLen}
                            onChange={(e) => setArmLeftLen(Number(e.target.value))}
                            className="w-full h-2 bg-blue-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        />
                    </div>
                    
                    <div className="w-px h-8 bg-slate-200 mx-2"></div>

                    <div className="flex flex-col flex-1 px-2">
                        <label className="text-xs font-bold text-red-600 mb-1 flex justify-between">
                            Страна a: <span>{displayLen(armRightLen)}</span>
                        </label>
                        <input 
                            type="range" min="30" max="200" step="10"
                            value={armRightLen}
                            onChange={(e) => setArmRightLen(Number(e.target.value))}
                            className="w-full h-2 bg-red-100 rounded-lg appearance-none cursor-pointer accent-red-600"
                        />
                    </div>
                </div>

                {/* NEW: Dynamic Inequality Window */}
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-center">
                    <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Услов за егзистенција</p>
                    
                    {/* Formula */}
                    <div className="flex justify-center items-center gap-2 text-xs font-bold text-slate-500 mb-2">
                        <span>| <span className="text-red-500">a</span> - <span className="text-blue-500">b</span> |</span>
                        <span>&lt;</span>
                        <span className="text-slate-800">c</span>
                        <span>&lt;</span>
                        <span><span className="text-red-500">a</span> + <span className="text-blue-500">b</span></span>
                    </div>

                    {/* Calculation */}
                    {(() => {
                        const a = parseFloat(displayLen(armRightLen));
                        const b = parseFloat(displayLen(armLeftLen));
                        const c = parseFloat(displayLen(baseLen));
                        const diff = Math.abs(a - b);
                        const sum = a + b;
                        
                        const diffOk = diff < c;
                        const sumOk = sum > c;

                        return (
                            <div className="flex justify-center items-center gap-3 text-lg font-bold font-mono bg-white rounded border border-slate-100 py-2 px-4 shadow-sm">
                                <span className={diffOk ? "text-green-600" : "text-red-500"}>
                                    {diff.toFixed(1)}
                                </span>
                                <span className="text-slate-300">&lt;</span>
                                <span className="text-slate-800">{c}</span>
                                <span className="text-slate-300">&lt;</span>
                                <span className={sumOk ? "text-green-600" : "text-red-500"}>
                                    {sum.toFixed(1)}
                                </span>
                            </div>
                        );
                    })()}
                </div>

                {/* Conclusion / Status */}
                <div className="text-center">
                    <span className={`px-4 py-2 rounded-full text-xs font-bold shadow-sm transition-all duration-300 border ${isTriangleFormed ? 'bg-green-100 text-green-700 border-green-200' : canFormTriangle ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
                        {isTriangleFormed 
                            ? '✅ Триаголникот е формиран!' 
                            : canFormTriangle 
                                ? '👉 Можно е! Ротирај ги страните за да ги споиш.' 
                                : '❌ Не може да се формира! (c ≥ a + b)'}
                    </span>
                </div>
            </div>
        )}

        {moduleId === ModuleId.SIDE_ANGLE_RELATION && (
            <div className="w-full flex flex-col gap-2 items-center text-sm">
                <p className="text-center text-xs text-slate-500 animate-fade-in">
                    Менувај го триаголникот. Црвено = Најголемо, Сино = Најмало.
                </p>
                <div className="flex justify-center gap-4 bg-slate-50 p-2 rounded-lg border border-slate-200 w-full">
                    <div className="flex flex-col items-center">
                        <span className="text-[10px] uppercase font-bold text-red-500">Најголеми</span>
                        <div className="flex items-center gap-2 font-bold text-slate-700">
                            <span>Агол: {Math.round(Math.max(angleA, angleB, angleC))}°</span>
                            <span>→</span>
                            <span>Страна: {Math.max(parseFloat(displayLen(sideA)), parseFloat(displayLen(sideB)), parseFloat(displayLen(sideC)))}</span>
                        </div>
                    </div>
                    <div className="w-px bg-slate-200"></div>
                    <div className="flex flex-col items-center">
                        <span className="text-[10px] uppercase font-bold text-blue-500">Најмали</span>
                        <div className="flex items-center gap-2 font-bold text-slate-700">
                            <span>Агол: {Math.round(Math.min(angleA, angleB, angleC))}°</span>
                            <span>→</span>
                            <span>Страна: {Math.min(parseFloat(displayLen(sideA)), parseFloat(displayLen(sideB)), parseFloat(displayLen(sideC)))}</span>
                        </div>
                    </div>
                </div>
            </div>
        )}
      </div>
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

  return (
    <div className="w-full flex justify-center">
        {renderContent(false)}
    </div>
  );
};

export default TriangleVisualizer;