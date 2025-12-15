
import React, { useState } from 'react';
import { ModuleData, ModuleId, SubModuleId } from './types';
import { MODULES } from './constants';
import TriangleVisualizer from './components/TriangleVisualizer';
import LessonView from './components/LessonView';
import QuizView from './components/QuizView';
import AITutor from './components/AITutor';
import InternalAnglesAnimation from './components/InternalAnglesAnimation';
import { BookOpen, Compass, CheckSquare, ChevronLeft, GraduationCap, PlayCircle, Star } from 'lucide-react';

const App: React.FC = () => {
  const [activeModuleId, setActiveModuleId] = useState<ModuleId | null>(null);
  const [activeSubModule, setActiveSubModule] = useState<SubModuleId>(SubModuleId.LESSON);

  const activeModule = MODULES.find(m => m.id === activeModuleId);
  const isFinalQuiz = activeModuleId === ModuleId.FINAL_QUIZ;

  const handleModuleSelect = (id: ModuleId) => {
      setActiveModuleId(id);
      // For Final Quiz, immediately jump to Test mode
      if (id === ModuleId.FINAL_QUIZ) {
          setActiveSubModule(SubModuleId.TEST);
      } else {
          setActiveSubModule(SubModuleId.LESSON);
      }
  };

  const renderContent = () => {
    if (!activeModule) return null;

    switch (activeSubModule) {
      case SubModuleId.LESSON:
        return <LessonView rootNode={activeModule.lessonRoot} objectives={activeModule.goals} />;
      case SubModuleId.EXPLORE:
        return (
          <div className="h-full overflow-y-auto bg-slate-50/50">
            <div className="flex flex-col items-center p-6 md:p-10 pb-32 min-h-min gap-8">
              <TriangleVisualizer moduleId={activeModule.id} />
              
              {/* Removed Visual Proof from here as requested, it is now only in LessonView */}
            </div>
          </div>
        );
      case SubModuleId.TEST:
        return (
          <div className={`h-full overflow-y-auto bg-slate-50/50 ${isFinalQuiz ? 'flex items-center justify-center p-4' : ''}`}>
            <div className={`${isFinalQuiz ? 'w-full' : 'p-6 md:p-10 pb-32 min-h-min'}`}>
              <QuizView questions={activeModule.quiz} isCompact={isFinalQuiz} />
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
        {/* HERO SECTION - COMPACT VERSION */}
        <div className="relative bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-800 text-white overflow-hidden shadow-xl mb-8">
           {/* Decorative Background Elements */}
           <div className="absolute inset-0 opacity-10 pointer-events-none">
              <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                 <path d="M0 100 L0 0 L100 0 Z" fill="white" />
              </svg>
           </div>
           
           {/* Floating Shapes */}
           <div className="absolute top-10 right-20 opacity-20 pointer-events-none">
              <svg width="200" height="200" viewBox="0 0 100 100" className="animate-pulse">
                 <path d="M 50 10 L 90 90 L 10 90 Z" fill="none" stroke="white" strokeWidth="2" />
              </svg>
           </div>
           <div className="absolute bottom-[-20px] left-10 opacity-10 pointer-events-none">
              <svg width="150" height="150" viewBox="0 0 100 100" className="rotate-12">
                 <rect x="20" y="20" width="60" height="60" fill="none" stroke="white" strokeWidth="2" />
              </svg>
           </div>

           <div className="max-w-7xl mx-auto px-6 py-10 md:py-14 relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex-1 text-center md:text-left">
                 <div className="inline-flex items-center gap-2 bg-blue-500/30 border border-blue-400/30 rounded-full px-3 py-1 mb-4 backdrop-blur-sm shadow-sm">
                    <Star size={12} className="text-yellow-300 fill-yellow-300 animate-pulse" />
                    <span className="text-[10px] font-bold text-blue-50 uppercase tracking-widest">Интерактивна Геометрија</span>
                 </div>
                 
                 <h1 className="text-4xl md:text-6xl font-extrabold mb-4 tracking-tight drop-shadow-md leading-tight">
                    Триаголници
                 </h1>
                 
                 <p className="text-lg text-blue-100 max-w-xl leading-relaxed mb-6 mx-auto md:mx-0">
                    Добредојде во дигиталниот свет на формите! Истражувај, учи преку анимации и тестирај го своето знаење на забавен начин.
                 </p>

                 <button 
                    onClick={() => document.getElementById('modules-grid')?.scrollIntoView({ behavior: 'smooth' })}
                    className="bg-white text-blue-700 hover:bg-blue-50 px-6 py-3 rounded-full font-bold text-base shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 flex items-center gap-2 mx-auto md:mx-0"
                 >
                    <PlayCircle size={20} /> Започни со учење
                 </button>
              </div>
              
              <div className="hidden md:block relative">
                  <div className="absolute inset-0 bg-blue-400 blur-3xl opacity-20 rounded-full scale-150"></div>
                  <GraduationCap size={180} className="text-white drop-shadow-2xl relative z-10 rotate-[-10deg] opacity-90" strokeWidth={1.2} />
              </div>
           </div>
        </div>

        <main className="max-w-7xl mx-auto p-6 md:p-8" id="modules-grid">
            <div className="flex items-center gap-3 mb-8">
                <div className="h-8 w-1.5 bg-blue-600 rounded-full"></div>
                <h2 className="text-2xl font-bold text-slate-800">Избери лекција</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {MODULES.map((module) => (
                    <div 
                        key={module.id}
                        onClick={() => handleModuleSelect(module.id)}
                        className={`group bg-white rounded-3xl shadow-sm border border-slate-200 hover:shadow-2xl transition-all duration-300 cursor-pointer overflow-hidden flex flex-col relative h-[340px] ${module.id === ModuleId.FINAL_QUIZ ? 'ring-4 ring-indigo-100 border-indigo-200' : ''}`}
                    >
                        <div className={`h-2 absolute top-0 left-0 right-0 ${module.color}`}></div>

                        <div className={`h-40 ${module.color} bg-opacity-10 group-hover:bg-opacity-20 transition-all flex items-center justify-center relative overflow-hidden`}>
                           <div className="absolute inset-0 opacity-5">
                                <svg width="100%" height="100%">
                                    <pattern id={`pat-${module.id}`} x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                                        <circle cx="10" cy="10" r="1.5" fill="currentColor" />
                                    </pattern>
                                    <rect width="100%" height="100%" fill={`url(#pat-${module.id})`} />
                                </svg>
                           </div>
                           
                           <div className={`p-4 rounded-2xl bg-white shadow-sm group-hover:scale-110 transition-transform duration-500 ${module.color.replace('bg-', 'text-')}`}>
                                {module.id === ModuleId.FINAL_QUIZ ? <Star size={48} className="text-yellow-500 fill-yellow-500" /> : <GraduationCap size={48} />}
                           </div>
                        </div>

                        <div className="p-8 flex-1 flex flex-col">
                            <h3 className="text-2xl font-bold text-slate-800 mb-3 group-hover:text-blue-700 transition-colors">{module.title}</h3>
                            <p className="text-slate-500 text-base leading-relaxed mb-6 line-clamp-2">{module.description}</p>
                            
                            <div className="mt-auto flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{module.id === ModuleId.FINAL_QUIZ ? 'Завршен тест' : 'Лекција • Квиз'}</span>
                                <span className={`w-10 h-10 rounded-full flex items-center justify-center ${module.color} text-white group-hover:scale-110 transition-transform shadow-md`}>
                                    <ChevronLeft className="rotate-180" size={20}/>
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </main>
        
        <footer className="text-center py-12 mt-12 bg-white border-t border-slate-100">
            <p className="text-slate-400 font-medium">Триаголници © 2024</p>
        </footer>
        <AITutor context="Корисникот се наоѓа на почетниот екран (мени)." />
      </div>
    );
  }

  // MODULE VIEW - Inner Pages
  return (
    <div className="h-screen bg-slate-50 flex flex-col font-sans overflow-hidden">
       {/* Top Header - Matches the Gradient Theme */}
       <header className={`${isFinalQuiz ? 'bg-slate-900' : 'bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700'} shadow-md px-4 py-3 shrink-0 flex items-center justify-between z-20`}>
          <div className="flex items-center gap-4">
             <button 
                onClick={() => { setActiveModuleId(null); setActiveSubModule(SubModuleId.LESSON); }}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition backdrop-blur-sm"
                title="Назад кон мени"
             >
                <ChevronLeft size={24} />
             </button>
             <div className="flex flex-col">
                 <span className={`${isFinalQuiz ? 'text-indigo-300' : 'text-blue-200'} text-xs font-bold uppercase tracking-wider`}>Модул</span>
                 <h1 className="text-lg font-bold text-white leading-tight truncate">{activeModule.title}</h1>
             </div>
          </div>
       </header>

       <div className="flex-1 flex overflow-hidden relative">
          {/* Desktop Sidebar - Hidden for Final Quiz */}
          {!isFinalQuiz && (
          <aside className="hidden md:flex w-72 bg-white border-r border-slate-200 flex-col shrink-0 z-10">
              <div className="p-6 space-y-3">
                  <p className="px-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Навигација</p>
                  
                  <button 
                      onClick={() => setActiveSubModule(SubModuleId.LESSON)}
                      className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl font-bold transition-all duration-200 text-left group ${activeSubModule === SubModuleId.LESSON ? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-100' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}
                  >
                      <div className={`p-2 rounded-xl transition-colors ${activeSubModule === SubModuleId.LESSON ? 'bg-blue-200 text-blue-700' : 'bg-slate-100 text-slate-400 group-hover:text-slate-600'}`}>
                        <BookOpen size={20} />
                      </div>
                      Лекција
                  </button>
                  
                  <button 
                      onClick={() => setActiveSubModule(SubModuleId.EXPLORE)}
                      className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl font-bold transition-all duration-200 text-left group ${activeSubModule === SubModuleId.EXPLORE ? 'bg-purple-50 text-purple-700 shadow-sm border border-purple-100' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}
                  >
                      <div className={`p-2 rounded-xl transition-colors ${activeSubModule === SubModuleId.EXPLORE ? 'bg-purple-200 text-purple-700' : 'bg-slate-100 text-slate-400 group-hover:text-slate-600'}`}>
                        <Compass size={20} />
                      </div>
                      Истражувај
                  </button>
                  
                  <button 
                      onClick={() => setActiveSubModule(SubModuleId.TEST)}
                      className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl font-bold transition-all duration-200 text-left group ${activeSubModule === SubModuleId.TEST ? 'bg-emerald-50 text-emerald-700 shadow-sm border border-emerald-100' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}
                  >
                      <div className={`p-2 rounded-xl transition-colors ${activeSubModule === SubModuleId.TEST ? 'bg-emerald-200 text-emerald-700' : 'bg-slate-100 text-slate-400 group-hover:text-slate-600'}`}>
                        <CheckSquare size={20} />
                      </div>
                      Тестирај се
                  </button>
              </div>
              
              <div className="mt-auto p-6">
                 <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-5 text-center shadow-lg text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-2 opacity-10">
                        <GraduationCap size={60} />
                    </div>
                    <p className="text-xs text-slate-300 mb-3 uppercase font-bold tracking-wider">Твој напредок</p>
                    <div className="w-full bg-slate-700 h-3 rounded-full overflow-hidden mb-2">
                        <div className="bg-gradient-to-r from-blue-400 to-cyan-300 h-full w-2/3 rounded-full shadow-[0_0_10px_rgba(56,189,248,0.5)]"></div>
                    </div>
                    <p className="text-xs text-slate-400">Продолжи така!</p>
                 </div>
              </div>
          </aside>
          )}

          {/* Main Content Area */}
          <main className="flex-1 relative overflow-hidden bg-slate-50/50">
             {renderContent()}
          </main>
       </div>

       {/* Mobile Bottom Navigation - Hidden for Final Quiz */}
       {!isFinalQuiz && (
       <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-4 py-2 flex justify-between items-center z-30 pb-safe shadow-[0_-8px_30px_rgba(0,0,0,0.05)] rounded-t-3xl">
            <button 
                onClick={() => setActiveSubModule(SubModuleId.LESSON)}
                className={`flex flex-col items-center gap-1 p-2 rounded-2xl w-24 transition-all duration-300 ${activeSubModule === SubModuleId.LESSON ? 'text-blue-600 bg-blue-50 -translate-y-2 shadow-lg ring-2 ring-blue-100' : 'text-slate-400 hover:text-slate-600'}`}
            >
                <BookOpen size={24} strokeWidth={activeSubModule === SubModuleId.LESSON ? 2.5 : 2} />
                <span className="text-[10px] font-bold">Лекција</span>
            </button>
            <button 
                onClick={() => setActiveSubModule(SubModuleId.EXPLORE)}
                className={`flex flex-col items-center gap-1 p-2 rounded-2xl w-24 transition-all duration-300 ${activeSubModule === SubModuleId.EXPLORE ? 'text-purple-600 bg-purple-50 -translate-y-2 shadow-lg ring-2 ring-purple-100' : 'text-slate-400 hover:text-slate-600'}`}
            >
                <Compass size={24} strokeWidth={activeSubModule === SubModuleId.EXPLORE ? 2.5 : 2} />
                <span className="text-[10px] font-bold">Истражувај</span>
            </button>
            <button 
                onClick={() => setActiveSubModule(SubModuleId.TEST)}
                className={`flex flex-col items-center gap-1 p-2 rounded-2xl w-24 transition-all duration-300 ${activeSubModule === SubModuleId.TEST ? 'text-emerald-600 bg-emerald-50 -translate-y-2 shadow-lg ring-2 ring-emerald-100' : 'text-slate-400 hover:text-slate-600'}`}
            >
                <CheckSquare size={24} strokeWidth={activeSubModule === SubModuleId.TEST ? 2.5 : 2} />
                <span className="text-[10px] font-bold">Тест</span>
            </button>
       </div>
       )}

       <AITutor context={`Корисникот учи за ${activeModule.title}, моментално во секцијата: ${activeSubModule}`} />
    </div>
  );
};

export default App;
