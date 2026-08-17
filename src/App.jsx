import React, { useState, useEffect } from 'react';
import PomodoroTimer from './components/PomodoroTimer';
import FAB from './components/FAB';
import ErrorBoundary from './ErrorBoundary';

console.log('🚀 App.jsx loaded');

export default function App() {
  console.log('📱 App component rendering');
  const [topics, setTopics] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  useEffect(() => {
    console.log('📂 Loading topics from storage...');
    const stored = localStorage.getItem('study_147_topics');
    if (stored) {
      try {
        setTopics(JSON.parse(stored));
      } catch (e) {
        console.error('❌ Failed to parse topics:', e);
      }
    }
  }, []);

  const handleSessionComplete = (minutes, topicId) => {
    console.log('✅ Session complete:', minutes, 'mins, topic:', topicId);
    if (!topicId) return;
    const idx = topics.findIndex((t) => t.id === topicId);
    if (idx === -1) return;
    const updated = [...topics];
    updated[idx].minutesTracked = (updated[idx].minutesTracked || 0) + minutes;
    setTopics(updated);
    localStorage.setItem('study_147_topics', JSON.stringify(updated));
  };

  return (
    <ErrorBoundary>
      <div id="app-root" className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
        <main className="container-lg px-4 py-6">
          <h1 className="text-3xl font-bold mb-6">📚 Study Timer (1-4-7 Rule)</h1>
          <PomodoroTimer onSessionComplete={handleSessionComplete} />
        </main>

        {/* Floating Add button (portal) */}
        <FAB onClick={() => setIsAddModalOpen(true)} />
      </div>
    </ErrorBoundary>
  );
}
