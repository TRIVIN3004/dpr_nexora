import React from 'react';
import { X, Layers, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ProjectsModal({ isOpen, onClose, projects }) {
  if (!isOpen) return null;

  const ongoingProjects = projects.filter(p => p.status !== 'Completed');
  const completedProjects = projects.filter(p => p.status === 'Completed');

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
        />

        {/* Modal Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl max-h-[85vh] overflow-hidden rounded-2xl glass-panel border border-slate-800/80 bg-slate-950/95 shadow-glass-hover p-6 flex flex-col text-left"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-900 pb-4 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-nexora-purple/10 border border-nexora-purple/20 text-nexora-purple">
                <Layers className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-100">Nexora Project Registry</h3>
                <p className="text-xs text-slate-500 mt-0.5">Overview of active initiatives and completed milestones</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-900 transition-all cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto pr-1 space-y-6">
            
            {/* Ongoing Projects Section */}
            <div className="space-y-3">
              <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 font-sans">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                Ongoing Initiatives ({ongoingProjects.length})
              </h4>
              
              {ongoingProjects.length === 0 ? (
                <div className="flex items-center gap-2 p-4 rounded-xl bg-slate-900/20 border border-slate-900 text-xs text-slate-500">
                  <AlertCircle className="h-4 w-4 text-slate-600" />
                  No ongoing projects currently active.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {ongoingProjects.map((p) => (
                    <div key={p.id} className="p-4 rounded-xl bg-slate-900/35 border border-slate-900 flex flex-col justify-between gap-2.5">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h5 className="font-bold text-slate-200 text-xs">{p.name}</h5>
                          <span className="text-[8px] font-extrabold px-1.5 py-0.5 rounded-full border bg-amber-500/10 text-amber-400 border-amber-500/20 whitespace-nowrap uppercase tracking-wider">
                            {p.status || 'In Progress'}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1 leading-relaxed line-clamp-2">{p.description || 'No description provided.'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Completed Projects Section */}
            <div className="space-y-3">
              <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 font-sans">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Completed Milestones ({completedProjects.length})
              </h4>

              {completedProjects.length === 0 ? (
                <div className="flex items-center gap-2 p-4 rounded-xl bg-slate-900/20 border border-slate-900 text-xs text-slate-500">
                  <AlertCircle className="h-4 w-4 text-slate-600" />
                  No projects marked as completed yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {completedProjects.map((p) => (
                    <div key={p.id} className="p-4 rounded-xl bg-slate-900/35 border border-slate-900 flex flex-col justify-between gap-2.5 opacity-80 hover:opacity-100 transition-opacity">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h5 className="font-bold text-slate-450 text-xs line-through">{p.name}</h5>
                          <span className="text-[8px] font-extrabold px-1.5 py-0.5 rounded-full border bg-emerald-500/10 text-emerald-400 border-emerald-500/20 whitespace-nowrap uppercase tracking-wider">
                            Completed
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1 leading-relaxed line-clamp-2">{p.description || 'No description provided.'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
