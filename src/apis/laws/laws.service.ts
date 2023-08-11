import { ConfigService } from '@nestjs/config';
import {
  SearchRangeEnum,
  SearchTabEnum,
  RawLawDetailRes,
  LawListApiResponse,
  RawDataEntry,
  RawLawData,
  TransformedCleanDataEntry,
  TransformedCleanLawList,
  PageResponse,
  PrecDetailData,
  LawDetailData,
  LawArticle,
} from 'src/common/types';
import { Injectable, NotFoundException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import convert from 'xml-js';
import { fetchData } from 'src/common/utils';
import { getLawListDto } from './dtos/get-law.dto';
import { OpenaiService } from 'src/shared/services/openai.service';
import { ChatCompletionRequestMessage } from 'openai';

interface GetLawListParams {
  type: SearchTabEnum;
  q: string;
  page: number;
  take: number;
}

@Injectable()
export class LawsService {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly openAiService: OpenaiService,
  ) {}

  async getLawList(
    type: SearchTabEnum,
    queryParams: getLawListDto,
  ): Promise<PageResponse<LawDetailData[] | PrecDetailData[]>> {
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
    const requestConfig = this.generateRequestConfig(params);
    const lawDetailList: TransformedCleanLawList = await Promise.all(lawIdList.map(this.fetchLawDetail(requestConfig)));

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
    const convertedLaws = convert.xml2js(laws, { compact: true, nativeType: true }) as LawListApiResponse;
    return convertedLaws;
  };

  private generateRequestConfig = (params: Partial<GetLawListParams>) => {
    const { q, type, page, take } = params;
    const sort = type === 'prec' ? 'ddes' : 'efdes';
    return {
      params: {
        OC: this.configService.get('LAW_OPEN_API_OC'),
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

  private fetchLawDetail =
    (requestConfig: ReturnType<typeof this.generateRequestConfig>) =>
    async (lawId: number): Promise<TransformedCleanDataEntry | TransformedCleanDataEntry[]> => {
      const lawDetail = await fetchData(this.httpService, 'http://www.law.go.kr/DRF/lawService.do', {
        params: {
          ID: lawId,
          ...requestConfig.params,
        },
      });
      const convertedLawDetail = convert.xml2js(lawDetail, { compact: true, nativeType: true }) as RawLawDetailRes;

      const detailKey = requestConfig.params.target === 'prec' ? 'PrecService' : '법령';
      const detailData = convertedLawDetail[detailKey];
      if (!detailData) {
        return null;
      }

      return this.transformCleanLawData(detailData);
    };

  private getLawIdList(lawList: LawListApiResponse): number[] {
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

  private transformCleanLawData = (
    rawData: RawLawData | RawDataEntry,
  ): TransformedCleanDataEntry | TransformedCleanDataEntry[] => {
    if (Array.isArray(rawData)) {
      return rawData.map((item: RawLawData) => this.transformCleanLawData(item)) as TransformedCleanDataEntry[]; // 재귀 호출
    }
    const transformedData = Object.entries(rawData).reduce((acc, [key, value]) => {
      if (value['_text'] || typeof value['_text'] === 'number') {
        acc[key] = value['_text'];
      } else if (value['_cdata']) {
        acc[key] = value['_cdata'];
      } else if (typeof value === 'object' && value !== null) {
        acc[key] = this.transformCleanLawData(value); // 재귀 호출
      } else {
        acc[key] = value;
      }
      return acc;
    }, {} as TransformedCleanDataEntry[]);

    return transformedData;
  };

  private generatePaginationData(
    convertedLaws: LawListApiResponse,
    params: GetLawListParams,
    currentElementsCount: number,
  ): Omit<PageResponse<TransformedCleanLawList>, 'list'> {
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

  private generateResponseData(
    type: SearchTabEnum,
    lawDetailList: TransformedCleanLawList,
  ): LawDetailData[] | PrecDetailData[] {
    if (type === SearchTabEnum.LAW) {
      return lawDetailList.map((lawDetail: TransformedCleanDataEntry): LawDetailData => {
        const lawDetailTyped = lawDetail as unknown as LawDetailData;
        const lawArticle = this.transformLawArticle(lawDetailTyped.조문.조문단위);
        return {
          기본정보: {
            법령ID: Number(lawDetailTyped.기본정보.법령ID),
            법령명: String(lawDetailTyped.기본정보.법령명_한글),
            시행일자: Number(lawDetailTyped.기본정보.시행일자),
          },
          조문: {
            조문단위: lawArticle,
          },
          부칙: {
            부칙단위: lawDetailTyped.부칙.부칙단위,
          },
        };
      });
    }

    return lawDetailList.map((precDetail: TransformedCleanDataEntry): PrecDetailData => {
      const lawDetailTyped = precDetail as unknown as PrecDetailData;
      return {
        판례정보일련번호: Number(lawDetailTyped.판례정보일련번호),
        사건번호: String(lawDetailTyped.사건번호),
        사건종류명: String(lawDetailTyped.사건종류명),
        판결유형: String(lawDetailTyped.판결유형),
        선고: String(lawDetailTyped.선고),
        법원명: String(lawDetailTyped.법원명),
        선고일자: String(lawDetailTyped.선고일자),
        사건명: String(lawDetailTyped.사건명),
        판례내용: String(lawDetailTyped.판례내용),
      };
    });
  }

  private transformLawArticle(lawArticleData: LawArticle | LawArticle[]): LawArticle | LawArticle[] {
    const transformSingleArticle = (article: LawArticle) => {
      return {
        조문키: article._attributes.조문키,
        조문번호: article.조문번호,
        조문여부: article.조문여부,
        조문제목: article.조문제목,
        조문시행일자: article.조문시행일자,
        조문내용: article.조문내용,
        항: article.항,
        조문참고자료: article.조문참고자료,
      };
    };

    if (Array.isArray(lawArticleData)) {
      return lawArticleData.map(transformSingleArticle);
    } else {
      return transformSingleArticle(lawArticleData);
    }
  }

  async getLawDetail(type: SearchTabEnum, id: number): Promise<LawDetailData | PrecDetailData> {
    const params = {
      type,
    };
    const requestConfig = this.generateRequestConfig(params);
    const lawDetailList = await Promise.all([id].map(this.fetchLawDetail(requestConfig)));
    if (!lawDetailList[0]) {
      throw new NotFoundException(`해당하는 ${type === 'prec' ? '판례가' : '법령이'} 없습니다.`);
    }
    const responseData = this.generateResponseData(type, lawDetailList);

    return responseData[0];
  }

  async createLawSummary(type: SearchTabEnum, id: number, assistantMessages: string): Promise<string> {
    const initContent = this.configService.get('LAW_SUMMARY_INIT_PROMPT');
    const messages: Array<ChatCompletionRequestMessage> = [
      {
        role: 'system',
        content: initContent,
      },
    ];

    const lawDetail = await this.getLawDetail(type, id);
    let content: string;
    if ('판례내용' in lawDetail) {
      content = lawDetail.판례내용.replace(/<[^>]*>|&nbsp;|&gt;|&amp;?|\n|\r/g, ''); // html 태그, 엔터티, 줄바꿈 제거
    } else {
      content = JSON.stringify(lawDetail);
    }
    const requestType = type === 'prec' ? '판례' : '법령';

    messages.push({
      role: 'user',
      content: `${requestType} 내용 중학생도 이해하기 쉽게 요약 설명 부탁해. ${content}`,
    });

    if (assistantMessages) {
      messages.push({
        role: 'assistant',
        content: assistantMessages.replace(/<[^>]*>|&nbsp;|&gt;|&amp;?|\n/g, ''),
      });
      messages.push({
        role: 'user',
        content: '더 쉽게 설명 부탁해.',
      });
    }

    const summary = await this.openAiService.createAIChatCompletion(messages);
    const summaryContent = summary.data.choices[0].message?.content;

    return summaryContent;
  }
}
