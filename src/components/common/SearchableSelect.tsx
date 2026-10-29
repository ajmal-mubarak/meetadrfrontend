import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, X, Check, ChevronDown } from 'lucide-react';

export type SearchableSelectOption = string | { value: string; label: string };

interface SearchableSelectProps {
  label?: string;
  placeholder?: string;
  options: SearchableSelectOption[];
  value: string;
  onChange: (value: string) => void;
  allowCustom?: boolean;
  disabled?: boolean;
  className?: string;
  required?: boolean;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  label,
  placeholder = 'Select option...',
  options,
  value,
  onChange,
  allowCustom = false,
  disabled = false,
  className = '',
  required = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getOptValue = (opt: SearchableSelectOption): string => {
    return typeof opt === 'string' ? opt : opt.value;
  };

  const getOptLabel = (opt: SearchableSelectOption): string => {
    return typeof opt === 'string' ? opt : opt.label;
  };

  const displayLabel = useMemo(() => {
    if (!value) return '';
    const found = options.find((opt) => getOptValue(opt) === value);
    return found ? getOptLabel(found) : value;
  }, [options, value]);

  const filteredOptions = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return options;
    return options.filter((opt) => {
      const labelStr = getOptLabel(opt).toLowerCase();
      const valStr = getOptValue(opt).toLowerCase();
      return labelStr.includes(q) || valStr.includes(q);
    });
  }, [options, search]);

  const selectOption = (opt: SearchableSelectOption | string) => {
    const val = typeof opt === 'string' ? opt : getOptValue(opt);
    onChange(val);
    setIsOpen(false);
    setSearch('');
  };

  const isExactMatch = useMemo(() => {
    const q = search.trim().toLowerCase();
    return options.some((opt) => {
      return getOptLabel(opt).toLowerCase() === q || getOptValue(opt).toLowerCase() === q;
    });
  }, [options, search]);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-xs font-bold text-slate-700 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      {/* Trigger Box */}
      <div
        onClick={() => {
          if (!disabled) {
            setIsOpen((prev) => !prev);
            setTimeout(() => inputRef.current?.focus(), 50);
          }
        }}
        className={`h-[42px] px-3 bg-white border rounded-xl flex items-center justify-between gap-2 cursor-pointer transition-all ${
          isOpen
            ? 'border-[#2DA7B5] ring-2 ring-[#2DA7B5]/20 shadow-xs'
            : 'border-[#CBD5E1] hover:border-slate-400'
        } ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-50' : ''}`}
      >
        <div className="flex-1 truncate text-xs font-medium">
          {displayLabel ? (
            <span className="text-slate-900 font-semibold">{displayLabel}</span>
          ) : (
            <span className="text-slate-400 select-none">{placeholder}</span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0 text-slate-400">
          {value && !disabled && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange('');
              }}
              title="Clear"
              className="p-1 hover:text-slate-600 rounded-full cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-[#2DA7B5]' : ''
            }`}
          />
        </div>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-[#CBD5E1] rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          {/* Search Box */}
          <div className="p-2 border-b border-slate-100 bg-[#F8FAFC]">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && search.trim() && allowCustom) {
                    selectOption(search.trim());
                  }
                }}
                placeholder="Search options..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-[#E2EBF0] rounded-lg focus:outline-hidden focus:border-[#2DA7B5] font-medium placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Options List */}
          <div className="max-h-60 overflow-y-auto p-1.5 space-y-0.5 no-scrollbar">
            {allowCustom && search.trim() && !isExactMatch && (
              <button
                type="button"
                onClick={() => selectOption(search.trim())}
                className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold text-[#0E7490] bg-[#EBF7F9] hover:bg-[#DCF3F6] flex items-center justify-between cursor-pointer transition-colors mb-1"
              >
                <span>Use &quot;{search.trim()}&quot; (custom)</span>
                <span className="text-[10px] bg-white px-1.5 py-0.5 rounded-md border border-[#CDEBF0]">Enter</span>
              </button>
            )}

            {filteredOptions.length === 0 && (!allowCustom || !search.trim()) ? (
              <div className="py-6 text-center text-xs text-slate-400">
                No matching options found
              </div>
            ) : (
              filteredOptions.map((opt, idx) => {
                const optVal = getOptValue(opt);
                const optLabel = getOptLabel(opt);
                const isSelected = value === optVal;
                return (
                  <div
                    key={`${optVal}-${idx}`}
                    onClick={() => selectOption(opt)}
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-[#EBF7F9] text-[#0E7490] font-bold'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="truncate pr-2">{optLabel}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-[#2DA7B5] stroke-[3]" />}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
