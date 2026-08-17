import React, { useEffect, useState } from 'react';

export default function TimerSettingsModal({ open, onClose, settings, onSave }) {
  const [form, setForm] = useState({ work: 25, short: 5, long: 15, autoCycle: false, soundOn: true, saveAsDefault: false });

  useEffect(() => {
    if (settings) setForm((s) => ({ ...s, ...settings }));
  }, [settings]);

  if (!open) return null;

  function updateField(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleSave() {
    const sanitized = {
      work: Math.max(1, Number(form.work) || 25),
      short: Math.max(1, Number(form.short) || 5),
      long: Math.max(1, Number(form.long) || 15),
      autoCycle: !!form.autoCycle,
      soundOn: !!form.soundOn,
      saveAsDefault: !!form.saveAsDefault,
    };
    if (typeof onSave === 'function') onSave(sanitized);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-gradient-to-tr from-slate-900/80 to-slate-800/60 border border-slate-700 rounded-2xl p-6 w-full max-w-md mx-4">
        <h3 className="text-lg font-semibold text-white mb-3">Timer Settings</h3>
        <div className="space-y-3 text-sm text-slate-300">
          <div className="grid grid-cols-2 gap-2">
            <label className="flex flex-col">
              <span className="text-xs text-slate-400 mb-1">Work (minutes)</span>
              <input type="number" min="1" value={form.work} onChange={(e) => updateField('work', e.target.value)} className="p-2 rounded bg-slate-800 text-white" />
            </label>
            <label className="flex flex-col">
              <span className="text-xs text-slate-400 mb-1">Short Break (minutes)</span>
              <input type="number" min="1" value={form.short} onChange={(e) => updateField('short', e.target.value)} className="p-2 rounded bg-slate-800 text-white" />
            </label>
          </div>

          <div>
            <label className="flex flex-col">
              <span className="text-xs text-slate-400 mb-1">Long Break (minutes)</span>
              <input type="number" min="1" value={form.long} onChange={(e) => updateField('long', e.target.value)} className="p-2 rounded bg-slate-800 text-white" />
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-400">Auto-cycle</div>
              <div className="text-[11px] text-slate-500">Automatically start break after work (off by default)</div>
            </div>
            <input type="checkbox" checked={!!form.autoCycle} onChange={(e) => updateField('autoCycle', e.target.checked)} />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-400">Sound</div>
              <div className="text-[11px] text-slate-500">Play beep on session end</div>
            </div>
            <input type="checkbox" checked={!!form.soundOn} onChange={(e) => updateField('soundOn', e.target.checked)} />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-400">Save as default</div>
              <div className="text-[11px] text-slate-500">Apply these values as defaults for new timers</div>
            </div>
            <input type="checkbox" checked={!!form.saveAsDefault} onChange={(e) => updateField('saveAsDefault', e.target.checked)} />
          </div>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-2 rounded bg-slate-700 text-slate-200">Cancel</button>
          <button onClick={handleSave} className="px-3 py-2 rounded btn-primary">Save</button>
        </div>
      </div>
    </div>
  );
}
