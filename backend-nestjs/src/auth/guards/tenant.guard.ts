import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { UserRole } from '../../database/entities/user.entity';

@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request?.user;

    if (!user) {
      throw new ForbiddenException('auth-required');
    }

    if (user.role === UserRole.SUPER_ADMIN) {
      return true;
    }

    const tenantId = user.tenant_id;
    if (!tenantId) {
      throw new ForbiddenException('tenant-context-required');
    }

    const candidates = [
      request?.params?.tenantId,
      request?.params?.tenant_id,
      request?.body?.tenantId,
      request?.body?.tenant_id,
      request?.query?.tenantId,
      request?.query?.tenant_id,
    ].filter(Boolean);

    for (const candidate of candidates) {
      if (candidate !== tenantId) {
        throw new ForbiddenException('tenant-mismatch');
      }
    }

    return true;
  }
}
