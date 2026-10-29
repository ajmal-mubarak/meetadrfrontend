import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, X, Check, ChevronDown, Plus } from 'lucide-react';

interface SearchableMultiSelectProps {
  label?: string;
  sublabel?: string;
  placeholder?: string;
  options: string[];
  selected?: string[];
  values?: string[];
  onChange: (selected: string[]) => void;
  allowCustom?: boolean;
  maxDisplayPills?: number;
  disabled?: boolean;
  className?: string;
  required?: boolean;
}

export const SearchableMultiSelect: React.FC<SearchableMultiSelectProps> = ({
  label,
  sublabel,
  placeholder = 'Select options...',
  options,
  selected,
  values,
  onChange,
  allowCustom = true,
  maxDisplayPills = 4,
  disabled = false,
  className = '',
  required = false,
}) => {
  const currentSelected = useMemo(() => selected || values || [], [selected, values]);

  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [customInputValue, setCustomInputValue] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setIsAddingCustom(false);
        setCustomInputValue('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return options;
    return options.filter((opt) => opt.toLowerCase().includes(q));
  }, [options, search]);

  const toggleOption = (opt: string) => {
    const trimmed = opt.trim();
    if (!trimmed) return;
    if (currentSelected.includes(trimmed)) {
      onChange(currentSelected.filter((s) => s !== trimmed));
    } else {
      onChange([...currentSelected, trimmed]);
    }
  };

  const removeOption = (e: React.MouseEvent, opt: string) => {
    e.stopPropagation();
    onChange(currentSelected.filter((s) => s !== opt));
  };

  const isExactMatch = useMemo(() => {
    const q = search.trim().toLowerCase();
    return options.some((opt) => opt.toLowerCase() === q);
  }, [options, search]);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-xs font-bold text-slate-700 mb-1">
          {label} {sublabel && <span className="font-normal text-slate-400">{sublabel}</span>}{' '}
          {required && <span className="text-red-500">*</span>}
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
        className={`min-h-[42px] py-1.5 px-3 bg-white border rounded-xl flex items-center justify-between gap-2 cursor-pointer transition-all ${
          isOpen
            ? 'border-[#2DA7B5] ring-2 ring-[#2DA7B5]/20 shadow-xs'
            : 'border-[#CBD5E1] hover:border-slate-400'
        } ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-50' : ''}`}
      >
        <div className="flex-1 flex flex-wrap gap-1.5 items-center">
          {currentSelected.length === 0 ? (
            <span className="text-xs text-slate-400 select-none">{placeholder}</span>
          ) : (
            <>
              {currentSelected.slice(0, maxDisplayPills).map((item) => (
                <span
                  key={item}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#EBF7F9] text-[#0E7490] text-xs font-semibold border border-[#CDEBF0]"
                >
                  <span className="max-w-[140px] truncate">{item}</span>
                  {!disabled && (
                    <button
                      type="button"
                      onClick={(e) => removeOption(e, item)}
                      className="hover:text-red-600 rounded-full cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </span>
              ))}
              {currentSelected.length > maxDisplayPills && (
                <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600 text-xs font-bold">
                  +{currentSelected.length - maxDisplayPills} more
                </span>
              )}
            </>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0 text-slate-400">
          {currentSelected.length > 0 && !disabled && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange([]);
              }}
              title="Clear all"
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
                    toggleOption(search.trim());
                    setSearch('');
                  }
                }}
                placeholder="Search and select options..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-[#E2EBF0] rounded-lg focus:outline-hidden focus:border-[#2DA7B5] font-medium placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Options List */}
          <div className="max-h-60 overflow-y-auto p-1.5 space-y-0.5 no-scrollbar">
            {allowCustom && search.trim() && !isExactMatch && (
              <button
                type="button"
                onClick={() => {
                  toggleOption(search.trim());
                  setSearch('');
                }}
                className="w-full text-left px-2.5 py-2 rounded-xl text-xs font-bold text-[#0E7490] bg-[#EBF7F9] hover:bg-[#DCF3F6] border border-[#2DA7B5]/30 flex items-center justify-between cursor-pointer transition-colors mb-1.5 shadow-2xs"
              >
                <div className="flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5 text-[#2DA7B5]" />
                  <span>Add &quot;{search.trim()}&quot; (custom)</span>
                </div>
                <span className="text-[10px] bg-white px-2 py-0.5 rounded-md border border-[#CDEBF0] font-semibold">Enter ↵</span>
              </button>
            )}

            {filteredOptions.length === 0 && (!allowCustom || !search.trim()) ? (
              <div className="py-6 text-center text-xs text-slate-400">
                No matching options found
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = currentSelected.includes(opt);
                return (
                  <div
                    key={opt}
                    onClick={() => toggleOption(opt)}
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-[#EBF7F9] text-[#0E7490] font-bold'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="truncate pr-2">{opt}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-[#2DA7B5] stroke-[3]" />}
                  </div>
                );
              })
            )}
          </div>

          {/* Custom Option Footer */}
          {allowCustom && (
            <div className="p-2 border-t border-slate-100 bg-[#F8FAFC]">
              {isAddingCustom ? (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={customInputValue}
                      onChange={(e) => setCustomInputValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (customInputValue.trim()) {
                            toggleOption(customInputValue.trim());
                            setCustomInputValue('');
                            setIsAddingCustom(false);
                          }
                        } else if (e.key === 'Escape') {
                          setIsAddingCustom(false);
                          setCustomInputValue('');
                        }
                      }}
                      placeholder="Enter custom insurance name..."
                      className="flex-1 px-2.5 py-1.5 text-xs bg-white border border-[#CBD5E1] rounded-lg focus:outline-hidden focus:border-[#2DA7B5] font-medium"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (customInputValue.trim()) {
                          toggleOption(customInputValue.trim());
                          setCustomInputValue('');
                          setIsAddingCustom(false);
                        }
                      }}
                      className="px-3 py-1.5 bg-[#2DA7B5] hover:bg-[#258e9b] text-white text-xs font-bold rounded-lg cursor-pointer transition-colors shadow-2xs shrink-0"
                    >
                      Add
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingCustom(false);
                        setCustomInputValue('');
                      }}
                      className="px-2 py-1.5 text-slate-500 hover:text-slate-700 text-xs font-medium cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                  <span className="text-[10px] text-slate-400 block px-1">
                    Press Enter to add custom insurance
                  </span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsAddingCustom(true)}
                  className="w-full py-1.5 px-3 text-xs font-bold text-[#0E7490] hover:text-[#0b5c73] bg-white hover:bg-[#EBF7F9] border border-dashed border-[#2DA7B5]/40 hover:border-[#2DA7B5] rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Add Custom Insurance</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
