import { Controller } from '@nestjs/common';
import { Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@Controller('health-checker')
@ApiTags('Health Checker')
export class HealthCheckerController {
  @Get()
  getHealthCheck(): string {
    return 'ok';
  }
}
