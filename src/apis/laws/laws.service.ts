import { ForbiddenException, Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { map } from 'rxjs/operators';
import { AxiosRequestConfig } from 'axios';
import * as convert from 'xml-js';

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
    const convertedLaws = convert.xml2json(laws, { compact: true, spaces: 2 });

    return convertedLaws;
  }
}
