import React from 'react';
import { motion } from 'framer-motion';

export default function AttendanceStatCard({ title, value, subtitle, icon: Icon, color = 'blue', trend, badge }) {
  const colorMap = {
    blue: {
      border: 'border-white/20 hover:border-blue-400/50',
      iconBg: 'bg-blue-500/20 text-cyan-300 border border-blue-400/30',
      valueText: 'text-white',
      badgeBg: 'bg-blue-500/20 text-cyan-300 border-blue-400/30'
    },
    purple: {
      border: 'border-white/20 hover:border-purple-400/50',
      iconBg: 'bg-purple-500/20 text-purple-300 border border-purple-400/30',
      valueText: 'text-white',
      badgeBg: 'bg-purple-500/20 text-purple-300 border-purple-400/30'
    },
    emerald: {
      border: 'border-white/20 hover:border-emerald-400/50',
      iconBg: 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30',
      valueText: 'text-white',
      badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30'
    },
    amber: {
      border: 'border-white/20 hover:border-amber-400/50',
      iconBg: 'bg-amber-500/20 text-amber-300 border border-amber-400/30',
      valueText: 'text-white',
      badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-400/30'
    },
    rose: {
      border: 'border-white/20 hover:border-rose-400/50',
      iconBg: 'bg-rose-500/20 text-rose-300 border border-rose-400/30',
      valueText: 'text-white',
      badgeBg: 'bg-rose-500/20 text-rose-300 border-rose-400/30'
    },
    cyan: {
      border: 'border-white/20 hover:border-cyan-400/50',
      iconBg: 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/30',
      valueText: 'text-white',
      badgeBg: 'bg-cyan-500/20 text-cyan-300 border-cyan-400/30'
    }
  };

  const currentTheme = colorMap[color] || colorMap.blue;

  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ duration: 0.2 }}
      className={`relative overflow-hidden rounded-2xl border border-slate-200 dark:border-white/20 bg-white dark:bg-white/[0.08] backdrop-blur-2xl p-5 shadow-sm dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] hover:bg-slate-50 dark:hover:bg-white/[0.12] transition-all duration-300`}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1.5">
          <span className="text-xs font-black text-slate-600 dark:text-slate-200 uppercase tracking-wider">
            {title}
          </span>
          <div className="flex items-baseline gap-2">
            <h3 className={`text-2xl md:text-3xl font-black tracking-tight text-slate-900 dark:text-white drop-shadow-sm`}>
              {value}
            </h3>
            {badge && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${currentTheme.badgeBg}`}>
                {badge}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {subtitle}
            </p>
          )}
        </div>

        <div className={`p-3 rounded-xl ${currentTheme.iconBg} shadow-xs`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>

      {trend && (
        <div className="mt-4 pt-3 border-t border-slate-200 dark:border-white/10 flex items-center justify-between text-xs">
          <span className="text-slate-500 dark:text-slate-400 font-medium">Policy Status</span>
          <span className={`font-bold ${trend.positive ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
            {trend.label}
          </span>
        </div>
      )}
    </motion.div>
  );
}
