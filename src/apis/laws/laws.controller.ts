import { Controller, Param, Query, Get, ParseEnumPipe, Post, Body } from '@nestjs/common';
import { LawsService } from './laws.service';
import { ApiOperation, ApiTags, ApiParam, ApiBody, ApiResponse, ApiResponseOptions } from '@nestjs/swagger';
import { getLawListDto } from './dtos/get-law.dto';
import { RequestSummaryDto } from './dtos/request-summary.dto';
import {
  PageResponse,
  SearchTabEnum,
  StatuteDetailData,
  PrecDetailData,
  LawSummaryResponseData,
} from 'src/common/types';

@Controller('laws')
@ApiTags('Laws')
export class LawsController {
  constructor(private readonly lawsService: LawsService) {}

  @Get(':type')
  @ApiOperation({ summary: '판례/법령 목록 조회' })
  @ApiParam({
    name: 'type',
    enum: SearchTabEnum,
    description: 'prec: 판례, law: 법령',
  })
  getLawList(
    @Param('type', new ParseEnumPipe(SearchTabEnum))
    type: SearchTabEnum,
    @Query() queryParams: getLawListDto,
  ): Promise<PageResponse<StatuteDetailData[] | PrecDetailData[]>> {
    return this.lawsService.getLawList(type, queryParams);
  }

  @Get(':type/:id')
  @ApiOperation({ summary: '판례/법령 상세 조회' })
  @ApiParam({
    name: 'type',
    enum: SearchTabEnum,
    description: 'prec: 판례, law: 법령',
  })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: '판례 또는 법령의 ID(판례일련번호/법령ID)',
  })
  getLawDetail(
    @Param('type', new ParseEnumPipe(SearchTabEnum))
    type: SearchTabEnum,
    @Param('id') id: number,
  ): Promise<StatuteDetailData | PrecDetailData> {
    return this.lawsService.getLawDetail(type, id);
  }

  @Post(':type/:id/summary')
  @ApiOperation({
    summary: '판례/법령 요약 조회',
    description:
      "'더 쉽게 해석'을 위한 요청을 보내는 경우, 마지막에 제공받았던 요약문을 body의 recentAssistMsg에 담아서 요청합니다. \n\n '더 쉽게 해석' 요청인 경우, summary만 제공됩니다.",
  })
  @ApiParam({
    name: 'type',
    enum: SearchTabEnum,
    description: 'prec: 판례, law: 법령',
  })
  @ApiParam({
    name: 'id',
    description: '판례 또는 법령의 ID(판례일련번호/법령ID)',
  })
  @ApiBody({
    type: RequestSummaryDto,
    required: false,
    description: 'assistantMessages: 기존에 제공받았던 요약문 목록',
  })
  @ApiResponse({
    status: 201,
    description: 'Successfule response',
    content: {
      'application/json': {
        examples: {
          '최초 요약 요청': {
            value: {
              success: true,
              data: {
                easyTitle: '쉬운 제목',
                summary: '요약문',
                keywords: ['키워드1', '키워드2'],
              },
            },
            description: '최초 요약 요청에 대한 응답',
          },
          '더 쉽게 해석': {
            value: {
              success: true,
              data: {
                summary: '요약문',
              },
            },
            description: '더 쉽게 해석 요청에 대한 응답',
          },
        },
        schema: {
          type: 'object',
          properties: {
            easyTitle: {
              type: 'string',
              nullable: true,
              description: '쉬운 제목',
            },
            summary: {
              type: 'string',
              description: '요약문',
            },
            keywords: {
              type: 'array',
              nullable: true,
              items: {
                type: 'string',
              },
              description: '키워드 목록',
            },
          },
        },
      },
    },
  })
  createLawSummary(
    @Param('type', new ParseEnumPipe(SearchTabEnum))
    type: SearchTabEnum,
    @Param('id') id: number,
    @Body() requestSummaryDto?: RequestSummaryDto,
  ): Promise<LawSummaryResponseData> {
    return this.lawsService.createLawSummary(type, id, requestSummaryDto.recentSummaryMsg);
  }
}
