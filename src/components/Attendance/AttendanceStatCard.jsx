import React from 'react';
import { motion } from 'framer-motion';

export default function AttendanceStatCard({ title, value, subtitle, icon: Icon, color = 'blue', trend, badge }) {
  const colorMap = {
    blue: {
      border: 'border-blue-500/20 hover:border-blue-500/40',
      iconBg: 'bg-blue-500/10 text-blue-400',
      glow: 'shadow-glow-blue',
      badgeBg: 'bg-blue-500/10 text-blue-400 border-blue-500/20'
    },
    purple: {
      border: 'border-purple-500/20 hover:border-purple-500/40',
      iconBg: 'bg-purple-500/10 text-purple-400',
      glow: 'shadow-glow-purple',
      badgeBg: 'bg-purple-500/10 text-purple-400 border-purple-500/20'
    },
    emerald: {
      border: 'border-emerald-500/20 hover:border-emerald-500/40',
      iconBg: 'bg-emerald-500/10 text-emerald-400',
      glow: 'shadow-glow-emerald',
      badgeBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
    },
    amber: {
      border: 'border-amber-500/20 hover:border-amber-500/40',
      iconBg: 'bg-amber-500/10 text-amber-400',
      glow: 'shadow-glow-amber',
      badgeBg: 'bg-amber-500/10 text-amber-400 border-amber-500/20'
    },
    rose: {
      border: 'border-rose-500/20 hover:border-rose-500/40',
      iconBg: 'bg-rose-500/10 text-rose-400',
      glow: 'shadow-glow-rose',
      badgeBg: 'bg-rose-500/10 text-rose-400 border-rose-500/20'
    },
    cyan: {
      border: 'border-cyan-500/20 hover:border-cyan-500/40',
      iconBg: 'bg-cyan-500/10 text-cyan-400',
      glow: 'shadow-glow-cyan',
      badgeBg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
    }
  };

  const currentTheme = colorMap[color] || colorMap.blue;

  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ duration: 0.2 }}
      className={`relative overflow-hidden rounded-2xl bg-slate-900/80 backdrop-blur-xl border ${currentTheme.border} p-5 shadow-xl transition-all duration-300`}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1.5">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            {title}
          </span>
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              {value}
            </h3>
            {badge && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${currentTheme.badgeBg}`}>
                {badge}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-xs font-medium text-slate-500">
              {subtitle}
            </p>
          )}
        </div>

        <div className={`p-3 rounded-xl ${currentTheme.iconBg} border border-white/5`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>

      {trend && (
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
          <span className="text-slate-400 font-medium">Policy Status</span>
          <span className={`font-semibold ${trend.positive ? 'text-emerald-400' : 'text-amber-400'}`}>
            {trend.label}
          </span>
        </div>
      )}
    </motion.div>
  );
}
