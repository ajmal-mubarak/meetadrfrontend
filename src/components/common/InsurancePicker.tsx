/**
 * InsurancePicker — "Add insurance" button + modal
 *
 * Matches the reference design:
 *  • "Add insurance" pill trigger button with shield icon & down chevron
 *  • Modal dialog:
 *    - Search input at the top ("Search for insurance...")
 *    - "Your insurances" (if logged in as patient with saved profile / dependents)
 *    - "Popular carriers" 2-column grid cards with logos/badges (like reference)
 *    - "All carriers" grouped alphabetically (#, A, B, C...)
 *    - Real-time search filtering across all carriers
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ShieldCheck, X, Search, Check, ChevronDown, User, Users } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { patientService } from '../../services/patientService';

interface InsurancePickerProps {
  /** All unique insurance plan names scraped from hospital list */
  allHospitalPlans?: string[];
  /** Currently selected insurer (controlled) */
  selected: string;
  /** Called when user picks / clears an insurer */
  onSelect: (insurer: string) => void;
  isArabic?: boolean;
  buttonClassName?: string;
  containerClassName?: string;
  variant?: 'default' | 'hero';
}

interface PatientInsuranceEntry {
  label: string;
  provider: string;
  isDependent: boolean;
}

/** Default comprehensive list of health insurance carriers in the UAE / GCC region */
const STANDARD_CARRIERS = [
  'Aetna International',
  'Al Buhaira National Insurance',
  'Al Dhafra Insurance',
  'Al Hilal Takaful',
  'Al Ittihad Al Watani',
  'Al Khazna Insurance',
  'Al Madallah Healthcare',
  'Al Sagr National Insurance',
  'Al Wathba National Insurance',
  'Allianz Care',
  'Amity Health',
  'Arabia Insurance',
  'Aster Insurance Network',
  'AXA / GIG Gulf',
  'Blue Cross Blue Shield',
  'Bupa Global',
  'Cigna Healthcare',
  'Daman (National Health Insurance)',
  'Dubai Insurance',
  'Dubai National Insurance (DNIR)',
  'Emirates Insurance Company',
  'Enaya (Government of Dubai)',
  'Fidelity United',
  'GIG Gulf (formerly AXA)',
  'HealthNet',
  'Inayah TPA',
  'Islamic Arab Insurance (Salama)',
  'MaxCare TPA',
  'Mednet Global',
  'MetLife',
  'NAS Administration Services',
  'National General Insurance (NGI)',
  'National Takaful (Watania)',
  'Neuron TPA',
  'NextCare',
  'Noor Takaful',
  'Oman Insurance (Sukoon)',
  'Orient Insurance',
  'Orient UNB Takaful',
  'Qatar Insurance (QIC)',
  'Ras Al Khaimah National Insurance (RAKNIC)',
  'Saada (DHA Health Program)',
  'Saico Health (DAMANA)',
  'Sukoon Insurance',
  'Takaful Emarat',
  'Thiqa (Abu Dhabi Citizens)',
  'Union Insurance',
  'UnitedHealthcare Global',
  'Wateen TPA',
  'Other / Custom Insurance',
];

/** Popular carriers displayed as cards at the top of the modal */
const POPULAR_CARRIERS = [
  { name: 'Daman', code: 'DAMAN', badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { name: 'NextCare', code: 'NEXT', badgeBg: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
  { name: 'GIG Gulf (AXA)', code: 'GIG', badgeBg: 'bg-rose-50 text-rose-700 border-rose-200' },
  { name: 'Cigna', code: 'CIGNA', badgeBg: 'bg-teal-50 text-teal-700 border-teal-200' },
  { name: 'MetLife', code: 'MET', badgeBg: 'bg-blue-50 text-blue-700 border-blue-200' },
  { name: 'Bupa Global', code: 'BUPA', badgeBg: 'bg-sky-50 text-sky-700 border-sky-200' },
  { name: 'Sukoon', code: 'SUKOON', badgeBg: 'bg-amber-50 text-amber-700 border-amber-200' },
  { name: 'Al Madallah', code: 'MADAL', badgeBg: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  { name: 'Thiqa', code: 'THIQA', badgeBg: 'bg-purple-50 text-purple-700 border-purple-200' },
  { name: 'Mednet', code: 'MEDNET', badgeBg: 'bg-slate-100 text-slate-700 border-slate-300' },
];

/** Group a sorted list of insurer names by first letter */
function groupByLetter(names: string[]): { letter: string; items: string[] }[] {
  const map = new Map<string, string[]>();
  for (const n of names) {
    const firstChar = n.trim()[0] || '';
    const letter = /^[0-9]/.test(firstChar) ? '#' : firstChar.toUpperCase();
    if (!map.has(letter)) map.set(letter, []);
    map.get(letter)!.push(n);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => (a === '#' ? -1 : b === '#' ? 1 : a.localeCompare(b)))
    .map(([letter, items]) => ({ letter, items }));
}

export const InsurancePicker: React.FC<InsurancePickerProps> = ({
  allHospitalPlans = [],
  selected,
  onSelect,
  isArabic = false,
  buttonClassName,
  containerClassName,
  variant = 'default',
}) => {
  const { isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [patientInsurances, setPatientInsurances] = useState<PatientInsuranceEntry[]>([]);
  const [profileLoading, setProfileLoading] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // ─── Load patient insurance data (when logged in + modal opens) ───────────
  useEffect(() => {
    if (!isAuthenticated || !open) return;
    if (patientInsurances.length > 0) return;
    setProfileLoading(true);
    patientService
      .getProfile()
      .then((profile) => {
        const entries: PatientInsuranceEntry[] = [];
        if (profile.insuranceProvider?.trim()) {
          entries.push({
            label: isArabic ? 'أنت (حسابك الأساسي)' : 'You (Primary Account)',
            provider: profile.insuranceProvider.trim(),
            isDependent: false,
          });
        }
        (profile.dependents || []).forEach((dep) => {
          if (dep.insuranceProvider?.trim()) {
            entries.push({
              label: `${dep.name} (${dep.relation})`,
              provider: dep.insuranceProvider.trim(),
              isDependent: true,
            });
          }
        });
        setPatientInsurances(entries);
      })
      .catch(() => { })
      .finally(() => setProfileLoading(false));
  }, [isAuthenticated, open, isArabic]);

  // ─── Close on outside click / Escape ─────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const keyHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('keydown', keyHandler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('keydown', keyHandler);
    };
  }, [open]);

  // Focus search input when modal opens
  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 80);
  }, [open]);

  // ─── Derived data ─────────────────────────────────────────────────────────

  /** Unique master list combining defaults with DB hospital plans */
  const allUniquePlans = useMemo(() => {
    const set = new Set<string>();
    STANDARD_CARRIERS.forEach((c) => set.add(c));
    allHospitalPlans.forEach((p) => {
      if (p.trim()) set.add(p.trim());
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [allHospitalPlans]);

  /** Items shown in "All carriers" alphabetical list (filtered by search) */
  const filteredAll = useMemo(() => {
    const q = query.trim().toLowerCase();
    const source = q ? allUniquePlans.filter((p) => p.toLowerCase().includes(q)) : allUniquePlans;
    return groupByLetter(source);
  }, [allUniquePlans, query]);

  /** Matching popular carriers (if search query matches) */
  const matchingPopular = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return POPULAR_CARRIERS;
    return POPULAR_CARRIERS.filter((c) => c.name.toLowerCase().includes(q));
  }, [query]);

  /** Filtered patient saved insurances */
  const filteredPatient = useMemo(() => {
    const q = query.trim().toLowerCase();
    return patientInsurances.filter(
      (e) => !q || e.provider.toLowerCase().includes(q) || e.label.toLowerCase().includes(q),
    );
  }, [patientInsurances, query]);

  const hasResults =
    filteredAll.some((g) => g.items.length > 0) ||
    filteredPatient.length > 0 ||
    matchingPopular.length > 0;

  // ─── Action Handlers ──────────────────────────────────────────────────────

  const handlePick = (name: string) => {
    onSelect(selected === name ? '' : name);
    setOpen(false);
    setQuery('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect('');
  };

  const buttonLabel = selected
    ? selected
    : isArabic
      ? 'التأمين'
      : 'Insurance';

  return (
    <div className={`relative ${variant === 'hero' ? 'flex items-center w-full sm:w-56' : 'inline-flex items-center'} ${containerClassName || ''}`}>
      {/* Trigger Button */}
      {variant === 'hero' ? (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={`w-full sm:w-56 h-[48px] flex items-center justify-between px-3 py-2 bg-[#F8FAFC] rounded-xl border transition-colors cursor-pointer select-none text-left rtl:text-right group ${
            selected
              ? 'border-[#2DA7B5] bg-[#E8F6F8] ring-1 ring-[#2DA7B5]/20 shadow-2xs'
              : 'border-[#E2EBF0] hover:border-[#2DA7B5]'
          } ${buttonClassName || ''}`}
          aria-haspopup="dialog"
          aria-expanded={open}
        >
          <div className="flex items-center gap-2 min-w-0 flex-1 pr-1 rtl:pr-0 rtl:pl-1">
            <div className="w-8 h-8 rounded-xl bg-[#2DA7B5] text-white flex items-center justify-center shrink-0 shadow-2xs">
              <ShieldCheck className="w-4 h-4 text-white stroke-[2.5]" />
            </div>
            <span
              className={`text-xs font-bold truncate ${
                selected ? 'text-[#0E7490]' : 'text-slate-800 group-hover:text-[#0E7490]'
              }`}
            >
              {buttonLabel}
            </span>
          </div>
          {selected ? (
            <button
              type="button"
              onClick={handleClear}
              className="text-[#0E7490] hover:text-rose-500 transition-colors p-1 cursor-pointer shrink-0"
              aria-label="Clear insurance filter"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <ChevronDown
              className={`w-4 h-4 text-slate-400 group-hover:text-slate-600 shrink-0 transition-transform duration-200 ${
                open ? 'rotate-180 text-[#0E7490]' : ''
              }`}
            />
          )}
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={`inline-flex items-center gap-2 px-3.5 py-2 sm:py-2.5 rounded-xl border text-xs sm:text-sm font-semibold transition-all cursor-pointer select-none ${
            selected
              ? 'bg-[#E8F6F8] border-[#2DA7B5] text-[#0E7490] shadow-2xs font-bold'
              : 'bg-[#F8FAFC] border-[#E2EBF0] text-slate-700 hover:border-[#2DA7B5] hover:text-[#0E7490] hover:bg-white'
          } ${buttonClassName || ''}`}
          aria-haspopup="dialog"
          aria-expanded={open}
        >
          <ShieldCheck className="w-4 h-4 text-slate-700 shrink-0" />
          <span className="truncate underline decoration-slate-400 decoration-1 underline-offset-2">
            {buttonLabel}
          </span>
          {selected ? (
            <button
              type="button"
              onClick={handleClear}
              className="ml-auto text-[#0E7490] hover:text-rose-500 transition-colors p-0.5 cursor-pointer"
              aria-label="Clear insurance filter"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <ChevronDown
              className={`w-3.5 h-3.5 text-slate-500 shrink-0 ml-auto transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
            />
          )}
        </button>
      )}

      {/* Modal Dialog */}
      {open && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-label="Select insurance"
            className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-[#E2EBF0] overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-slate-900"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-black text-slate-900">
                  {isArabic ? 'اختر شركة التأمين' : 'Select insurance'}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {isAuthenticated
                    ? isArabic
                      ? 'تأميناتك المعتمدة وقائمة كبرى شركات التأمين'
                      : 'Your saved coverage & accredited network carriers'
                    : isArabic
                      ? 'اختر مزود التأمين الصحي لعرض المستشفيات المعتمدة'
                      : 'Choose your provider to view in-network medical centers'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => { setOpen(false); setQuery(''); }}
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Input Box */}
            <div className="px-6 pt-4 pb-3">
              <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl border border-[#E2EBF0] bg-[#F8FAFC] focus-within:border-[#2DA7B5] focus-within:bg-white transition-all shadow-2xs">
                <Search className="w-4 h-4 text-slate-400 shrink-0" />
                <input
                  ref={searchRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={isArabic ? 'ابحث عن شركة تأمين...' : 'Search for insurance...'}
                  className="flex-1 bg-transparent text-sm text-slate-900 placeholder-slate-400 focus:outline-none font-medium"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery('')}
                    className="text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Modal Scrollable Content */}
            <div className="overflow-y-auto max-h-[60vh] px-6 pb-6 space-y-5">

              {/* ── Section A: Logged-in Patient & Dependents Saved Insurances ── */}
              {isAuthenticated && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-bold text-[#0E7490] uppercase tracking-wider flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5" />
                      <span>{isArabic ? 'تأميناتك المسجلة' : 'Your saved insurance'}</span>
                    </p>
                  </div>

                  {profileLoading ? (
                    <div className="flex items-center gap-2 text-xs text-slate-400 py-2">
                      <div className="w-4 h-4 border-2 border-[#2DA7B5] border-t-transparent rounded-full animate-spin" />
                      <span>{isArabic ? 'جاري التحميل...' : 'Loading your insurances...'}</span>
                    </div>
                  ) : filteredPatient.length > 0 ? (
                    <div className="space-y-1.5">
                      {filteredPatient.map((entry) => {
                        const isMatch = selected.toLowerCase() === entry.provider.toLowerCase();
                        return (
                          <button
                            key={entry.label + entry.provider}
                            type="button"
                            onClick={() => handlePick(entry.provider)}
                            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl border text-left rtl:text-right transition-all cursor-pointer ${isMatch
                                ? 'bg-[#E8F6F8] border-[#2DA7B5] text-[#0E7490]'
                                : 'border-[#E2EBF0] hover:bg-slate-50 text-slate-800'
                              }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-xl bg-[#E8F6F8] text-[#0E7490] flex items-center justify-center shrink-0 border border-[#CDEBF0]">
                                {entry.isDependent ? <Users className="w-4 h-4" /> : <User className="w-4 h-4" />}
                              </div>
                              <div>
                                <p className="text-xs font-bold text-slate-900">{entry.provider}</p>
                                <p className="text-[11px] text-slate-500">{entry.label}</p>
                              </div>
                            </div>
                            {isMatch && <Check className="w-4 h-4 text-[#0E7490] shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-xs text-slate-400 bg-[#F8FAFC] rounded-2xl p-3 border border-dashed border-[#E2EBF0]">
                      {isArabic
                        ? 'لم تُضف شركة تأمين إلى ملفك الشخصي بعد. يمكنك الاختيار من القائمة أدناه.'
                        : 'No insurance saved on your profile yet. Pick a carrier below.'}
                    </div>
                  )}
                </div>
              )}

              {/* ── Section B: Popular Carriers Grid (Matches reference image 3) ── */}
              {matchingPopular.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2.5">
                    {isArabic ? 'شركات التأمين الأكثر شيوعاً' : 'Popular carriers'}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {matchingPopular.map((carrier) => {
                      const isMatch = selected.toLowerCase() === carrier.name.toLowerCase();
                      return (
                        <button
                          key={carrier.name}
                          type="button"
                          onClick={() => handlePick(carrier.name)}
                          className={`flex items-center gap-2.5 p-2.5 rounded-2xl border text-left rtl:text-right transition-all cursor-pointer group ${isMatch
                              ? 'bg-[#E8F6F8] border-[#2DA7B5] text-[#0E7490] font-bold shadow-2xs'
                              : 'bg-white border-[#E2EBF0] hover:border-[#2DA7B5] hover:bg-slate-50 text-slate-800'
                            }`}
                        >
                          <div
                            className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 font-black text-[10px] tracking-tight ${carrier.badgeBg}`}
                          >
                            {carrier.code}
                          </div>
                          <span className="text-xs font-bold truncate flex-1 group-hover:text-[#0E7490] transition-colors">
                            {carrier.name}
                          </span>
                          {isMatch && <Check className="w-4 h-4 text-[#0E7490] shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ── Section C: All Carriers Alphabetical Grouping (Matches reference image 4) ── */}
              {filteredAll.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2.5">
                    {isArabic ? 'جميع شركات التأمين' : 'All carriers'}
                  </p>
                  <div className="space-y-4">
                    {filteredAll.map(({ letter, items }) => (
                      <div key={letter} className="border-b border-slate-100 last:border-b-0 pb-3">
                        <p className="text-xs font-black text-slate-400 px-1 mb-1.5">{letter}</p>
                        <div className="space-y-0.5">
                          {items.map((name) => {
                            const isMatch = selected.toLowerCase() === name.toLowerCase();
                            return (
                              <button
                                key={name}
                                type="button"
                                onClick={() => handlePick(name)}
                                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left rtl:text-right text-xs transition-colors cursor-pointer ${isMatch
                                    ? 'bg-[#E8F6F8] text-[#0E7490] font-bold'
                                    : 'hover:bg-slate-50 text-slate-700 font-medium'
                                  }`}
                              >
                                <span className="truncate">{name}</span>
                                {isMatch && <Check className="w-4 h-4 text-[#0E7490] shrink-0 ml-2" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty Search State */}
              {!hasResults && (
                <div className="text-center py-6">
                  <ShieldCheck className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-700">
                    {isArabic
                      ? `لا توجد نتائج لـ "${query}"`
                      : `No standard carrier matches "${query}"`}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5 mb-3">
                    {isArabic
                      ? 'يمكنك استخدام هذا التأمين المخصص مباشرة'
                      : 'You can select this custom insurance directly'}
                  </p>
                  {query.trim() && (
                    <button
                      type="button"
                      onClick={() => handlePick(query.trim())}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#2DA7B5] hover:bg-[#258e9b] text-white text-xs font-bold rounded-xl cursor-pointer transition-colors shadow-2xs"
                    >
                      <span>{isArabic ? `اختيار "${query.trim()}"` : `Select "${query.trim()}" (Custom)`}</span>
                    </button>
                  )}
                </div>
              )}

            </div>
          </div>

        </div>
      )}
    </div>
  );
};
