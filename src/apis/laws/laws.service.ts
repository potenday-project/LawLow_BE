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
  StatuteDetailData,
  StatuteArticle,
  LawSummaryResponseData,
} from 'src/common/types';
import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import convert from 'xml-js';
import { fetchData } from 'src/common/utils';
import { getLawListDto } from './dtos/get-law.dto';
import { OpenaiService } from 'src/shared/services/openai.service';
import { ChatCompletionMessage } from 'openai/resources/chat';

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
  ): Promise<PageResponse<StatuteDetailData[] | PrecDetailData[]>> {
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
        target: type === 'prec' ? 'prec' : 'law',
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
  ): StatuteDetailData[] | PrecDetailData[] {
    if (type === SearchTabEnum.STATUTE) {
      return lawDetailList.map((statuteDetail: TransformedCleanDataEntry): StatuteDetailData => {
        const statuteDetailTyped = statuteDetail as unknown as StatuteDetailData;
        const lawArticle = this.transformLawArticle(statuteDetailTyped.조문.조문단위);
        return {
          기본정보: {
            법령ID: Number(statuteDetailTyped.기본정보.법령ID),
            법령명: String(statuteDetailTyped.기본정보.법령명_한글),
            시행일자: Number(statuteDetailTyped.기본정보.시행일자),
          },
          조문: {
            조문단위: lawArticle,
          },
          부칙: {
            부칙단위: statuteDetailTyped.부칙.부칙단위,
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

  private transformLawArticle(
    statuteArticleData: StatuteArticle | StatuteArticle[],
  ): StatuteArticle | StatuteArticle[] {
    const transformSingleArticle = (article: StatuteArticle) => {
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

    if (Array.isArray(statuteArticleData)) {
      return statuteArticleData.map(transformSingleArticle);
    } else {
      return transformSingleArticle(statuteArticleData);
    }
  }

  async getLawDetail(type: SearchTabEnum, id: number): Promise<StatuteDetailData | PrecDetailData> {
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

  async createLawSummary(type: SearchTabEnum, id: number, recentSummaryMsg: string): Promise<LawSummaryResponseData> {
    const MAX_RETRY_KEYWORD_TITLE_COUNT = 2;
    const lawDetail = await this.getLawDetail(type, id);

    const onlySummaryReqMsgs = await this.generateSummaryReqMessasges(lawDetail, recentSummaryMsg, {
      onlySummary: true,
    });

    const isFirstSummary = !recentSummaryMsg;
    if (!isFirstSummary) {
      const onlySummaryResponse = await this.openAiService.createAIChatCompletion(onlySummaryReqMsgs);
      return { summary: onlySummaryResponse.choices[0].message.content };
    }

    const [onlySummaryResponse, { easyTitle: easyTitle, keywords: keywords }] = await Promise.all([
      this.openAiService.createAIChatCompletion(onlySummaryReqMsgs),
      this.fetchTitleAndKeywords(lawDetail as PrecDetailData, MAX_RETRY_KEYWORD_TITLE_COUNT),
    ]);

    return {
      easyTitle,
      summary: onlySummaryResponse.choices[0].message.content,
      keywords,
    };
  }

  async createLawStreamSummary(type: SearchTabEnum, id: number, recentSummaryMsg: string) {
    const lawDetail = await this.getLawDetail(type, id);

    const summaryReqMsgs = await this.generateSummaryReqMessasges(lawDetail, recentSummaryMsg, {
      onlySummary: true,
    });
    const summaryReadableStream = await this.openAiService.createAIStramChatCompletion(summaryReqMsgs);

    return summaryReadableStream;
  }

  private async fetchTitleAndKeywords(
    summaryContent: StatuteDetailData | PrecDetailData,
    retryCount = 2,
  ): Promise<{ easyTitle: string; keywords: string[] }> {
    const titleKeywordReqMessages = await this.generateSummaryReqMessasges(summaryContent);

    for (let i = 0; i < retryCount; i++) {
      const titleKeywordResponse = await this.openAiService.createAIChatCompletion(titleKeywordReqMessages);
      const titleKeywordContent = titleKeywordResponse.choices[0].message.content;

      const title = titleKeywordContent.split('제목:')[1]?.split('키워드:')[0].trim();
      const keywordsString = titleKeywordContent.split('키워드:')[1]?.trim();
      const keywords = keywordsString?.split(',').map((keyword) => keyword.trim());

      if (title && keywords) {
        return {
          easyTitle: title,
          keywords: keywords,
        };
      }
    }
    throw new InternalServerErrorException('요약 제목과 키워드를 생성하지 못했습니다.');
  }

  /**
   *
   * 판례 요약을 위한 요청 메시지를 생성하는 메서드
   * @param lawDetail 요약할 법령/판례 데이터
   * @param recentSummaryMsg 직전 요약 메시지(더 쉽게 해석 기능을 위함) -> 있으면 제목/키워드 없이 요약만 생성
   * @param onlySummary 요약만 할지, 요약과 쉬운 제목/키워드를 생성할지 여부
   * @returns 요약 메시지 생성을 위한 요청 메시지 배열
   */
  private async generateSummaryReqMessasges(
    lawDetail: StatuteDetailData | PrecDetailData | string,
    recentSummaryMsg?: string,
    { onlySummary }: { onlySummary?: boolean } = {
      onlySummary: false,
    },
  ): Promise<Array<ChatCompletionMessage>> {
    const isFirstSummary = !recentSummaryMsg;
    const initContent = onlySummary
      ? this.configService.get('LAW_SUMMARY_INIT_PROMPT_ONLY_SUMMARY')
      : isFirstSummary
      ? this.configService.get('LAW_SUMMARY_INIT_PROMPT')
      : this.configService.get('LAW_SUMMARY_INIT_PROMPT_ONLY_SUMMARY');
    const messages: Array<ChatCompletionMessage> = [
      {
        role: 'system',
        content: initContent,
      },
      {
        role: 'user',
        content: initContent,
      },
      {
        role: 'assistant',
        content: `판례/법령 내용을 주세요.${
          onlySummary || !isFirstSummary ? '' : ' 무조건 제목:, 키워드: 형식으로 알려드립니다.'
        }`, // 요금 절약을 위해 제목, 키워드 결과를 같이 받아옴
      },
    ];

    let content: string;
    let requestType: '판례' | '법령';
    if (typeof lawDetail === 'string') {
      content = lawDetail;
      requestType = '판례';
    } else if ('판례내용' in lawDetail) {
      content = lawDetail.판례내용.replace(/<[^>]*>|&nbsp;|&gt;|&amp;?|\n|\r/g, ''); // html 태그, 엔터티, 줄바꿈 제거
      requestType = '판례';
    } else {
      content = JSON.stringify(lawDetail).replace(/<[^>]*>|&nbsp;|&gt;|&amp;?|\n|\r|"|\[|\{|\}|\]/g, '');
      requestType = '법령';
    }

    messages.push({
      role: 'user',
      content: `${requestType}${
        onlySummary || !isFirstSummary
          ? '내용 누구나 이해하기 쉬운 수준으로 요약해서 설명 부탁해.'
          : '의 이해하기 쉬운 제목과 키워드를 알려줘.'
      } ${content}`,
    });

    if (!isFirstSummary) {
      messages.push({
        role: 'assistant',
        content: recentSummaryMsg.replace(/<[^>]*>|&nbsp;|&gt;|&amp;?|\n/g, ''),
      });
      messages.push({
        role: 'user',
        content: '더 쉽게 설명 부탁해.',
      });
    }

    return messages;
  }
}
