import { Module } from "@nestjs/common";
import { HeyGenController } from "./heygen.controller";
import { HeyGenService } from "./heygen.service";

@Module({
  controllers: [HeyGenController],
  providers: [HeyGenService],
  exports: [HeyGenService],
})
export class HeyGenModule {}
