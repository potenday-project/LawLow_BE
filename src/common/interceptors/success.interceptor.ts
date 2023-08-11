import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { CommonResponse } from '../types';

@Injectable()
export class SuccessInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<CommonResponse> {
    return next.handle().pipe(
      map((data: CommonResponse | boolean) => {
        if (typeof data === 'boolean') {
          return { success: data };
        }

        const success = data.success;
        if (typeof data.success === 'boolean') delete data.success;

        const isExistPassedData = data.data;

        if (isExistPassedData) {
          return {
            success: success ?? true,
            ...data,
          } as CommonResponse;
        }

        return {
          success: success ?? true,
          data: data,
        } as CommonResponse;
      }),
    );
  }
}
