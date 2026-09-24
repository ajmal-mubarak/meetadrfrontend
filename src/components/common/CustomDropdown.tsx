import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, Check } from 'lucide-react';

export interface DropdownOption {
  value: string;
  label: string;
  badge?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  isDivider?: boolean;
  sublabel?: string;
}

interface CustomDropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: DropdownOption[];
  placeholder?: string;
  icon?: React.ReactNode;
  className?: string;
  buttonClassName?: string;
  menuClassName?: string;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  align?: 'left' | 'right' | 'auto';
  headerContent?: React.ReactNode;
  maxMenuHeight?: string;
}

export const CustomDropdown: React.FC<CustomDropdownProps> = ({
  value,
  onChange,
  options,
  placeholder = 'Select...',
  icon,
  className = '',
  buttonClassName = '',
  menuClassName = '',
  disabled = false,
  size = 'md',
  align = 'auto',
  headerContent,
  maxMenuHeight = 'max-h-60',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click or escape key
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const selectedOption = options.find((opt) => opt.value === value);

  // Size configurations
  const sizeClasses = {
    sm: 'py-1.5 px-2.5 text-xs rounded-xl',
    md: 'py-2 px-3 text-xs sm:text-sm rounded-xl',
    lg: 'py-2.5 sm:py-3 px-3.5 text-xs sm:text-sm rounded-2xl',
  };

  const alignClasses =
    align === 'right'
      ? 'right-0'
      : align === 'left'
      ? 'left-0'
      : 'left-0 sm:left-auto sm:right-0 rtl:sm:right-auto rtl:sm:left-0';

  return (
    <div className={`relative min-w-0 ${className}`} ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full flex items-center justify-between gap-2 border border-[#E2EBF0] hover:border-[#2DA7B5] focus:border-[#2DA7B5] bg-[#F8FAFC] hover:bg-white focus:bg-white text-slate-800 font-semibold transition-all cursor-pointer shadow-2xs outline-none select-none disabled:opacity-50 disabled:cursor-not-allowed ${sizeClasses[size]} ${buttonClassName}`}
      >
        <div className="flex items-center gap-2 truncate min-w-0">
          {icon && <span className="shrink-0 text-[#0E7490]">{icon}</span>}
          <span className="truncate">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          {selectedOption?.badge && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-[#E8F6F8] text-[#0E7490] shrink-0">
              {selectedOption.badge}
            </span>
          )}
        </div>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-[#0E7490]' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: 0.14 }}
            className={`absolute top-full mt-1.5 w-full min-w-[200px] max-w-[calc(100vw-32px)] bg-white rounded-2xl shadow-xl border border-[#E2EBF0] p-1.5 z-50 overflow-hidden text-slate-900 ${alignClasses} ${menuClassName}`}
          >
            {headerContent && (
              <div className="pb-1.5 mb-1 border-b border-slate-100">
                {headerContent}
              </div>
            )}

            <div className={`overflow-y-auto space-y-0.5 ${maxMenuHeight}`}>
              {options.map((opt, idx) => {
                if (opt.isDivider) {
                  return (
                    <div
                      key={`divider-${idx}`}
                      className="h-px bg-slate-100 my-1 mx-1.5"
                    />
                  );
                }

                const isSelected = opt.value === value;

                return (
                  <button
                    key={opt.value || `opt-${idx}`}
                    type="button"
                    disabled={opt.disabled}
                    onClick={() => {
                      if (!opt.disabled) {
                        onChange(opt.value);
                        setIsOpen(false);
                      }
                    }}
                    className={`w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-xl text-left rtl:text-right transition-colors cursor-pointer group text-xs ${
                      opt.disabled
                        ? 'opacity-40 cursor-not-allowed'
                        : isSelected
                        ? 'bg-[#E8F6F8] text-[#0E7490] font-bold'
                        : 'hover:bg-slate-50 text-slate-700 font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate min-w-0">
                      {opt.icon && (
                        <span
                          className={`shrink-0 ${
                            isSelected ? 'text-[#0E7490]' : 'text-slate-400 group-hover:text-[#2DA7B5]'
                          }`}
                        >
                          {opt.icon}
                        </span>
                      )}
                      <div className="truncate">
                        <span className="block truncate">{opt.label}</span>
                        {opt.sublabel && (
                          <span className="text-[10px] text-slate-400 block truncate font-normal">
                            {opt.sublabel}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {opt.badge && (
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                            isSelected
                              ? 'bg-[#2DA7B5]/20 text-[#0E7490]'
                              : 'bg-slate-100 text-slate-500 group-hover:bg-white group-hover:text-slate-700'
                          }`}
                        >
                          {opt.badge}
                        </span>
                      )}
                      {isSelected && <Check className="w-3.5 h-3.5 text-[#0E7490]" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
