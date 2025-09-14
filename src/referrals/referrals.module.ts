import { Module } from '@nestjs/common';
import { ReferralsService } from './referrals.service';
import { ReferralsController } from './referrals.controller';
import { ReferralPaymentHook } from './referral-payment.hook';
import { DatabaseModule } from '../database/database.module';
import { LoggerModule } from '../logger/logger.module';

@Module({
  imports: [DatabaseModule, LoggerModule],
  providers: [ReferralsService, ReferralPaymentHook],
  controllers: [ReferralsController],
  exports: [ReferralsService, ReferralPaymentHook],
})
export class ReferralsModule {}
