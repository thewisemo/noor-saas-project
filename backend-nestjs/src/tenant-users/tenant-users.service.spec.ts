import assert from 'assert';
import { TenantUsersService } from './tenant-users.service';
import { User, UserRole } from '../database/entities/user.entity';
import { Tenant } from '../database/entities/tenant.entity';

class FakeRepo<T extends { id?: string }> {
  private items: T[] = [];

  constructor(seed: T[] = []) {
    this.items = seed;
  }

  create(input: T): T {
    const next: T = { ...input, id: (Math.random() * 1000000).toFixed(0) } as T;
    return next;
  }

  async save(input: T): Promise<T> {
    this.items.push(input);
    return input;
  }

  async find(options?: any): Promise<T[]> {
    if (!options?.where) return this.items;
    return this.items.filter(item =>
      Object.entries(options.where).every(([key, value]) => (item as any)[key] === value),
    );
  }

  async findOne(options: any): Promise<T | null> {
    const found = (await this.find(options))[0];
    return found || null;
  }
}

async function runTenantUsersServiceSpec() {
  const tenant: Tenant = { id: 'tenant-1', name: 'Test', slug: 'test', created_at: new Date(), updated_at: new Date() } as any;
  const tenantsRepo = new FakeRepo<Tenant>([tenant]);
  const usersRepo = new FakeRepo<User>();
  const service = new TenantUsersService(usersRepo as any, tenantsRepo as any);

  const created = await service.createTenantAdmin(tenant.id, {
    name: 'Admin',
    email: 'admin@example.com',
    password: 'secret',
    role: UserRole.TENANT_ADMIN,
  });

  assert.strictEqual(created.role, UserRole.TENANT_ADMIN);
  assert.strictEqual(created.email, 'admin@example.com');

  const admins = await service.listUsersByTenant(tenant.id);
  assert.strictEqual(admins.length, 1);
  assert.strictEqual(admins[0].email, 'admin@example.com');

  const staff = await service.listUsersForTenantAdmin(tenant.id);
  assert.strictEqual(staff.length, 1);
}

runTenantUsersServiceSpec().then(
  () => console.log('tenant-users.service spec passed'),
  error => {
    console.error(error);
    process.exit(1);
  },
);

