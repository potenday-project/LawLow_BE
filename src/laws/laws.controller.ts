import { Controller } from '@nestjs/common';
import { LawsService } from './laws.service';
import { Get } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';

@Controller('laws')
export class LawsController {
  constructor(private readonly lawsService: LawsService) {}

  @Get()
  @ApiOperation({ summary: 'Get laws' })
  getLaws() {
    return this.lawsService.getLaws();
  }
}
