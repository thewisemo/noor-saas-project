import { Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ConversationsService } from './conversations.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../database/entities/user.entity';
import { TenantId } from '../auth/decorators/tenant-id.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ConversationStatus } from '../database/entities/conversation.entity';

@Controller('conversations')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.AGENT, UserRole.STAFF, UserRole.TENANT_ADMIN)
export class ConversationsController {
  constructor(private readonly service: ConversationsService) {}

  @Get()
  list(@TenantId() tenantId: string, @Query('status') status?: ConversationStatus) {
    return this.service.list(tenantId, status);
  }

  @Post('takeover/:id')
  takeover(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @CurrentUser('sub') agentId: string,
  ) {
    return this.service.takeover(tenantId, id, agentId);
  }

  @Post(':id/resolve')
  resolve(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.service.resolve(tenantId, id);
  }
}

