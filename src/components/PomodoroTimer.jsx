import React, { useState, useEffect } from 'react';

export default function PomodoroTimer({ onSessionComplete }) {
  const [seconds, setSeconds] = useState(25 * 60);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) return;
    if (seconds <= 0) {
      setRunning(false);
      setSeconds(25 * 60);
      if (onSessionComplete) onSessionComplete(25);
      return;
    }
    const id = setInterval(() => setSeconds((s) => s - 1), 1000);
    return () => clearInterval(id);
  }, [running, seconds, onSessionComplete]);

  const format = (s) => `${Math.floor(s / 60)
    .toString()
    .padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <div className="bg-slate-900 p-4 rounded-xl">
      <div className="text-4xl font-bold">{format(seconds)}</div>
      <div className="mt-3 space-x-2">
        <button onClick={() => setRunning(true)} className="px-3 py-1 bg-indigo-600 rounded text-white">Start</button>
        <button onClick={() => setRunning(false)} className="px-3 py-1 bg-slate-700 rounded text-white">Pause</button>
        <button
          onClick={() => {
            setRunning(false);
            setSeconds(25 * 60);
          }}
          className="px-3 py-1 bg-rose-600 rounded text-white"
        >
          Reset
        </button>
      </div>
    </div>
  );
}
