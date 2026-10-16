import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Send, X, CheckCircle2, AlertCircle, Copy, Check } from 'lucide-react';
import { sendEmailAlert, getResendConfig } from '../utils/emailService';

export default function EmailPreviewModal({
  isOpen,
  onClose,
  recipientName = 'Staff Member',
  personalEmail,
  subject,
  html,
  type = 'alert',
  metadata = {},
  onSent
}) {
  const [isSending, setIsSending] = useState(false);
  const [sendStatus, setSendStatus] = useState(null); // { success: boolean, message: string, simulated: boolean }
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const config = getResendConfig();

  const handleSend = async () => {
    setIsSending(true);
    setSendStatus(null);
    try {
      const res = await sendEmailAlert({
        to: personalEmail,
        recipientName,
        subject,
        html,
        type,
        metadata
      });
      setSendStatus(res);
      if (res.success && onSent) {
        onSent(res);
      }
    } catch (err) {
      setSendStatus({ success: false, error: err.message });
    } finally {
      setIsSending(false);
    }
  };

  const handleCopyHtml = () => {
    if (html) {
      navigator.clipboard.writeText(html);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl overflow-hidden text-left"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 px-6 border-b border-slate-800 bg-slate-950/70">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                <Mail className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                  <span>Resend Email Alert Preview</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase">
                    {type.replace('_', ' ')}
                  </span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  Target Personal Mail: <strong className="text-emerald-400 font-mono">{personalEmail}</strong>
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Metadata bar */}
          <div className="bg-slate-950/40 border-b border-slate-800/80 px-6 py-3 text-xs space-y-1.5">
            <div className="flex items-center gap-2 text-slate-400">
              <span className="w-16 text-slate-500 font-bold uppercase text-[10px]">From:</span>
              <span className="text-slate-300 font-mono">{config.fromEmail}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-400">
              <span className="w-16 text-slate-500 font-bold uppercase text-[10px]">To:</span>
              <span className="text-emerald-300 font-semibold font-mono">{recipientName} &lt;{personalEmail}&gt;</span>
            </div>
            <div className="flex items-center gap-2 text-slate-400">
              <span className="w-16 text-slate-500 font-bold uppercase text-[10px]">Subject:</span>
              <span className="text-white font-bold">{subject}</span>
            </div>
          </div>

          {/* HTML Preview Frame */}
          <div className="flex-1 overflow-y-auto p-4 bg-slate-950/90">
            <div className="rounded-xl border border-slate-800 overflow-hidden bg-slate-900 shadow-inner">
              <iframe
                title="Email Preview"
                srcDoc={html}
                className="w-full h-[380px] border-none bg-[#0b0f19]"
                sandbox="allow-same-origin"
              />
            </div>
          </div>

          {/* Result Alert if already triggered */}
          {sendStatus && (
            <div className={`mx-6 mt-3 p-3 rounded-xl border text-xs flex items-center gap-3 ${
              sendStatus.success 
                ? 'bg-emerald-950/50 border-emerald-700/60 text-emerald-300' 
                : 'bg-rose-950/50 border-rose-700/60 text-rose-300'
            }`}>
              {sendStatus.success ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
              )}
              <div className="flex-1">
                <span className="font-bold">{sendStatus.success ? 'Email Dispatched!' : 'Dispatch Error:'}</span>{' '}
                <span>{sendStatus.message || sendStatus.error}</span>
                {sendStatus.simulated && (
                  <span className="block text-[10px] text-emerald-400/80 mt-0.5">
                    (Simulation Mode: Add RESEND_API_KEY in Settings to send live messages via Resend).
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="p-4 px-6 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between gap-3">
            <button
              onClick={handleCopyHtml}
              className="px-3 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? 'HTML Copied' : 'Copy HTML'}</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                Close Preview
              </button>

              <button
                onClick={handleSend}
                disabled={isSending}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white text-xs font-extrabold flex items-center gap-2 shadow-lg shadow-indigo-500/25 transition-all disabled:opacity-50 cursor-pointer"
              >
                {isSending ? (
                  <>
                    <span className="inline-block h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Sending via Resend...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-3.5 w-3.5" />
                    <span>Send to Personal Mail Now</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
