import { Module } from '@nestjs/common';
import { LawsController } from './laws.controller';
import { LawsService } from './laws.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  controllers: [LawsController],
  providers: [LawsService],
})
export class LawModule {}
