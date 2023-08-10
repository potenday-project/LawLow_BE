import { Controller, Query } from '@nestjs/common';
import { LawsService } from './laws.service';
import { Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { getLawListDto } from './dtos/get-law.dto';
import { TransformedDataEntry, PageResponse, PrecDetailData } from 'src/common/types';

@Controller('laws')
@ApiTags('Laws')
export class LawsController {
  constructor(private readonly lawsService: LawsService) {}

  @Get()
  @ApiOperation({ summary: '판례/법령 목록 조회' })
  getLawList(
    @Query() queryParams: getLawListDto,
  ): Promise<PageResponse<(TransformedDataEntry | TransformedDataEntry[])[] | PrecDetailData[]>> {
    return this.lawsService.getLawList(queryParams);
  }
}
