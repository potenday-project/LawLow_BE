import { ApiProperty } from '@nestjs/swagger';
import { PrecDetailData } from 'src/common/types';
import * as v from 'class-validator';

export class ResponsePrecDto implements PrecDetailData {
  @ApiProperty()
  @v.IsNumber()
  판례정보일련번호: number;

  @ApiProperty()
  @v.IsString()
  사건번호: string;

  @ApiProperty()
  @v.IsString()
  사건종류명: string;

  @ApiProperty()
  @v.IsString()
  판결유형: string;

  @ApiProperty()
  @v.IsString()
  선고: string;

  @ApiProperty()
  @v.IsString()
  법원명: string;

  @ApiProperty()
  @v.IsString()
  선고일자: string;

  @ApiProperty()
  @v.IsString()
  사건명: string;

  @ApiProperty()
  @v.IsString()
  판례내용: string;
}
