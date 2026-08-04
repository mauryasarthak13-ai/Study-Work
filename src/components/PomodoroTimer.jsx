import React, { useEffect, useRef, useState } from 'react';
import { getStorage, setStorage } from '../lib/storage';
import TimerSettingsModal from './TimerSettingsModal';

function formatTime(secs) {
  const m = Math.floor(secs / 60).toString().padStart(2, '0');
  const s = Math.floor(secs % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function playBeep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(880, ctx.currentTime);
    g.gain.setValueAtTime(0.06, ctx.currentTime);
    o.connect(g);
    g.connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + 0.18);
  } catch (e) {
    // ignore
  }
}

function fireConfetti() {
  const canvas = document.createElement('canvas');
  canvas.style.position = 'fixed';
  canvas.style.left = 0;
  canvas.style.top = 0;
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = 9999;
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  const DPR = window.devicePixelRatio || 1;
  function resize() {
    canvas.width = window.innerWidth * DPR;
    canvas.height = window.innerHeight * DPR;
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
    ctx.scale(DPR, DPR);
  }
  resize();
  window.addEventListener('resize', resize);

  const colors = ['#4F8CFF', '#7C3AED', '#22C55E', '#F59E0B', '#EF4444', '#ffffff'];
  const particles = [];
  for (let i = 0; i < 60; i++) {
    particles.push({
      x: Math.random() * window.innerWidth,
      y: -10 - Math.random() * 200,
      vx: (Math.random() - 0.5) * 6,
      vy: Math.random() * 6 + 2,
      size: Math.random() * 8 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      rot: Math.random() * 360,
      dr: (Math.random() - 0.5) * 10,
    });
  }

  let raf;
  let t0 = null;
  function loop(t) {
    if (!t0) t0 = t;
    const dt = Math.min(40, t - t0);
    t0 = t;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.15;
      p.rot += p.dr;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rot * Math.PI) / 180);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      ctx.restore();
    });
    raf = requestAnimationFrame(loop);
  }
  raf = requestAnimationFrame(loop);
  setTimeout(() => {
    cancelAnimationFrame(raf);
    window.removeEventListener('resize', resize);
    if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
  }, 2000);
}

export default function PomodoroTimer({ onSessionComplete }) {
  const savedSettings = getStorage('study_147_timer_settings', { work: 25, short: 5, long: 15, autoCycle: false, soundOn: true, saveAsDefault: false });
  const lastSession = getStorage('study_147_timer_last', 'work');
  const savedEnd = getStorage('study_147_timer_end', null);
  const savedRunning = getStorage('study_147_timer_running', false);

  const [settings, setSettings] = useState(savedSettings);
  const [openSettings, setOpenSettings] = useState(false);
  const [sessionType, setSessionType] = useState(lastSession || 'work');
  const [minutesInput, setMinutesInput] = useState(settings.work);
  const [totalSeconds, setTotalSeconds] = useState(settings.work * 60);
  const [remaining, setRemaining] = useState(settings.work * 60);
  const [running, setRunning] = useState(false);
  const [endTime, setEndTime] = useState(savedEnd);
  const intervalRef = useRef(null);
  const startedRef = useRef(false);
  const [tickAnim, setTickAnim] = useState(false);
  const sessionMinutesRef = useRef(Math.round(settings.work));

  useEffect(() => {
    setStorage('study_147_timer_settings', settings);
  }, [settings]);

  useEffect(() => {
    setStorage('study_147_timer_last', sessionType);
  }, [sessionType]);

  useEffect(() => {
    const secs = Math.max(1, Number(minutesInput)) * 60;
    setTotalSeconds(secs);
    if (!running) setRemaining(secs);
  }, [minutesInput]);

  useEffect(() => {
    if (savedEnd) {
      const now = Date.now();
      const rem = Math.max(0, Math.round((savedEnd - now) / 1000));
      setRemaining(rem);
      // If rem is zero but a session was running, ensure totalSeconds reflects configured session minutes
      if (!totalSeconds || totalSeconds < 60) setTotalSeconds(Math.max(rem, settings.work * 60));
      if (savedRunning && savedEnd > now) {
        setRunning(true);
        setEndTime(savedEnd);
      } else if (savedEnd <= now) {
        handleCompleteSilent();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setStorage('study_147_timer_running', running);
    if (endTime) setStorage('study_147_timer_end', endTime);
    else setStorage('study_147_timer_end', null);
  }, [running, endTime]);

  useEffect(() => {
    function onVisibility() {
      if (endTime) {
        const now = Date.now();
        const rem = Math.max(0, Math.round((endTime - now) / 1000));
        setRemaining(rem);
        if (rem <= 0 && running) {
          clearTimers();
          handleComplete();
        }
      }
    }
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('focus', onVisibility);
    window.addEventListener('pagehide', onVisibility);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('focus', onVisibility);
      window.removeEventListener('pagehide', onVisibility);
    };
  }, [endTime, running]);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            setRunning(false);
            setEndTime(null);
            handleComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [running]);

  function clearTimers() {
    clearInterval(intervalRef.current);
    setRunning(false);
    setEndTime(null);
  }

  function toggleStartPause() {
    if (!startedRef.current) startedRef.current = true;
    if (!running) {
      const now = Date.now();
      const et = now + remaining * 1000;
      setEndTime(et);
      setStorage('study_147_timer_end', et);
      setStorage('study_147_timer_running', true);
      setRunning(true);
      // capture the session minutes at start (so pauses/visibility won't change what we credit)
      sessionMinutesRef.current = Math.round((totalSeconds) / 60);
    } else {
      setRunning(false);
      setEndTime(null);
      setStorage('study_147_timer_end', null);
      setStorage('study_147_timer_running', false);
    }
  }

  function handleReset() {
    clearInterval(intervalRef.current);
    setRunning(false);
    setEndTime(null);
    setRemaining(totalSeconds);
    setStorage('study_147_timer_end', null);
    setStorage('study_147_timer_running', false);
  }

  function handleCompleteSilent() {
    try { if (settings.soundOn) playBeep(); } catch (e) {}
    fireConfetti();
    const minutes = sessionMinutesRef.current || Math.round(totalSeconds / 60);
    if (typeof onSessionComplete === 'function') {
      try { onSessionComplete(minutes); } catch (e) {}
    }
    setStorage('study_147_timer_end', null);
    setStorage('study_147_timer_running', false);
  }

  function showNotification(title, body) {
    try {
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        new Notification(title, { body });
      }
    } catch (e) {}
  }

  function handleComplete() {
    if (settings.soundOn) playBeep();
    fireConfetti();
    setTickAnim(true);
    setTimeout(() => setTickAnim(false), 1200);
    const minutes = sessionMinutesRef.current || Math.round(totalSeconds / 60);
    try { if (typeof onSessionComplete === 'function') onSessionComplete(minutes); } catch (e) {}
    if (document.hidden && Notification && Notification.permission !== 'denied') {
      Notification.requestPermission().then((perm) => { if (perm === 'granted') showNotification('Study session complete', `Your ${minutes}m session finished.`); });
    } else if (document.hidden && Notification && Notification.permission === 'granted') {
      showNotification('Study session complete', `Your ${minutes}m session finished.`);
    }
    setEndTime(null);
    setStorage('study_147_timer_end', null);
    setStorage('study_147_timer_running', false);
  }

  function applyPreset(mins) { setMinutesInput(mins); }
  function changeSession(type) {
    setSessionType(type);
    let mins = settings.work;
    if (type === 'short') mins = settings.short;
    if (type === 'long') mins = settings.long;
    setMinutesInput(mins);
  }

  function saveSettings(newSettings) { setSettings(newSettings); if (newSettings.saveAsDefault) setMinutesInput(newSettings.work); setOpenSettings(false); }

  const radius = 78;
  const circumference = 2 * Math.PI * radius;
  const progress = totalSeconds ? (totalSeconds - remaining) / totalSeconds : 0;
  const dashOffset = Math.max(0, circumference * (1 - progress));

  useEffect(() => {
    function onBeforeUnload() {
      setStorage('study_147_timer_end', endTime);
      setStorage('study_147_timer_running', running);
    }
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [endTime, running]);

  return (
    <div className="p-4 md:p-6">
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex-1 w-full md:w-auto flex items-center gap-6">
          <div className="relative">
            <svg width="180" height="180" viewBox="0 0 200 200" className="rounded-full">
              <defs>
                <linearGradient id="g1" x1="0%" x2="100%">
                  <stop offset="0%" stopColor="#4F8CFF" />
                  <stop offset="100%" stopColor="#7C3AED" />
                </linearGradient>
              </defs>
              <g transform="translate(100,100)">
                <circle cx="0" cy="0" r="80" fill="rgba(255,255,255,0.02)" />
                <g transform="rotate(-90)">
                  <circle ref={null} r={radius} cx="0" cy="0" fill="none" stroke="#071025" strokeWidth="12" />
                  <circle r={radius} cx="0" cy="0" fill="none" stroke="url(#g1)" strokeWidth="12" strokeLinecap="round"
                    strokeDasharray={`${circumference} ${circumference}`} strokeDashoffset={dashOffset} style={{ transition: 'stroke-dashoffset 1s linear' }} />
                </g>
              </g>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <div className="text-4xl md:text-5xl font-extrabold">{formatTime(remaining)}</div>
                <div className="text-xs text-slate-400 mt-1">{sessionType === 'work' ? 'Work' : sessionType === 'short' ? 'Short Break' : 'Long Break'}</div>
              </div>
            </div>
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <button onClick={() => changeSession('work')} className={`px-3 py-1 rounded-md ${sessionType === 'work' ? 'bg-indigo-700/40 text-white' : 'bg-slate-800 text-slate-200'}`}>Work</button>
              <button onClick={() => changeSession('short')} className={`px-3 py-1 rounded-md ${sessionType === 'short' ? 'bg-indigo-700/40 text-white' : 'bg-slate-800 text-slate-200'}`}>Short</button>
              <button onClick={() => changeSession('long')} className={`px-3 py-1 rounded-md ${sessionType === 'long' ? 'bg-indigo-700/40 text-white' : 'bg-slate-800 text-slate-200'}`}>Long</button>
              <button onClick={() => setOpenSettings(true)} className="ml-auto px-3 py-1 rounded-md bg-slate-800 text-slate-200">Settings</button>
            </div>

            <div className="mb-3">
              <label className="text-xs text-slate-400">Custom minutes</label>
              <div className="mt-2 flex items-center gap-2">
                <input type="number" min="1" value={minutesInput} onChange={(e) => setMinutesInput(Math.max(1, Number(e.target.value || 1)))} className="w-28 p-2 rounded bg-slate-800 text-white" />
                <div className="flex gap-2">
                  <button onClick={() => applyPreset(25)} className="px-3 py-1 rounded-md bg-gradient-to-r from-primary to-secondary text-white">25</button>
                  <button onClick={() => applyPreset(45)} className="px-3 py-1 rounded-md bg-slate-800 text-slate-200">45</button>
                  <button onClick={() => applyPreset(60)} className="px-3 py-1 rounded-md bg-slate-800 text-slate-200">60</button>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button onClick={toggleStartPause} className="btn-primary px-4 py-2 rounded-md">{running ? 'Pause' : 'Start'}</button>
              <button onClick={handleReset} className="px-4 py-2 rounded-md bg-slate-800 text-slate-200">Reset</button>
              <div className="ml-auto text-xs text-slate-400">Short: {settings.short}m • Long: {settings.long}m</div>
            </div>
          </div>
        </div>
      </div>

      {tickAnim && (
        <div className="fixed top-10 right-10 bg-emerald-600 text-white px-4 py-2 rounded-lg shadow-lg">✓ Completed</div>
      )}

      <TimerSettingsModal open={openSettings} onClose={() => setOpenSettings(false)} settings={settings} onSave={saveSettings} />
    </div>
  );
}
