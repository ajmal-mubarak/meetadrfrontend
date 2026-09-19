import { mockDb } from '../data/mockDatabase';
import { User, UserRole } from '../types';

const delay = (ms = 250) => new Promise((resolve) => setTimeout(resolve, ms));

export const authService = {
  async login(email: string, password: string): Promise<User> {
    await delay();
    const users = mockDb.getUsers();
    const found = users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase().trim() && u.password === password
    );

    if (!found) {
      throw new Error('Invalid email or password. Check demo credentials.');
    }

    const { password: _, ...safeUser } = found;
    mockDb.saveSession({ user: safeUser });
    return safeUser;
  },

  async register(
    name: string,
    email: string,
    password: string,
    mobile: string,
    role: UserRole = 'patient'
  ): Promise<User> {
    await delay();
    const users = mockDb.getUsers();
    const existing = users.find((u) => u.email.toLowerCase() === email.toLowerCase().trim());
    if (existing) {
      throw new Error('An account with this email address already exists.');
    }

    const newUser = {
      id: `usr_${Date.now()}`,
      name,
      email: email.toLowerCase().trim(),
      password,
      role,
      mobile,
    };

    users.push(newUser);
    mockDb.saveUsers(users);

    const { password: _, ...safeUser } = newUser;
    mockDb.saveSession({ user: safeUser });
    return safeUser;
  },

  async logout(): Promise<void> {
    await delay(100);
    mockDb.saveSession(null);
  },

  async getCurrentSession(): Promise<User | null> {
    await delay(50);
    const session = mockDb.getSession();
    return session?.user || null;
  },
};
