import { Module } from '@nestjs/common';
import { LawsController } from './laws.controller';
import { LawsService } from './laws.service';

@Module({
  controllers: [LawsController],
  providers: [LawsService],
})
export class LawsModule {}
