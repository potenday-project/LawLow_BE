import { SearchRequest } from '../../../common/types';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import * as v from 'class-validator';

export class getLawListDto implements SearchRequest {
  @ApiProperty({ required: true, description: '검색어' })
  @v.IsNotEmpty()
  @v.IsString()
  readonly q: string;

  @ApiProperty({ required: false, default: 1 })
  @v.IsOptional()
  @Transform(({ value }) => Number(value))
  @v.IsInt()
  readonly page: number = 1;

  @ApiProperty({ required: false, default: 10 })
  @v.IsOptional()
  @Transform(({ value }) => Number(value))
  @v.IsInt()
  readonly take: number = 10;
}
