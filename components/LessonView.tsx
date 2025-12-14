
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { LessonNode } from '../types';
import { ChevronRight, ChevronDown, Circle, ChevronUp, Maximize2, X, Target } from 'lucide-react';
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
      <g stroke="#0ea5e9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
      <g stroke="#0ea5e9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
       <path d="M 20 70 L 30 70 L 30 80" fill="none" stroke="#0ea5e9" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
    )
  },
  acute: {
    viewBox: "0 0 100 100",
    path: "M 50 15 L 85 85 L 15 85 Z", // Standard acute
    decor: (
      <g strokeLinecap="round" strokeLinejoin="round">
        <path d="M 45 25 A 10 10 0 0 1 55 25" fill="none" stroke="#0ea5e9" strokeWidth="1.5" />
        <path d="M 23 78 A 10 10 0 0 1 30 75" fill="none" stroke="#0ea5e9" strokeWidth="1.5" />
        <path d="M 70 75 A 10 10 0 0 1 77 78" fill="none" stroke="#0ea5e9" strokeWidth="1.5" />
      </g>
    )
  },
  obtuse: {
    viewBox: "0 0 100 100",
    path: "M 25 80 L 90 80 L 5 30 Z", // Corrected Obtuse (Angle > 90)
    decor: (
       <path d="M 40 80 A 15 15 0 0 0 20 66" fill="none" stroke="#0ea5e9" strokeWidth="1.5" strokeDasharray="2" strokeLinecap="round" strokeLinejoin="round" />
    )
  },
  // MIDDLE LINE
  mid_def: {
    viewBox: "0 0 100 100",
    path: "M 50 15 L 90 85 L 10 85 Z",
    decor: (
       <g>
          {/* Points */}
          <circle cx="30" cy="50" r="3" fill="#ef4444" />
          <circle cx="70" cy="50" r="3" fill="#ef4444" />
          {/* Line */}
          <line x1="30" y1="50" x2="70" y2="50" stroke="#ef4444" strokeWidth="2" />
          <text x="30" y="45" textAnchor="middle" className="text-[10px] fill-red-600 font-bold">D</text>
          <text x="70" y="45" textAnchor="middle" className="text-[10px] fill-red-600 font-bold">E</text>
       </g>
    )
  },
  prop_parallel: {
    viewBox: "0 0 100 100",
    path: "M 50 15 L 90 85 L 10 85 Z",
    decor: (
      <g>
         <line x1="30" y1="50" x2="70" y2="50" stroke="#ef4444" strokeWidth="2" />
         {/* Parallel Arrows */}
         <path d="M 48 50 L 52 53 L 48 56" fill="none" stroke="#ef4444" strokeWidth="1.5" />
         <path d="M 48 85 L 52 88 L 48 91" fill="none" stroke="#0ea5e9" strokeWidth="1.5" />
      </g>
    )
  },
  prop_length: {
    viewBox: "0 0 100 100",
    path: "M 50 15 L 90 85 L 10 85 Z",
    decor: (
      <g>
         <line x1="30" y1="50" x2="70" y2="50" stroke="#ef4444" strokeWidth="2" />
         <text x="50" y="45" textAnchor="middle" className="text-[8px] fill-red-600 font-bold">a/2</text>
         <text x="50" y="95" textAnchor="middle" className="text-[8px] fill-blue-600 font-bold">a</text>
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
         <line x1="50" y1="15" x2="50" y2="85" stroke="#ef4444" strokeWidth="2" />
         <circle cx="50" cy="85" r="2" fill="white" stroke="#ef4444" />
      </g>
    )
  },
  cent_point: {
    viewBox: "0 0 100 100",
    path: "M 50 15 L 90 85 L 10 85 Z",
    decor: (
      <g>
         {/* All 3 Medians */}
         <line x1="50" y1="15" x2="50" y2="85" stroke="#ef4444" strokeWidth="1" strokeDasharray="2" />
         <line x1="10" y1="85" x2="70" y2="50" stroke="#ef4444" strokeWidth="1" strokeDasharray="2" />
         <line x1="90" y1="85" x2="30" y2="50" stroke="#ef4444" strokeWidth="1" strokeDasharray="2" />
         {/* Centroid */}
         <circle cx="50" cy="61.6" r="3" fill="#ef4444" stroke="white" />
         <text x="55" y="60" className="text-[10px] font-bold fill-red-600">T</text>
      </g>
    )
  },
  cent_ratio: {
    viewBox: "0 0 100 100",
    path: "M 50 15 L 90 85 L 10 85 Z",
    decor: (
      <g>
         {/* One Median emphasized */}
         <line x1="50" y1="15" x2="50" y2="85" stroke="#ef4444" strokeWidth="2" />
         <circle cx="50" cy="61.6" r="3" fill="white" stroke="#ef4444" strokeWidth="2" />
         {/* Braces or labels */}
         <text x="55" y="40" className="text-[8px] font-bold fill-red-600">2x</text>
         <text x="55" y="75" className="text-[8px] font-bold fill-red-600">x</text>
      </g>
    )
  },
  // ORTHOCENTER
  ortho_def: {
    viewBox: "0 0 100 100",
    path: "M 50 15 L 90 85 L 10 85 Z",
    decor: (
      <g>
         <line x1="50" y1="15" x2="50" y2="85" stroke="#8b5cf6" strokeWidth="2" />
         {/* Right Angle Marker */}
         <path d="M 50 78 L 57 78 L 57 85" fill="none" stroke="#8b5cf6" strokeWidth="1" />
         <text x="62" y="75" className="text-[8px] font-bold fill-violet-600">90°</text>
      </g>
    )
  },
  ortho_point: {
    viewBox: "0 0 100 100",
    path: "M 50 15 L 90 85 L 10 85 Z",
    decor: (
      <g>
         {/* Altitudes */}
         <line x1="50" y1="15" x2="50" y2="85" stroke="#8b5cf6" strokeWidth="1" strokeDasharray="2" />
         <line x1="10" y1="85" x2="80" y2="32.5" stroke="#8b5cf6" strokeWidth="1" strokeDasharray="2" />
         <line x1="90" y1="85" x2="20" y2="32.5" stroke="#8b5cf6" strokeWidth="1" strokeDasharray="2" />
         {/* H */}
         <circle cx="50" cy="55" r="3" fill="#8b5cf6" stroke="white" />
         <text x="55" y="52" className="text-[10px] font-bold fill-violet-600">H</text>
      </g>
    )
  },
  // CIRCUMCIRCLE
  circum_def: {
    viewBox: "0 0 100 100",
    path: "M 50 15 L 90 85 L 10 85 Z",
    decor: (
      <g>
         {/* Circle passing through points */}
         <circle cx="50" cy="58" r="44" fill="none" stroke="#06b6d4" strokeWidth="2" />
         <circle cx="50" cy="15" r="2" fill="#06b6d4" />
         <circle cx="90" cy="85" r="2" fill="#06b6d4" />
         <circle cx="10" cy="85" r="2" fill="#06b6d4" />
      </g>
    )
  },
  circum_const: {
    viewBox: "0 0 100 100",
    path: "M 50 15 L 90 85 L 10 85 Z",
    decor: (
      <g>
         {/* Perpendicular Bisectors */}
         <line x1="50" y1="58" x2="50" y2="95" stroke="#06b6d4" strokeWidth="1" strokeDasharray="2" />
         <line x1="50" y1="58" x2="10" y2="25" stroke="#06b6d4" strokeWidth="1" strokeDasharray="2" />
         <line x1="50" y1="58" x2="90" y2="25" stroke="#06b6d4" strokeWidth="1" strokeDasharray="2" />
         
         <circle cx="50" cy="58" r="3" fill="#06b6d4" stroke="white" />
         <text x="55" y="55" className="text-[10px] font-bold fill-cyan-600">O</text>
         
         {/* Perpendicular marker on bottom side */}
         <path d="M 48 85 L 48 80 L 52 80 L 52 85" fill="none" stroke="#06b6d4" strokeWidth="1" />
      </g>
    )
  },
  circum_pos: {
    viewBox: "0 0 100 100",
    path: "M 20 20 L 20 80 L 80 80 Z", // Right triangle
    decor: (
      <g>
         {/* Center on hypotenuse */}
         <circle cx="50" cy="50" r="3" fill="#06b6d4" stroke="white" />
         <circle cx="50" cy="50" r="42.5" fill="none" stroke="#06b6d4" strokeWidth="1" strokeDasharray="2" />
      </g>
    )
  },
  // INCIRCLE
  incircle_def: {
    viewBox: "0 0 100 100",
    path: "M 50 15 L 90 85 L 10 85 Z",
    decor: (
      <g>
         {/* Incircle touching sides */}
         <circle cx="50" cy="58" r="20" fill="none" stroke="#f97316" strokeWidth="2" />
         <circle cx="50" cy="58" r="2" fill="#f97316" />
      </g>
    )
  },
  incircle_const: {
    viewBox: "0 0 100 100",
    path: "M 50 15 L 90 85 L 10 85 Z",
    decor: (
      <g>
         {/* Angle Bisectors */}
         <line x1="50" y1="15" x2="50" y2="85" stroke="#f97316" strokeWidth="1" strokeDasharray="2" />
         <line x1="10" y1="85" x2="70" y2="50" stroke="#f97316" strokeWidth="1" strokeDasharray="2" />
         <line x1="90" y1="85" x2="30" y2="50" stroke="#f97316" strokeWidth="1" strokeDasharray="2" />
         
         <circle cx="50" cy="61.5" r="3" fill="#f97316" stroke="white" />
         <text x="55" y="60" className="text-[10px] font-bold fill-orange-600">V</text>
         
         {/* Radius to bottom */}
         <line x1="50" y1="61.5" x2="50" y2="85" stroke="#f97316" strokeWidth="1.5" />
         <text x="52" y="75" className="text-[8px] font-bold fill-orange-600">r</text>
      </g>
    )
  },
  incircle_pos: {
    viewBox: "0 0 100 100",
    path: "M 50 15 L 90 85 L 10 85 Z", // Generic
    decor: (
      <g>
         {/* Highlight circle inside */}
         <circle cx="50" cy="58" r="20" fill="rgba(249, 115, 22, 0.2)" stroke="#f97316" strokeWidth="2" />
      </g>
    )
  },
  // EXISTENCE
  exist_rule: {
    viewBox: "0 0 100 100",
    path: "M 50 20 L 90 80 L 10 80 Z",
    decor: (
      <g>
         <text x="70" y="50" textAnchor="middle" className="text-[8px] font-bold fill-blue-600">a</text>
         <text x="30" y="50" textAnchor="middle" className="text-[8px] font-bold fill-blue-600">b</text>
         <text x="50" y="90" textAnchor="middle" className="text-[8px] font-bold fill-red-600">c</text>
         {/* Visual equation */}
         <text x="50" y="10" textAnchor="middle" className="text-[10px] font-bold fill-slate-700">a + b &gt; c</text>
      </g>
    )
  },
  exist_visual: {
    viewBox: "0 0 100 100",
    path: "M 10 80 L 90 80", // Base only
    decor: (
      <g>
         {/* Broken arms */}
         <line x1="10" y1="80" x2="30" y2="50" stroke="#0ea5e9" strokeWidth="2" />
         <line x1="90" y1="80" x2="70" y2="50" stroke="#0ea5e9" strokeWidth="2" />
         <line x1="10" y1="80" x2="90" y2="80" stroke="#ef4444" strokeWidth="2" />
         
         {/* X mark in gap */}
         <path d="M 45 45 L 55 55 M 55 45 L 45 55" stroke="#ef4444" strokeWidth="2" />
         <text x="50" y="65" textAnchor="middle" className="text-[8px] font-bold fill-slate-500">Прекратки!</text>
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
         <path d="M 20 70 A 10 10 0 0 1 30 80" fill="none" stroke="#ef4444" strokeWidth="2" />
         <line x1="90" y1="80" x2="20" y2="20" stroke="#ef4444" strokeWidth="2" />
         
         {/* Arrow connecting */}
         <path d="M 35 75 Q 50 60 55 50" fill="none" stroke="#ef4444" strokeWidth="1" strokeDasharray="2" markerEnd="url(#arrow-red)" />
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

  // Check for static visual asset
  const visualAsset = TRIANGLE_ASSETS[node.id];

  // Layout Strategy:
  // Depth 0 (Root) -> Children stack Vertically (Sides, Angles)
  // Depth 1 (Categories) -> Children stack Horizontally/Grid (Triangle Types)
  const isVerticalStack = depth === 0;

  const renderContentBody = (isLarge: boolean) => (
      <>
        {/* Render Static Visuals (Types of Triangles) */}
        {visualAsset && (
            <div className={`mb-3 p-1 bg-slate-50 rounded-lg border border-slate-100 ${isLarge ? 'p-6 mb-8 max-w-md mx-auto border-2' : ''}`}>
                <svg viewBox={visualAsset.viewBox} className={`${isLarge ? 'w-full h-48' : 'w-24 h-16'} mx-auto overflow-visible`}>
                    <defs>
                        <marker id="arrow-red" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto" markerUnits="strokeWidth">
                            <path d="M0,0 L0,6 L6,3 z" fill="#ef4444" />
                        </marker>
                    </defs>
                    <path 
                        d={visualAsset.path} 
                        fill={node.id.includes('exist') ? 'none' : "rgba(224, 242, 254, 0.5)"} 
                        stroke={node.id.includes('exist') ? 'none' : "#0284c7"}
                        strokeWidth="3" 
                        strokeLinejoin="round" 
                        strokeLinecap="round" 
                    />
                    {visualAsset.decor}
                </svg>
            </div>
        )}

        {/* Render Animations */}
        <div className={`w-full ${isLarge ? 'max-w-2xl mx-auto my-6' : ''}`}>
            {showIntroDef && <ExternalAnglesVisuals mode="definition" />}
            {showInternalSum && <InternalAnglesAnimation />}
            {showExternalSupp && <ExternalAnglesVisuals mode="supplementary" />}
            {showExternalSum && <ExternalAnglesVisuals mode="sum_360" />}
            {showExternalTheorem && <ExternalAnglesVisuals mode="theorem" />}
        </div>

        {/* Text Content */}
        {!showInternalSum && !showExternalSupp && !showExternalSum && !showExternalTheorem && !showIntroDef && (
            <div className={`text-slate-600 ${isLarge ? 'prose prose-xl max-w-none text-center px-4' : 'text-base prose prose-stone prose-p:my-2 leading-relaxed'}`}>
                <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                    {node.content}
                </ReactMarkdown>
            </div>
        )}
        
        {/* Helper text for animated nodes - Only for specific nodes */}
        {(showExternalSum || showExternalTheorem) && (
             <div className={`text-slate-500 mt-2 italic ${isLarge ? 'text-xl text-center' : 'text-sm'}`}>
                 <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                    {node.content}
                 </ReactMarkdown>
             </div>
        )}
      </>
  );

  return (
    <div className={`flex flex-col items-center ${depth > 0 ? 'mx-2' : ''}`} ref={nodeRef}>
      
      {/* Expanded Modal View */}
      {isExpanded && createPortal(
          <div className="fixed inset-0 z-[2000] bg-white/95 backdrop-blur-md flex items-center justify-center p-4 md:p-8 animate-fade-in" onClick={(e) => e.stopPropagation()}>
               <div className="relative w-full max-w-4xl max-h-full bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
                   {/* Header */}
                   <div className="flex justify-between items-center p-4 md:p-6 border-b border-slate-100 bg-slate-50">
                        <h2 className="text-3xl font-bold text-slate-800">{node.title}</h2>
                        <button onClick={toggleExpand} className="p-2 hover:bg-red-100 text-slate-400 hover:text-red-500 rounded-full transition">
                            <X size={32} />
                        </button>
                   </div>
                   {/* Body */}
                   <div className="flex-1 overflow-y-auto p-6 md:p-8">
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
            relative z-10 flex flex-col items-center text-center p-5 rounded-xl border-2 transition-all duration-300 cursor-pointer group
            ${isOpen ? 'bg-white border-blue-400 shadow-lg ring-2 ring-blue-50' : 'bg-white border-slate-200 hover:border-blue-300 shadow-sm'}
            ${depth === 0 ? 'min-w-[350px] border-blue-600 bg-blue-50' : 'min-w-[300px] max-w-sm'}
        `}
      >
        <button 
             onClick={toggleExpand} 
             className="absolute top-2 right-2 p-1.5 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all z-20 opacity-0 group-hover:opacity-100 focus:opacity-100"
             title="Зголеми"
        >
             <Maximize2 size={20} />
        </button>

        <h4 className={`font-bold text-slate-800 mb-3 ${depth === 0 ? 'text-2xl' : 'text-xl'}`}>{node.title}</h4>
        
        {renderContentBody(false)}
        
        {hasChildren && (
            <div className={`mt-3 p-1 rounded-full ${isOpen ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
                {isOpen ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
            </div>
        )}
      </div>

      {/* Children Container */}
      {hasChildren && isOpen && (
        <div className="flex flex-col items-center w-full animate-fade-in-down">
          
          {/* Connector Line from Parent */}
          <div className="h-8 w-0.5 bg-slate-300"></div>

          {isVerticalStack ? (
              // VERTICAL STACK (For Level 0 children)
              <div className="flex flex-col gap-10 w-full items-center relative">
                  {/* Vertical line spanning the height */}
                  <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-slate-200 -z-10 hidden"></div>
                  
                  {node.children!.map((child, index) => (
                      <div key={child.id} className="relative flex flex-col items-center">
                          {/* Small vertical connector if needed, or visual separation */}
                          <FlowNode node={child} depth={depth + 1} />
                      </div>
                  ))}
              </div>
          ) : (
              // HORIZONTAL/GRID STACK (For Level 1+ children)
              <div className="flex flex-wrap justify-center gap-8 pt-2 relative">
                 {/* Horizontal Connector Bar */}
                 {node.children!.length > 1 && (
                     <div className="absolute top-0 h-0.5 bg-slate-300 left-10 right-10"></div>
                 )}
                 
                 {node.children!.map((child) => (
                   <div key={child.id} className="flex flex-col items-center relative">
                     {/* Connector from Bar to Child */}
                     <div className="w-0.5 h-2 bg-slate-300 mb-1"></div>
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
    <div className="w-full h-full p-4 md:p-8 bg-slate-50 overflow-y-auto">
      {/* Learning Objectives Card */}
      {objectives && objectives.length > 0 && (
         <div className="max-w-4xl mx-auto mb-10 bg-white border border-indigo-100 rounded-xl shadow-sm p-6 relative overflow-hidden">
             <div className="absolute top-0 left-0 w-2 h-full bg-indigo-500"></div>
             <div className="flex items-start gap-4">
                 <div className="p-3 bg-indigo-50 text-indigo-600 rounded-full shrink-0">
                     <Target size={28} />
                 </div>
                 <div>
                     <h3 className="text-xl font-bold text-slate-800 mb-3">Цели на часот</h3>
                     <ul className="space-y-3">
                         {objectives.map((goal, idx) => (
                             <li key={idx} className="flex items-start gap-3 text-slate-700 text-base">
                                 <span className="mt-2 w-2 h-2 rounded-full bg-indigo-400 shrink-0"></span>
                                 <span>{goal}</span>
                             </li>
                         ))}
                     </ul>
                 </div>
             </div>
         </div>
      )}

      <div className="flex justify-center mb-6">
        <span className="bg-blue-100 text-blue-800 text-sm font-semibold px-4 py-1.5 rounded-full flex items-center gap-2 shadow-sm border border-blue-200">
            <Circle size={12} className="animate-pulse fill-blue-500"/> 
            Интерактивна мапа - Кликни на картичките за повеќе инфо
        </span>
      </div>
      <div className="pb-20">
        <FlowNode node={rootNode} />
      </div>
    </div>
  );
};

export default LessonView;
