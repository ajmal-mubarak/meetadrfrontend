import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Search, Check } from 'lucide-react';
import { COUNTRY_PHONE_RULES, PhoneCountryRule } from '../../utils/phoneValidation';

interface CountryCodeDropdownProps {
  value: string;
  onChange: (dialCode: string) => void;
  className?: string;
  buttonClassName?: string;
  dropdownClassName?: string;
}

export const CountryCodeDropdown: React.FC<CountryCodeDropdownProps> = ({
  value,
  onChange,
  className = '',
  buttonClassName = '',
  dropdownClassName = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const rulesList: PhoneCountryRule[] = useMemo(() => {
    return Object.values(COUNTRY_PHONE_RULES);
  }, []);

  const currentRule = useMemo(() => {
    return COUNTRY_PHONE_RULES[value] || rulesList[0];
  }, [value, rulesList]);

  // Filter countries by name or dial code
  const filteredRules = useMemo(() => {
    if (!search.trim()) return rulesList;
    const q = search.toLowerCase().trim();
    return rulesList.filter(
      (r) =>
        r.countryName.toLowerCase().includes(q) ||
        r.dialCode.toLowerCase().includes(q)
    );
  }, [rulesList, search]);

  // Outside click to close
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearch('');
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  const handleSelect = (dialCode: string) => {
    onChange(dialCode);
    setIsOpen(false);
    setSearch('');
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Dropdown Toggle Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full flex items-center justify-between gap-1.5 px-3 py-3 rounded-2xl bg-[#F8FAFC] border border-[#E2EBF0] text-xs font-bold text-slate-800 hover:border-[#2DA7B5] focus:outline-hidden transition-all cursor-pointer shadow-2xs ${buttonClassName}`}
      >
        <span className="truncate">{currentRule.dialCode}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-[#2DA7B5]' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu - Always opens downwards (top-full mt-1.5) with scroll */}
      {isOpen && (
        <div
          className={`absolute left-0 top-full mt-1.5 w-64 max-w-[90vw] bg-white border border-[#E2EBF0] rounded-2xl shadow-xl z-50 py-2 animate-in fade-in slide-in-from-top-1 duration-150 ${dropdownClassName}`}
        >
          {/* Quick search input */}
          <div className="px-2.5 pb-2 border-b border-slate-100">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search country or code..."
                className="w-full pl-8 pr-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-[#2DA7B5] font-medium"
              />
            </div>
          </div>

          {/* Scrollable list */}
          <div className="max-h-56 overflow-y-auto divide-y divide-slate-50 py-1">
            {filteredRules.length === 0 ? (
              <p className="text-center py-3 text-xs text-slate-400 font-medium">
                No matching country found
              </p>
            ) : (
              filteredRules.map((rule) => {
                const isSelected = rule.dialCode === value;
                return (
                  <button
                    key={rule.dialCode}
                    type="button"
                    onClick={() => handleSelect(rule.dialCode)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs transition-colors cursor-pointer text-left rtl:text-right ${
                      isSelected
                        ? 'bg-[#E8F6F8] text-[#0E7490] font-bold'
                        : 'text-slate-700 hover:bg-slate-50 font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate pr-2">
                      <span className="font-mono font-bold text-slate-900 w-12 shrink-0">
                        {rule.dialCode}
                      </span>
                      <span className="truncate">{rule.countryName}</span>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-[#2DA7B5] shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

