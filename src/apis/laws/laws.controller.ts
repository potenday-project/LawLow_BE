import { Controller, Param, Query, Get, ParseEnumPipe } from '@nestjs/common';
import { LawsService } from './laws.service';
import { ApiOperation, ApiTags, ApiParam } from '@nestjs/swagger';
import { getLawListDto } from './dtos/get-law.dto';
import { PageResponse, SearchTabEnum, LawDetailData, PrecDetailData } from 'src/common/types';

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
  ): Promise<PageResponse<LawDetailData[] | PrecDetailData[]>> {
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
  ): Promise<LawDetailData | PrecDetailData> {
    return this.lawsService.getLawDetail(type, id);
  }
}
