import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { map } from 'rxjs/operators';
import { AxiosRequestConfig } from 'axios';

@Injectable()
export class LawsService {
  constructor(private readonly httpService: HttpService) {}
  async getLaws() {
    const requestConfig: AxiosRequestConfig = {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      params: {
        OC: 'rjsgmldnwn',
        target: 'prec',
        type: 'XML',
      },
    };

    const laws = await lastValueFrom(
      await this.httpService.get('http://www.law.go.kr/DRF/lawSearch.do', requestConfig).pipe(map((res) => res.data)),
    );

    return laws;
  }
}
