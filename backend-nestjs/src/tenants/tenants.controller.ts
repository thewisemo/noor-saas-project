import { Body, Controller, Get, Post } from '@nestjs/common';
import { TenantsService } from './tenants.service';

@Controller('api/tenants')
export class TenantsController {
  constructor(private srv: TenantsService) {}

  @Get()
  list() {
    return this.srv.findAll();
  }

  @Post()
  create(@Body() body: { name: string }) {
    return this.srv.create(body.name);
  }
}
