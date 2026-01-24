import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { UsersService } from '../users/users.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const usersService = app.get(UsersService);

  console.log('🌱 Seeding database...');

  try {
    // Create admin user
    const adminEmail = 'admin@teamhub.demo';
    let admin = await usersService.findByEmail(adminEmail);

    if (!admin) {
      console.log('Creating admin user...');
      admin = await usersService.create({
        email: adminEmail,
        username: 'admin',
        password: 'Admin123!',
        firstName: 'Admin',
        lastName: 'User',
        isEmailVerified: true,
      } as any);
      console.log(`✅ Admin user created: ${adminEmail} / Admin123!`);
    } else {
      console.log('Admin user already exists');
    }

    // Create member user
    const memberEmail = 'member@teamhub.demo';
    let member = await usersService.findByEmail(memberEmail);

    if (!member) {
      console.log('Creating member user...');
      member = await usersService.create({
        email: memberEmail,
        username: 'member',
        password: 'Member123!',
        firstName: 'Member',
        lastName: 'User',
        isEmailVerified: true,
      } as any);
      console.log(`✅ Member user created: ${memberEmail} / Member123!`);
    } else {
      console.log('Member user already exists');
    }

    console.log('\n📋 Demo Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Admin:');
    console.log(`  Email: ${adminEmail}`);
    console.log(`  Password: Admin123!`);
    console.log('\nMember:');
    console.log(`  Email: ${memberEmail}`);
    console.log(`  Password: Member123!`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('✅ Seeding completed!');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

bootstrap();
