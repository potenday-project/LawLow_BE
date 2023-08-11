import { ApiProperty } from '@nestjs/swagger';
import * as v from 'class-validator';

export class RequestSummaryDto {
  @ApiProperty({
    required: false,
    example: '최근에 제공받은 판례/법령의 요지를 요약한 문장을 입력합니다.',
  })
  @v.IsOptional()
  @v.IsString()
  readonly recentAssistMsg?: string;
}
