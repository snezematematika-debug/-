import React, { useState } from 'react';
import { ModuleData, ModuleId, SubModuleId } from './types';
import { MODULES } from './constants';
import TriangleVisualizer from './components/TriangleVisualizer';
import LessonView from './components/LessonView';
import QuizView from './components/QuizView';
import AITutor from './components/AITutor';
import { BookOpen, Compass, CheckSquare, ChevronLeft, GraduationCap } from 'lucide-react';

const App: React.FC = () => {
  const [activeModuleId, setActiveModuleId] = useState<ModuleId | null>(null);
  const [activeSubModule, setActiveSubModule] = useState<SubModuleId>(SubModuleId.LESSON);

  const activeModule = MODULES.find(m => m.id === activeModuleId);

  const renderContent = () => {
    if (!activeModule) return null;

    switch (activeSubModule) {
      case SubModuleId.LESSON:
        return <LessonView rootNode={activeModule.lessonRoot} />;
      case SubModuleId.EXPLORE:
        return (
          <div className="flex justify-center p-8">
            <TriangleVisualizer moduleId={activeModule.id} />
          </div>
        );
      case SubModuleId.TEST:
        return (
          <div className="p-8">
            <QuizView questions={activeModule.quiz} />
          </div>
        );
      default:
        return null;
    }
  };

  if (!activeModuleId) {
    // DASHBOARD VIEW
    return (
      <div className="min-h-screen bg-slate-50 font-sans">
        <header className="bg-white border-b border-slate-200 py-6 px-8 sticky top-0 z-10">
           <div className="max-w-6xl mx-auto flex items-center gap-3">
             <div className="p-2 bg-blue-600 rounded-lg text-white">
                <GraduationCap size={32} />
             </div>
             <div>
                <h1 className="text-2xl font-bold text-slate-800">Триаголници</h1>
                <p className="text-slate-500 text-sm">Интерактивен учебник за геометрија</p>
             </div>
           </div>
        </header>

        <main className="max-w-6xl mx-auto p-8">
            <h2 className="text-xl font-semibold text-slate-700 mb-6">Избери лекција</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {MODULES.map((module) => (
                    <div 
                        key={module.id}
                        onClick={() => setActiveModuleId(module.id)}
                        className="group bg-white rounded-2xl shadow-sm border border-slate-200 hover:shadow-xl hover:border-blue-300 transition-all duration-300 cursor-pointer overflow-hidden flex flex-col"
                    >
                        <div className={`h-32 ${module.color} flex items-center justify-center text-white`}>
                           {/* Simple Icon Logic based on constants */}
                           <GraduationCap size={48} className="opacity-80 group-hover:scale-110 transition-transform duration-500" />
                        </div>
                        <div className="p-6 flex-1 flex flex-col">
                            <h3 className="text-xl font-bold text-slate-800 mb-2">{module.title}</h3>
                            <p className="text-slate-500 text-sm leading-relaxed mb-4 flex-1">{module.description}</p>
                            <span className="text-blue-600 font-semibold text-sm group-hover:underline flex items-center gap-1">
                                Започни <ChevronLeft className="rotate-180" size={16}/>
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </main>
        
        {/* Footer */}
        <footer className="text-center py-8 text-slate-400 text-sm">
            Триаголници © 2024
        </footer>
        
        <AITutor context="Корисникот се наоѓа на почетниот екран (мени)." />
      </div>
    );
  }

  // MODULE VIEW
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
       {/* Top Navigation Bar (Mobile: Back + Title only | Desktop: Back + Title + Tabs) */}
       <header className="bg-white border-b border-slate-200 px-4 md:px-6 py-3 md:py-4 flex justify-between items-center sticky top-0 z-20 shadow-sm">
          <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
             <button 
                onClick={() => { setActiveModuleId(null); setActiveSubModule(SubModuleId.LESSON); }}
                className="p-2 hover:bg-slate-100 rounded-full text-slate-600 transition shrink-0"
                title="Назад кон мени"
             >
                <ChevronLeft size={24} />
             </button>
             <h1 className="text-base md:text-lg font-bold text-slate-800 truncate">{activeModule.title}</h1>
          </div>
          
          {/* Desktop Tabs (Hidden on Mobile) */}
          <div className="hidden md:flex bg-slate-100 p-1 rounded-xl">
            <button 
                onClick={() => setActiveSubModule(SubModuleId.LESSON)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition ${activeSubModule === SubModuleId.LESSON ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
                <BookOpen size={16} /> Лекција
            </button>
            <button 
                onClick={() => setActiveSubModule(SubModuleId.EXPLORE)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition ${activeSubModule === SubModuleId.EXPLORE ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
                <Compass size={16} /> Истражувај
            </button>
            <button 
                onClick={() => setActiveSubModule(SubModuleId.TEST)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition ${activeSubModule === SubModuleId.TEST ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
                <CheckSquare size={16} /> Тестирај се
            </button>
          </div>
       </header>

       {/* Content Area (Added padding bottom for mobile nav) */}
       <main className="flex-1 overflow-y-auto pb-24 md:pb-0">
          {renderContent()}
       </main>

       {/* Mobile Bottom Navigation (Hidden on Desktop) */}
       <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-2 py-2 flex justify-around items-center z-30 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] safe-area-bottom">
            <button 
                onClick={() => setActiveSubModule(SubModuleId.LESSON)}
                className={`flex flex-col items-center gap-1 p-2 rounded-lg w-full transition ${activeSubModule === SubModuleId.LESSON ? 'text-blue-600' : 'text-slate-400'}`}
            >
                <BookOpen size={24} strokeWidth={activeSubModule === SubModuleId.LESSON ? 2.5 : 2} />
                <span className="text-[10px] font-bold">Лекција</span>
            </button>
            <button 
                onClick={() => setActiveSubModule(SubModuleId.EXPLORE)}
                className={`flex flex-col items-center gap-1 p-2 rounded-lg w-full transition ${activeSubModule === SubModuleId.EXPLORE ? 'text-blue-600' : 'text-slate-400'}`}
            >
                <Compass size={24} strokeWidth={activeSubModule === SubModuleId.EXPLORE ? 2.5 : 2} />
                <span className="text-[10px] font-bold">Истражувај</span>
            </button>
            <button 
                onClick={() => setActiveSubModule(SubModuleId.TEST)}
                className={`flex flex-col items-center gap-1 p-2 rounded-lg w-full transition ${activeSubModule === SubModuleId.TEST ? 'text-blue-600' : 'text-slate-400'}`}
            >
                <CheckSquare size={24} strokeWidth={activeSubModule === SubModuleId.TEST ? 2.5 : 2} />
                <span className="text-[10px] font-bold">Тестирај се</span>
            </button>
       </div>

       <AITutor context={`Корисникот учи за ${activeModule.title}, моментално во секцијата: ${activeSubModule}`} />
    </div>
  );
};

export default App;