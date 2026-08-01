import React, { useState, useEffect, useMemo } from 'react';

// --- Sound Synthesizer via Web Audio API ---
const playAudioEffect = (type = 'success') => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'success') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.1);
      osc.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } else if (type === 'timer') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    }
  } catch (e) {}
};

// --- Helper Date Functions ---
const formatDateISO = (date = new Date()) => {
  const d = new Date(date);
  const month = '' + (d.getMonth() + 1);
  const day = '' + d.getDate();
  const year = d.getFullYear();
  return [year, month.padStart(2, '0'), day.padStart(2, '0')].join('-');
};

const addDaysToISO = (isoDateStr, days) => {
  const d = new Date(isoDateStr);
  d.setDate(d.getDate() + days);
  return formatDateISO(d);
};

const getDaysDifference = (isoDateStr1, isoDateStr2) => {
  const d1 = new Date(isoDateStr1);
  const d2 = new Date(isoDateStr2);
  const diffTime = d2.getTime() - d1.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

const formatDisplayDate = (isoStr) => {
  if (!isoStr) return '';
  const today = formatDateISO();
  if (isoStr === today) return 'Today';
  const diff = getDaysDifference(today, isoStr);
  if (diff === 1) return 'Tomorrow';
  if (diff === -1) return 'Yesterday';
  if (diff < -1) return `${Math.abs(diff)} days ago`;
  if (diff > 1) return `In ${diff} days`;
  const d = new Date(isoStr);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const SUBJECT_COLORS = {
  Mathematics: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30' },
  Science: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  History: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' },
  Programming: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30' },
  Languages: { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/30' },
  Other: { bg: 'bg-gray-500/10', text: 'text-gray-400', border: 'border-gray-500/30' },
};

export default function App() {
  const [topics, setTopics] = useState(() => {
    const saved = localStorage.getItem('study_147_topics');
    return saved ? JSON.parse(saved) : [];
  });
  const [mistakes, setMistakes] = useState(() => {
    const saved = localStorage.getItem('study_147_mistakes');
    return saved ? JSON.parse(saved) : [];
  });
  const [stats, setStats] = useState(() => {
    const saved = localStorage.getItem('study_147_stats');
    return saved ? JSON.parse(saved) : { xp: 0, level: 1, streak: 0, lastStudyDate: formatDateISO(), totalMinutes: 0 };
  });

  const [activeTab, setActiveTab] = useState('home');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isRevisionModalOpen, setIsRevisionModalOpen] = useState(false);
  const [activeRevisionTask, setActiveRevisionTask] = useState(null);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(formatDateISO());

  const [newTopic, setNewTopic] = useState({ subject: 'Programming', title: '', notes: '' });
  const [newMistake, setNewMistake] = useState({ title: '', correction: '' });
  const [isAddMistakeOpen, setIsAddMistakeOpen] = useState(false);

  useEffect(() => localStorage.setItem('study_147_topics', JSON.stringify(topics)), [topics]);
  useEffect(() => localStorage.setItem('study_147_mistakes', JSON.stringify(mistakes)), [mistakes]);
  useEffect(() => localStorage.setItem('study_147_stats', JSON.stringify(stats)), [stats]);

  const todayStr = formatDateISO();

  const todayRevisions = useMemo(() => {
    const list = [];
    topics.forEach(t => {
      if (t.archived) return;
      if (t.day1Date <= todayStr && !t.day1Completed) list.push({ ...t, stage: 1, isOverdue: t.day1Date < todayStr });
      else if (t.day1Completed && t.day4Date <= todayStr && !t.day4Completed) list.push({ ...t, stage: 4, isOverdue: t.day4Date < todayStr });
      else if (t.day4Completed && t.day7Date <= todayStr && !t.day7Completed) list.push({ ...t, stage: 7, isOverdue: t.day7Date < todayStr });
    });
    return list;
  }, [topics, todayStr]);

  const addXP = (amount) => {
    playAudioEffect('success');
    setStats(prev => {
      const newXp = prev.xp + amount;
      return { ...prev, xp: newXp, level: Math.floor(newXp / 200) + 1, lastStudyDate: todayStr };
    });
  };

  const handleCreateTopic = (e) => {
    e.preventDefault();
    if (!newTopic.title.trim()) return;
    const created = formatDateISO();
    setTopics(prev => [{
      id: 'topic-' + Date.now(), subject: newTopic.subject, title: newTopic.title.trim(), notes: newTopic.notes.trim(),
      createdAt: created, day1Date: created, day4Date: addDaysToISO(created, 3), day7Date: addDaysToISO(created, 6),
      day1Completed: false, day4Completed: false, day7Completed: false, archived: false
    }, ...prev]);
    setNewTopic({ subject: 'Programming', title: '', notes: '' });
    setIsAddModalOpen(false);
  };

  const handleCompleteRevision = (topicId, stage) => {
    setTopics(prev => prev.map(t => {
      if (t.id === topicId) {
        if (stage === 1) return { ...t, day1Completed: true };
        if (stage === 4) return { ...t, day4Completed: true };
        if (stage === 7) return { ...t, day7Completed: true };
      }
      return t;
    }));
    addXP(stage === 7 ? 80 : 30);
    setIsRevisionModalOpen(false);
  };

  const handleDeleteTopic = (id) => {
    if(window.confirm('Delete this topic permanently?')) {
        setTopics(prev => prev.filter(t => t.id !== id));
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col md:flex-row antialiased">
      <aside className="w-full md:w-64 bg-slate-900 border-b md:border-b-0 md:border-r border-slate-800 flex md:flex-col justify-between shrink-0 sticky top-0 z-40">
        <div>
          <div className="p-4 md:p-6 flex items-center justify-between border-b border-slate-800/60">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-500 flex items-center justify-center font-black text-xl shadow-lg">147</div>
              <div>
                <h1 className="font-bold text-base leading-tight text-white">Revision 147</h1>
                <p className="text-xs text-slate-400">Memory Tracker</p>
              </div>
            </div>
          </div>
          <nav className="p-2 md:p-3 space-x-1 md:space-x-0 md:space-y-1 flex md:block overflow-x-auto">
            {[
              { id: 'home', label: 'Dashboard', badge: todayRevisions.length },
              { id: 'topics', label: 'All Topics', badge: 0 },
              { id: 'calendar', label: 'Calendar', badge: 0 },
              { id: 'pomodoro', label: 'Focus Timer', badge: 0 },
              { id: 'mistakes', label: 'Mistakes', badge: mistakes.filter(m => !m.resolved).length },
            ].map(item => (
              <button key={item.id} onClick={() => setActiveTab(item.id)} className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs md:text-sm font-medium transition-all ${ activeTab === item.id ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200' }`}>
                <span>{item.label}</span>
                {item.badge > 0 && <span className="ml-2 px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">{item.badge}</span>}
              </button>
            ))}
          </nav>
        </div>
        <div className="hidden md:block p-4 border-t border-slate-800">
          <button onClick={() => setIsAddModalOpen(true)} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 px-4 rounded-xl shadow-lg transition text-sm">+ Add New Topic</button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 max-w-6xl mx-auto w-full">
        <div className="flex justify-between items-center pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-2xl font-extrabold text-white capitalize">
              {activeTab === 'home' && '📅 Dashboard'}
              {activeTab === 'topics' && '📚 All Topics'}
              {activeTab === 'calendar' && '🗓️ Revision Calendar'}
              {activeTab === 'pomodoro' && '⏱️ Pomodoro Timer'}
              {activeTab === 'mistakes' && '📓 Mistake Vault'}
            </h2>
          </div>
          <div className="flex space-x-3">
             <div className="bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl text-amber-400 font-bold text-sm">⭐ Lvl {stats.level} ({stats.xp} XP)</div>
            <button onClick={() => setIsAddModalOpen(true)} className="md:hidden bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm px-4 py-2 rounded-xl">+ Add</button>
          </div>
        </div>

        {activeTab === 'home' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
                <div className="text-slate-400 text-xs font-semibold uppercase">Due Today</div>
                <div className="text-3xl font-black text-rose-400 mt-1">{todayRevisions.length}</div>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
                <div className="text-slate-400 text-xs font-semibold uppercase">Total Topics</div>
                <div className="text-3xl font-black text-indigo-400 mt-1">{topics.length}</div>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
                <div className="text-slate-400 text-xs font-semibold uppercase">Focus Time</div>
                <div className="text-3xl font-black text-emerald-400 mt-1">{stats.totalMinutes}m</div>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
                <div className="text-slate-400 text-xs font-semibold uppercase">Total XP</div>
                <div className="text-3xl font-black text-amber-400 mt-1">{stats.xp}</div>
              </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4">
              <h3 className="text-lg font-bold text-white">Today's Revisions</h3>
              {todayRevisions.length === 0 ? (
                <div className="text-center py-10 bg-slate-950 rounded-xl border border-dashed border-slate-800 text-slate-400">You are completely caught up! Add a new topic to start learning.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {todayRevisions.map((item) => (
                    <div key={item.id} className={`p-4 rounded-xl bg-slate-900 border ${item.isOverdue ? 'border-rose-500/50' : 'border-slate-800'} flex flex-col justify-between space-y-3`}>
                      <div>
                        <div className="text-[10px] text-indigo-400 font-bold uppercase mb-1">Day {item.stage} Revision • {item.subject}</div>
                        <h4 className="text-base font-bold text-white">{item.title}</h4>
                      </div>
                      <button onClick={() => { setActiveRevisionTask(item); setIsRevisionModalOpen(true); }} className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3.5 py-2 rounded-lg">
                        Start Revision
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'topics' && (
          <div className="space-y-4">
            {topics.length === 0 ? (
               <div className="text-center py-10 bg-slate-900 rounded-xl text-slate-400">No topics tracked yet.</div>
            ) : topics.map(topic => {
              const color = SUBJECT_COLORS[topic.subject] || SUBJECT_COLORS.Other;
              return (
                <div key={topic.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 relative">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center space-x-2">
                       <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${color.bg} ${color.text} border ${color.border}`}>{topic.subject}</span>
                       <h3 className="text-base font-bold text-white">{topic.title}</h3>
                    </div>
                    <button onClick={() => handleDeleteTopic(topic.id)} className="text-slate-500 hover:text-rose-400 text-xs">✕ Delete</button>
                  </div>
                  {topic.notes && <p className="text-xs text-slate-400 mb-4 bg-slate-950 p-2 rounded-lg">{topic.notes}</p>}
                  <div className="grid grid-cols-3 gap-2 mt-4 text-center text-xs font-bold">
                    <div className={`p-2 rounded-lg border flex flex-col items-center justify-center ${topic.day1Completed ? 'bg-emerald-900/30 border-emerald-500/30 text-emerald-400' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>
                      <span>Day 1</span><span className="text-[9px] opacity-70 mt-1">{formatDisplayDate(topic.day1Date)}</span><span className="mt-1">{topic.day1Completed ? '✅' : '⏳'}</span>
                    </div>
                    <div className={`p-2 rounded-lg border flex flex-col items-center justify-center ${topic.day4Completed ? 'bg-emerald-900/30 border-emerald-500/30 text-emerald-400' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>
                      <span>Day 4</span><span className="text-[9px] opacity-70 mt-1">{formatDisplayDate(topic.day4Date)}</span><span className="mt-1">{topic.day4Completed ? '✅' : '⏳'}</span>
                    </div>
                    <div className={`p-2 rounded-lg border flex flex-col items-center justify-center ${topic.day7Completed ? 'bg-emerald-900/30 border-emerald-500/30 text-emerald-400' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>
                      <span>Day 7</span><span className="text-[9px] opacity-70 mt-1">{formatDisplayDate(topic.day7Date)}</span><span className="mt-1">{topic.day7Completed ? '✅' : '⏳'}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'calendar' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
             <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">Select Date</h3>
                <input type="date" value={selectedCalendarDate} onChange={(e) => setSelectedCalendarDate(e.target.value)} className="bg-slate-800 border border-slate-700 text-white text-xs px-3 py-1.5 rounded-xl"/>
              </div>
              <div className="text-xs text-slate-400">Showing revisions scheduled for: <strong className="text-indigo-400">{formatDisplayDate(selectedCalendarDate)}</strong></div>
              {(() => {
                const tasksOnDate = [];
                topics.forEach(t => {
                  if (t.archived) return;
                  if (t.day1Date === selectedCalendarDate) tasksOnDate.push({ ...t, stage: 1, done: t.day1Completed });
                  if (t.day4Date === selectedCalendarDate) tasksOnDate.push({ ...t, stage: 4, done: t.day4Completed });
                  if (t.day7Date === selectedCalendarDate) tasksOnDate.push({ ...t, stage: 7, done: t.day7Completed });
                });
                if (tasksOnDate.length === 0) return <div className="text-center py-10 bg-slate-950 rounded-xl text-slate-500">No tasks on this date.</div>;
                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                    {tasksOnDate.map(task => (
                      <div key={task.id + task.stage} className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex justify-between items-center">
                        <div>
                          <div className="text-[10px] font-bold text-indigo-400 uppercase">Day {task.stage} • {task.subject}</div>
                          <div className="text-sm font-bold text-white mt-0.5">{task.title}</div>
                        </div>
                        <span className={`text-xs px-2.5 py-1 rounded-md font-semibold ${task.done ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                          {task.done ? 'Done ✅' : 'Pending ⏳'}
                        </span>
                      </div>
                    ))}
                  </div>
                );
              })()}
          </div>
        )}

        {activeTab === 'pomodoro' && (
          <PomodoroTimer onSessionComplete={(minutes) => { addXP(50); setStats(prev => ({ ...prev, totalMinutes: prev.totalMinutes + minutes })); }} />
        )}

        {activeTab === 'mistakes' && (
           <div className="space-y-6">
            <div className="flex justify-end"><button onClick={() => setIsAddMistakeOpen(true)} className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2 rounded-xl">+ Log New Mistake</button></div>
            {mistakes.length === 0 ? (
               <div className="text-center py-10 bg-slate-900 rounded-xl text-slate-400">No mistakes logged. You are doing great!</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {mistakes.map((m) => (
                  <div key={m.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="text-sm font-bold text-white">{m.title}</h4>
                      <button onClick={() => setMistakes(prev => prev.map(item => item.id === m.id ? { ...item, resolved: !item.resolved } : item))} className={`text-[10px] font-bold px-2 py-0.5 rounded ${m.resolved ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'}`}>
                        {m.resolved ? 'Mastered ✅' : 'Mark Fixed'}
                      </button>
                    </div>
                    <p className="text-xs text-emerald-300/80 bg-emerald-950/20 p-2 rounded border border-emerald-900/30">💡 <strong>Correction:</strong> {m.correction}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* --- MODALS --- */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4">Add New Topic</h3>
            <form onSubmit={
