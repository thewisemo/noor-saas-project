import { Injectable } from '@nestjs/common';

@Injectable()
export class TenantsService {
  async findAll(): Promise<any[]> {
    return [];
  }
}
