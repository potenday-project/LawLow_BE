import {
  Controller,
  Param,
  Query,
  Get,
  ParseEnumPipe,
  Post,
  Body,
  ParseIntPipe,
  UseGuards,
  Delete,
  Res,
} from '@nestjs/common';
import { LawsService } from './laws.service';
import {
  ApiOperation,
  ApiTags,
  ApiParam,
  ApiBody,
  ApiTooManyRequestsResponse,
  ApiCreatedResponse,
  ApiBearerAuth,
  ApiOkResponse,
  getSchemaPath,
  ApiExtraModels,
} from '@nestjs/swagger';
import { GetLawListDto } from './dtos/get-laws.dto';
import { RequestSummaryDto } from './dtos/request-summary.dto';
import {
  PageResponse,
  SearchTabEnum,
  StatuteDetailData,
  PrecDetailData,
  LawSummaryResponseData,
  JwtPayloadInfo,
} from 'src/common/types';
import { Throttle } from '@nestjs/throttler';
import { OpenaiService } from 'src/shared/services/openai.service';
import { Stream } from 'openai/streaming';
import { ChatCompletionChunk } from 'openai/resources/chat';
import { JwtUserPayload } from 'src/common/decorators/jwt-user.decorator';
import { AuthGuard } from '@nestjs/passport';
import { GetBookmarkLawListDto } from './dtos/get-bookmark-laws.dto';
import { Response } from 'express';
import { OnlyGetAccessTokenValueGuard } from '../auth/security/guards/only-get-access-token-value.guard';
import { LawBookmark } from '@prisma/client';
import { ResponsePrecDto } from './dtos/prec.response.dto';
import { ResponseStatuteDto } from './dtos/statute.response.dto';

@Controller({ path: 'laws' })
@ApiTags('Laws')
export class LawsController {
  constructor(private readonly lawsService: LawsService, private readonly openaiService: OpenaiService) {}

  @Get(':type')
  @ApiOperation({ summary: '판례/법령 목록 조회' })
  @ApiParam({
    name: 'type',
    enum: SearchTabEnum,
    description: 'prec: 판례, statute: 법령',
  })
  getLawList(
    @Param('type', new ParseEnumPipe(SearchTabEnum))
    type: SearchTabEnum,
    @Query() queryParams: GetLawListDto,
  ): Promise<PageResponse<StatuteDetailData[] | PrecDetailData[]>> {
    return this.lawsService.getLawList(type, queryParams);
  }

  @Get(':type/bookmarks')
  @UseGuards(AuthGuard('jwt-access'))
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: '저장한 판례/법령 목록 요청',
  })
  @ApiParam({
    name: 'type',
    enum: SearchTabEnum,
    description: 'prec: 판례, statute: 법령',
  })
  @ApiOkResponse({
    description: 'Successfule response',
  })
  getBookmarkedLaws(
    @JwtUserPayload() jwtUser: JwtPayloadInfo,
    @Param('type', new ParseEnumPipe(SearchTabEnum))
    type: SearchTabEnum,
    @Query() queryParams: GetBookmarkLawListDto,
  ) {
    return this.lawsService.getBookmarkedLaws(jwtUser.userId, type, queryParams);
  }

  @Get(':type/:id')
  @UseGuards(OnlyGetAccessTokenValueGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '판례/법령 상세 조회' })
  @ApiParam({
    name: 'type',
    enum: SearchTabEnum,
    description: 'prec: 판례, statute: 법령',
  })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: '판례 또는 법령의 ID(판례일련번호/법령ID)',
  })
  @ApiExtraModels(ResponsePrecDto, ResponseStatuteDto)
  @ApiOkResponse({
    description: 'Successfule response',
    schema: {
      properties: {
        lawInfo: {
          oneOf: [{ $ref: getSchemaPath(ResponsePrecDto) }, { $ref: getSchemaPath(ResponseStatuteDto) }],
        },
        isBookmarked: {
          type: 'boolean',
        },
      },
    },
  })
  async getLawDetail(
    @JwtUserPayload() jwtUser: JwtPayloadInfo,
    @Param('type', new ParseEnumPipe(SearchTabEnum))
    type: SearchTabEnum,
    @Param('id', new ParseIntPipe()) id: number,
  ): Promise<{
    lawInfo: StatuteDetailData | PrecDetailData;
    isBookmarked: boolean;
  }> {
    const bookmarkedLawPromise: Promise<LawBookmark> = this.lawsService.getBookmarkedLawInfo(
      jwtUser.userId,
      id.toString(),
      type,
    );
    const lawDetailPromise = this.lawsService.getLawDetail(type, id.toString());
    const [bookmarkedLaw, lawDetail] = await Promise.all([bookmarkedLawPromise, lawDetailPromise]);

    return {
      lawInfo: lawDetail,
      isBookmarked: !!bookmarkedLaw,
    };
  }

  @Post(':type/:id/summary')
  @ApiOperation({
    summary: '판례/법령 요약 요청',
    description: `
      '더 쉽게 해석'을 위한 요청을 보내는 경우, 마지막에 제공받았던 요약문을 body의 recentAssistMsg에 담아서 요청합니다.\n
      '더 쉽게 해석' 요청인 경우, summary만 제공됩니다.`,
  })
  @Throttle(4, 60)
  @ApiParam({
    name: 'type',
    enum: SearchTabEnum,
    description: 'prec: 판례, statute: 법령',
  })
  @ApiParam({
    name: 'id',
    description: '판례 또는 법령의 ID(판례일련번호/법령ID)',
  })
  @ApiBody({
    examples: {
      '최초 요약 요청': {
        value: {
          recentSummaryMsg: null,
        },
        description: '최초 요약 요청',
      },
      '더 쉽게 해석': {
        value: {
          recentSummaryMsg: '직전에 제공받았던 요약문',
        },
        description: '더 쉽게 해석 요청',
      },
    },
    schema: {
      properties: {
        recentSummaryMsg: {
          type: 'string',
          nullable: true,
          description: '직전에 제공받은 요약문',
        },
      },
    },
    required: false,
    description: 'recentSummaryMsg: 직전에 제공받은 요약문을 입력합니다.',
  })
  @ApiCreatedResponse({
    description: 'Successfule response',
    content: {
      'application/json': {
        examples: {
          '최초 요약 요청': {
            value: {
              easyTitle: '쉬운 제목',
              summary: '요약문',
              keywords: ['키워드1', '키워드2'],
            },
            description: '최초 요약 요청에 대한 응답',
          },
          '더 쉽게 해석': {
            value: {
              summary: '요약문',
            },
            description: '더 쉽게 해석 요청에 대한 응답',
          },
        },
        schema: {
          oneOf: [
            {
              type: 'object',
              properties: {
                easyTitle: {
                  type: 'string',
                  nullable: true,
                  description: '쉬운 제목',
                },
                summary: {
                  type: 'string',
                  description: '요약문',
                },
                keywords: {
                  type: 'array',
                  nullable: true,
                  items: {
                    type: 'string',
                  },
                  description: '키워드 목록',
                },
              },
            },
          ],
        },
      },
    },
  })
  @ApiTooManyRequestsResponse({
    description: '요청 횟수 제한 초과 (1분에 4번)',
    content: {
      'application/json': {
        schema: {
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            statusCode: {
              type: 'number',
              example: 429,
            },
            message: {
              type: 'string',
              example: 'Too Many Requests',
            },
            erorrDetail: {
              type: 'string',
              example: 'Too many Requests at [" /laws/statute/1/summary "]',
            },
          },
        },
      },
    },
  })
  createLawSummary(
    @Param('type', new ParseEnumPipe(SearchTabEnum))
    type: SearchTabEnum,
    @Param('id', new ParseIntPipe()) id: number,
    @Body() requestSummaryDto?: RequestSummaryDto,
  ): Promise<LawSummaryResponseData> {
    return this.lawsService.createLawSummary(type, id.toString(), requestSummaryDto.recentSummaryMsg);
  }

  @Post(':type/:id/additional-summary')
  @ApiOperation({
    summary: '판례/법령 부가 정보 요약 요청',
    description: `
    본문 요약을 제외한 추가 요약을 요청합니다.\n
    -> 판례/법령에 대한 '제목', '키워드'만 제공됩니다.`,
  })
  @Throttle(4, 60)
  @ApiParam({
    name: 'type',
    enum: SearchTabEnum,
    description: 'prec: 판례, statute: 법령',
  })
  @ApiParam({
    name: 'id',
    description: '판례 또는 법령의 ID(판례일련번호/법령ID)',
  })
  createLawAdditionalSummary(
    @Param('type', new ParseEnumPipe(SearchTabEnum))
    type: SearchTabEnum,
    @Param('id', new ParseIntPipe()) id: number,
  ): Promise<Pick<LawSummaryResponseData, 'easyTitle' | 'keywords'>> {
    return this.lawsService.createLawAdditionalSummary(type, id.toString());
  }

  @Post(':type/:id/summary-stream')
  @ApiOperation({
    summary: '판례/법령 본문 요약 요청 - stream version',
    description: `
      '더 쉽게 해석'을 위한 요청을 보내는 경우, 마지막에 제공받았던 요약문을 body의 recentAssistMsg에 담아서 요청합니다.\n\n
      stream 버전 요약 API는 chunk data가 응답으로 제공됩니다. 클라이언트에서는 ReadableStream 형태로 받으시면 됩니다.`,
  })
  @ApiParam({
    name: 'type',
    enum: SearchTabEnum,
    description: 'prec: 판례, statute: 법령',
  })
  @ApiParam({
    name: 'id',
    description: '판례 또는 법령의 ID(판례일련번호/법령ID)',
  })
  @ApiBody({
    examples: {
      '최초 요약 요청': {
        value: {
          recentSummaryMsg: null,
        },
        description: '최초 요약 요청',
      },
      '더 쉽게 해석': {
        value: {
          recentSummaryMsg: '직전에 제공받았던 요약문',
        },
        description: '더 쉽게 해석 요청',
      },
    },
    schema: {
      properties: {
        recentSummaryMsg: {
          type: 'string',
          nullable: true,
          description: '직전에 제공받은 요약문',
        },
      },
    },
    required: false,
    description: 'recentSummaryMsg: 직전에 제공받은 요약문을 입력합니다.',
  })
  async createLawStreamSummary(
    @Res() res: Response,
    @Param('type', new ParseEnumPipe(SearchTabEnum)) type: SearchTabEnum,
    @Param('id', new ParseIntPipe()) id: number,
    @Body() requestSummaryDto?: RequestSummaryDto,
  ): Promise<void> {
    const lawSummaryStream: Stream<ChatCompletionChunk> = await this.lawsService.createLawStreamSummary(
      type,
      id.toString(),
      requestSummaryDto?.recentSummaryMsg,
    );
    return this.openaiService.sendChunksWithOpenAIStream(res, lawSummaryStream);
  }

  @Post(':type/:id/bookmark')
  @UseGuards(AuthGuard('jwt-access'))
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: '판례/법령 저장 요청',
  })
  @ApiParam({
    name: 'type',
    enum: SearchTabEnum,
    description: 'prec: 판례, statute: 법령',
  })
  @ApiParam({
    name: 'id',
    description: '판례 또는 법령의 ID(판례일련번호/법령ID)',
  })
  @ApiCreatedResponse({
    description: 'Successfule response',
    content: {
      'application/json': {
        schema: {
          properties: {
            bookmarkId: {
              type: 'number',
              example: 1,
            },
          },
        },
      },
    },
  })
  postLawBookmark(
    @JwtUserPayload() jwtUser: JwtPayloadInfo,
    @Param('type', new ParseEnumPipe(SearchTabEnum))
    type: SearchTabEnum,
    @Param('id', new ParseIntPipe()) law_id: number,
  ) {
    return this.lawsService.postLawBookmark(jwtUser.userId, law_id.toString(), type);
  }

  @Delete(':type/:id/bookmark')
  @UseGuards(AuthGuard('jwt-access'))
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: '판례/법령 저장 취소 요청',
  })
  @ApiParam({
    name: 'type',
    enum: SearchTabEnum,
    description: 'prec: 판례, statute: 법령',
  })
  @ApiParam({
    name: 'id',
    description: '판례 또는 법령의 ID(판례일련번호/법령ID)',
  })
  deleteLawBookmark(
    @JwtUserPayload() jwtUser: JwtPayloadInfo,
    @Param('type', new ParseEnumPipe(SearchTabEnum))
    type: SearchTabEnum,
    @Param('id', new ParseIntPipe()) law_id: number,
  ) {
    return this.lawsService.deleteLawBookmark(jwtUser.userId, law_id.toString(), type);
  }
}
