
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Point, ModuleId } from '../types';
import { Maximize2, Minimize2, X, RotateCcw, PenTool, Move, Hand, Lock, ArrowRight } from 'lucide-react';

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

// Helper to get extension point (extends line p1->p2 past p2 by 'len')
const getExtensionPoint = (p1: Point, p2: Point, len: number) => {
    const d = dist(p1, p2);
    if (d === 0) return p2;
    const ux = (p2.x - p1.x) / d;
    const uy = (p2.y - p1.y) / d;
    return { x: p2.x + ux * len, y: p2.y + uy * len };
};

type ToolMode = 'MOVE' | 'DRAW';

const TriangleVisualizer: React.FC<Props> = ({ moduleId }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  
  const [tool, setTool] = useState<ToolMode>('MOVE');

  // --- EXISTENCE MODULE STATE ---
  const [baseLen] = useState(240); // Fixed base length (pixels)
  const [armLeftLen, setArmLeftLen] = useState(80);
  const [armRightLen, setArmRightLen] = useState(100);
  const [armLeftAngle, setArmLeftAngle] = useState(-45); // Degrees, relative to base
  const [armRightAngle, setArmRightAngle] = useState(-135); // Degrees
  const [isTriangleFormed, setIsTriangleFormed] = useState(false);

  useEffect(() => {
    if (moduleId === ModuleId.CENTROID || moduleId === ModuleId.ORTHOCENTER || moduleId === ModuleId.CIRCUMCIRCLE || moduleId === ModuleId.INCIRCLE) {
        setTool('DRAW'); 
    } else {
        setTool('MOVE'); 
    }
    
    if (moduleId === ModuleId.EXISTENCE) {
        setArmLeftLen(80);
        setArmRightLen(100);
        setIsTriangleFormed(false);
    }
  }, [moduleId]);

  const [points, setPoints] = useState<{ A: Point; B: Point; C: Point }>({
    A: { x: 200, y: 50 },
    B: { x: 100, y: 300 },
    C: { x: 300, y: 300 },
  });

  const [dragging, setDragging] = useState<'A' | 'B' | 'C' | 'ARM_LEFT' | 'ARM_RIGHT' | null>(null);

  // --- Drawing States ---
  const [drawnMedians, setDrawnMedians] = useState<{A: boolean, B: boolean, C: boolean}>({ A: false, B: false, C: false });
  const [drawnAltitudes, setDrawnAltitudes] = useState<{A: boolean, B: boolean, C: boolean}>({ A: false, B: false, C: false });
  const [drawnBisectors, setDrawnBisectors] = useState<{A: boolean, B: boolean, C: boolean}>({ A: false, B: false, C: false });
  const [drawnAngleBisectors, setDrawnAngleBisectors] = useState<{A: boolean, B: boolean, C: boolean}>({ A: false, B: false, C: false });
  const [drawSelection, setDrawSelection] = useState<string | null>(null);

  useEffect(() => {
    setDrawnMedians({ A: false, B: false, C: false });
    setDrawnAltitudes({ A: false, B: false, C: false });
    setDrawnBisectors({ A: false, B: false, C: false });
    setDrawnAngleBisectors({ A: false, B: false, C: false });
    setDrawSelection(null);
  }, [moduleId]);

  // Calculations omitted for brevity, logic identical to previous version, just ensuring styles update
  const sideA = dist(points.B, points.C); 
  const sideB = dist(points.A, points.C); 
  const sideC = dist(points.A, points.B); 

  const angleA = calculateAngle(points.A, points.B, points.C);
  const angleB = calculateAngle(points.B, points.A, points.C);
  const angleC = calculateAngle(points.C, points.A, points.B);

  // External Angles Calculation
  const extAngleA = 180 - angleA;
  const extAngleB = 180 - angleB;
  const extAngleC = 180 - angleC;

  // Extension Points for External Angles Visuals (Cyclic: C->A->ext, A->B->ext, B->C->ext)
  const extPointA = getExtensionPoint(points.C, points.A, 80);
  const extPointB = getExtensionPoint(points.A, points.B, 80);
  const extPointC = getExtensionPoint(points.B, points.C, 80);

  const centroid = { x: (points.A.x + points.B.x + points.C.x) / 3, y: (points.A.y + points.B.y + points.C.y) / 3 };
  const midAB = { x: (points.A.x + points.B.x) / 2, y: (points.A.y + points.B.y) / 2 };
  const midBC = { x: (points.B.x + points.C.x) / 2, y: (points.B.y + points.C.y) / 2 };
  const midAC = { x: (points.A.x + points.C.x) / 2, y: (points.A.y + points.C.y) / 2 };

  const getAltitudeFoot = (p: Point, a: Point, b: Point) => {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    // Calculate vector t parameter for projection
    const t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy);
    return { x: a.x + t * dx, y: a.y + t * dy, t: t };
  };
  const altFootA = getAltitudeFoot(points.A, points.B, points.C);
  const altFootB = getAltitudeFoot(points.B, points.A, points.C);
  const altFootC = getAltitudeFoot(points.C, points.A, points.B);
  
  const getLineIntersection = (p1: Point, p2: Point, p3: Point, p4: Point) => {
      const d = (p1.x - p2.x) * (p3.y - p4.y) - (p1.y - p2.y) * (p3.x - p4.x);
      if (d === 0) return centroid; 
      const t = ((p1.x - p3.x) * (p3.y - p4.y) - (p1.y - p3.y) * (p3.x - p4.x)) / d;
      return { x: p1.x + t * (p2.x - p1.x), y: p1.y + t * (p2.y - p1.y) };
  };
  const orthocenter = getLineIntersection(points.A, altFootA, points.B, altFootB);

  const getPerpBisectorPoints = (p1: Point, p2: Point) => {
      const mid = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
      const dx = p2.x - p1.x; const dy = p2.y - p1.y;
      const len = Math.sqrt(dx*dx + dy*dy);
      const nx = -dy / len * 400; const ny = dx / len * 400;
      return { x1: mid.x - nx, y1: mid.y - ny, x2: mid.x + nx, y2: mid.y + ny };
  };
  const pbAB = getPerpBisectorPoints(points.A, points.B);
  const pbBC = getPerpBisectorPoints(points.B, points.C);
  const pbAC = getPerpBisectorPoints(points.A, points.C);

  const getCircumcenter = (a: Point, b: Point, c: Point) => {
      const D = 2 * (a.x * (b.y - c.y) + b.x * (c.y - a.y) + c.x * (a.y - b.y));
      if (Math.abs(D) < 0.0001) return centroid; 
      const Ux = (1 / D) * ((a.x**2 + a.y**2) * (b.y - c.y) + (b.x**2 + b.y**2) * (c.y - a.y) + (c.x**2 + c.y**2) * (a.y - b.y));
      const Uy = (1 / D) * ((a.x**2 + a.y**2) * (c.x - b.x) + (b.x**2 + b.y**2) * (a.x - c.x) + (c.x**2 + c.y**2) * (b.x - a.x));
      return { x: Ux, y: Uy };
  };
  const circumcenter = getCircumcenter(points.A, points.B, points.C);
  const circumRadius = dist(circumcenter, points.A);

  const perimeter = sideA + sideB + sideC;
  const incenter = {
      x: (sideA * points.A.x + sideB * points.B.x + sideC * points.C.x) / perimeter,
      y: (sideA * points.A.y + sideB * points.B.y + sideC * points.C.y) / perimeter
  };
  const s = perimeter / 2;
  const area = Math.sqrt(s * (s - sideA) * (s - sideB) * (s - sideC));
  const inradius = area / s;

  const getBisectorFoot = (vA: Point, vB: Point, vC: Point, lenB: number, lenC: number) => {
      return { x: (lenB * vB.x + lenC * vC.x) / (lenB + lenC), y: (lenB * vB.y + lenC * vC.y) / (lenB + lenC) };
  };
  const bisectFootA = getBisectorFoot(points.A, points.B, points.C, sideB, sideC);
  const bisectFootB = getBisectorFoot(points.B, points.A, points.C, sideA, sideC);
  const bisectFootC = getBisectorFoot(points.C, points.A, points.B, sideA, sideB);

  // Updated: Uses decimal comma instead of dot
  const displayLen = (px: number) => (px / 30).toFixed(1).replace('.', ',');

  // Special lengths for Middle Line module
  const valAB = displayLen(sideC);
  const valMN = displayLen(dist(midAC, midBC));

  // Special lengths for Centroid module
  // Rounded to integers for cleaner display in the 2:1 ratio window
  const valAT = Math.round(dist(points.A, centroid) / 30);
  const valTA1 = Math.round(dist(centroid, midBC) / 30);

  // Existence Values (Real numbers for display)
  const valExistA = Number((armRightLen / 30).toFixed(1));
  const valExistB = Number((armLeftLen / 30).toFixed(1));
  const valExistC = Number((baseLen / 30).toFixed(1));
  const valExistDiff = Math.abs(valExistA - valExistB);
  const valExistSum = valExistA + valExistB;

  const isEquilateral = sideA > 0 && Math.abs(sideA - sideB) < 5 && Math.abs(sideB - sideC) < 5;
  const isIsosceles = !isEquilateral && (Math.abs(sideA - sideB) < 5 || Math.abs(sideB - sideC) < 5 || Math.abs(sideA - sideC) < 5);
  const isRight = Math.abs(angleA - 90) < 2 || Math.abs(angleB - 90) < 2 || Math.abs(angleC - 90) < 2;
  const isObtuse = angleA > 92 || angleB > 92 || angleC > 92;

  // Function to calculate label position inside the triangle
  const getLabelPos = (p: Point) => {
    const textOffset = 40; // Pixels to move towards centroid
    const dir = { x: centroid.x - p.x, y: centroid.y - p.y };
    const len = Math.sqrt(dir.x * dir.x + dir.y * dir.y);
    // Move slightly towards centroid
    return { 
        x: p.x + (dir.x / len) * textOffset, 
        y: p.y + (dir.y / len) * textOffset 
    };
  };

  const labelPosA = getLabelPos(points.A);
  const labelPosB = getLabelPos(points.B);
  const labelPosC = getLabelPos(points.C);

  // Existence Logic
  const existBaseA = { x: 80, y: 300 };
  const existBaseB = { x: 80 + baseLen, y: 300 };
  const getArmTip = (origin: Point, len: number, angleDeg: number) => {
      const rad = (angleDeg * Math.PI) / 180;
      return { x: origin.x + len * Math.cos(rad), y: origin.y + len * Math.sin(rad) };
  };
  const tipLeft = getArmTip(existBaseA, armLeftLen, armLeftAngle);
  const tipRight = getArmTip(existBaseB, armRightLen, armRightAngle);
  const tipDist = dist(tipLeft, tipRight);
  const canFormTriangle = (armLeftLen + armRightLen) > baseLen;

  useEffect(() => {
      if (moduleId === ModuleId.EXISTENCE && canFormTriangle && tipDist < 15) {
          setIsTriangleFormed(true);
      } else {
          setIsTriangleFormed(false);
      }
  }, [tipDist, canFormTriangle, moduleId]);

  // Relation Logic
  const angles = [angleA, angleB, angleC];
  const maxAngleIdx = angles.indexOf(Math.max(...angles));
  const minAngleIdx = angles.indexOf(Math.min(...angles));
  
  const getColor = (idx: number) => {
      if (moduleId !== ModuleId.SIDE_ANGLE_RELATION) return "#0ea5e9";
      if (idx === maxAngleIdx) return "#ef4444"; 
      if (idx === minAngleIdx) return "#3b82f6";
      return "#94a3b8"; 
  };
  const getSector = (center: Point, p1: Point, p2: Point, r: number) => {
      const d1 = dist(center, p1); const d2 = dist(center, p2);
      if (d1 === 0 || d2 === 0) return "";
      const x1 = center.x + (p1.x - center.x) * (r / d1);
      const y1 = center.y + (p1.y - center.y) * (r / d1);
      const x2 = center.x + (p2.x - center.x) * (r / d2);
      const y2 = center.y + (p2.y - center.y) * (r / d2);
      const cp = (p1.x - center.x)*(p2.y - center.y) - (p1.y - center.y)*(p2.x - center.x);
      // For internal angles, we usually want the smaller sweep, but for external logic, order matters
      // Standard sector logic checks cross product.
      const sweep = cp > 0 ? 1 : 0;
      return `M ${center.x} ${center.y} L ${x1} ${y1} A ${r} ${r} 0 0 ${sweep} ${x2} ${y2} Z`;
  };

  // Improved calculation to place external angle labels exactly in the center of the sector
  const getExternalLabelPos = (vertex: Point, p1: Point, p2: Point) => {
    const distOffset = 28; // Distance from vertex, slightly less than sector radius (40)
    
    // Vectors from vertex to endpoints
    const vx1 = p1.x - vertex.x;
    const vy1 = p1.y - vertex.y;
    const len1 = Math.sqrt(vx1*vx1 + vy1*vy1);
    
    const vx2 = p2.x - vertex.x;
    const vy2 = p2.y - vertex.y;
    const len2 = Math.sqrt(vx2*vx2 + vy2*vy2);
    
    // Normalized vectors (unit vectors)
    const nx1 = vx1 / len1;
    const ny1 = vy1 / len1;
    const nx2 = vx2 / len2;
    const ny2 = vy2 / len2;
    
    // Bisector vector (sum of unit vectors gives the direction of the bisector)
    const bx = nx1 + nx2;
    const by = ny1 + ny2;
    const blen = Math.sqrt(bx*bx + by*by);
    
    if (blen === 0) return { x: vertex.x, y: vertex.y }; // Should not happen in valid triangle

    // Normalize bisector and scale to distance
    return { 
        x: vertex.x + (bx/blen) * distOffset, 
        y: vertex.y + (by/blen) * distOffset 
    };
  }

  // Helper to draw right angle marker at a point `foot` perpendicular to `baseStart`->`baseEnd` pointing towards `vertex`
  const getRightAnglePath = (foot: Point, ver: Point, baseStart: Point, baseEnd: Point) => {
    // Vector along altitude (Foot -> Vertex)
    const dvx = ver.x - foot.x;
    const dvy = ver.y - foot.y;
    const lenV = Math.sqrt(dvx*dvx + dvy*dvy);
    if (lenV < 1) return "";
    const uVx = dvx / lenV;
    const uVy = dvy / lenV;

    // Vector along base (Foot -> BaseStart) - check which direction is "inward" or consistent
    // Actually, we just need a perpendicular vector. We can rotate uV by 90 degrees.
    // But to ensure it aligns with the line, let's use base points.
    const dbx = baseEnd.x - baseStart.x;
    const dby = baseEnd.y - baseStart.y;
    const lenB = Math.sqrt(dbx*dbx + dby*dby);
    if (lenB < 1) return "";
    
    // We want the vector along the base that points towards the main part of the triangle (usually Centroid)
    // A simple heuristic: calculate the square point.
    // P1 = Foot + size * uV
    // P2 = Foot + size * uBase
    // Corner = P1 + P2 - Foot
    // We check two directions for uBase (+ and -) and see which Corner is closer to the triangle Centroid.
    
    const size = 10;
    const uBx = dbx / lenB;
    const uBy = dby / lenB;
    
    const pV = { x: foot.x + uVx * size, y: foot.y + uVy * size };
    
    // Candidate 1
    const pB1 = { x: foot.x + uBx * size, y: foot.y + uBy * size };
    const corner1 = { x: pV.x + uBx * size, y: pV.y + uBy * size };
    
    // Candidate 2
    const pB2 = { x: foot.x - uBx * size, y: foot.y - uBy * size };
    const corner2 = { x: pV.x - uBx * size, y: pV.y - uBy * size };
    
    const d1 = dist(corner1, centroid);
    const d2 = dist(corner2, centroid);
    
    const finalCorner = d1 < d2 ? corner1 : corner2;
    const finalPB = d1 < d2 ? pB1 : pB2;
    
    return `M ${pV.x} ${pV.y} L ${finalCorner.x} ${finalCorner.y} L ${finalPB.x} ${finalPB.y}`;
  };

  const handleVertexClick = (v: 'A' | 'B' | 'C') => (e: React.MouseEvent) => {
    e.stopPropagation(); 
    if (tool !== 'DRAW') return;
    const relevantModules = [ModuleId.CENTROID, ModuleId.ORTHOCENTER, ModuleId.CIRCUMCIRCLE, ModuleId.INCIRCLE];
    if (!relevantModules.includes(moduleId)) return;
    if (moduleId === ModuleId.CENTROID && drawnMedians[v]) return;
    if (moduleId === ModuleId.ORTHOCENTER && drawnAltitudes[v]) return;
    if (moduleId === ModuleId.INCIRCLE) {
        setDrawnAngleBisectors(prev => ({...prev, [v]: !prev[v]}));
        return;
    }
    if (moduleId === ModuleId.CIRCUMCIRCLE) return;
    setDrawSelection(prev => prev === v ? null : v);
  };

  const handleTargetClick = (targetId: 'A' | 'B' | 'C') => (e: React.MouseEvent) => {
      e.stopPropagation();
      if (tool !== 'DRAW') return;
      if (drawSelection === targetId) {
          if (moduleId === ModuleId.CENTROID) setDrawnMedians(prev => ({ ...prev, [targetId]: true }));
          else setDrawnAltitudes(prev => ({ ...prev, [targetId]: true }));
          setDrawSelection(null);
      }
  };

  const handleBisectorClick = (sideId: 'A' | 'B' | 'C') => (e: React.MouseEvent) => {
      e.stopPropagation();
      if (tool !== 'DRAW' || moduleId !== ModuleId.CIRCUMCIRCLE) return;
      setDrawnBisectors(prev => ({ ...prev, [sideId]: true }));
  };

  const handleMouseDown = (obj: 'A' | 'B' | 'C' | 'ARM_LEFT' | 'ARM_RIGHT') => (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation(); setDragging(obj);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging || !svgRef.current) return;
    const CTM = svgRef.current.getScreenCTM();
    if (!CTM) return;
    const x = (e.clientX - CTM.e) / CTM.a;
    const y = (e.clientY - CTM.f) / CTM.d;

    if (tool === 'MOVE' && moduleId !== ModuleId.EXISTENCE) {
        const constrainedX = Math.max(10, Math.min(390, x));
        const constrainedY = Math.max(10, Math.min(390, y));
        if (dragging === 'A' || dragging === 'B' || dragging === 'C') {
            setPoints(prev => ({ ...prev, [dragging]: { x: constrainedX, y: constrainedY } }));
        }
    }
    if (moduleId === ModuleId.EXISTENCE) {
        if (dragging === 'ARM_LEFT') {
            const dx = x - existBaseA.x; const dy = y - existBaseA.y;
            setArmLeftAngle(Math.atan2(dy, dx) * 180 / Math.PI);
            setArmLeftLen(Math.min(180, Math.max(40, Math.sqrt(dx*dx + dy*dy))));
        }
        if (dragging === 'ARM_RIGHT') {
            const dx = x - existBaseB.x; const dy = y - existBaseB.y;
            setArmRightAngle(Math.atan2(dy, dx) * 180 / Math.PI);
            setArmRightLen(Math.min(180, Math.max(40, Math.sqrt(dx*dx + dy*dy))));
        }
    }
  };

  const handleMouseUp = () => setDragging(null);
  const handleTouchStart = (obj: any) => (e: any) => { e.preventDefault(); e.stopPropagation(); setDragging(obj); };
  const handleTouchMove = (e: any) => {
      if (!dragging || !svgRef.current) return;
      const touch = e.touches[0];
      const CTM = svgRef.current.getScreenCTM();
      if (!CTM) return;
      const x = (touch.clientX - CTM.e) / CTM.a;
      const y = (touch.clientY - CTM.f) / CTM.d;
      
      if (tool === 'MOVE' && moduleId !== ModuleId.EXISTENCE) {
         const cx = Math.max(10, Math.min(390, x)); const cy = Math.max(10, Math.min(390, y));
         if(dragging === 'A'||dragging==='B'||dragging==='C') setPoints(p => ({...p, [dragging]: {x: cx, y: cy}}));
      }
      if (moduleId === ModuleId.EXISTENCE) {
         if(dragging==='ARM_LEFT') {
             const dx = x - existBaseA.x; const dy = y - existBaseA.y;
             setArmLeftAngle(Math.atan2(dy, dx)*180/Math.PI);
             setArmLeftLen(Math.min(180, Math.max(40, Math.sqrt(dx*dx + dy*dy))));
         }
         if(dragging==='ARM_RIGHT') {
             const dx = x - existBaseB.x; const dy = y - existBaseB.y;
             setArmRightAngle(Math.atan2(dy, dx)*180/Math.PI);
             setArmRightLen(Math.min(180, Math.max(40, Math.sqrt(dx*dx + dy*dy))));
         }
      }
  };

  useEffect(() => {
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchend', handleMouseUp);
    return () => { window.removeEventListener('mouseup', handleMouseUp); window.removeEventListener('touchend', handleMouseUp); };
  }, []);

  const typeColor = isEquilateral ? 'text-purple-600' : isIsosceles ? 'text-blue-600' : 'text-slate-600';
  const angleTypeColor = isRight ? 'text-red-600' : isObtuse ? 'text-orange-600' : 'text-green-600';

  const toggleExpand = (e?: React.MouseEvent) => { e?.stopPropagation(); setIsExpanded(!isExpanded); };
  const resetDrawing = () => {
      setDrawnMedians({ A: false, B: false, C: false }); setDrawnAltitudes({ A: false, B: false, C: false });
      setDrawnBisectors({ A: false, B: false, C: false }); setDrawnAngleBisectors({ A: false, B: false, C: false });
      setDrawSelection(null);
  };
  const hasDrawingFeatures = moduleId === ModuleId.CENTROID || moduleId === ModuleId.ORTHOCENTER || moduleId === ModuleId.CIRCUMCIRCLE || moduleId === ModuleId.INCIRCLE;

  const renderToolbar = () => {
      if (moduleId === ModuleId.EXISTENCE) {
          return (
            <div className="flex items-center gap-2 text-slate-500 text-sm bg-slate-100 px-4 py-2 rounded-full font-bold">
                <PenTool size={16} /> Режим: Конструкција
            </div>
          )
      }
      if (!hasDrawingFeatures) return (
        <div className="flex items-center gap-2 text-slate-500 text-sm bg-slate-100 px-4 py-2 rounded-full font-bold">
             <Move size={16} /> Режим: Движење
        </div>
      );

      return (
          <div className="flex bg-slate-100 p-1 rounded-full border border-slate-200">
              <button 
                onClick={() => setTool('MOVE')}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold transition-all ${tool === 'MOVE' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
              >
                  <Hand size={14} /> Мести
              </button>
              <button 
                onClick={() => setTool('DRAW')}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold transition-all ${tool === 'DRAW' ? 'bg-blue-600 shadow text-white' : 'text-slate-500 hover:text-slate-700'}`}
              >
                  <PenTool size={14} /> Цртај
              </button>
          </div>
      );
  };

  const renderContent = (expanded: boolean) => (
    <div className={`flex flex-col items-center bg-white p-6 rounded-[2.5rem] shadow-xl border border-slate-100 w-full ${expanded ? 'h-full justify-center max-w-4xl' : 'max-w-xl'}`}>
      
      <div className="w-full flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
          <div className="flex flex-col items-start gap-1">
              <h3 className="text-xl font-extrabold text-slate-800 hidden sm:block">Лабораторија</h3>
              {renderToolbar()}
          </div>
          <div className="flex gap-2">
            {hasDrawingFeatures && (
                <button onClick={resetDrawing} className="p-3 bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-2xl transition" title="Избриши линии">
                    <RotateCcw size={20} />
                </button>
            )}
            <button onClick={toggleExpand} className="p-3 bg-slate-50 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-2xl transition" title={expanded ? "Намали" : "Зголеми"}>
                {expanded ? <Minimize2 size={24} /> : <Maximize2 size={20} />}
            </button>
          </div>
      </div>
      
      <div className="w-full mb-3 text-center">
          <span className="inline-block px-4 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold">
            {moduleId === ModuleId.EXISTENCE ? '👉 Влечи ги круговите за да ги споиш линиите.' 
             : tool === 'MOVE' ? '👉 Фати ги темињата и влечи.' 
             : '✏️ Кликни на означените точки за да црташ.'}
          </span>
      </div>

      <div className={`relative w-full ${expanded ? 'flex-1 min-h-0' : 'aspect-square'}`}>
        <svg 
            ref={svgRef}
            viewBox="0 0 400 400" 
            className={`w-full h-full bg-slate-50 rounded-3xl touch-none border-2 border-slate-200 select-none ${tool === 'DRAW' ? 'cursor-default' : 'cursor-default'}`}
            onMouseMove={handleMouseMove}
            onTouchMove={handleTouchMove}
        >
            <defs>
                <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                    <circle cx="2" cy="2" r="1" fill="#cbd5e1" />
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

                    {isTriangleFormed && (
                        <path d={`M ${existBaseA.x} ${existBaseA.y} L ${existBaseB.x} ${existBaseB.y} L ${tipLeft.x} ${tipLeft.y} Z`} fill="rgba(34, 197, 94, 0.2)" stroke="none" className="animate-fade-in" />
                    )}

                    <g>
                        <line x1={existBaseA.x} y1={existBaseA.y} x2={tipLeft.x} y2={tipLeft.y} stroke="#3b82f6" strokeWidth="4" strokeLinecap="round" />
                        <circle cx={tipLeft.x} cy={tipLeft.y} r="12" fill={isTriangleFormed ? "#22c55e" : "#3b82f6"} stroke="white" strokeWidth="2" style={{ cursor: 'pointer' }} onMouseDown={handleMouseDown('ARM_LEFT')} onTouchStart={handleTouchStart('ARM_LEFT')} />
                        <text x={(existBaseA.x + tipLeft.x)/2 - 10} y={(existBaseA.y + tipLeft.y)/2 - 10} className="text-xs font-bold fill-blue-600">b</text>
                    </g>

                    <g>
                        <line x1={existBaseB.x} y1={existBaseB.y} x2={tipRight.x} y2={tipRight.y} stroke="#ef4444" strokeWidth="4" strokeLinecap="round" />
                        <circle cx={tipRight.x} cy={tipRight.y} r="12" fill={isTriangleFormed ? "#22c55e" : "#ef4444"} stroke="white" strokeWidth="2" style={{ cursor: 'pointer' }} onMouseDown={handleMouseDown('ARM_RIGHT')} onTouchStart={handleTouchStart('ARM_RIGHT')} />
                        <text x={(existBaseB.x + tipRight.x)/2 + 10} y={(existBaseB.y + tipRight.y)/2 - 10} className="text-xs font-bold fill-red-600">a</text>
                    </g>
                </g>
            ) : (
            <>
            {moduleId !== ModuleId.EXISTENCE && moduleId !== ModuleId.SIDE_ANGLE_RELATION && (
                <path d={`M ${points.A.x} ${points.A.y} L ${points.B.x} ${points.B.y} L ${points.C.x} ${points.C.y} Z`} fill="rgba(14, 165, 233, 0.1)" stroke="#0ea5e9" strokeWidth="3" />
            )}

            {/* Default Internal Angles (Except for modules that override them) */}
            {moduleId !== ModuleId.MIDDLE_LINE && moduleId !== ModuleId.CENTROID && moduleId !== ModuleId.ORTHOCENTER && moduleId !== ModuleId.CIRCUMCIRCLE && moduleId !== ModuleId.INCIRCLE && moduleId !== ModuleId.EXISTENCE && moduleId !== ModuleId.SIDE_ANGLE_RELATION && moduleId !== ModuleId.EXTERNAL_ANGLES && (
                <g className="pointer-events-none select-none">
                    <text x={labelPosA.x} y={labelPosA.y} textAnchor="middle" fill="#0284c7" className="text-sm font-black drop-shadow-sm bg-white/50">{Math.round(angleA)}°</text>
                    <text x={labelPosB.x} y={labelPosB.y} textAnchor="middle" fill="#0284c7" className="text-sm font-black drop-shadow-sm bg-white/50">{Math.round(angleB)}°</text>
                    <text x={labelPosC.x} y={labelPosC.y} textAnchor="middle" fill="#0284c7" className="text-sm font-black drop-shadow-sm bg-white/50">{Math.round(angleC)}°</text>
                </g>
            )}

            {/* External Angles Specific Logic */}
            {moduleId === ModuleId.EXTERNAL_ANGLES && (
                 <g className="pointer-events-none">
                     {/* Dashed Extension Lines */}
                     <line x1={points.C.x} y1={points.C.y} x2={extPointA.x} y2={extPointA.y} stroke="#94a3b8" strokeWidth="2" strokeDasharray="5,5" />
                     <line x1={points.A.x} y1={points.A.y} x2={extPointB.x} y2={extPointB.y} stroke="#94a3b8" strokeWidth="2" strokeDasharray="5,5" />
                     <line x1={points.B.x} y1={points.B.y} x2={extPointC.x} y2={extPointC.y} stroke="#94a3b8" strokeWidth="2" strokeDasharray="5,5" />

                     {/* External Angle Wedges (Visualized between Side and Extension of other side) */}
                     {/* Angle at A: Between AB and Ext(CA) */}
                     <path d={getSector(points.A, points.B, extPointA, 40)} fill="rgba(239, 68, 68, 0.2)" stroke="#ef4444" strokeWidth="2" />
                     <text x={getExternalLabelPos(points.A, points.B, extPointA).x} y={getExternalLabelPos(points.A, points.B, extPointA).y} textAnchor="middle" fill="#ef4444" className="text-sm font-black drop-shadow-sm bg-white/80 rounded-full px-1">{Math.round(extAngleA)}°</text>

                     {/* Angle at B: Between BC and Ext(AB) */}
                     <path d={getSector(points.B, points.C, extPointB, 40)} fill="rgba(59, 130, 246, 0.2)" stroke="#3b82f6" strokeWidth="2" />
                     <text x={getExternalLabelPos(points.B, points.C, extPointB).x} y={getExternalLabelPos(points.B, points.C, extPointB).y} textAnchor="middle" fill="#3b82f6" className="text-sm font-black drop-shadow-sm bg-white/80 rounded-full px-1">{Math.round(extAngleB)}°</text>
                     
                     {/* Angle at C: Between CA and Ext(BC) */}
                     <path d={getSector(points.C, points.A, extPointC, 40)} fill="rgba(34, 197, 94, 0.2)" stroke="#22c55e" strokeWidth="2" />
                     <text x={getExternalLabelPos(points.C, points.A, extPointC).x} y={getExternalLabelPos(points.C, points.A, extPointC).y} textAnchor="middle" fill="#22c55e" className="text-sm font-black drop-shadow-sm bg-white/80 rounded-full px-1">{Math.round(extAngleC)}°</text>
                 </g>
            )}

            {/* Visuals omitted for brevity, logic identical to previous, just wrapped in <> */}
            {moduleId === ModuleId.SIDE_ANGLE_RELATION && (
                <g className="pointer-events-none">
                    <path d={`M ${points.A.x} ${points.A.y} L ${points.B.x} ${points.B.y} L ${points.C.x} ${points.C.y} Z`} fill="rgba(241, 245, 249, 0.5)" stroke="none" />
                    <line x1={points.B.x} y1={points.B.y} x2={points.C.x} y2={points.C.y} stroke={getColor(0)} strokeWidth="4" strokeLinecap="round" />
                    <line x1={points.A.x} y1={points.A.y} x2={points.C.x} y2={points.C.y} stroke={getColor(1)} strokeWidth="4" strokeLinecap="round" />
                    <line x1={points.A.x} y1={points.A.y} x2={points.B.x} y2={points.B.y} stroke={getColor(2)} strokeWidth="4" strokeLinecap="round" />
                    <path d={getSector(points.A, points.B, points.C, 40)} fill={getColor(0)} stroke="white" strokeWidth="2" fillOpacity="1" />
                    <text x={points.A.x} y={points.A.y - 10} textAnchor="middle" fill={getColor(0)} className="text-sm font-black">α</text>
                    <path d={getSector(points.B, points.C, points.A, 40)} fill={getColor(1)} stroke="white" strokeWidth="2" fillOpacity="1" />
                    <text x={points.B.x - 15} y={points.B.y} textAnchor="middle" fill={getColor(1)} className="text-sm font-black">β</text>
                    <path d={getSector(points.C, points.A, points.B, 40)} fill={getColor(2)} stroke="white" strokeWidth="2" fillOpacity="1" />
                    <text x={points.C.x + 15} y={points.C.y} textAnchor="middle" fill={getColor(2)} className="text-sm font-black">γ</text>
                </g>
            )}

            {/* Middle Line */}
            {moduleId === ModuleId.MIDDLE_LINE && (
                <g>
                    {/* The Line */}
                    <line x1={midAC.x} y1={midAC.y} x2={midBC.x} y2={midBC.y} stroke="#ef4444" strokeWidth="4" />
                    
                    {/* Endpoints */}
                    <circle cx={midAC.x} cy={midAC.y} r="6" fill="#ef4444" stroke="white" strokeWidth="2"/>
                    <circle cx={midBC.x} cy={midBC.y} r="6" fill="#ef4444" stroke="white" strokeWidth="2"/>
                    
                    {/* Labels M and N */}
                    <text x={midAC.x - 15} y={midAC.y - 15} className="font-bold fill-red-600">M</text>
                    <text x={midBC.x + 15} y={midBC.y - 15} className="font-bold fill-red-600">N</text>

                    {/* Length Labels */}
                    {/* Middle Line Length */}
                    <rect x={(midAC.x + midBC.x)/2 - 20} y={(midAC.y + midBC.y)/2 - 25} width="40" height="20" rx="4" fill="white" fillOpacity="0.8"/>
                    <text x={(midAC.x + midBC.x)/2} y={(midAC.y + midBC.y)/2 - 10} textAnchor="middle" className="text-xs font-bold fill-red-600">{valMN}</text>

                    {/* Base AB Length */}
                    <rect x={(points.A.x + points.B.x)/2 - 20} y={(points.A.y + points.B.y)/2 + 10} width="40" height="20" rx="4" fill="white" fillOpacity="0.8"/>
                    <text x={(points.A.x + points.B.x)/2} y={(points.A.y + points.B.y)/2 + 25} textAnchor="middle" className="text-xs font-bold fill-blue-600">{valAB}</text>
                </g>
            )}

            {/* Centroid */}
            {moduleId === ModuleId.CENTROID && (
                <g>
                    {drawnMedians.A && <line x1={points.A.x} y1={points.A.y} x2={midBC.x} y2={midBC.y} stroke="#cbd5e1" strokeWidth="2" strokeDasharray="5,3" />}
                    {drawnMedians.B && <line x1={points.B.x} y1={points.B.y} x2={midAC.x} y2={midAC.y} stroke="#cbd5e1" strokeWidth="2" strokeDasharray="5,3" />}
                    {drawnMedians.C && <line x1={points.C.x} y1={points.C.y} x2={midAB.x} y2={midAB.y} stroke="#cbd5e1" strokeWidth="2" strokeDasharray="5,3" />}
                    
                    {tool === 'DRAW' && [{ pt: midBC, id: 'A' }, { pt: midAC, id: 'B' }, { pt: midAB, id: 'C' }].map((m) => (
                        (!drawnMedians.A || !drawnMedians.B || !drawnMedians.C) && (
                        <g key={m.id} onClick={handleTargetClick(m.id as 'A'|'B'|'C')} style={{ cursor: 'pointer' }}>
                             {drawSelection === m.id && !drawnMedians[m.id as 'A'|'B'|'C'] && <circle cx={m.pt.x} cy={m.pt.y} r="14" fill="#22c55e" fillOpacity="0.5" className="animate-pulse" />}
                        </g>)
                    ))}

                    {drawnMedians.A && drawnMedians.B && drawnMedians.C && (
                        <g>
                            <circle cx={centroid.x} cy={centroid.y} r="10" fill="#1e293b" stroke="white" strokeWidth="2" />
                            <text x={centroid.x} y={centroid.y} dy=".3em" textAnchor="middle" className="text-[10px] font-bold fill-white">T</text>
                            
                            {/* Label A1 at midBC if median A is drawn */}
                            {drawnMedians.A && (
                                <text x={midBC.x + 10} y={midBC.y + 10} className="text-xs font-bold fill-slate-500">A₁</text>
                            )}
                        </g>
                    )}
                </g>
            )}

            {/* Orthocenter */}
            {moduleId === ModuleId.ORTHOCENTER && (
                <g>
                    {tool === 'DRAW' && [{ pt: altFootA, id: 'A' }, { pt: altFootB, id: 'B' }, { pt: altFootC, id: 'C' }].map((m) => (
                         (!drawnAltitudes.A || !drawnAltitudes.B || !drawnAltitudes.C) && (
                        <g key={m.id} onClick={handleTargetClick(m.id as 'A'|'B'|'C')} style={{ cursor: 'pointer' }}>
                            {drawSelection === m.id && !drawnAltitudes[m.id as 'A'|'B'|'C'] && <rect x={m.pt.x - 8} y={m.pt.y - 8} width="16" height="16" fill="#8b5cf6" fillOpacity="0.5" className="animate-pulse" />}
                        </g>)
                    ))}
                    
                    {/* Render each drawn altitude individually */}
                    {[
                      { drawn: drawnAltitudes.A, start: points.A, foot: altFootA, baseStart: points.B, baseEnd: points.C },
                      { drawn: drawnAltitudes.B, start: points.B, foot: altFootB, baseStart: points.A, baseEnd: points.C },
                      { drawn: drawnAltitudes.C, start: points.C, foot: altFootC, baseStart: points.A, baseEnd: points.B }
                    ].map((alt, idx) => alt.drawn && (
                         <g key={idx}>
                             {/* The Altitude */}
                             <line x1={alt.start.x} y1={alt.start.y} x2={alt.foot.x} y2={alt.foot.y} stroke="#8b5cf6" strokeWidth="2" />
                             
                             {/* Right Angle Marker */}
                             <path d={getRightAnglePath(alt.foot, alt.start, alt.baseStart, alt.baseEnd)} fill="none" stroke="#8b5cf6" strokeWidth="1.5" />
                             
                             {/* Side Extension for Obtuse angles */}
                             {alt.foot.t < 0 && (
                                 <line x1={alt.baseStart.x} y1={alt.baseStart.y} x2={alt.foot.x} y2={alt.foot.y} stroke="#94a3b8" strokeWidth="2" strokeDasharray="4,4" />
                             )}
                             {alt.foot.t > 1 && (
                                 <line x1={alt.baseEnd.x} y1={alt.baseEnd.y} x2={alt.foot.x} y2={alt.foot.y} stroke="#94a3b8" strokeWidth="2" strokeDasharray="4,4" />
                             )}
                         </g>
                    ))}

                    {/* Orthocenter Point - visible when all 3 drawn */}
                    {drawnAltitudes.A && drawnAltitudes.B && drawnAltitudes.C && (
                        <g>
                            {/* Dashed lines from vertices to Orthocenter if outside */}
                            {/* We just draw full lines intersection, but visually we might need extensions if outside */}
                            {/* The dashed lines to intersection point are helpful for visual completion */}
                            <line x1={altFootA.x} y1={altFootA.y} x2={orthocenter.x} y2={orthocenter.y} stroke="#8b5cf6" strokeWidth="1" strokeDasharray="4,4" opacity="0.5" />
                            <line x1={altFootB.x} y1={altFootB.y} x2={orthocenter.x} y2={orthocenter.y} stroke="#8b5cf6" strokeWidth="1" strokeDasharray="4,4" opacity="0.5" />
                            <line x1={altFootC.x} y1={altFootC.y} x2={orthocenter.x} y2={orthocenter.y} stroke="#8b5cf6" strokeWidth="1" strokeDasharray="4,4" opacity="0.5" />
                            
                            <circle cx={orthocenter.x} cy={orthocenter.y} r="10" fill="#5b21b6" stroke="white" strokeWidth="2" />
                            <text x={orthocenter.x} y={orthocenter.y} dy=".3em" textAnchor="middle" className="text-[10px] font-bold fill-white">H</text>
                        </g>
                    )}
                </g>
            )}
            
            {/* Circumcircle */}
            {moduleId === ModuleId.CIRCUMCIRCLE && (
                <g>
                    {tool === 'DRAW' && [{ pt: midBC, id: 'A' }, { pt: midAC, id: 'B' }, { pt: midAB, id: 'C' }].map((m) => (
                        !drawnBisectors[m.id as 'A'|'B'|'C'] && (
                        <g key={m.id} onClick={handleBisectorClick(m.id as 'A'|'B'|'C')} style={{ cursor: 'pointer' }}>
                            <circle cx={m.pt.x} cy={m.pt.y} r="8" fill="#06b6d4" className="animate-pulse" />
                        </g>)
                    ))}
                    {drawnBisectors.A && <line x1={pbBC.x1} y1={pbBC.y1} x2={pbBC.x2} y2={pbBC.y2} stroke="#06b6d4" strokeWidth="1" strokeDasharray="4,4" />}
                    {drawnBisectors.B && <line x1={pbAC.x1} y1={pbAC.y1} x2={pbAC.x2} y2={pbAC.y2} stroke="#06b6d4" strokeWidth="1" strokeDasharray="4,4" />}
                    {drawnBisectors.C && <line x1={pbAB.x1} y1={pbAB.y1} x2={pbAB.x2} y2={pbAB.y2} stroke="#06b6d4" strokeWidth="1" strokeDasharray="4,4" />}
                    {drawnBisectors.A && drawnBisectors.B && drawnBisectors.C && (
                        <g>
                            <circle cx={circumcenter.x} cy={circumcenter.y} r={circumRadius} fill="none" stroke="#06b6d4" strokeWidth="3" opacity="0.5" />
                            <circle cx={circumcenter.x} cy={circumcenter.y} r="10" fill="black" stroke="white" strokeWidth="2" />
                            <text x={circumcenter.x} y={circumcenter.y} dy=".3em" textAnchor="middle" className="text-[10px] font-bold fill-white">O</text>
                        </g>
                    )}
                </g>
            )}

            {/* Incircle */}
            {moduleId === ModuleId.INCIRCLE && (
                <g>
                     {/* 1. Render Angle Bisector Lines */}
                     {drawnAngleBisectors.A && <line x1={points.A.x} y1={points.A.y} x2={bisectFootA.x} y2={bisectFootA.y} stroke="#f97316" strokeWidth="2" strokeDasharray="5,5" />}
                     {drawnAngleBisectors.B && <line x1={points.B.x} y1={points.B.y} x2={bisectFootB.x} y2={bisectFootB.y} stroke="#f97316" strokeWidth="2" strokeDasharray="5,5" />}
                     {drawnAngleBisectors.C && <line x1={points.C.x} y1={points.C.y} x2={bisectFootC.x} y2={bisectFootC.y} stroke="#f97316" strokeWidth="2" strokeDasharray="5,5" />}

                     {/* 2. Render Interactive Angle Arcs */}
                     {tool === 'DRAW' && (
                        <g>
                            {/* Arc A */}
                            <path 
                                d={getSector(points.A, points.B, points.C, 50)} 
                                fill={drawnAngleBisectors.A ? "rgba(249, 115, 22, 0.4)" : "rgba(249, 115, 22, 0.1)"}
                                stroke="#f97316" strokeWidth={drawnAngleBisectors.A ? 3 : 1}
                                className="cursor-pointer hover:fill-orange-200 transition-all"
                                onClick={(e) => { e.stopPropagation(); setDrawnAngleBisectors(p => ({...p, A: !p.A})); }}
                            />
                            {/* Arc B */}
                            <path 
                                d={getSector(points.B, points.C, points.A, 50)} 
                                fill={drawnAngleBisectors.B ? "rgba(249, 115, 22, 0.4)" : "rgba(249, 115, 22, 0.1)"}
                                stroke="#f97316" strokeWidth={drawnAngleBisectors.B ? 3 : 1}
                                className="cursor-pointer hover:fill-orange-200 transition-all"
                                onClick={(e) => { e.stopPropagation(); setDrawnAngleBisectors(p => ({...p, B: !p.B})); }}
                            />
                            {/* Arc C */}
                            <path 
                                d={getSector(points.C, points.A, points.B, 50)} 
                                fill={drawnAngleBisectors.C ? "rgba(249, 115, 22, 0.4)" : "rgba(249, 115, 22, 0.1)"}
                                stroke="#f97316" strokeWidth={drawnAngleBisectors.C ? 3 : 1}
                                className="cursor-pointer hover:fill-orange-200 transition-all"
                                onClick={(e) => { e.stopPropagation(); setDrawnAngleBisectors(p => ({...p, C: !p.C})); }}
                            />
                        </g>
                     )}

                     {/* 3. Incircle + Center V (Only when all 3 are drawn) */}
                     {drawnAngleBisectors.A && drawnAngleBisectors.B && drawnAngleBisectors.C && (
                        <g className="animate-fade-in">
                            <circle cx={incenter.x} cy={incenter.y} r={inradius} fill="rgba(249, 115, 22, 0.05)" stroke="#f97316" strokeWidth="2" />
                            <circle cx={incenter.x} cy={incenter.y} r="10" fill="black" stroke="white" strokeWidth="2" />
                            <text x={incenter.x} y={incenter.y} dy=".3em" textAnchor="middle" className="text-[10px] font-bold fill-white">V</text>
                        </g>
                    )}
                </g>
            )}

            {(Object.entries(points) as [string, Point][]).map(([key, p]) => (
                <g key={key}>
                    <circle cx={p.x} cy={p.y} r="30" fill="transparent" 
                        onMouseDown={handleMouseDown(key as any)} onTouchStart={handleTouchStart(key as any)}
                        onClick={handleVertexClick(key as any)} style={{ cursor: tool === 'MOVE' ? 'move' : 'pointer' }} />
                    <circle cx={p.x} cy={p.y} r={drawSelection === key ? 14 : 10} 
                        fill={drawSelection === key ? '#f59e0b' : '#0ea5e9'} stroke="white" strokeWidth="3" className="shadow-sm" style={{ pointerEvents: 'none' }} />
                    <text x={p.x} y={p.y} dy=".3em" textAnchor="middle" className="text-xs font-bold fill-white pointer-events-none">{key}</text>
                </g>
            ))}
            </>
            )}
        </svg>
      </div>

      {/* Info Cards */}
      <div className="mt-6 w-full">
         {moduleId === ModuleId.TYPES && (
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-purple-50 p-3 rounded-2xl text-center border border-purple-100">
                    <p className="text-xs font-bold text-purple-400 uppercase">Страни</p>
                    <p className={`text-lg font-black ${typeColor}`}>{isEquilateral ? 'Рамностран' : isIsosceles ? 'Рамнокрак' : 'Разностран'}</p>
                </div>
                <div className="bg-emerald-50 p-3 rounded-2xl text-center border border-emerald-100">
                    <p className="text-xs font-bold text-emerald-400 uppercase">Агли</p>
                    <p className={`text-lg font-black ${angleTypeColor}`}>{isRight ? 'Правоаголен' : isObtuse ? 'Тапоаголен' : 'Остроаголен'}</p>
                </div>
            </div>
        )}
        
        {/* Dynamic Sum Window for Internal Angles */}
        {moduleId === ModuleId.INTERNAL_ANGLES && (
            <div className="bg-blue-600 text-white p-4 rounded-2xl shadow-lg border-2 border-blue-400/30 flex items-center justify-center gap-4 animate-fade-in">
                <div className="flex items-center gap-2 text-xl md:text-2xl font-black font-mono">
                    <span>{Math.round(angleA)}°</span>
                    <span className="text-blue-300">+</span>
                    <span>{Math.round(angleB)}°</span>
                    <span className="text-blue-300">+</span>
                    <span>{Math.round(angleC)}°</span>
                    <span className="text-blue-300">=</span>
                    <span className="text-yellow-300">{Math.round(angleA + angleB + angleC)}°</span>
                </div>
            </div>
        )}

        {/* Dynamic Sum Window for External Angles */}
        {moduleId === ModuleId.EXTERNAL_ANGLES && (
            <div className="bg-amber-600 text-white p-4 rounded-2xl shadow-lg border-2 border-amber-400/30 flex flex-col md:flex-row items-center justify-center gap-2 md:gap-4 animate-fade-in">
                <div className="text-amber-100 text-xs font-bold uppercase tracking-widest mb-1 md:mb-0">Збир на надворешни агли</div>
                <div className="flex items-center gap-2 text-xl md:text-2xl font-black font-mono">
                    <span className="text-red-200">{Math.round(extAngleA)}°</span>
                    <span className="text-amber-300">+</span>
                    <span className="text-blue-200">{Math.round(extAngleB)}°</span>
                    <span className="text-amber-300">+</span>
                    <span className="text-green-200">{Math.round(extAngleC)}°</span>
                    <span className="text-amber-300">=</span>
                    <span className="text-yellow-300">{Math.round(extAngleA + extAngleB + extAngleC)}°</span>
                </div>
            </div>
        )}

        {/* Dynamic Window for Middle Line */}
        {moduleId === ModuleId.MIDDLE_LINE && (
            <div className="bg-indigo-600 text-white p-4 rounded-2xl shadow-lg border-2 border-indigo-400/30 flex flex-col md:flex-row items-center justify-center gap-2 md:gap-4 animate-fade-in">
               <div className="text-indigo-100 text-xs font-bold uppercase tracking-widest mb-1 md:mb-0 mr-2">Својство на средна линија</div>
               <div className="flex items-center gap-3 text-xl md:text-2xl font-black font-mono">
                  {/* MN with overline */}
                  <span className="overline decoration-2 decoration-white/50">MN</span>
                  
                  <span>=</span>
                  
                  {/* AB / 2 Fraction */}
                  <div className="flex flex-col items-center justify-center leading-none">
                      <span className="text-indigo-200 overline decoration-2 decoration-indigo-200/50 border-b-2 border-white/40 pb-1 mb-1 px-1">AB</span>
                      <span className="text-lg">2</span>
                  </div>

                  <span>=</span>

                  {/* Value / 2 Fraction */}
                  <div className="flex flex-col items-center justify-center leading-none">
                      <span className="text-blue-300 border-b-2 border-white/40 pb-1 mb-1 px-1">{valAB}</span>
                      <span className="text-lg">2</span>
                  </div>

                  <span>=</span>

                  <span className="text-yellow-300">{valMN}</span>
               </div>
            </div>
        )}

        {/* Dynamic Window for Centroid */}
        {moduleId === ModuleId.CENTROID && (
            <div className="bg-rose-600 text-white p-4 rounded-2xl shadow-lg border-2 border-rose-400/30 flex flex-col md:flex-row items-center justify-center gap-2 md:gap-4 animate-fade-in">
               <div className="text-rose-100 text-xs font-bold uppercase tracking-widest mb-1 md:mb-0 mr-2">Својство на тежиште</div>
               <div className="flex items-center gap-3 text-xl md:text-2xl font-black font-mono">
                  {/* AT : TA1 */}
                  <span className="overline decoration-2 decoration-white/50">AT</span>
                  <span>:</span>
                  <span className="overline decoration-2 decoration-white/50">TA₁</span>
                  
                  <span>=</span>
                  <span className="text-rose-200">{valAT}</span>
                  <span>:</span>
                  <span className="text-rose-200">{valTA1}</span>

                  <span>=</span>
                  <span className="text-yellow-300">2 : 1</span>
               </div>
            </div>
        )}

        {/* Dynamic Window for Existence */}
        {moduleId === ModuleId.EXISTENCE && (
            <div className="bg-teal-600 text-white p-4 rounded-2xl shadow-lg border-2 border-teal-400/30 flex flex-col items-center justify-center gap-3 animate-fade-in">
                <div className="text-teal-100 text-xs font-bold uppercase tracking-widest mb-1">Неравенство на триаголник</div>
                <div className="flex flex-wrap items-center justify-center gap-2 md:gap-4 text-lg md:text-xl font-black font-mono">
                    {/* |a - b| < c */}
                    <div className="flex items-center gap-1">
                        <span className={`${valExistDiff < valExistC ? 'text-teal-200' : 'text-red-300'}`}>
                            |{valExistA} - {valExistB}|
                        </span>
                        <span className="text-teal-300">&lt;</span>
                        <span className="text-white border-b-2 border-white/30 px-1">{valExistC}</span>
                        <span className="text-teal-300">&lt;</span>
                        {/* c < a + b */}
                        <span className={`${valExistSum > valExistC ? 'text-teal-200' : 'text-red-300'}`}>
                            {valExistA} + {valExistB}
                        </span>
                    </div>
                </div>
                
                {/* Calculated Result Line */}
                <div className="flex items-center gap-3 text-sm md:text-base font-bold font-mono text-teal-100 bg-teal-800/30 px-4 py-2 rounded-xl">
                     <span className={valExistDiff < valExistC ? "text-green-300" : "text-red-300"}>{valExistDiff.toFixed(1)}</span>
                     <span>&lt;</span>
                     <span className="text-white font-black">{valExistC}</span>
                     <span>&lt;</span>
                     <span className={valExistSum > valExistC ? "text-green-300" : "text-red-300"}>{valExistSum.toFixed(1)}</span>
                </div>

                {!canFormTriangle && (
                    <div className="bg-red-500 text-white px-4 py-1.5 rounded-full text-xs font-bold animate-pulse shadow-md mt-1">
                        ⚠️ Не може да се формира триаголник!
                    </div>
                )}
            </div>
        )}

        {/* Dynamic Window for Side Angle Relation */}
        {moduleId === ModuleId.SIDE_ANGLE_RELATION && (
            <div className="bg-slate-800 text-white p-5 rounded-2xl shadow-lg border-2 border-slate-700 flex flex-col gap-3 animate-fade-in w-full">
                <div className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 border-b border-slate-700 pb-2">
                    Врска: Страни vs Агли
                </div>
                {(() => {
                    // Prepare data sorted by size for display
                    const data = [
                        { label: 'a (BC)', angleName: 'α', valSide: sideA, valAngle: angleA, color: getColor(0), idx: 0 },
                        { label: 'b (AC)', angleName: 'β', valSide: sideB, valAngle: angleB, color: getColor(1), idx: 1 },
                        { label: 'c (AB)', angleName: 'γ', valSide: sideC, valAngle: angleC, color: getColor(2), idx: 2 }
                    ].sort((a, b) => b.valSide - a.valSide);

                    const max = data[0];
                    const min = data[2];

                    return (
                        <>
                            {/* Largest Row */}
                            <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-red-900/40 to-slate-800 border border-red-500/30">
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-bold text-red-400 uppercase">Најдолга страна</span>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-xl font-black text-white">{max.label}</span>
                                        <span className="text-sm font-mono text-slate-400 opacity-80">{displayLen(max.valSide)}</span>
                                    </div>
                                </div>
                                <div className="text-red-500 animate-pulse">
                                    <ArrowRight size={24} strokeWidth={3} />
                                </div>
                                <div className="flex flex-col items-end">
                                    <span className="text-[10px] font-bold text-red-400 uppercase">Најголем агол</span>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-sm font-mono text-slate-400 opacity-80">{Math.round(max.valAngle)}°</span>
                                        <span className="text-xl font-black text-white">{max.angleName}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Smallest Row */}
                            <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-blue-900/40 to-slate-800 border border-blue-500/30">
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-bold text-blue-400 uppercase">Најкратка страна</span>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-xl font-black text-white">{min.label}</span>
                                        <span className="text-sm font-mono text-slate-400 opacity-80">{displayLen(min.valSide)}</span>
                                    </div>
                                </div>
                                <div className="text-blue-500 animate-pulse">
                                    <ArrowRight size={24} strokeWidth={3} />
                                </div>
                                <div className="flex flex-col items-end">
                                    <span className="text-[10px] font-bold text-blue-400 uppercase">Најмал агол</span>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-sm font-mono text-slate-400 opacity-80">{Math.round(min.valAngle)}°</span>
                                        <span className="text-xl font-black text-white">{min.angleName}</span>
                                    </div>
                                </div>
                            </div>
                        </>
                    );
                })()}
            </div>
        )}
        
        {/* ... More detailed info cards omitted but structure applies ... */}
      </div>

    </div>
  );

  if (isExpanded) {
     return createPortal(
        <div className="fixed inset-0 z-[2000] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4">
             <div className="absolute top-4 right-4 z-50">
                <button onClick={toggleExpand} className="p-3 bg-white hover:bg-red-50 text-slate-600 hover:text-red-600 rounded-full shadow-lg transition">
                    <X size={24}/>
                </button>
             </div>
             {renderContent(true)}
        </div>,
        document.body
     );
  }

  return <div className="w-full flex justify-center">{renderContent(false)}</div>;
};

export default TriangleVisualizer;
