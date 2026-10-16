import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Save, X, Sparkles, Check, AlertCircle } from 'lucide-react';
import { getPersonalEmail, bulkUpdatePersonalEmails } from '../utils/emailService';

export default function BulkPersonalEmailModal({
  isOpen,
  onClose,
  members = [],
  onSaved
}) {
  const [emailMap, setEmailMap] = useState({});
  const [quickPasteText, setQuickPasteText] = useState('');
  const [showPasteBox, setShowPasteBox] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (isOpen && members.length > 0) {
      const initial = {};
      members.forEach(m => {
        initial[m.id] = m.personalEmail || getPersonalEmail(m) || '';
      });
      setEmailMap(initial);
      setSaveSuccess(false);
    }
  }, [isOpen, members]);

  if (!isOpen) return null;

  const handleInputChange = (memberId, val) => {
    setEmailMap(prev => ({ ...prev, [memberId]: val }));
  };

  const handleApplyPaste = () => {
    if (!quickPasteText.trim()) return;

    const newMap = { ...emailMap };
    const lines = quickPasteText.split('\n');

    lines.forEach(line => {
      const trimmed = line.trim();
      if (!trimmed) return;

      // Supports formats: "ID: email", "email = personal", "Name - personal", comma separated or tab separated
      let delimiter = ':';
      if (trimmed.includes('=')) delimiter = '=';
      else if (trimmed.includes(',')) delimiter = ',';
      else if (trimmed.includes('\t')) delimiter = '\t';
      else if (trimmed.includes('-')) delimiter = '-';

      const parts = trimmed.split(delimiter).map(p => p.trim());
      if (parts.length >= 2) {
        const identifier = parts[0].toLowerCase();
        const personalMail = parts[1];

        // Find member matching ID, work email, or name
        const matched = members.find(m => 
          m.id.toLowerCase() === identifier ||
          m.email.toLowerCase() === identifier ||
          m.name.toLowerCase().includes(identifier)
        );

        if (matched) {
          newMap[matched.id] = personalMail;
        }
      }
    });

    setEmailMap(newMap);
    setShowPasteBox(false);
    setQuickPasteText('');
  };

  const handleSaveAll = () => {
    bulkUpdatePersonalEmails(emailMap);
    setSaveSuccess(true);
    if (onSaved) onSaved(emailMap);
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-2xl max-h-[88vh] flex flex-col rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden text-left"
        >
          {/* Header */}
          <div className="p-5 px-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/60">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                <Mail className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Link Personal Mail IDs to Staff Profiles</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                    Resend Ready
                  </span>
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Assign personal email addresses where attendance absence notices, warnings, and terminations will be dispatched.
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Quick Paste Bar */}
          <div className="px-6 py-2.5 bg-indigo-50/60 dark:bg-indigo-950/30 border-b border-indigo-100 dark:border-indigo-900/40 flex items-center justify-between text-xs">
            <span className="text-indigo-900 dark:text-indigo-200 font-semibold text-[11px]">
              Want to paste multiple emails at once?
            </span>
            <button
              type="button"
              onClick={() => setShowPasteBox(!showPasteBox)}
              className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] cursor-pointer transition-colors"
            >
              {showPasteBox ? 'Hide Paste Box' : 'Quick Paste Text / List'}
            </button>
          </div>

          {/* Quick Paste Area */}
          {showPasteBox && (
            <div className="p-4 bg-slate-100 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 space-y-2 text-xs">
              <label className="text-slate-700 dark:text-slate-300 font-bold block text-[11px]">
                Paste rows formatted as <code className="text-indigo-600 dark:text-indigo-400">Name: email</code> or <code className="text-indigo-600 dark:text-indigo-400">EMP-ID: email</code>:
              </label>
              <textarea
                rows={4}
                value={quickPasteText}
                onChange={(e) => setQuickPasteText(e.target.value)}
                placeholder={"Pavithraa: pavithraa@gmail.com\nLogesh: logesh@gmail.com\nEMP-001: trivin@gmail.com"}
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:border-indigo-500"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowPasteBox(false)}
                  className="px-3 py-1 rounded-lg text-slate-500 hover:text-slate-700 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleApplyPaste}
                  className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
                >
                  Apply Pasted Emails
                </button>
              </div>
            </div>
          )}

          {/* Member List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-3">
            {members.map(member => (
              <div
                key={member.id}
                className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-0.5 min-w-[180px]">
                  <h4 className="font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span>{member.name}</span>
                    <span className="font-mono text-[10px] text-slate-500">({member.id})</span>
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    Work: <span className="font-mono">{member.email}</span>
                  </p>
                </div>

                <div className="flex-1 max-w-sm">
                  <div className="relative">
                    <input
                      type="email"
                      value={emailMap[member.id] || ''}
                      onChange={(e) => handleInputChange(member.id, e.target.value)}
                      placeholder="e.g. personal@gmail.com"
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-medium font-mono focus:outline-none focus:border-indigo-500 pl-8"
                    />
                    <Mail className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Success message */}
          {saveSuccess && (
            <div className="mx-6 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
              <Check className="h-4 w-4 text-emerald-500" />
              <span className="font-bold">All personal mail IDs linked and saved successfully!</span>
            </div>
          )}

          {/* Footer Actions */}
          <div className="p-4 px-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 flex items-center justify-between">
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              {Object.values(emailMap).filter(v => Boolean(v)).length} of {members.length} personal emails configured
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                Close
              </button>

              <button
                type="button"
                onClick={handleSaveAll}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black flex items-center gap-2 shadow-lg shadow-emerald-600/20 cursor-pointer transition-colors"
              >
                <Save className="h-3.5 w-3.5" />
                <span>Save All Personal Emails</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
