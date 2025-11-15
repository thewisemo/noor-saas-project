import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Socket } from 'socket.io';

@Injectable()
export class SocketAuthService {
  private readonly secret: string;

  constructor(private readonly jwt: JwtService, config: ConfigService) {
    this.secret = config.get<string>('JWT_SECRET', '');
  }

  async authenticate(client: Socket) {
    const token = this.extractToken(client);
    if (!token) {
      throw new UnauthorizedException('socket-token-missing');
    }
    try {
      const payload = await this.jwt.verifyAsync(token, { secret: this.secret });
      client.data.user = payload;
      if (payload?.tenant_id) {
        client.join(this.getTenantRoom(payload.tenant_id));
      }
      return payload;
    } catch (error) {
      throw new UnauthorizedException('socket-token-invalid');
    }
  }

  getTenantRoom(tenantId: string) {
    return `tenant:${tenantId}`;
  }

  private extractToken(client: Socket) {
    const tokenFromHandshake = (client.handshake.auth?.token || client.handshake.query?.token) as string | undefined;
    if (tokenFromHandshake) return tokenFromHandshake;
    const header = client.handshake.headers.authorization;
    if (!header) return '';
    return header.replace(/^Bearer\s+/i, '');
  }
}

