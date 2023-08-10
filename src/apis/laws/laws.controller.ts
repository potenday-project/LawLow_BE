import { Controller, Param, Query, Get, ParseEnumPipe } from '@nestjs/common';
import { LawsService } from './laws.service';
import { ApiOperation, ApiTags, ApiParam } from '@nestjs/swagger';
import { getLawListDto } from './dtos/get-law.dto';
import { PageResponse, ResLawData, SearchTabEnum } from 'src/common/types';

@Controller('laws')
@ApiTags('Laws')
export class LawsController {
  constructor(private readonly lawsService: LawsService) {}

  @Get()
  @ApiOperation({ summary: '판례/법령 목록 조회' })
  @ApiParam({
    name: 'type',
    enum: SearchTabEnum,
  })
  getLawList(
    @Param('type', new ParseEnumPipe(SearchTabEnum))
    type: SearchTabEnum,
    @Query() queryParams: getLawListDto,
  ): Promise<PageResponse<ResLawData>> {
    return this.lawsService.getLawList(type, queryParams);
  }
}
