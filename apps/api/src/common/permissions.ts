import { UserRole } from '@teamhub/shared';

export enum Permission {
  // Organization
  CREATE_ORGANIZATION = 'create_organization',
  VIEW_ORGANIZATION = 'view_organization',
  UPDATE_ORGANIZATION = 'update_organization',
  DELETE_ORGANIZATION = 'delete_organization',

  // Workspace
  CREATE_WORKSPACE = 'create_workspace',
  VIEW_WORKSPACE = 'view_workspace',
  UPDATE_WORKSPACE = 'update_workspace',
  DELETE_WORKSPACE = 'delete_workspace',
  MANAGE_MEMBERS = 'manage_members',
  INVITE_MEMBERS = 'invite_members',
  VIEW_AUDIT_LOGS = 'view_audit_logs',

  // Teams
  CREATE_TEAM = 'create_team',
  MANAGE_TEAM_MEMBERS = 'manage_team_members',
  VIEW_TEAMS = 'view_teams',

  // Channels
  CREATE_CHANNEL = 'create_channel',
  UPDATE_CHANNEL = 'update_channel',
  DELETE_CHANNEL = 'delete_channel',
  VIEW_CHANNEL = 'view_channel',
  SEND_MESSAGE = 'send_message',
  MANAGE_CHANNEL_MEMBERS = 'manage_channel_members',

  // Projects
  CREATE_PROJECT = 'create_project',
  UPDATE_PROJECT = 'update_project',
  DELETE_PROJECT = 'delete_project',
  VIEW_PROJECT = 'view_project',
  MANAGE_PROJECT_MEMBERS = 'manage_project_members',

  // Tasks
  CREATE_TASK = 'create_task',
  UPDATE_TASK = 'update_task',
  DELETE_TASK = 'delete_task',
  APPROVE_TASK = 'approve_task',
  ASSIGN_TASK = 'assign_task',

  // Notes
  CREATE_NOTE = 'create_note',
  UPDATE_NOTE = 'update_note',
  DELETE_NOTE = 'delete_note',
  VIEW_NOTE = 'view_note',

  // Files
  UPLOAD_FILE = 'upload_file',
  DELETE_FILE = 'delete_file',
  VIEW_FILE = 'view_file',

  // Reports & Oversight
  SUBMIT_REPORT = 'submit_report',
  VIEW_HR_REPORTS = 'view_hr_reports',
  VIEW_WORKLOAD = 'view_workload',
  VIEW_SUPERVISOR_DASHBOARD = 'view_supervisor_dashboard',
}

const OWNER_PERMISSIONS: Permission[] = Object.values(Permission);

const ADMIN_PERMISSIONS: Permission[] = [
  Permission.CREATE_ORGANIZATION,
  Permission.VIEW_ORGANIZATION,

  Permission.CREATE_WORKSPACE,
  Permission.VIEW_WORKSPACE,
  Permission.UPDATE_WORKSPACE,
  Permission.MANAGE_MEMBERS,
  Permission.INVITE_MEMBERS,
  Permission.VIEW_AUDIT_LOGS,

  Permission.CREATE_TEAM,
  Permission.MANAGE_TEAM_MEMBERS,
  Permission.VIEW_TEAMS,

  Permission.CREATE_CHANNEL,
  Permission.UPDATE_CHANNEL,
  Permission.DELETE_CHANNEL,
  Permission.VIEW_CHANNEL,
  Permission.SEND_MESSAGE,
  Permission.MANAGE_CHANNEL_MEMBERS,

  Permission.CREATE_PROJECT,
  Permission.UPDATE_PROJECT,
  Permission.DELETE_PROJECT,
  Permission.VIEW_PROJECT,
  Permission.MANAGE_PROJECT_MEMBERS,

  Permission.CREATE_TASK,
  Permission.UPDATE_TASK,
  Permission.DELETE_TASK,
  Permission.APPROVE_TASK,
  Permission.ASSIGN_TASK,

  Permission.CREATE_NOTE,
  Permission.UPDATE_NOTE,
  Permission.DELETE_NOTE,
  Permission.VIEW_NOTE,

  Permission.UPLOAD_FILE,
  Permission.DELETE_FILE,
  Permission.VIEW_FILE,

  Permission.SUBMIT_REPORT,
  Permission.VIEW_HR_REPORTS,
  Permission.VIEW_WORKLOAD,
  Permission.VIEW_SUPERVISOR_DASHBOARD,
];

const SUPERVISOR_PERMISSIONS: Permission[] = [
  Permission.CREATE_ORGANIZATION,
  Permission.VIEW_ORGANIZATION,

  Permission.CREATE_WORKSPACE,
  Permission.VIEW_WORKSPACE,
  Permission.INVITE_MEMBERS,
  Permission.VIEW_AUDIT_LOGS,

  Permission.CREATE_TEAM,
  Permission.MANAGE_TEAM_MEMBERS,
  Permission.VIEW_TEAMS,

  Permission.CREATE_CHANNEL,
  Permission.VIEW_CHANNEL,
  Permission.SEND_MESSAGE,
  Permission.MANAGE_CHANNEL_MEMBERS,

  Permission.CREATE_PROJECT,
  Permission.VIEW_PROJECT,
  Permission.MANAGE_PROJECT_MEMBERS,

  Permission.CREATE_TASK,
  Permission.UPDATE_TASK,
  Permission.APPROVE_TASK,
  Permission.ASSIGN_TASK,

  Permission.CREATE_NOTE,
  Permission.UPDATE_NOTE,
  Permission.VIEW_NOTE,

  Permission.UPLOAD_FILE,
  Permission.VIEW_FILE,

  Permission.SUBMIT_REPORT,
  Permission.VIEW_HR_REPORTS,
  Permission.VIEW_WORKLOAD,
  Permission.VIEW_SUPERVISOR_DASHBOARD,
];

const LEADER_PERMISSIONS: Permission[] = [
  Permission.CREATE_ORGANIZATION,
  Permission.VIEW_ORGANIZATION,

  Permission.CREATE_WORKSPACE,
  Permission.VIEW_WORKSPACE,
  Permission.INVITE_MEMBERS,

  Permission.CREATE_TEAM,
  Permission.MANAGE_TEAM_MEMBERS,
  Permission.VIEW_TEAMS,

  Permission.CREATE_CHANNEL,
  Permission.VIEW_CHANNEL,
  Permission.SEND_MESSAGE,
  Permission.MANAGE_CHANNEL_MEMBERS,

  Permission.CREATE_PROJECT,
  Permission.VIEW_PROJECT,
  Permission.MANAGE_PROJECT_MEMBERS,

  Permission.CREATE_TASK,
  Permission.UPDATE_TASK,
  Permission.APPROVE_TASK,
  Permission.ASSIGN_TASK,

  Permission.CREATE_NOTE,
  Permission.UPDATE_NOTE,
  Permission.VIEW_NOTE,

  Permission.UPLOAD_FILE,
  Permission.VIEW_FILE,

  Permission.SUBMIT_REPORT,
];

const TASK_MANAGER_PERMISSIONS: Permission[] = [
  Permission.CREATE_ORGANIZATION,
  Permission.VIEW_ORGANIZATION,
  Permission.VIEW_WORKSPACE,
  Permission.VIEW_TEAMS,

  Permission.VIEW_CHANNEL,
  Permission.SEND_MESSAGE,

  Permission.VIEW_PROJECT,

  Permission.CREATE_TASK,
  Permission.UPDATE_TASK,
  Permission.APPROVE_TASK,
  Permission.ASSIGN_TASK,

  Permission.CREATE_NOTE,
  Permission.UPDATE_NOTE,
  Permission.VIEW_NOTE,

  Permission.UPLOAD_FILE,
  Permission.VIEW_FILE,

  Permission.SUBMIT_REPORT,
];

const HR_PERMISSIONS: Permission[] = [
  Permission.CREATE_ORGANIZATION,
  Permission.VIEW_ORGANIZATION,
  Permission.VIEW_WORKSPACE,
  Permission.VIEW_TEAMS,

  Permission.VIEW_CHANNEL,
  Permission.SEND_MESSAGE,

  Permission.VIEW_PROJECT,

  Permission.CREATE_TASK,
  Permission.UPDATE_TASK,
  Permission.VIEW_NOTE,
  Permission.CREATE_NOTE,
  Permission.UPDATE_NOTE,

  Permission.UPLOAD_FILE,
  Permission.VIEW_FILE,

  Permission.SUBMIT_REPORT,
  Permission.VIEW_HR_REPORTS,
  Permission.VIEW_WORKLOAD,
];

const MEMBER_PERMISSIONS: Permission[] = [
  Permission.CREATE_ORGANIZATION,
  Permission.VIEW_ORGANIZATION,
  Permission.VIEW_WORKSPACE,
  Permission.VIEW_TEAMS,

  Permission.VIEW_CHANNEL,
  Permission.SEND_MESSAGE,

  Permission.VIEW_PROJECT,

  Permission.CREATE_TASK,
  Permission.UPDATE_TASK,

  Permission.CREATE_NOTE,
  Permission.UPDATE_NOTE,
  Permission.VIEW_NOTE,

  Permission.UPLOAD_FILE,
  Permission.VIEW_FILE,

  Permission.SUBMIT_REPORT,
];

const GUEST_PERMISSIONS: Permission[] = [
  Permission.VIEW_ORGANIZATION,
  Permission.VIEW_WORKSPACE,

  Permission.VIEW_CHANNEL,
  Permission.VIEW_PROJECT,
  Permission.VIEW_NOTE,
  Permission.VIEW_FILE,
];

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.OWNER]: OWNER_PERMISSIONS,
  [UserRole.ADMIN]: ADMIN_PERMISSIONS,
  [UserRole.SUPERVISOR]: SUPERVISOR_PERMISSIONS,
  [UserRole.LEADER]: LEADER_PERMISSIONS,
  [UserRole.TASK_MANAGER]: TASK_MANAGER_PERMISSIONS,
  [UserRole.HR]: HR_PERMISSIONS,
  [UserRole.MEMBER]: MEMBER_PERMISSIONS,
  [UserRole.GUEST]: GUEST_PERMISSIONS,
};

const _permissionCache = new Map<string, boolean>();

export function hasPermission(role: UserRole, permission: Permission): boolean {
  const key = `${role}:${permission}`;
  const cached = _permissionCache.get(key);
  if (cached !== undefined) return cached;

  const perms = ROLE_PERMISSIONS[role];
  const result = perms ? perms.includes(permission) : false;
  _permissionCache.set(key, result);
  return result;
}

export function rolesWithPermission(permission: Permission): UserRole[] {
  return Object.values(UserRole).filter((role) => hasPermission(role, permission));
}
