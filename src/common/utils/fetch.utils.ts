import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { map } from 'rxjs/operators';
import { AxiosRequestConfig } from 'axios';

export const fetchData = async (httpService: HttpService, url: string, config: AxiosRequestConfig<any>) => {
  const response$ = httpService
    .get(url, {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      ...config,
    })
    .pipe(map((res) => res.data));
  return await lastValueFrom(response$);
};
