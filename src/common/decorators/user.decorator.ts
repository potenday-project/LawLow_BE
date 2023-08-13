import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const TokenUser = createParamDecorator((data, ctx: ExecutionContext): ParameterDecorator => {
  const request = ctx.switchToHttp().getRequest(); // 클라이언트에서 보낸 request의 정보

  // 이전에 AuthGuard 클래스에서 할당했던 request.userId 객체의 정보를 return
  return request.user;
});
