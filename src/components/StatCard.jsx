import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function StatCard({ title, value, change, changeType, icon: Icon, delay }) {
  const isPositive = changeType === 'positive';
  const isNegative = changeType === 'negative';

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: delay || 0 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="relative overflow-hidden rounded-2xl glass-panel p-5 shadow-glass transition-all hover:shadow-glass-hover group"
    >
      {/* Background soft glow animation */}
      <div className="absolute top-0 right-0 -mr-6 -mt-6 h-20 w-20 rounded-full bg-nexora-purple/5 blur-xl group-hover:bg-nexora-purple/10 transition-colors duration-300" />
      
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">{title}</span>
        {Icon && (
          <div className="p-2.5 rounded-xl bg-slate-950/50 border border-slate-800 text-slate-300 group-hover:text-nexora-purple transition-colors duration-300">
            <Icon className="h-4.5 w-4.5" />
          </div>
        )}
      </div>

      <div className="mt-4 flex items-baseline gap-2">
        <span className="text-2xl md:text-3xl font-extrabold text-slate-100 font-sans tracking-tight">
          {value}
        </span>
      </div>

      {change && (
        <div className="mt-2.5 flex items-center gap-1">
          {isPositive && (
            <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-emerald-400">
              <ArrowUpRight className="h-3 w-3" />
              {change}
            </span>
          )}
          {isNegative && (
            <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-rose-400">
              <ArrowDownRight className="h-3 w-3" />
              {change}
            </span>
          )}
          {!isPositive && !isNegative && (
            <span className="text-xs font-medium text-slate-500">
              {change}
            </span>
          )}
          <span className="text-[10px] text-slate-500 font-medium ml-1">vs last week</span>
        </div>
      )}
    </motion.div>
  );
}
