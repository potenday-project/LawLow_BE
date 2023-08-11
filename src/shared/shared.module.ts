import { HttpModule } from '@nestjs/axios';
import { Global, Module } from '@nestjs/common';
import { OpenaiService } from './services/openai.service';

const providers = [OpenaiService];

@Global()
@Module({
  providers,
  imports: [HttpModule],
  exports: [...providers, HttpModule],
})
export class SharedModule {}
