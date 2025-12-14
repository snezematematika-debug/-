
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
        // LessonView already has internal scrolling (h-full overflow-y-auto)
        return <LessonView rootNode={activeModule.lessonRoot} objectives={activeModule.goals} />;
      case SubModuleId.EXPLORE:
        return (
          <div className="h-full overflow-y-auto">
            <div className="flex justify-center p-8 pb-32 min-h-min">
              <TriangleVisualizer moduleId={activeModule.id} />
            </div>
          </div>
        );
      case SubModuleId.TEST:
        return (
          <div className="h-full overflow-y-auto">
            <div className="p-8 pb-32 min-h-min">
              <QuizView questions={activeModule.quiz} />
            </div>
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
        <header className="bg-white border-b border-slate-200 py-6 px-8 sticky top-0 z-10 shadow-sm">
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
        
        <footer className="text-center py-8 text-slate-400 text-sm">
            Триаголници © 2024
        </footer>
        
        <AITutor context="Корисникот се наоѓа на почетниот екран (мени)." />
      </div>
    );
  }

  // MODULE VIEW
  return (
    <div className="h-screen bg-slate-50 flex flex-col font-sans overflow-hidden">
       {/* Top Header */}
       <header className="bg-white border-b border-slate-200 px-4 py-3 shrink-0 flex items-center justify-between z-20 shadow-sm">
          <div className="flex items-center gap-3">
             <button 
                onClick={() => { setActiveModuleId(null); setActiveSubModule(SubModuleId.LESSON); }}
                className="p-2 hover:bg-slate-100 rounded-full text-slate-500 hover:text-slate-800 transition"
                title="Назад кон мени"
             >
                <ChevronLeft size={24} />
             </button>
             <h1 className="text-lg font-bold text-slate-800 truncate">{activeModule.title}</h1>
          </div>
       </header>

       <div className="flex-1 flex overflow-hidden relative">
          {/* Desktop Sidebar */}
          <aside className="hidden md:flex w-64 bg-white border-r border-slate-200 flex-col shrink-0 z-10 transition-all">
              <div className="p-4 space-y-2">
                  <button 
                      onClick={() => setActiveSubModule(SubModuleId.LESSON)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all duration-200 ${activeSubModule === SubModuleId.LESSON ? 'bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-100' : 'text-slate-600 hover:bg-slate-50'}`}
                  >
                      <BookOpen size={20} /> Лекција
                  </button>
                  <button 
                      onClick={() => setActiveSubModule(SubModuleId.EXPLORE)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all duration-200 ${activeSubModule === SubModuleId.EXPLORE ? 'bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-100' : 'text-slate-600 hover:bg-slate-50'}`}
                  >
                      <Compass size={20} /> Истражувај
                  </button>
                  <button 
                      onClick={() => setActiveSubModule(SubModuleId.TEST)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all duration-200 ${activeSubModule === SubModuleId.TEST ? 'bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-100' : 'text-slate-600 hover:bg-slate-50'}`}
                  >
                      <CheckSquare size={20} /> Тестирај се
                  </button>
              </div>
              
              <div className="mt-auto p-4">
                 <div className="bg-slate-100 rounded-xl p-4 text-center">
                    <p className="text-xs text-slate-500 mb-2">Напредок во модулот</p>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div className="bg-blue-500 h-full w-2/3 rounded-full"></div>
                    </div>
                 </div>
              </div>
          </aside>

          {/* Main Content Area */}
          <main className="flex-1 relative overflow-hidden bg-slate-50">
             {renderContent()}
          </main>
       </div>

       {/* Mobile Bottom Navigation */}
       <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-2 py-2 flex justify-around items-center z-30 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
            <button 
                onClick={() => setActiveSubModule(SubModuleId.LESSON)}
                className={`flex flex-col items-center gap-1 p-2 rounded-lg w-full transition ${activeSubModule === SubModuleId.LESSON ? 'text-blue-600 bg-blue-50' : 'text-slate-400'}`}
            >
                <BookOpen size={24} strokeWidth={activeSubModule === SubModuleId.LESSON ? 2.5 : 2} />
                <span className="text-[10px] font-bold">Лекција</span>
            </button>
            <button 
                onClick={() => setActiveSubModule(SubModuleId.EXPLORE)}
                className={`flex flex-col items-center gap-1 p-2 rounded-lg w-full transition ${activeSubModule === SubModuleId.EXPLORE ? 'text-blue-600 bg-blue-50' : 'text-slate-400'}`}
            >
                <Compass size={24} strokeWidth={activeSubModule === SubModuleId.EXPLORE ? 2.5 : 2} />
                <span className="text-[10px] font-bold">Истражувај</span>
            </button>
            <button 
                onClick={() => setActiveSubModule(SubModuleId.TEST)}
                className={`flex flex-col items-center gap-1 p-2 rounded-lg w-full transition ${activeSubModule === SubModuleId.TEST ? 'text-blue-600 bg-blue-50' : 'text-slate-400'}`}
            >
                <CheckSquare size={24} strokeWidth={activeSubModule === SubModuleId.TEST ? 2.5 : 2} />
                <span className="text-[10px] font-bold">Тест</span>
            </button>
       </div>

       <AITutor context={`Корисникот учи за ${activeModule.title}, моментално во секцијата: ${activeSubModule}`} />
    </div>
  );
};

export default App;
