import { SetMetadata } from '@nestjs/common';
import { AuthGuardType } from '../types';

export const AUTH_GUARD_TYPE_KEY = 'AUTH_GUARD_TYPE';
export const SetAuthGuardType = (authType: AuthGuardType) => SetMetadata(AUTH_GUARD_TYPE_KEY, authType);
