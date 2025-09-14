import type { Request } from 'express';

export interface AdminSessionState {
  isAdmin?: boolean;
}

export type AdminSessionRequest = Request & { session?: AdminSessionState };
