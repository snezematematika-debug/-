
import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { LessonNode } from '../types';
import { ChevronDown, Circle, ChevronUp, Maximize2, X, Target, Info } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import InternalAnglesAnimation from './InternalAnglesAnimation';
import ExternalAnglesVisuals from './ExternalAnglesVisuals';

interface Props {
  node: LessonNode;
  depth?: number;
}

// Visual Assets for specific Lesson IDs
const TRIANGLE_ASSETS: Record<string, { path: string, viewBox: string, decor?: React.ReactNode }> = {
  // SIDES
  equilateral: {
    viewBox: "0 0 100 100",
    path: "M 50 10 L 90 80 L 10 80 Z",
    decor: (
      <g stroke="#0ea5e9" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
         {/* Tick marks for equal sides */}
         <line x1="28" y1="45" x2="36" y2="40" /> 
         <line x1="64" y1="40" x2="72" y2="45" />
         <line x1="46" y1="84" x2="54" y2="76" />
      </g>
    )
  },
  isosceles: {
    viewBox: "0 0 100 100",
    path: "M 50 10 L 75 90 L 25 90 Z",
    decor: (
      <g stroke="#0ea5e9" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
         {/* Tick marks for legs */}
         <line x1="34" y1="50" x2="42" y2="46" />
         <line x1="58" y1="46" x2="66" y2="50" />
      </g>
    )
  },
  scalene: {
    viewBox: "0 0 100 100",
    path: "M 20 20 L 90 90 L 10 90 Z",
    decor: null
  },
  // ANGLES
  right: {
    viewBox: "0 0 100 100",
    path: "M 20 20 L 20 80 L 80 80 Z",
    decor: (
       <path d="M 20 70 L 30 70 L 30 80" fill="none" stroke="#0ea5e9" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
    )
  },
  acute: {
    viewBox: "0 0 100 100",
    path: "M 50 15 L 85 85 L 15 85 Z", // Standard acute
    decor: (
      <g strokeLinecap="round" strokeLinejoin="round">
        <path d="M 45 25 A 10 10 0 0 1 55 25" fill="none" stroke="#0ea5e9" strokeWidth="2" />
        <path d="M 23 78 A 10 10 0 0 1 30 75" fill="none" stroke="#0ea5e9" strokeWidth="2" />
        <path d="M 70 75 A 10 10 0 0 1 77 78" fill="none" stroke="#0ea5e9" strokeWidth="2" />
      </g>
    )
  },
  obtuse: {
    viewBox: "0 0 100 100",
    path: "M 25 80 L 90 80 L 5 30 Z", // Corrected Obtuse (Angle > 90)
    decor: (
       <path d="M 40 80 A 15 15 0 0 0 20 66" fill="none" stroke="#0ea5e9" strokeWidth="2" strokeDasharray="3" strokeLinecap="round" strokeLinejoin="round" />
    )
  },
  // MIDDLE LINE
  mid_def: {
    viewBox: "0 0 100 100",
    path: "M 50 15 L 90 85 L 10 85 Z",
    decor: (
       <g>
          {/* Points */}
          <circle cx="30" cy="50" r="4" fill="#ef4444" />
          <circle cx="70" cy="50" r="4" fill="#ef4444" />
          {/* Line */}
          <line x1="30" y1="50" x2="70" y2="50" stroke="#ef4444" strokeWidth="3" />
          <text x="30" y="42" textAnchor="middle" className="text-[12px] fill-red-700 font-extrabold">D</text>
          <text x="70" y="42" textAnchor="middle" className="text-[12px] fill-red-700 font-extrabold">E</text>
          {/* Vertices */}
          <text x="50" y="10" textAnchor="middle" className="text-[10px] font-bold fill-slate-500">C</text>
          <text x="5" y="90" className="text-[10px] font-bold fill-slate-500">A</text>
          <text x="95" y="90" textAnchor="end" className="text-[10px] font-bold fill-slate-500">B</text>
       </g>
    )
  },
  prop_parallel: {
    viewBox: "0 0 100 100",
    path: "M 50 15 L 90 85 L 10 85 Z",
    decor: (
      <g>
         <line x1="30" y1="50" x2="70" y2="50" stroke="#ef4444" strokeWidth="3" />
         {/* Vertices */}
         <text x="50" y="10" textAnchor="middle" className="text-[10px] font-bold fill-slate-500">C</text>
         <text x="5" y="90" className="text-[10px] font-bold fill-slate-500">A</text>
         <text x="95" y="90" textAnchor="end" className="text-[10px] font-bold fill-slate-500">B</text>
      </g>
    )
  },
  prop_length: {
    viewBox: "0 0 100 100",
    path: "M 50 15 L 90 85 L 10 85 Z",
    decor: (
      <g>
         <line x1="30" y1="50" x2="70" y2="50" stroke="#ef4444" strokeWidth="3" />
         <text x="50" y="45" textAnchor="middle" className="text-[10px] fill-red-700 font-extrabold">a/2</text>
         <text x="50" y="95" textAnchor="middle" className="text-[10px] fill-blue-700 font-extrabold">a</text>
         {/* Vertices */}
         <text x="50" y="10" textAnchor="middle" className="text-[10px] font-bold fill-slate-500">C</text>
         <text x="5" y="90" className="text-[10px] font-bold fill-slate-500">A</text>
         <text x="95" y="90" textAnchor="end" className="text-[10px] font-bold fill-slate-500">B</text>
      </g>
    )
  },
  // CENTROID
  cent_def: {
    viewBox: "0 0 100 100",
    path: "M 50 15 L 90 85 L 10 85 Z",
    decor: (
      <g>
         {/* Median from top */}
         <line x1="50" y1="15" x2="50" y2="85" stroke="#ef4444" strokeWidth="3" />
         <circle cx="50" cy="85" r="3" fill="white" stroke="#ef4444" />
      </g>
    )
  },
  cent_point: {
    viewBox: "0 0 100 100",
    path: "M 50 15 L 90 85 L 10 85 Z",
    decor: (
      <g>
         {/* All 3 Medians */}
         <line x1="50" y1="15" x2="50" y2="85" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="3" />
         <line x1="10" y1="85" x2="70" y2="50" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="3" />
         <line x1="90" y1="85" x2="30" y2="50" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="3" />
         {/* Centroid */}
         <circle cx="50" cy="61.6" r="4" fill="#ef4444" stroke="white" />
         <text x="56" y="58" className="text-[12px] font-extrabold fill-red-700">T</text>
      </g>
    )
  },
  cent_ratio: {
    viewBox: "0 0 100 100",
    path: "M 50 15 L 90 85 L 10 85 Z",
    decor: (
      <g>
         {/* One Median emphasized */}
         <line x1="50" y1="15" x2="50" y2="85" stroke="#ef4444" strokeWidth="3" />
         <circle cx="50" cy="61.6" r="4" fill="white" stroke="#ef4444" strokeWidth="2" />
         {/* Braces or labels */}
         <text x="58" y="40" className="text-[10px] font-extrabold fill-red-700">2x</text>
         <text x="58" y="75" className="text-[10px] font-extrabold fill-red-700">x</text>
      </g>
    )
  },
  // ORTHOCENTER
  ortho_def: {
    viewBox: "0 0 100 100",
    path: "M 50 15 L 90 85 L 10 85 Z",
    decor: (
      <g>
         <line x1="50" y1="15" x2="50" y2="85" stroke="#8b5cf6" strokeWidth="3" />
         {/* Right Angle Marker */}
         <path d="M 50 78 L 57 78 L 57 85" fill="none" stroke="#8b5cf6" strokeWidth="1.5" />
         <text x="65" y="75" className="text-[10px] font-extrabold fill-violet-800">90°</text>
      </g>
    )
  },
  ortho_point: {
    viewBox: "0 0 100 100",
    path: "M 50 15 L 90 85 L 10 85 Z",
    decor: (
      <g>
         {/* Altitudes */}
         <line x1="50" y1="15" x2="50" y2="85" stroke="#8b5cf6" strokeWidth="1.5" strokeDasharray="3" />
         <line x1="10" y1="85" x2="80" y2="32.5" stroke="#8b5cf6" strokeWidth="1.5" strokeDasharray="3" />
         <line x1="90" y1="85" x2="20" y2="32.5" stroke="#8b5cf6" strokeWidth="1.5" strokeDasharray="3" />
         {/* H */}
         <circle cx="50" cy="55" r="4" fill="#8b5cf6" stroke="white" />
         <text x="56" y="52" className="text-[12px] font-extrabold fill-violet-800">H</text>
      </g>
    )
  },
  // CIRCUMCIRCLE
  circum_def: {
    viewBox: "0 0 100 100",
    path: "M 50 15 L 90 85 L 10 85 Z",
    decor: (
      <g>
         {/* Circle passing through points. 
             Circumcenter calculation for (50,15), (90,85), (10,85):
             Center = (50, 61.43), Radius = 46.43
         */}
         <circle cx="50" cy="61.43" r="46.43" fill="none" stroke="#06b6d4" strokeWidth="3" />
         <circle cx="50" cy="15" r="3" fill="#06b6d4" />
         <circle cx="90" cy="85" r="3" fill="#06b6d4" />
         <circle cx="10" cy="85" r="3" fill="#06b6d4" />
      </g>
    )
  },
  circum_const: {
    viewBox: "0 0 100 100",
    path: "M 50 15 L 90 85 L 10 85 Z",
    decor: (
      <g>
         {/* Perpendicular Bisectors */}
         <line x1="50" y1="61.43" x2="50" y2="95" stroke="#06b6d4" strokeWidth="1.5" strokeDasharray="3" />
         <line x1="50" y1="61.43" x2="10" y2="25" stroke="#06b6d4" strokeWidth="1.5" strokeDasharray="3" />
         <line x1="50" y1="61.43" x2="90" y2="25" stroke="#06b6d4" strokeWidth="1.5" strokeDasharray="3" />
         
         <circle cx="50" cy="61.43" r="4" fill="#06b6d4" stroke="white" />
         <text x="56" y="58" className="text-[12px] font-extrabold fill-cyan-800">O</text>
         
         {/* Perpendicular marker on bottom side */}
         <path d="M 48 85 L 48 80 L 52 80 L 52 85" fill="none" stroke="#06b6d4" strokeWidth="1.5" />
      </g>
    )
  },
  circum_pos: {
    viewBox: "0 0 100 100",
    path: "M 20 20 L 20 80 L 80 80 Z", // Right triangle
    decor: (
      <g>
         {/* Center on hypotenuse */}
         <circle cx="50" cy="50" r="4" fill="#06b6d4" stroke="white" />
         <circle cx="50" cy="50" r="42.5" fill="none" stroke="#06b6d4" strokeWidth="2" strokeDasharray="4" />
      </g>
    )
  },
  // INCIRCLE
  incircle_def: {
    viewBox: "0 0 100 100",
    path: "M 50 15 L 90 85 L 10 85 Z",
    decor: (
      <g>
         {/* Precise Incircle: Center(50, 61.8), Radius 23.2 */}
         <circle cx="50" cy="61.8" r="23.2" fill="none" stroke="#f97316" strokeWidth="2.5" />
         <circle cx="50" cy="61.8" r="3" fill="#f97316" />
         <text x="50" y="55" textAnchor="middle" className="text-[10px] font-extrabold fill-orange-800">V</text>
         
         {/* Radius to bottom side */}
         <line x1="50" y1="61.8" x2="50" y2="85" stroke="#f97316" strokeWidth="1.5" />
         <text x="55" y="75" className="text-[10px] font-bold fill-orange-800">r</text>
         
         {/* Right Angle Marker */}
         <path d="M 50 80 L 55 80 L 55 85" fill="none" stroke="#f97316" strokeWidth="1.5" />
      </g>
    )
  },
  incircle_const: {
    viewBox: "0 0 100 100",
    path: "M 50 15 L 90 85 L 10 85 Z",
    decor: (
      <g>
         {/* Angle Bisectors */}
         <line x1="50" y1="15" x2="50" y2="85" stroke="#f97316" strokeWidth="1.5" strokeDasharray="3" />
         <line x1="10" y1="85" x2="70" y2="50" stroke="#f97316" strokeWidth="1.5" strokeDasharray="3" />
         <line x1="90" y1="85" x2="30" y2="50" stroke="#f97316" strokeWidth="1.5" strokeDasharray="3" />
         
         <circle cx="50" cy="61.5" r="4" fill="#f97316" stroke="white" />
         <text x="56" y="60" className="text-[12px] font-extrabold fill-orange-800">V</text>
         
         {/* Radius to bottom */}
         <line x1="50" y1="61.5" x2="50" y2="85" stroke="#f97316" strokeWidth="2" />
         <text x="53" y="75" className="text-[10px] font-extrabold fill-orange-800">r</text>
      </g>
    )
  },
  incircle_pos: {
    viewBox: "0 0 100 100",
    path: "M 50 15 L 90 85 L 10 85 Z", // Generic
    decor: (
      <g>
         {/* Highlight circle inside */}
         <circle cx="50" cy="61.8" r="23.2" fill="rgba(249, 115, 22, 0.2)" stroke="#f97316" strokeWidth="2.5" />
         <circle cx="50" cy="61.8" r="3" fill="#f97316" />
         
         {/* Radius to bottom side */}
         <line x1="50" y1="61.8" x2="50" y2="85" stroke="#f97316" strokeWidth="1.5" />
         <text x="55" y="75" className="text-[10px] font-bold fill-orange-800">r</text>
         
         {/* Right Angle Marker */}
         <path d="M 50 80 L 55 80 L 55 85" fill="none" stroke="#f97316" strokeWidth="1.5" />
      </g>
    )
  },
  // EXISTENCE
  exist_rule: {
    viewBox: "0 0 100 100",
    path: "M 50 20 L 90 80 L 10 80 Z",
    decor: (
      <g>
         <text x="75" y="45" textAnchor="middle" className="text-[10px] font-extrabold fill-blue-800">a</text>
         <text x="25" y="45" textAnchor="middle" className="text-[10px] font-extrabold fill-blue-800">b</text>
         <text x="50" y="90" textAnchor="middle" className="text-[10px] font-extrabold fill-red-700">c</text>
         {/* Visual equation */}
         <text x="50" y="10" textAnchor="middle" className="text-[12px] font-extrabold fill-slate-900">a + b > c</text>
      </g>
    )
  },
  exist_visual: {
    viewBox: "0 0 100 100",
    path: "M 10 80 L 90 80", // Base only
    decor: (
      <g>
         {/* Broken arms */}
         <line x1="10" y1="80" x2="30" y2="50" stroke="#0ea5e9" strokeWidth="3" />
         <line x1="90" y1="80" x2="70" y2="50" stroke="#0ea5e9" strokeWidth="3" />
         <line x1="10" y1="80" x2="90" y2="80" stroke="#ef4444" strokeWidth="3" />
         
         {/* X mark in gap */}
         <path d="M 45 45 L 55 55 M 55 45 L 45 55" stroke="#ef4444" strokeWidth="3" />
         <text x="50" y="65" textAnchor="middle" className="text-[10px] font-extrabold fill-slate-700">Прекратки!</text>
      </g>
    )
  },
  // RELATION
  rel_rule: {
    viewBox: "0 0 100 100",
    path: "M 20 80 L 90 80 L 20 20 Z",
    decor: (
      <g>
         {/* Big Angle - Big Side */}
         <path d="M 20 70 A 10 10 0 0 1 30 80" fill="none" stroke="#ef4444" strokeWidth="3" />
         <line x1="90" y1="80" x2="20" y2="20" stroke="#ef4444" strokeWidth="3" />
         
         {/* Arrow connecting */}
         <path d="M 35 75 Q 50 60 55 50" fill="none" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="3" markerEnd="url(#arrow-red)" />
      </g>
    )
  }
};

const FlowNode: React.FC<Props> = ({ node, depth = 0 }) => {
  const [isOpen, setIsOpen] = useState(depth === 0); // Always open root
  const [isExpanded, setIsExpanded] = useState(false);
  const hasChildren = node.children && node.children.length > 0;
  const nodeRef = useRef<HTMLDivElement>(null);

  const toggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasChildren) {
      const newState = !isOpen;
      setIsOpen(newState);
      
      // Auto-scroll logic to keep context visible
      if (newState && nodeRef.current) {
         setTimeout(() => {
             nodeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'center' });
         }, 300);
      }
    }
  };

  const toggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  // Specific Visualization Logic
  const showIntroDef = node.id === 'intro_def';
  const showInternalSum = node.id === 'sum';
  const showExternalSupp = node.id === 'def';
  const showExternalSum = node.id === 'sum_ext';
  const showExternalTheorem = node.id === 'relation';

  const isInteractive = showIntroDef || showInternalSum || showExternalSupp || showExternalSum || showExternalTheorem;

  // Check for static visual asset
  const visualAsset = TRIANGLE_ASSETS[node.id];

  const isVerticalStack = depth === 0;

  const renderContentBody = (isLarge: boolean) => (
      <>
        {/* Render Static Visuals (Types of Triangles) */}
        {visualAsset && (
            <div className={`mb-6 p-4 bg-white/50 rounded-2xl border border-slate-100/50 backdrop-blur-sm shadow-inner ${isLarge ? 'p-10 mb-12 max-w-2xl mx-auto' : ''}`}>
                <svg viewBox={visualAsset.viewBox} className={`${isLarge ? 'w-full h-64' : 'w-32 h-24'} mx-auto overflow-visible drop-shadow-lg`}>
                    <defs>
                        <marker id="arrow-red" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto" markerUnits="strokeWidth">
                            <path d="M0,0 L0,6 L6,3 z" fill="#ef4444" />
                        </marker>
                    </defs>
                    <path 
                        d={visualAsset.path} 
                        fill={node.id.includes('exist') ? 'none' : "url(#blue-gradient)"} 
                        stroke={node.id === 'exist_visual' ? 'none' : "#0284c7"}
                        strokeWidth="3" 
                        strokeLinejoin="round" 
                        strokeLinecap="round" 
                    />
                     <linearGradient id="blue-gradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#e0f2fe" stopOpacity="0.8"/>
                        <stop offset="100%" stopColor="#bae6fd" stopOpacity="0.4"/>
                    </linearGradient>
                    {visualAsset.decor}
                </svg>
            </div>
        )}

        {/* Render Animations */}
        <div className={`w-full ${isLarge ? 'max-w-4xl mx-auto my-10' : ''}`}>
            {showIntroDef && <ExternalAnglesVisuals mode="definition" />}
            {showInternalSum && <InternalAnglesAnimation />}
            {showExternalSupp && <ExternalAnglesVisuals mode="supplementary" />}
            {showExternalSum && <ExternalAnglesVisuals mode="sum_360" />}
            {showExternalTheorem && <ExternalAnglesVisuals mode="theorem" />}
        </div>

        {/* Text Content - Only hide for internal sum if animation is showing (it has its own text now), but often helpful to keep context */}
        {!isInteractive && (
            <div className={`text-slate-800 font-medium ${isLarge ? 'prose prose-2xl max-w-none text-center px-8' : 'text-lg prose prose-slate prose-p:text-slate-800 prose-p:leading-relaxed prose-p:my-4 leading-relaxed'}`}>
                <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                    {node.content}
                </ReactMarkdown>
            </div>
        )}
        
        {/* If Interactive, sometimes we still want the basic definition text if it's not redundant */}
        {isInteractive && !showInternalSum && (
             <div className="mt-2 text-slate-600 font-medium text-base">
                <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                    {node.content}
                </ReactMarkdown>
             </div>
        )}
      </>
  );

  return (
    <div className={`flex flex-col items-center ${depth > 0 ? 'mx-3' : ''}`} ref={nodeRef}>
      
      {/* Expanded Modal View */}
      {isExpanded && createPortal(
          <div className="fixed inset-0 z-[2000] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 md:p-8 animate-fade-in" onClick={(e) => e.stopPropagation()}>
               <div className="relative w-full max-w-6xl max-h-full bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col ring-4 ring-white/20">
                   {/* Header */}
                   <div className="flex justify-between items-center p-8 md:p-10 border-b border-slate-100 bg-gradient-to-r from-blue-50 to-white">
                        <h2 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-indigo-600">{node.title}</h2>
                        <button onClick={toggleExpand} className="p-4 bg-slate-100 hover:bg-red-100 text-slate-500 hover:text-red-600 rounded-full transition shadow-sm">
                            <X size={32} />
                        </button>
                   </div>
                   {/* Body */}
                   <div className="flex-1 overflow-y-auto p-8 md:p-12 bg-white">
                        {renderContentBody(true)}
                   </div>
               </div>
          </div>,
          document.body
      )}

      {/* Node Box (Card) */}
      <div 
        onClick={toggle}
        className={`
            relative z-10 flex flex-col items-center text-center p-8 rounded-[2rem] border-b-4 transition-all duration-300 cursor-pointer group hover:-translate-y-1
            ${isOpen 
                ? 'bg-white border-blue-500 shadow-2xl ring-4 ring-blue-50/50' 
                : 'bg-white border-slate-200 hover:border-blue-300 shadow-lg hover:shadow-xl'}
            ${depth === 0 ? 'min-w-[400px] border-blue-600 bg-gradient-to-b from-blue-50 to-white' : 'min-w-[350px] max-w-lg'}
        `}
      >
        <button 
             onClick={toggleExpand} 
             className="absolute top-4 right-4 p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all z-20 opacity-0 group-hover:opacity-100 focus:opacity-100"
             title="Зголеми"
        >
             <Maximize2 size={24} />
        </button>

        <h4 className={`font-extrabold text-slate-900 mb-6 tracking-tight ${depth === 0 ? 'text-4xl' : 'text-3xl'}`}>{node.title}</h4>
        
        {renderContentBody(false)}
        
        {hasChildren && (
            <div className={`mt-6 p-2 rounded-full transition-colors duration-300 ${isOpen ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500'}`}>
                {isOpen ? <ChevronUp size={32} /> : <ChevronDown size={32} />}
            </div>
        )}
      </div>

      {/* Children Container */}
      {hasChildren && isOpen && (
        <div className="flex flex-col items-center w-full animate-fade-in-down">
          
          {/* Connector Line from Parent */}
          <div className="h-12 w-1.5 bg-slate-200 rounded-full my-1"></div>

          {isVerticalStack ? (
              // VERTICAL STACK (For Level 0 children)
              <div className="flex flex-col gap-12 w-full items-center relative">
                  {node.children!.map((child, index) => (
                      <div key={child.id} className="relative flex flex-col items-center w-full">
                          <FlowNode node={child} depth={depth + 1} />
                      </div>
                  ))}
              </div>
          ) : (
              // HORIZONTAL/GRID STACK (For Level 1+ children)
              <div className="flex flex-wrap justify-center gap-8 pt-4 relative">
                 {/* Horizontal Connector Bar */}
                 {node.children!.length > 1 && (
                     <div className="absolute top-0 h-1.5 bg-slate-200 left-20 right-20 rounded-full"></div>
                 )}
                 
                 {node.children!.map((child) => (
                   <div key={child.id} className="flex flex-col items-center relative">
                     {/* Connector from Bar to Child */}
                     <div className="w-1.5 h-6 bg-slate-200 mb-2 rounded-full"></div>
                     <FlowNode node={child} depth={depth + 1} />
                   </div>
                 ))}
               </div>
          )}
        </div>
      )}
    </div>
  );
};

const LessonView: React.FC<{ rootNode: LessonNode; objectives?: string[] }> = ({ rootNode, objectives }) => {
  return (
    <div className="w-full h-full p-6 md:p-10 bg-slate-50/50 overflow-y-auto">
      {/* Learning Objectives Card */}
      {objectives && objectives.length > 0 && (
         <div className="max-w-6xl mx-auto mb-16 bg-white rounded-[2rem] shadow-xl p-8 md:p-10 relative overflow-hidden ring-1 ring-slate-900/5 group hover:shadow-2xl transition-all">
             <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-blue-500 to-indigo-600"></div>
             <div className="absolute -right-10 -top-10 w-40 h-40 bg-blue-50 rounded-full opacity-50 group-hover:scale-110 transition-transform"></div>
             
             <div className="flex flex-col md:flex-row items-start gap-8 relative z-10">
                 <div className="p-5 bg-blue-50 text-blue-600 rounded-3xl shrink-0 shadow-sm">
                     <Target size={40} />
                 </div>
                 <div>
                     <h3 className="text-3xl font-extrabold text-slate-900 mb-6">Цели на часот</h3>
                     <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         {objectives.map((goal, idx) => (
                             <li key={idx} className="flex items-start gap-4 text-slate-700 text-lg font-medium bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                 <span className="mt-1.5 w-3 h-3 rounded-full bg-blue-500 shrink-0 shadow-[0_0_8px_rgba(59,130,246,0.6)]"></span>
                                 <span className="leading-snug">{goal}</span>
                             </li>
                         ))}
                     </ul>
                 </div>
             </div>
         </div>
      )}

      <div className="flex justify-center mb-10">
        <span className="bg-white text-blue-800 text-base font-bold px-6 py-3 rounded-full flex items-center gap-3 shadow-md border border-blue-100 animate-bounce-subtle">
            <Circle size={16} className="animate-pulse fill-blue-500 text-blue-500"/> 
            Интерактивна мапа - Кликни на картичките
        </span>
      </div>
      
      <div className="pb-32">
        <FlowNode node={rootNode} />
      </div>
    </div>
  );
};

export default LessonView;
