import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

type DataValueType = string | number | object;

interface ICommonData {
  data?: DataValueType;
  [key: string]: DataValueType | boolean;
}
interface IData extends ICommonData {
  success?: boolean;
}
interface IResult extends ICommonData {
  success: boolean;
}

@Injectable()
export class SuccessInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<IResult> {
    return next.handle().pipe(
      map((data: IData | boolean) => {
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
          } as IResult;
        }

        return {
          success: success ?? true,
          data: data,
        } as IResult;
      }),
    );
  }
}
