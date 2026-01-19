import 'dotenv/config';
import * as bcrypt from 'bcrypt';
import dataSource from '../ormconfig';
import { User, UserRole } from '../src/database/entities/user.entity';

async function run() {
  if (process.env.ALLOW_SUPER_ADMIN_RESET !== 'true') {
    throw new Error('[reset] Refusing to run: set ALLOW_SUPER_ADMIN_RESET=true to proceed.');
  }
  if (!process.env.DATABASE_URL) {
    throw new Error('[reset] DATABASE_URL is not set. Ensure .env is loaded.');
  }

  const email = process.env.SUPER_ADMIN_EMAIL;
  const password = process.env.SUPER_ADMIN_PASSWORD;
  const name = process.env.SUPER_ADMIN_NAME || 'Super Admin';

  if (!email || !password) {
    throw new Error('[reset] SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD are required.');
  }

  await dataSource.initialize();
  const userRepo = dataSource.getRepository(User);
  const passwordHash = await bcrypt.hash(password, 12);

  let user = await userRepo.findOne({ where: { email } });
  if (!user) {
    user = userRepo.create({
      tenant_id: null,
      name,
      email,
      phone: null,
      password_hash: passwordHash,
      role: UserRole.SUPER_ADMIN,
      is_active: true,
    });
  } else {
    user.tenant_id = null;
    user.name = name;
    user.password_hash = passwordHash;
    user.role = UserRole.SUPER_ADMIN;
    user.is_active = true;
  }

  await userRepo.save(user);
  await dataSource.destroy();
  // eslint-disable-next-line no-console
  console.log(`[reset] super admin ready (${email}).`);
}

run().catch(error => {
  // eslint-disable-next-line no-console
  console.error('[reset] failed', error);
  process.exit(1);
});
