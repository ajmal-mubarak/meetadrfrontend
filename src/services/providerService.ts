import { mockDb } from '../data/mockDatabase';
import { ProviderRequest } from '../types';

const delay = (ms = 250) => new Promise((resolve) => setTimeout(resolve, ms));

export interface JoinRequestInput {
  providerType: 'hospital' | 'clinic' | 'doctor';
  name: string;
  contactNumber: string;
  email: string;
  country: string;
  location: string;
}

function normalizeRequest(r: ProviderRequest): ProviderRequest {
  return {
    ...r,
    createdAt: r.createdAt || r.submittedAt,
    status: r.status || 'pending',
  };
}

export const providerService = {
  async submitJoinRequest(input: JoinRequestInput): Promise<ProviderRequest> {
    await delay(350);
    const list = mockDb.getProviderRequests();
    const now = new Date().toISOString();
    const newRequest: ProviderRequest = {
      id: `req_${Date.now()}`,
      providerType: input.providerType,
      name: input.name,
      contactNumber: input.contactNumber,
      email: input.email.trim().toLowerCase(),
      country: input.country,
      location: input.location,
      submittedAt: now,
      createdAt: now,
      status: 'pending',
    };
    list.unshift(newRequest);
    mockDb.saveProviderRequests(list);
    return newRequest;
  },

  async getJoinRequests(): Promise<ProviderRequest[]> {
    await delay();
    return mockDb.getProviderRequests().map(normalizeRequest);
  },

  async getAllRequests(): Promise<ProviderRequest[]> {
    return this.getJoinRequests();
  },

  async updateRequestStatus(id: string, status: 'approved' | 'rejected'): Promise<ProviderRequest> {
    await delay(250);
    const list = mockDb.getProviderRequests();
    const index = list.findIndex((r) => r.id === id);
    if (index === -1) {
      throw new Error('Provider request not found.');
    }
    list[index] = {
      ...list[index],
      status,
    };
    mockDb.saveProviderRequests(list);
    return normalizeRequest(list[index]);
  },
};
