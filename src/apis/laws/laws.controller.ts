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
}
