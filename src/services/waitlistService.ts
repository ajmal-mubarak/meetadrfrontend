import { WaitlistEntry } from '../types';

const WAITLIST_STORAGE_KEY = 'meetadr_waitlist';

export const waitlistService = {
  async joinWaitlist(email: string, name?: string): Promise<WaitlistEntry> {
    const raw = localStorage.getItem(WAITLIST_STORAGE_KEY);
    const list: WaitlistEntry[] = raw ? JSON.parse(raw) : [];
    const newEntry: WaitlistEntry = {
      id: `wt_${Date.now()}`,
      email: email.trim().toLowerCase(),
      name: name?.trim() || undefined,
      submittedAt: new Date().toISOString(),
    };
    list.unshift(newEntry);
    localStorage.setItem(WAITLIST_STORAGE_KEY, JSON.stringify(list));
    return newEntry;
  },

  async getWaitlist(): Promise<WaitlistEntry[]> {
    const raw = localStorage.getItem(WAITLIST_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  },
};
