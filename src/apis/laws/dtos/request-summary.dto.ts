import { ApiProperty } from '@nestjs/swagger';
import * as v from 'class-validator';

export class RequestSummaryDto {
  @ApiProperty({
    description: '직전에 제공받은 요약문을 입력합니다.',
    type: String,
    nullable: true,
    default: null,
  })
  @v.IsOptional()
  @v.IsString()
  recentSummaryMsg?: string;
}
