import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import dayjs from 'dayjs';

interface IResObject {
  success: boolean;
  statusCode: number;
  message: string | null;
  detail: string | null;
}

interface ILog {
  timestamp: string;
  method: string;
  url: string;
  res: IResObject;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException | Error, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    const stack = exception.stack;

    if (!(exception instanceof HttpException)) {
      exception = new InternalServerErrorException(exception.message);
    }

    const res: string | { message?: string; error?: string } = (exception as HttpException).getResponse();

    const statusCode = (exception as HttpException).getStatus();
    const resObject: IResObject = {
      success: false,
      statusCode,
      message: typeof res === 'string' ? res : res.message ?? exception.message ?? null,
      detail:
        typeof res === 'string'
          ? `${res} at [ '${req.url}' ]`
          : exception.name
          ? `${exception.name} at [ '${req.url}' ]`
          : res.error
          ? `${res.error} at [ '${req.url}' ]`
          : null,
    };

    const log: ILog = {
      timestamp: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      method: req.method,
      url: req.url,
      res: resObject,
    };

    if (statusCode >= 500) {
      this.logger.error(log, stack);
    } else {
      this.logger.warn(log, stack);
    }

    response.status(statusCode).json(resObject);
  }
}
