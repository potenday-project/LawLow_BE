import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

interface ICommonData {
  data?: any;
  [key: string]: any;
}
interface IData extends ICommonData {
  success?: boolean;
}
interface IResult extends ICommonData {
  success: boolean;
}

/**
 * -- 응답 형태 표준화를 위한 인터셉터 --
 *
 * - 모든 응답에 success, data 필드를 추가
 * - 넘어오는 데이터가 boolean인 경우, success 필드에 해당 값을 넣어 응답
 * - 넘어오는 데이터가 boolean이 아닌 경우, success 필드에 true를 넣고, data 필드에 해당 값을 넣어 응답
 * - 넘어오는 데이터에 key 값이 data인 값이 있는 경우, 해당 값을 data 필드에 넣고, 나머지 값은 그대로 응답
 * */
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
          };
        }

        return {
          success: success ?? true,
          data,
        };
      }),
    );
  }
}
