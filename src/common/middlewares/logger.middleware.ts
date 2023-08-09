import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction): void {
    // route handler 전 실행
    const { ip, method, originalUrl } = req;
    const userAgent = req.get('user-agent');
    const before = Date.now();

    // route handler 끝난 뒤 실행하기 위해 비동기로 빠짐
    res.on('finish', () => {
      const { statusCode } = res;
      const contentLength = res.get('content-length');
      const after = Date.now();

      this.logger.log(
        `${method} ${originalUrl} ${statusCode} ${contentLength} ${after - before} ms - ${userAgent} ${ip}`,
      );
    });

    next();
  }
}
