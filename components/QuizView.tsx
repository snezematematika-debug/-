import React, { useState, useEffect } from 'react';
import { QuizQuestion, QuizItem } from '../types';
import { CheckCircle, XCircle, RefreshCw, Trophy, ArrowRight, MousePointer2, HelpCircle, Keyboard } from 'lucide-react';

interface Props {
  questions: QuizQuestion[];
}

const QuizView: React.FC<Props> = ({ questions }) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  
  // State for question flow
  const [attempts, setAttempts] = useState(0); // 0 = First try, 1 = Second try (Hint shown), 2 = Done
  const [questionStatus, setQuestionStatus] = useState<'unanswered' | 'correct' | 'wrong'>('unanswered');

  // MCQ State
  const [mcqSelected, setMcqSelected] = useState<number | null>(null);

  // Input State
  const [userInputValue, setUserInputValue] = useState('');

  // Drag Drop State
  const [remainingItems, setRemainingItems] = useState<QuizItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<QuizItem | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{text: string, type: 'success'|'error'} | null>(null);

  const currentQ = questions[currentIdx];

  // Initialize/Reset State when question changes
  useEffect(() => {
    setAttempts(0);
    setQuestionStatus('unanswered');
    setMcqSelected(null);
    setUserInputValue('');
    
    if (currentQ.type === 'DRAG_DROP' && currentQ.items) {
      setRemainingItems([...currentQ.items].sort(() => Math.random() - 0.5)); // Shuffle
      setSelectedItem(null);
      setFeedbackMsg(null);
    } 
  }, [currentIdx, currentQ]);

  // --- Logic for MCQ ---
  const handleMcqSelect = (idx: number) => {
    if (questionStatus === 'correct' || attempts >= 2) return; // Prevent clicking after done
    setMcqSelected(idx);
  };

  const submitAnswer = () => {
    if (questionStatus === 'correct' || attempts >= 2) {
        nextQuestion();
        return;
    }

    let isCorrect = false;

    // VALIDATION
    if (currentQ.type === 'MCQ') {
        if (mcqSelected === null) return;
        isCorrect = mcqSelected === currentQ.correctIndex;
    } else if (currentQ.type === 'INPUT') {
        // Normalize input: remove spaces, '°', 'degrees', case insensitive
        const cleanInput = userInputValue.replace(/[^0-9]/g, '');
        const cleanAnswer = currentQ.correctAnswer?.replace(/[^0-9]/g, '');
        if (!cleanInput) return;
        isCorrect = cleanInput === cleanAnswer;
    }

    // SCORING LOGIC
    if (isCorrect) {
        setQuestionStatus('correct');
        if (attempts === 0) {
            setScore(s => s + 5); // Perfect first try
        } else {
            setScore(s => s + 3); // Correct on second try
        }
    } else {
        // Wrong answer
        if (attempts === 0) {
            // First attempt failed
            setAttempts(1);
            setScore(s => Math.max(0, s - 5)); // Penalty
            setQuestionStatus('wrong'); // Shows hint
        } else {
            // Second attempt failed
            setAttempts(2);
            setQuestionStatus('wrong'); // Shows solution
        }
    }
  };

  // --- Logic for Drag Drop (Kept instant feedback as per previous design) ---
  const handleItemClick = (item: QuizItem) => {
    setSelectedItem(item);
    setFeedbackMsg(null);
  };

  const handleBucketClick = (bucketName: string) => {
    if (!selectedItem) {
        setFeedbackMsg({ text: 'Прво избери триаголник!', type: 'error' });
        return;
    }

    if (selectedItem.category === bucketName) {
        // Correct
        setScore(s => s + 5);
        setFeedbackMsg({ text: 'Точно! +5 поени', type: 'success' });
        setRemainingItems(prev => prev.filter(i => i.id !== selectedItem.id));
        setSelectedItem(null);
    } else {
        // Incorrect
        setScore(s => Math.max(0, s - 5));
        setFeedbackMsg({ text: 'Грешка! -5 поени', type: 'error' });
    }
  };

  const nextQuestion = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(p => p + 1);
    } else {
      setShowResult(true);
    }
  };

  const restart = () => {
    setCurrentIdx(0);
    setScore(0);
    setShowResult(false);
  };

  // --- RENDERERS ---

  if (showResult) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl shadow-sm text-center animate-fade-in-up">
        <Trophy className="text-yellow-500 mb-4" size={64} />
        <h2 className="text-3xl font-bold mb-4 text-slate-800">Браво мајсторе!</h2>
        <p className="text-lg text-slate-600 mb-6">Освои вкупно: <span className="font-bold text-blue-600 text-2xl">{score}</span> поени!</p>
        <button 
          onClick={restart}
          className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition shadow-lg hover:shadow-xl font-bold"
        >
          <RefreshCw size={20} /> Играј повторно
        </button>
      </div>
    );
  }

  // Determine button label/state
  const isFinished = questionStatus === 'correct' || attempts >= 2;
  const btnText = isFinished ? 'Следно прашање' : attempts === 1 ? 'Обиди се повторно' : 'Провери';
  
  return (
    <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden min-h-[400px] flex flex-col">
      {/* Top Bar - More Compact */}
      <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex justify-between items-center">
        <div className="flex items-center gap-2">
            <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider">
                Ниво {currentIdx + 1}/{questions.length}
            </span>
            <span className="text-slate-400">|</span>
            <span className="font-semibold text-slate-700 text-sm">{currentQ.type === 'DRAG_DROP' ? 'Интерактивна игра' : 'Квиз'}</span>
        </div>
        <div className="flex items-center gap-2 bg-yellow-50 px-3 py-1 rounded-full border border-yellow-100">
             <Trophy size={14} className="text-yellow-600" />
             <span className="font-bold text-yellow-700 text-sm">{score} поени</span>
        </div>
      </div>

      <div className="p-6 flex-1 flex flex-col">
        <h3 className="text-xl font-bold text-slate-800 mb-4 text-center">{currentQ.question}</h3>

        {/* --- MCQ RENDER --- */}
        {currentQ.type === 'MCQ' && (
            <div className="max-w-xl mx-auto w-full flex-1 flex flex-col justify-center">
                <div className="space-y-2">
                {currentQ.options?.map((opt, idx) => {
                    let baseStyle = "w-full px-4 py-3 rounded-lg border text-left transition flex justify-between items-center text-base font-medium ";
                    const isSelected = mcqSelected === idx;
                    const isTheCorrect = idx === currentQ.correctIndex;

                    if (questionStatus === 'correct' && isTheCorrect) {
                        baseStyle += "border-green-500 bg-green-50 text-green-800";
                    } else if (attempts === 2 && isTheCorrect) {
                        // Failed twice, show correct
                        baseStyle += "border-green-500 bg-green-50 text-green-800";
                    } else if (isSelected) {
                         baseStyle += "border-blue-500 bg-blue-50 text-blue-800 shadow-sm ring-1 ring-blue-200";
                    } else {
                        baseStyle += "border-slate-200 hover:border-blue-300 hover:bg-slate-50 cursor-pointer";
                    }

                    return (
                    <button key={idx} disabled={isFinished} onClick={() => handleMcqSelect(idx)} className={baseStyle}>
                        <span>{opt}</span>
                        {questionStatus === 'correct' && isTheCorrect && <CheckCircle className="text-green-600" size={20} />}
                        {attempts === 2 && isTheCorrect && <CheckCircle className="text-green-600 opacity-50" size={20} />}
                    </button>
                    );
                })}
                </div>
            </div>
        )}

        {/* --- INPUT RENDER --- */}
        {currentQ.type === 'INPUT' && (
             <div className="max-w-sm mx-auto w-full flex-1 flex flex-col justify-center items-center">
                 <div className="relative w-full">
                    <input 
                        type="text" 
                        value={userInputValue}
                        onChange={(e) => setUserInputValue(e.target.value)}
                        disabled={isFinished}
                        className={`w-full text-center text-3xl font-bold p-2 border-b-4 focus:outline-none bg-transparent transition-colors
                            ${isFinished && questionStatus === 'correct' ? 'border-green-500 text-green-600' : ''}
                            ${attempts > 0 && questionStatus === 'wrong' && !isFinished ? 'border-orange-400 text-orange-600' : 'border-slate-300 focus:border-blue-500'}
                        `}
                        placeholder="?"
                    />
                    <Keyboard className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-300" size={20}/>
                 </div>
                 <p className="text-slate-400 mt-2 text-xs">Впиши го бројот и притисни провери</p>
             </div>
        )}

        {/* --- FEEDBACK AREA (MCQ & INPUT) --- */}
        {currentQ.type !== 'DRAG_DROP' && (
            <div className="mt-6 max-w-xl mx-auto w-full space-y-3">
                
                {/* HINT BOX (After 1st fail) */}
                {attempts === 1 && questionStatus === 'wrong' && (
                    <div className="bg-orange-50 border border-orange-200 p-3 rounded-xl flex items-start gap-3 animate-fade-in-up">
                        <HelpCircle className="text-orange-500 shrink-0 mt-1" size={20} />
                        <div>
                            <p className="font-bold text-orange-700 text-sm">Грешка! (-5 поени)</p>
                            <p className="text-orange-800 text-sm mt-0.5">{currentQ.hint}</p>
                            <p className="text-xs text-orange-600 mt-1 font-semibold">Обиди се повторно за +3 поени!</p>
                        </div>
                    </div>
                )}

                {/* SUCCESS BOX */}
                {questionStatus === 'correct' && (
                    <div className="bg-green-50 border border-green-200 p-3 rounded-xl flex items-center gap-3 animate-fade-in">
                        <CheckCircle className="text-green-500 shrink-0" size={24} />
                        <div>
                            <p className="font-bold text-green-700 text-sm">
                                {attempts === 0 ? 'Точно! (+5 поени)' : 'Браво! Го поправи одговорот. (+3 поени)'}
                            </p>
                            <p className="text-green-800 text-xs mt-0.5">{currentQ.explanation}</p>
                        </div>
                    </div>
                )}

                {/* FAIL BOX (After 2nd fail) */}
                {attempts === 2 && questionStatus === 'wrong' && (
                    <div className="bg-red-50 border border-red-200 p-3 rounded-xl flex items-center gap-3 animate-fade-in">
                        <XCircle className="text-red-500 shrink-0" size={24} />
                        <div>
                            <p className="font-bold text-red-700 text-sm">Немаш повеќе обиди.</p>
                            <p className="text-red-800 text-xs mt-0.5">Точниот одговор е: <span className="font-bold">{currentQ.options ? currentQ.options[currentQ.correctIndex!] : currentQ.correctAnswer}</span></p>
                            <p className="text-slate-600 text-xs mt-0.5">{currentQ.explanation}</p>
                        </div>
                    </div>
                )}

                {/* ACTION BUTTON */}
                <div className="flex justify-center pt-2">
                    <button 
                        onClick={submitAnswer} 
                        className={`
                            flex items-center gap-2 px-6 py-2.5 rounded-full font-bold text-base shadow-md transition-all
                            ${isFinished 
                                ? 'bg-slate-800 text-white hover:bg-slate-900' 
                                : attempts === 1 
                                    ? 'bg-orange-500 text-white hover:bg-orange-600'
                                    : 'bg-blue-600 text-white hover:bg-blue-700'
                            }
                        `}
                    >
                        {btnText} <ArrowRight size={18} />
                    </button>
                </div>
            </div>
        )}

        {/* --- DRAG DROP RENDER (Unchanged logic) --- */}
        {currentQ.type === 'DRAG_DROP' && (
            <div className="flex flex-col h-full">
                {/* Visual Feedback Message */}
                <div className="h-6 mb-2 flex justify-center">
                    {feedbackMsg && (
                        <span className={`px-3 py-0.5 rounded-full text-xs font-bold animate-bounce ${feedbackMsg.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {feedbackMsg.text}
                        </span>
                    )}
                </div>

                {/* Drop Zone (Buckets) */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                    {currentQ.buckets?.map((bucket) => (
                        <div 
                            key={bucket}
                            onClick={() => handleBucketClick(bucket)}
                            className={`
                                h-24 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all duration-200
                                ${selectedItem ? 'border-blue-400 bg-blue-50 hover:bg-blue-100 hover:scale-105 shadow-md' : 'border-slate-300 bg-slate-50'}
                            `}
                        >
                            <span className="font-bold text-slate-600 text-sm mb-1 text-center leading-tight">{bucket}</span>
                            {selectedItem && <div className="text-[10px] text-blue-400 font-semibold animate-pulse">Кликни тука</div>}
                        </div>
                    ))}
                </div>

                {/* Divider */}
                <div className="border-t border-slate-200 my-3 relative">
                    <span className="absolute top-[-10px] left-1/2 -translate-x-1/2 bg-white px-3 text-slate-400 text-xs">
                        Триаголници за сортирање
                    </span>
                </div>

                {/* Source Items */}
                <div className="flex-1 flex flex-wrap justify-center content-start gap-4 p-2 min-h-[150px]">
                    {remainingItems.length === 0 ? (
                         <div className="flex flex-col items-center justify-center w-full h-full animate-fade-in">
                            <CheckCircle size={32} className="text-green-500 mb-2"/>
                            <p className="text-slate-600 font-bold text-sm">Сите се сортирани!</p>
                            <button onClick={nextQuestion} className="mt-3 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full font-bold transition shadow-lg animate-pulse text-sm">
                                Продолжи понатаму <ArrowRight size={16} />
                            </button>
                         </div>
                    ) : (
                        remainingItems.map((item) => (
                            <div 
                                key={item.id}
                                onClick={() => handleItemClick(item)}
                                className={`
                                    w-20 h-20 bg-white rounded-lg shadow-sm border-2 cursor-pointer flex items-center justify-center p-1.5 transition-all duration-200
                                    ${selectedItem?.id === item.id ? 'border-blue-500 ring-4 ring-blue-100 scale-110 z-10' : 'border-slate-200 hover:border-blue-300 hover:shadow-md'}
                                `}
                            >
                                <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-sm">
                                    <path d={item.content} fill="#0ea5e9" stroke="#0284c7" strokeWidth="2" strokeLinejoin="round" />
                                </svg>
                            </div>
                        ))
                    )}
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default QuizView;