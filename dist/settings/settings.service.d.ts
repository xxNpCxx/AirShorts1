import { Pool } from "pg";
export declare class SettingsService {
    private readonly pool;
    constructor(pool: Pool);
    getSetting(key: string): Promise<string | null>;
    setSetting(key: string, value: string): Promise<void>;
    getCommissionPercent(): Promise<number>;
    setCommissionPercent(percent: number): Promise<void>;
    getReferralCommissionPercent(): Promise<number>;
    setReferralCommissionPercent(percent: number): Promise<void>;
    getOwnerId(): Promise<string | null>;
    getAdminIds(): Promise<string[]>;
    getOperatorIds(): Promise<string[]>;
    checkRole(userId: string, role: "owner" | "admin" | "operator"): Promise<boolean>;
}
//# sourceMappingURL=settings.service.d.ts.map