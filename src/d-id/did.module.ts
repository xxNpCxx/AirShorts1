import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { DidService } from "./did.service";
import { DidController } from "./did.controller";

@Module({
  imports: [ConfigModule],
  providers: [DidService],
  controllers: [DidController],
  exports: [DidService],
})
export class DidModule {}
