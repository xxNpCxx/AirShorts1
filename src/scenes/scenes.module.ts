import { Module } from '@nestjs/common';
import { VideoGenerationScene } from './video-generation.scene';
import { ReferralScene } from './referral.scene';
import { PaymentScene } from './payment.scene';
import { AdminReferralScene } from './admin-referral.scene';
import { ReferralsModule } from '../referrals/referrals.module';
import { KeyboardsModule } from '../keyboards/keyboards.module';
import { LoggerModule } from '../logger/logger.module';

@Module({
  imports: [ReferralsModule, KeyboardsModule, LoggerModule],
  providers: [VideoGenerationScene, ReferralScene, PaymentScene, AdminReferralScene],
  exports: [VideoGenerationScene, ReferralScene, PaymentScene, AdminReferralScene],
})
export class ScenesModule {}
