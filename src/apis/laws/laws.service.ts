import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import convert from 'xml-js';
import { fetchData } from 'src/common/utils';
import { getLawListDto } from './dtos/get-law.dto';
import {
  SearchRangeEnum,
  SearchTabEnum,
  LawDetailResponse,
  LawListResponse,
  RawDataEntry,
  RawLawData,
  TransformedDataEntry,
  PageResponse,
  PrecLawData,
  ResLawData,
  TransformedLawList,
  PrecDetailData,
} from 'src/common/types';

interface GetLawListParams {
  type: SearchTabEnum;
  q: string;
  page: number;
  take: number;
}

@Injectable()
export class LawsService {
  constructor(private readonly httpService: HttpService) {}
  async getLawList(type: SearchTabEnum, queryParams: getLawListDto): Promise<PageResponse<ResLawData>> {
    const params: GetLawListParams = { type, ...queryParams };
    const convertedLaws = await this.fetchConvertedLaws(params);

    // 검색 결과가 없을 경우
    if (!convertedLaws.PrecSearch?.prec && !convertedLaws.LawSearch?.law) {
      return {
        list: [],
        ...this.generatePaginationData(convertedLaws, params, 0),
      };
    }

    const lawIdList = this.getLawIdList(convertedLaws);
    const lawDetailList: TransformedLawList = await Promise.all(lawIdList.map(this.fetchLawDetail(params)));

    const paginationData = this.generatePaginationData(convertedLaws, params, lawIdList.length);
    const responseData = this.generateResponseData(type, lawDetailList);

    return {
      list: responseData,
      ...paginationData,
    };
  }

  private fetchConvertedLaws = async (params: GetLawListParams) => {
    const requestConfig = this.generateRequestConfig(params);
    const laws = await fetchData(this.httpService, 'http://www.law.go.kr/DRF/lawSearch.do', requestConfig);
    const convertedLaws = convert.xml2js(laws, { compact: true, nativeType: true }) as LawListResponse;
    return convertedLaws;
  };

  private generateRequestConfig = (params: GetLawListParams) => {
    const { q, type, page, take } = params;
    const sort = type === 'prec' ? 'ddes' : 'efdes';
    return {
      params: {
        OC: 'rjsgmldnwn',
        target: type,
        search: SearchRangeEnum.CONTENT,
        query: q,
        sort,
        display: take,
        page,
        type: 'XML',
      },
    };
  };

  private fetchLawDetail = (queryParams: GetLawListParams) => async (lawId: number) => {
    const requestConfig = this.generateRequestConfig(queryParams);
    const lawDetail = await fetchData(this.httpService, 'http://www.law.go.kr/DRF/lawService.do', {
      params: {
        ...requestConfig.params,
        ID: lawId,
      },
    });
    const convertedLawDetail = convert.xml2js(lawDetail, { compact: true, nativeType: true }) as LawDetailResponse;
    const detailKey = queryParams.type === 'prec' ? 'PrecService' : '법령';

    return this.transformLawData(convertedLawDetail[detailKey]);
  };

  private getLawIdList(lawList: LawListResponse): number[] {
    if (lawList.PrecSearch) {
      if (Array.isArray(lawList.PrecSearch.prec)) {
        return lawList.PrecSearch.prec.map((prec) => prec.판례일련번호._text);
      }
      return [lawList.PrecSearch.prec.판례일련번호._text];
    }

    if (lawList.LawSearch) {
      if (Array.isArray(lawList.LawSearch.law)) {
        return lawList.LawSearch.law.map((law) => law.법령ID._text);
      }
      return [lawList.LawSearch.law.법령ID._text];
    }

    return [];
  }

  private transformLawData = (rawData: RawLawData | RawDataEntry): TransformedDataEntry | TransformedDataEntry[] => {
    if (Array.isArray(rawData)) {
      return rawData.map((item: RawLawData) => this.transformLawData(item)) as TransformedDataEntry[]; // 재귀 호출
    }
    const transformedData = Object.entries(rawData).reduce((acc, [key, value]) => {
      if (value['_text'] || typeof value['_text'] === 'number') {
        acc[key] = value['_text'];
      } else if (value['_cdata']) {
        acc[key] = value['_cdata'];
      } else if (typeof value === 'object' && value !== null) {
        acc[key] = this.transformLawData(value); // 재귀 호출
      } else {
        acc[key] = value;
      }
      return acc;
    }, {} as TransformedDataEntry[]);

    return transformedData;
  };

  private generatePaginationData(
    convertedLaws: LawListResponse,
    params: GetLawListParams,
    currentElementsCount: number,
  ): Omit<PageResponse<TransformedLawList>, 'list'> {
    const { type, page, take } = params;
    const lawListKey = type === 'prec' ? 'PrecSearch' : 'LawSearch';
    const totalCount = convertedLaws[lawListKey].totalCnt._text;
    const totalPages = Math.ceil(totalCount / take);

    return {
      first: page === 1,
      last: page * take >= totalCount && currentElementsCount > 0,
      currentElements: currentElementsCount,
      size: take,
      totalElements: totalCount,
      totalPages: totalPages,
      currentPage: page,
    };
  }

  private generateResponseData(type: SearchTabEnum, lawDetailList: TransformedLawList): ResLawData {
    const isLawType = type === SearchTabEnum.LAW;
    if (isLawType) {
      return lawDetailList;
    }

    return lawDetailList.map((lawDetail: PrecLawData): PrecDetailData => {
      return {
        판례정보일련번호: lawDetail.판례정보일련번호,
        사건번호: lawDetail.사건번호,
        사건종류명: lawDetail.사건종류명,
        판결유형: lawDetail.판결유형,
        선고: lawDetail.선고,
        법원명: lawDetail.법원명,
        선고일자: lawDetail.선고일자,
        사건명: lawDetail.사건명,
        판례내용: lawDetail.판례내용,
      };
    });
  }
}
