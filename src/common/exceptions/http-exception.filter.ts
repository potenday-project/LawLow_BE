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
  message: string;
  detail: string;
}
interface ILog {
  timestamp: string;
  method: string;
  url: string;
  res: IResObject;
}
type Err = string | { message?: string; error?: string };

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException | Error, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    if (!(exception instanceof HttpException)) {
      exception = new InternalServerErrorException(exception.message);
    }

    const err: Err = (exception as HttpException).getResponse();

    const statusCode = (exception as HttpException).getStatus();
    const resObject: IResObject = {
      success: false,
      statusCode,
      message: typeof err === 'string' ? err : err.message ?? exception.message ?? null,
      detail: this.getDetail(exception, err, req),
    };

    this.logErrorOrWarning(exception, resObject, req);

    response.status(statusCode).json(resObject);
  }

  private getDetail(exception: HttpException | Error, err: Err, request: Request): string | null {
    if (typeof err === 'string') return `${err} at [ '${request.url}' ]`;
    if (exception.name) return `${exception.name} at [ '${request.url}' ]`;
    if (err.error) return `${err.error} at [ '${request.url}' ]`;

    return null;
  }

  private logErrorOrWarning(exception: HttpException | Error, resObject: IResObject, request: Request): void {
    const log: ILog = {
      timestamp: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      method: request.method,
      url: request.url,
      res: resObject,
    };
    const stack = exception.stack;

    if (resObject.statusCode >= 500) {
      this.logger.error(log, stack);
    } else {
      this.logger.warn(log, stack);
    }
  }
}
