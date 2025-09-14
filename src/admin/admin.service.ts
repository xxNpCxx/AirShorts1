import { Injectable } from '@nestjs/common';

@Injectable()
export class AdminService {
  private readonly adminPassword = process.env.ADMIN_PASSWORD || '';
  private readonly sessionSecret = process.env.ADMIN_SESSION_SECRET || '';

  isPasswordValid(password: string): boolean {
    return Boolean(this.adminPassword) && password === this.adminPassword;
  }
}
