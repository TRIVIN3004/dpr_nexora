import React from 'react';
import { motion } from 'framer-motion';

export default function AttendanceStatCard({ title, value, subtitle, icon: Icon, color = 'blue', trend, badge }) {
  const colorMap = {
    blue: {
      border: 'border-blue-200 hover:border-blue-300',
      iconBg: 'bg-blue-100/80 text-blue-600',
      valueText: 'text-blue-700',
      badgeBg: 'bg-blue-50 text-blue-600 border-blue-200'
    },
    purple: {
      border: 'border-purple-200 hover:border-purple-300',
      iconBg: 'bg-purple-100/80 text-purple-600',
      valueText: 'text-purple-700',
      badgeBg: 'bg-purple-50 text-purple-600 border-purple-200'
    },
    emerald: {
      border: 'border-emerald-200 hover:border-emerald-300',
      iconBg: 'bg-emerald-100/80 text-emerald-600',
      valueText: 'text-emerald-700',
      badgeBg: 'bg-emerald-50 text-emerald-600 border-emerald-200'
    },
    amber: {
      border: 'border-amber-200 hover:border-amber-300',
      iconBg: 'bg-amber-100/80 text-amber-600',
      valueText: 'text-amber-700',
      badgeBg: 'bg-amber-50 text-amber-600 border-amber-200'
    },
    rose: {
      border: 'border-rose-200 hover:border-rose-300',
      iconBg: 'bg-rose-100/80 text-rose-600',
      valueText: 'text-rose-700',
      badgeBg: 'bg-rose-50 text-rose-600 border-rose-200'
    },
    cyan: {
      border: 'border-cyan-200 hover:border-cyan-300',
      iconBg: 'bg-cyan-100/80 text-cyan-600',
      valueText: 'text-cyan-700',
      badgeBg: 'bg-cyan-50 text-cyan-600 border-cyan-200'
    }
  };

  const currentTheme = colorMap[color] || colorMap.blue;

  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ duration: 0.2 }}
      className={`relative overflow-hidden rounded-2xl bg-white border ${currentTheme.border} p-5 shadow-sm hover:shadow-md transition-all duration-300`}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1.5">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            {title}
          </span>
          <div className="flex items-baseline gap-2">
            <h3 className={`text-2xl md:text-3xl font-extrabold tracking-tight ${currentTheme.valueText}`}>
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

        <div className={`p-3 rounded-xl ${currentTheme.iconBg} border border-slate-100`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>

      {trend && (
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="text-slate-500 font-medium">Policy Status</span>
          <span className={`font-semibold ${trend.positive ? 'text-emerald-600' : 'text-amber-600'}`}>
            {trend.label}
          </span>
        </div>
      )}
    </motion.div>
  );
}
