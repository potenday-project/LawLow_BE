import { Test, TestingModule } from '@nestjs/testing';
import { HealthCheckerController } from './health-checker.controller';

describe('AppController', () => {
  let healthCheckController: HealthCheckerController;

  beforeEach(async () => {
    const healthChecker: TestingModule = await Test.createTestingModule({
      controllers: [HealthCheckerController],
    }).compile();

    healthCheckController = healthChecker.get<HealthCheckerController>(HealthCheckerController);
  });

  describe('root', () => {
    it('should return "ok"', () => {
      expect(healthCheckController.getHealthCheck()).toBe('ok');
    });
  });
});
