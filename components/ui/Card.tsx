import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  gradientBorder?: boolean;
  style?: React.CSSProperties;
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  className = '', 
  title, 
  subtitle,
  action,
  gradientBorder = false,
  style
}) => {
  // Check if a background color is already provided in className
  // We exclude 'bg-white' from this check to allow it to be passed explicitly without disabling the default behavior if we wanted to be strict,
  // but simpler is to just let the default apply if no 'bg-' class is present, OR if the user provides one, they are responsible.
  // However, specifically for bg-white, we want to ensure it works. 
  // If the user passes "bg-white", hasBg is true, so default is removed, but "bg-white" is in className. This should work.
  // If it's failing, we can force a white background style if no other background is detected, or rely on the prop.
  
  const hasBg = className.includes('bg-') && !className.includes('bg-opacity');
  const baseClasses = `group relative rounded-2xl shadow-[0_2px_10px_-4px_rgba(6,11,40,0.05)] border border-slate-100 transition-all duration-300 hover:shadow-lg hover:shadow-slate-100/50 overflow-hidden ${hasBg ? '' : 'bg-white'}`;

  return (
    <div className={`${baseClasses} ${className}`} style={style}>
      {/* Gradient Border Effect on Hover */}
      {gradientBorder && (
        <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-accent-cyan via-accent-purple to-accent-rose opacity-0 group-hover:opacity-20 transition-opacity duration-500 pointer-events-none" />
      )}
      
      <div className="relative p-6 h-full flex flex-col z-10">
        {(title || action) && (
          <div className="flex justify-between items-start mb-6">
            <div>
              {title && <h3 className={`text-sm font-semibold tracking-tight ${className.includes('text-white') ? 'text-white' : 'text-slate-800'}`}>{title}</h3>}
              {subtitle && <p className={`text-xs mt-1 font-light ${className.includes('text-white') ? 'text-slate-300' : 'text-slate-500'}`}>{subtitle}</p>}
            </div>
            {action && <div>{action}</div>}
          </div>
        )}
        <div className="flex-1">
          {children}
        </div>
      </div>
    </div>
  );
};