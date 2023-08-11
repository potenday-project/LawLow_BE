import { Module } from '@nestjs/common';
import { HealthCheckerController } from './health-checker.controller';

@Module({
  controllers: [HealthCheckerController],
})
export class HealthCheckerModule {}
