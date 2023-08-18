import {
  StatuteDetailData,
  StatuteArticle,
  StatuteAddendum,
  StatuteParagraph,
  StatuteSubparagraph,
  Statuteitem,
} from 'src/common/types';
import { ApiExtraModels, ApiProperty, ApiPropertyOptional, getSchemaPath } from '@nestjs/swagger';
import * as v from 'class-validator';

export class StatuteItemDTO implements Statuteitem {
  @ApiProperty()
  @v.IsString()
  목번호: string;

  @ApiProperty()
  @v.IsString()
  목내용: string;
}

export class StatuteSubparagraphDTO implements StatuteSubparagraph {
  @ApiProperty()
  @v.IsString()
  호번호: string;

  @ApiProperty()
  @v.IsString()
  호내용: string;

  @ApiPropertyOptional({ type: [StatuteItemDTO] })
  @v.IsOptional()
  목?: StatuteItemDTO | StatuteItemDTO[];
}

export class StatuteParagraphDTO implements StatuteParagraph {
  @ApiProperty()
  항번호: string;

  @ApiProperty()
  항내용: string;

  @ApiPropertyOptional({ type: [StatuteSubparagraphDTO] })
  호?: StatuteSubparagraphDTO | StatuteSubparagraphDTO[];
}

export class StatuteArticleDTO implements StatuteArticle {
  @ApiProperty()
  조문키: string;

  @ApiProperty()
  조문번호: number;

  @ApiProperty()
  조문여부: string;

  @ApiPropertyOptional()
  조문제목?: string;

  @ApiProperty()
  조문시행일자: number;

  @ApiProperty()
  조문내용: string;

  @ApiPropertyOptional({ type: [StatuteParagraphDTO] })
  항?: StatuteParagraphDTO | StatuteParagraphDTO[];

  @ApiPropertyOptional({ type: [String] })
  조문참고자료?: string | string[];
}

export class StatuteAddendumDTO implements StatuteAddendum {
  @ApiProperty()
  부칙키: string;

  @ApiProperty()
  부칙공포일자: number;

  @ApiProperty()
  부칙공포번호: number;

  @ApiProperty({ type: [String] })
  부칙내용: string[];
}

@ApiExtraModels(StatuteAddendumDTO, StatuteArticleDTO)
export class ResponseStatuteDto implements StatuteDetailData {
  @ApiProperty({
    properties: {
      법령ID: {
        type: 'number',
      },
      법령명: {
        type: 'string',
      },
      시행일자: {
        type: 'number',
      },
    },
  })
  기본정보: {
    법령ID: number;
    법령명: string;
    시행일자: number;
  };

  @ApiProperty({
    oneOf: [
      {
        $ref: getSchemaPath(StatuteArticleDTO),
      },
      {
        type: 'array',
        items: {
          $ref: getSchemaPath(StatuteArticleDTO),
        },
      },
    ],
  })
  조문: {
    조문단위: StatuteArticleDTO | StatuteArticleDTO[];
  };

  @ApiProperty({
    oneOf: [
      {
        $ref: getSchemaPath(StatuteAddendumDTO),
      },
      {
        type: 'array',
        items: {
          $ref: getSchemaPath(StatuteAddendumDTO),
        },
      },
    ],
  })
  부칙: {
    부칙단위: StatuteAddendumDTO | StatuteAddendumDTO[];
  };
}
