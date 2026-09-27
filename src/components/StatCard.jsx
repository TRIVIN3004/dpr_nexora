import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function StatCard({ title, value, change, changeType, icon: Icon, delay, onClick }) {
  const isPositive = changeType === 'positive';
  const isNegative = changeType === 'negative';

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: delay || 0 }}
      whileHover={onClick ? { y: -4, scale: 1.01, transition: { duration: 0.2 } } : { y: -4, transition: { duration: 0.2 } }}
      onClick={onClick}
      className={`relative overflow-hidden rounded-2xl p-5 border border-white/20 bg-white/[0.08] backdrop-blur-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] transition-all hover:border-white/35 hover:bg-white/[0.12] group ${
        onClick ? 'cursor-pointer active:scale-[0.99]' : ''
      }`}
    >
      {/* Background white specular glow */}
      <div className="absolute top-0 right-0 -mr-6 -mt-6 h-24 w-24 rounded-full bg-white/10 blur-xl group-hover:bg-white/20 transition-colors duration-300" />
      
      <div className="flex items-center justify-between">
        <span className="text-xs font-black text-white uppercase tracking-wider drop-shadow-sm">{title}</span>
        {Icon && (
          <div className="p-2.5 rounded-xl bg-white/10 border border-white/20 text-white group-hover:text-cyan-300 group-hover:bg-white/15 transition-colors duration-300 shadow-sm">
            <Icon className="h-4.5 w-4.5" />
          </div>
        )}
      </div>

      <div className="mt-4 flex items-baseline gap-2">
        <span className="text-3xl md:text-4xl font-black text-white font-sans tracking-tight drop-shadow-md">
          {value}
        </span>
      </div>

      {change && (
        <div className="mt-2.5 flex items-center gap-1.5">
          {isPositive && (
            <span className="inline-flex items-center gap-0.5 text-xs font-bold text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-md border border-emerald-400/30">
              <ArrowUpRight className="h-3 w-3" />
              {change}
            </span>
          )}
          {isNegative && (
            <span className="inline-flex items-center gap-0.5 text-xs font-bold text-rose-300 bg-rose-500/20 px-2 py-0.5 rounded-md border border-rose-400/30">
              <ArrowDownRight className="h-3 w-3" />
              {change}
            </span>
          )}
          {!isPositive && !isNegative && (
            <span className="text-xs font-bold text-white bg-white/10 px-2 py-0.5 rounded-md border border-white/20">
              {change}
            </span>
          )}
          <span className="text-[10px] text-white/90 font-bold ml-0.5">vs last week</span>
        </div>
      )}
    </motion.div>
  );
}
