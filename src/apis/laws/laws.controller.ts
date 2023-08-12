import { Controller, Param, Query, Get, ParseEnumPipe, Post, Body } from '@nestjs/common';
import { LawsService } from './laws.service';
import { ApiOperation, ApiTags, ApiParam, ApiBody } from '@nestjs/swagger';
import { getLawListDto } from './dtos/get-law.dto';
import { RequestSummaryDto } from './dtos/request-summary.dto';
import { PageResponse, SearchTabEnum, StatuteDetailData, PrecDetailData } from 'src/common/types';

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

  // 요약 api
  @Post(':type/:id/summary')
  @ApiOperation({
    summary: '판례/법령 요약 조회',
    description:
      "'더 쉽게 해석' 요청을 보내는 경우, 마지막에 제공받았던 요약문을 body의 recentAssistMsg에 담아서 요청합니다.",
  })
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
  @ApiBody({
    type: RequestSummaryDto,
    required: false,
    description: 'assistantMessages: 기존에 제공받았던 요약문 목록',
  })
  createLawSummary(
    @Param('type', new ParseEnumPipe(SearchTabEnum))
    type: SearchTabEnum,
    @Param('id') id: number,
    @Body() requestSummaryDto?: RequestSummaryDto,
  ): Promise<string> {
    return this.lawsService.createLawSummary(type, id, requestSummaryDto.recentSummaryMsg);
  }
}
