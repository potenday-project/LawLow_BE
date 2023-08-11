import { Controller } from '@nestjs/common';
import { Get } from '@nestjs/common';

@Controller('health-checker')
export class HealthCheckerController {
  @Get()
  getHealthCheck(): string {
    return 'ok';
  }
}
