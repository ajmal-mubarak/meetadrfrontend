import { mockDb } from '../data/mockDatabase';
import { WaitlistEntry } from '../types';

const delay = (ms = 250) => new Promise((resolve) => setTimeout(resolve, ms));

export const waitlistService = {
  async joinWaitlist(email: string, name?: string): Promise<WaitlistEntry> {
    await delay();
    const list = mockDb.getWaitlist();
    const newEntry: WaitlistEntry = {
      id: `wt_${Date.now()}`,
      email: email.trim().toLowerCase(),
      name: name?.trim() || undefined,
      submittedAt: new Date().toISOString(),
    };
    list.unshift(newEntry);
    mockDb.saveWaitlist(list);
    return newEntry;
  },

  async getWaitlist(): Promise<WaitlistEntry[]> {
    await delay();
    return mockDb.getWaitlist();
  },
};
