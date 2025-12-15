
import React, { useState, useEffect } from 'react';
import { QuizQuestion, QuizItem } from '../types';
import { CheckCircle, XCircle, RefreshCw, Trophy, ArrowRight, HelpCircle, Keyboard, Star } from 'lucide-react';

interface Props {
  questions: QuizQuestion[];
}

const QuizView: React.FC<Props> = ({ questions }) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [attempts, setAttempts] = useState(0); 
  const [questionStatus, setQuestionStatus] = useState<'unanswered' | 'correct' | 'wrong'>('unanswered');
  const [mcqSelected, setMcqSelected] = useState<number | null>(null);
  const [userInputValue, setUserInputValue] = useState('');
  const [remainingItems, setRemainingItems] = useState<QuizItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<QuizItem | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{text: string, type: 'success'|'error'} | null>(null);

  const currentQ = questions[currentIdx];

  useEffect(() => {
    setAttempts(0);
    setQuestionStatus('unanswered');
    setMcqSelected(null);
    setUserInputValue('');
    
    if (currentQ.type === 'DRAG_DROP' && currentQ.items) {
      setRemainingItems([...currentQ.items].sort(() => Math.random() - 0.5));
      setSelectedItem(null);
      setFeedbackMsg(null);
    } 
  }, [currentIdx, currentQ]);

  const handleMcqSelect = (idx: number) => {
    if (questionStatus === 'correct' || attempts >= 2) return;
    setMcqSelected(idx);
  };

  const submitAnswer = () => {
    if (questionStatus === 'correct' || attempts >= 2) {
        nextQuestion();
        return;
    }

    let isCorrect = false;

    if (currentQ.type === 'MCQ') {
        if (mcqSelected === null) return;
        isCorrect = mcqSelected === currentQ.correctIndex;
    } else if (currentQ.type === 'INPUT') {
        const cleanInput = userInputValue.replace(/[^0-9]/g, '');
        const cleanAnswer = currentQ.correctAnswer?.replace(/[^0-9]/g, '');
        if (!cleanInput) return;
        isCorrect = cleanInput === cleanAnswer;
    }

    if (isCorrect) {
        setQuestionStatus('correct');
        setScore(s => s + (attempts === 0 ? 5 : 3));
    } else {
        setAttempts(prev => prev + 1);
        setQuestionStatus('wrong');
        setScore(s => Math.max(0, s - 5));
    }
  };

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
        setScore(s => s + 5);
        setFeedbackMsg({ text: 'Точно! +5 поени', type: 'success' });
        setRemainingItems(prev => prev.filter(i => i.id !== selectedItem.id));
        setSelectedItem(null);
    } else {
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
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-3xl shadow-xl text-center animate-fade-in-up border-4 border-white ring-4 ring-blue-50">
        <div className="relative mb-6">
            <div className="absolute inset-0 bg-yellow-300 blur-xl opacity-50 rounded-full"></div>
            <Trophy className="text-yellow-500 relative z-10 drop-shadow-md" size={80} strokeWidth={1.5} />
        </div>
        <h2 className="text-4xl font-extrabold mb-4 text-slate-900">Честитки!</h2>
        <p className="text-xl text-slate-600 mb-8 font-medium">Твојот резултат е:</p>
        <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 mb-10">
            {score}
        </div>
        <button 
          onClick={restart}
          className="flex items-center gap-3 px-10 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl hover:scale-105 transition-all shadow-lg hover:shadow-blue-200 font-bold text-lg"
        >
          <RefreshCw size={24} /> Играј повторно
        </button>
      </div>
    );
  }

  const isFinished = questionStatus === 'correct' || attempts >= 2;
  const btnText = isFinished ? 'Следно прашање' : attempts === 1 ? 'Обиди се повторно' : 'Провери';
  
  return (
    <div className="max-w-4xl mx-auto bg-white rounded-[2.5rem] shadow-2xl overflow-hidden min-h-[500px] flex flex-col border border-slate-100 relative">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-bl-full -z-0 opacity-50 pointer-events-none"></div>

      {/* Top Bar */}
      <div className="relative z-10 px-8 py-6 flex justify-between items-center">
        <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center font-bold text-slate-600 shadow-inner">
                {currentIdx + 1}
            </div>
            <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Прашање</span>
                <span className="text-sm font-bold text-slate-800">од вкупно {questions.length}</span>
            </div>
        </div>
        
        <div className="flex items-center gap-3 bg-white px-5 py-2 rounded-2xl shadow-md border border-slate-100">
             <div className="bg-yellow-100 p-1.5 rounded-full">
                <Trophy size={20} className="text-yellow-600 fill-yellow-600" />
             </div>
             <span className="font-extrabold text-xl text-slate-800">{score}</span>
        </div>
      </div>

      <div className="px-8 md:px-12 pb-10 flex-1 flex flex-col relative z-10">
        <h3 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-8 text-center leading-tight">
            {currentQ.question}
        </h3>

        {/* --- MCQ RENDER --- */}
        {currentQ.type === 'MCQ' && (
            <div className="grid grid-cols-1 gap-4 max-w-2xl mx-auto w-full">
                {currentQ.options?.map((opt, idx) => {
                    const isSelected = mcqSelected === idx;
                    const isTheCorrect = idx === currentQ.correctIndex;
                    let cardClass = "relative w-full px-6 py-5 rounded-2xl border-2 text-left transition-all duration-200 flex justify-between items-center text-lg font-bold shadow-sm ";

                    if (questionStatus === 'correct' && isTheCorrect) {
                        cardClass += "border-green-500 bg-green-50 text-green-800 scale-105";
                    } else if (attempts === 2 && isTheCorrect) {
                        cardClass += "border-green-500 bg-green-50 text-green-800";
                    } else if (attempts > 0 && isSelected && !isTheCorrect) { // Show error on selected wrong
                         cardClass += "border-red-400 bg-red-50 text-red-800";
                    } else if (isSelected) {
                         cardClass += "border-blue-500 bg-blue-50 text-blue-800 ring-4 ring-blue-100";
                    } else {
                        cardClass += "border-slate-100 bg-white hover:border-blue-200 hover:shadow-md hover:-translate-y-1 text-slate-700";
                    }

                    return (
                    <button key={idx} disabled={isFinished} onClick={() => handleMcqSelect(idx)} className={cardClass}>
                        <span>{opt}</span>
                        {questionStatus === 'correct' && isTheCorrect && <CheckCircle className="text-green-600 fill-green-100" size={28} />}
                        {attempts > 0 && isSelected && !isTheCorrect && <XCircle className="text-red-500 fill-red-100" size={28} />}
                    </button>
                    );
                })}
            </div>
        )}

        {/* --- INPUT RENDER --- */}
        {currentQ.type === 'INPUT' && (
             <div className="max-w-md mx-auto w-full flex-1 flex flex-col justify-center items-center">
                 <div className="relative w-full">
                    <input 
                        type="text" 
                        value={userInputValue}
                        onChange={(e) => setUserInputValue(e.target.value)}
                        disabled={isFinished}
                        className={`
                            w-full text-center text-5xl font-black py-6 border-b-4 focus:outline-none bg-transparent transition-all placeholder:text-slate-200
                            ${isFinished && questionStatus === 'correct' ? 'border-green-500 text-green-600' : ''}
                            ${attempts > 0 && questionStatus === 'wrong' && !isFinished ? 'border-orange-400 text-orange-600' : 'border-slate-300 focus:border-blue-500 text-slate-800'}
                        `}
                        placeholder="0"
                    />
                    {!isFinished && <Keyboard className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" size={32}/>}
                 </div>
                 <p className="text-slate-400 mt-4 text-sm font-medium">Впиши го точниот број</p>
             </div>
        )}

        {/* --- FEEDBACK AREA --- */}
        {currentQ.type !== 'DRAG_DROP' && (
            <div className="mt-10 max-w-2xl mx-auto w-full space-y-4">
                {/* Hint/Error */}
                {attempts === 1 && questionStatus === 'wrong' && (
                    <div className="bg-orange-50 border border-orange-100 p-5 rounded-2xl flex items-start gap-4 animate-fade-in-up shadow-sm">
                        <div className="bg-orange-100 p-2 rounded-full">
                            <HelpCircle className="text-orange-600" size={24} />
                        </div>
                        <div>
                            <p className="font-bold text-orange-800 text-lg">Мала помош...</p>
                            <p className="text-orange-700 font-medium">{currentQ.hint}</p>
                        </div>
                    </div>
                )}

                {/* Success */}
                {questionStatus === 'correct' && (
                    <div className="bg-green-50 border border-green-100 p-5 rounded-2xl flex items-center gap-4 animate-fade-in shadow-sm">
                        <div className="bg-green-100 p-2 rounded-full">
                            <Star className="text-green-600 fill-green-600" size={24} />
                        </div>
                        <div>
                            <p className="font-bold text-green-800 text-lg">
                                {attempts === 0 ? 'Одлично! +5 поени' : 'Добро е! +3 поени'}
                            </p>
                            <p className="text-green-700 font-medium">{currentQ.explanation}</p>
                        </div>
                    </div>
                )}

                {/* Fail */}
                {attempts === 2 && questionStatus === 'wrong' && (
                    <div className="bg-red-50 border border-red-100 p-5 rounded-2xl flex items-center gap-4 animate-fade-in shadow-sm">
                        <div className="bg-red-100 p-2 rounded-full">
                            <XCircle className="text-red-600" size={24} />
                        </div>
                        <div>
                            <p className="font-bold text-red-800 text-lg">Точниот одговор е {currentQ.options ? currentQ.options[currentQ.correctIndex!] : currentQ.correctAnswer}</p>
                            <p className="text-red-700 font-medium">{currentQ.explanation}</p>
                        </div>
                    </div>
                )}

                {/* ACTION BUTTON */}
                <div className="flex justify-center pt-4">
                    <button 
                        onClick={submitAnswer} 
                        className={`
                            flex items-center gap-3 px-10 py-4 rounded-2xl font-black text-lg shadow-lg transition-all hover:-translate-y-1 hover:shadow-xl
                            ${isFinished 
                                ? 'bg-slate-800 text-white hover:bg-slate-900' 
                                : attempts === 1 
                                    ? 'bg-orange-500 text-white hover:bg-orange-600 ring-4 ring-orange-200'
                                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white ring-4 ring-blue-100'
                            }
                        `}
                    >
                        {btnText} <ArrowRight size={24} />
                    </button>
                </div>
            </div>
        )}

        {/* --- DRAG DROP RENDER --- */}
        {currentQ.type === 'DRAG_DROP' && (
            <div className="flex flex-col h-full mt-4">
                {/* Feedback Toast */}
                <div className="h-8 mb-4 flex justify-center">
                    {feedbackMsg && (
                        <span className={`px-6 py-2 rounded-full text-sm font-bold shadow-md animate-bounce ${feedbackMsg.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                            {feedbackMsg.text}
                        </span>
                    )}
                </div>

                {/* Drop Zones */}
                <div className="grid grid-cols-3 gap-4 mb-8">
                    {currentQ.buckets?.map((bucket) => (
                        <div 
                            key={bucket}
                            onClick={() => handleBucketClick(bucket)}
                            className={`
                                h-32 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center cursor-pointer transition-all duration-200 relative overflow-hidden group
                                ${selectedItem ? 'border-blue-400 bg-blue-50/50 hover:bg-blue-100 hover:scale-105 shadow-lg' : 'border-slate-200 bg-slate-50/50 hover:bg-white'}
                            `}
                        >
                            <span className="font-extrabold text-slate-700 text-base z-10 text-center px-2">{bucket}</span>
                            {selectedItem && <div className="absolute inset-0 bg-blue-500/10 animate-pulse z-0"></div>}
                        </div>
                    ))}
                </div>

                {/* Items Area */}
                <div className="flex-1 bg-slate-100 rounded-3xl p-6 relative">
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white px-4 py-1 rounded-full text-xs font-bold text-slate-400 shadow-sm border border-slate-100">
                        Сортирај ги формите
                    </div>
                    
                    <div className="flex flex-wrap justify-center gap-6">
                        {remainingItems.length === 0 ? (
                             <div className="flex flex-col items-center justify-center w-full py-8 animate-fade-in">
                                <div className="bg-green-100 p-4 rounded-full mb-4">
                                    <CheckCircle size={40} className="text-green-600 fill-green-600"/>
                                </div>
                                <p className="text-slate-800 font-bold text-xl mb-4">Сите се сортирани!</p>
                                <button onClick={nextQuestion} className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white px-8 py-3 rounded-xl font-bold transition shadow-lg animate-pulse">
                                    Продолжи <ArrowRight size={20} />
                                </button>
                             </div>
                        ) : (
                            remainingItems.map((item) => (
                                <div 
                                    key={item.id}
                                    onClick={() => handleItemClick(item)}
                                    className={`
                                        w-24 h-24 bg-white rounded-2xl shadow-md cursor-pointer flex items-center justify-center p-2 transition-all duration-200
                                        ${selectedItem?.id === item.id ? 'ring-4 ring-blue-500 scale-110 rotate-3 z-10 shadow-xl' : 'hover:scale-105 hover:shadow-lg hover:-rotate-2'}
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
            </div>
        )}
      </div>
    </div>
  );
};

export default QuizView;
