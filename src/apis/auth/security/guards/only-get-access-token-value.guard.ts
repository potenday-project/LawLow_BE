import { Observable } from 'rxjs';
import { ExecutionContext, Injectable, CanActivate } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OnlyGetAccessTokenValueGuard extends AuthGuard('jwt-access') implements CanActivate {
  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    return super.canActivate(context);
  }

  // Override the handleRequest method to not throw an error
  handleRequest(err, user, info) {
    if (err || info || !user) {
      return {};
    }
    return user;
  }
}
