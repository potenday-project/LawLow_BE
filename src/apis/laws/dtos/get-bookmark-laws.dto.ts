import { PickType } from '@nestjs/swagger';
import { GetLawListDto } from './get-laws.dto';

export class GetBookmarkLawListDto extends PickType(GetLawListDto, ['page', 'take']) {}
