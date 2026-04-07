import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { UsersService } from '../users/users.service';
import { WorkspacesService } from '../workspaces/workspaces.service';
import { ChannelsService } from '../channels/channels.service';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ChannelType, UserRole } from '@teamhub/shared';

const PASSWORD = 'Test123!';

const SEED_USERS = [
  { email: 'owner@teamhub.demo', username: 'owner', firstName: 'Omar', lastName: 'Owner', role: UserRole.OWNER },
  { email: 'admin@teamhub.demo', username: 'admin', firstName: 'Alice', lastName: 'Admin', role: UserRole.ADMIN },
  { email: 'supervisor@teamhub.demo', username: 'supervisor', firstName: 'Sara', lastName: 'Supervisor', role: UserRole.SUPERVISOR },
  { email: 'leader@teamhub.demo', username: 'leader', firstName: 'Leo', lastName: 'Leader', role: UserRole.LEADER },
  { email: 'taskmanager@teamhub.demo', username: 'taskmanager', firstName: 'Tina', lastName: 'TaskMgr', role: UserRole.TASK_MANAGER },
  { email: 'hr@teamhub.demo', username: 'hr', firstName: 'Hannah', lastName: 'HR', role: UserRole.HR },
  { email: 'member@teamhub.demo', username: 'member', firstName: 'Mike', lastName: 'Member', role: UserRole.MEMBER },
  { email: 'guest@teamhub.demo', username: 'guest', firstName: 'Grace', lastName: 'Guest', role: UserRole.GUEST },
];

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const usersService = app.get(UsersService);
  const workspacesService = app.get(WorkspacesService);
  const channelsService = app.get(ChannelsService);
  const workspaceMemberModel: Model<any> = app.get(getModelToken('WorkspaceMember'));
  const channelMemberModel: Model<any> = app.get(getModelToken('ChannelMember'));

  console.log('🌱 Seeding database...\n');

  try {
    // 1. Create all users
    const users: Record<string, any> = {};
    for (const seed of SEED_USERS) {
      let user = await usersService.findByEmail(seed.email);
      if (!user) {
        user = await usersService.create({
          email: seed.email,
          username: seed.username,
          password: PASSWORD,
          firstName: seed.firstName,
          lastName: seed.lastName,
          isEmailVerified: true,
        } as any);
        console.log(`  ✅ Created user: ${seed.email}`);
      } else {
        console.log(`  ⏭  User exists: ${seed.email}`);
      }
      users[seed.role] = user;
    }

    const ownerId = users[UserRole.OWNER]._id.toString();
    const organizationModel: Model<any> = app.get(getModelToken('Organization'));
    const workspaceModel: Model<any> = app.get(getModelToken('Workspace'));

    // 2. Create organization
    let org: any = await organizationModel.findOne({ slug: 'demo-org' }).exec();
    if (!org) {
      org = await workspacesService.createOrganization(ownerId, {
        name: 'Demo Organization',
        slug: 'demo-org',
      });
      console.log(`\n  ✅ Organization created: ${org.name}`);
    } else {
      console.log(`\n  ⏭  Organization exists: ${org.name}`);
    }

    // 3. Create workspace (the owner gets OWNER role automatically from createWorkspace)
    let workspace: any = await workspaceModel.findOne({
      organizationId: org._id.toString(),
      slug: 'general',
    }).exec();
    if (!workspace) {
      workspace = await workspacesService.createWorkspace(ownerId, {
        organizationId: org._id.toString(),
        name: 'General Workspace',
        slug: 'general',
        description: 'Main workspace for testing all roles and permissions',
      });
      console.log(`  ✅ Workspace created: ${workspace.name}`);
    } else {
      console.log(`  ⏭  Workspace exists: ${workspace.name}`);
    }

    const wsId = workspace._id.toString();

    // 4. Add every user to the workspace with the correct role
    console.log('\n  Adding workspace members:');
    for (const seed of SEED_USERS) {
      const userId = users[seed.role]._id.toString();
      const existing = await workspacesService.getWorkspaceMember(wsId, userId);
      if (existing) {
        if (existing.role !== seed.role) {
          existing.role = seed.role;
          await existing.save();
          console.log(`    🔄 Updated role for ${seed.username} → ${seed.role}`);
        } else {
          console.log(`    ⏭  ${seed.username} already ${seed.role}`);
        }
        continue;
      }
      await workspaceMemberModel.create({
        workspaceId: wsId,
        userId,
        role: seed.role,
      });
      console.log(`    ✅ ${seed.username} added as ${seed.role}`);
    }

    // 5. Ensure default #general channel exists and all non-GUEST users are members
    let generalChannel: any;
    const channels = await channelsService.findAll(wsId, ownerId);
    generalChannel = channels.find((c: any) => c.slug === 'general');
    if (!generalChannel) {
      generalChannel = await channelsService.create(ownerId, {
        workspaceId: wsId,
        name: 'general',
        type: ChannelType.PUBLIC,
        description: 'Default channel for workspace conversations',
        memberIds: [ownerId],
      });
      console.log('\n  ✅ Created #general channel');
    } else {
      console.log('\n  ⏭  #general channel exists');
    }

    const channelId = generalChannel._id.toString();
    for (const seed of SEED_USERS) {
      const userId = users[seed.role]._id.toString();
      const existing = await channelMemberModel.findOne({ channelId, userId }).lean().exec();
      if (!existing) {
        await channelMemberModel.create({ channelId, userId });
      }
    }
    console.log('  ✅ All users added to #general channel');

    // 6. Create a permanent invite code for easy testing
    let inviteCode: string | undefined;
    try {
      const invite = await workspacesService.createInviteLink(wsId, ownerId, {
        expiresInDays: 365,
        maxUses: 1000,
        role: UserRole.MEMBER,
      });
      inviteCode = invite.code;
      console.log(`\n  ✅ Invite link created: ${inviteCode}`);
    } catch (e: any) {
      console.log(`  ⏭  Invite link creation note: ${e.message}`);
    }

    // Print credentials table
    console.log('\n\n📋 Demo Credentials (all passwords: Test123!)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  Role          │ Email                         │ Can');
    console.log('  ──────────────│───────────────────────────────│──────────────────');
    console.log('  OWNER         │ owner@teamhub.demo            │ Everything');
    console.log('  ADMIN         │ admin@teamhub.demo            │ Full ws admin');
    console.log('  SUPERVISOR    │ supervisor@teamhub.demo       │ Oversight + teams');
    console.log('  LEADER        │ leader@teamhub.demo           │ Team lead');
    console.log('  TASK_MANAGER  │ taskmanager@teamhub.demo      │ Task approval');
    console.log('  HR            │ hr@teamhub.demo               │ Reports + workload');
    console.log('  MEMBER        │ member@teamhub.demo           │ Standard user');
    console.log('  GUEST         │ guest@teamhub.demo            │ Read-only');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    if (inviteCode) {
      console.log(`\n  Invite code (join via /join?code=${inviteCode}): ${inviteCode}`);
    }
    console.log('\n✅ Seeding completed!');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

bootstrap();
