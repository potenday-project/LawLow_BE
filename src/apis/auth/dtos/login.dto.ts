import { ApiProperty } from '@nestjs/swagger';
import * as v from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: 'tokenValue',
    description: '사용자가 구글 로그인 후 받은 토큰 값',
  })
  @v.IsNotEmpty()
  @v.IsString()
  token: string;
}
