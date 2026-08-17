import React, { useState, useEffect, useMemo } from 'react';
import PomodoroTimer from './components/PomodoroTimer';
import FAB from './components/FAB';
import ErrorBoundary from './ErrorBoundary';

export default function App() {
  const [topics, setTopics] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('study_147_topics');
    if (stored) {
      try {
        setTopics(JSON.parse(stored));
      } catch (e) {}
    }
  }, []);

  const handleSessionComplete = (minutes, topicId) => {
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
      <div id="app-root" className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <main className="container-lg">
          <PomodoroTimer onSessionComplete={handleSessionComplete} />
        </main>

        {/* Floating Add button (portal) */}
        <FAB onClick={() => setIsAddModalOpen(true)} />
      </div>
    </ErrorBoundary>
  );
}
