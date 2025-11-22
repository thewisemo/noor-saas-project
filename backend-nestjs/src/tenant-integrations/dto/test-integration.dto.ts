import { IsIn } from 'class-validator';

export class TestIntegrationDto {
  @IsIn(['whatsapp', 'ai'])
  target!: 'whatsapp' | 'ai';
}
