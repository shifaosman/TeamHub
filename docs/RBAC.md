# TeamHub Role-Based Access Control (RBAC)

## Overview

TeamHub uses a **workspace-scoped** role system. Each user can have a different role in
each workspace they belong to. The role stored on `WorkspaceMember.role` governs what
actions the user may perform inside that workspace and the organization it belongs to.

---

## Role Hierarchy

```
OWNER
 └── ADMIN
      ├── SUPERVISOR
      │    └── TASK_MANAGER ──┐
      └── LEADER              │
           └── TASK_MANAGER ──┘
                └── MEMBER
 HR ─────────────────┘    │
                     GUEST ┘
```

Roles higher in the tree **inherit all permissions** of the roles below them unless
explicitly noted otherwise. `HR` is a lateral role that shares the read-level of
`MEMBER` but adds access to reports and workload data.

---

## Role Definitions

| Role | Scope | Description |
|------|-------|-------------|
| **OWNER** | Organization + all workspaces | Creator of the organization. Unrestricted access. Can transfer ownership, delete the organization, and manage all workspaces under it. One per organization. |
| **ADMIN** | Workspace | Full workspace administration: settings, members, roles, invites, channels, projects, notes, files. Cannot delete the organization or transfer org ownership. |
| **SUPERVISOR** | Workspace | Oversight role. Can view all teams, task stats, workload reports, and HR reports. Can create workspaces (in the org), channels, and teams. Cannot manage workspace settings or member roles. |
| **LEADER** | Workspace / Team | Team lead. Can create channels, projects, and teams. Can manage members within their teams. Can approve/reject tasks. Cannot access HR/oversight dashboards. |
| **TASK_MANAGER** | Workspace | Task workflow specialist. Can approve/reject tasks, manage task assignments and due dates. Cannot create channels, manage members, or access oversight. |
| **HR** | Workspace | Human resources. Can view reports, workload data, and submit/review complaints. Read access to team membership. Cannot create or modify workspace resources. |
| **MEMBER** | Workspace | Standard participant. Can send messages, create notes, be assigned tasks, and participate in projects they belong to. Cannot create channels, projects, or teams. |
| **GUEST** | Workspace | Read-only. Can view channels, projects, and notes they are **explicitly added to**. Cannot create, update, or delete anything. |

---

## Permission Matrix

### Organization

| Action | OWNER | ADMIN | SUPERVISOR | LEADER | TASK_MANAGER | HR | MEMBER | GUEST |
|--------|:-----:|:-----:|:----------:|:------:|:------------:|:--:|:------:|:-----:|
| Create organization | any authenticated user ||||||||
| View own organization | Y | Y | Y | Y | Y | Y | Y | Y |
| Update organization | Y | — | — | — | — | — | — | — |
| Delete organization | Y | — | — | — | — | — | — | — |
| Transfer ownership | Y | — | — | — | — | — | — | — |

### Workspace

| Action | OWNER | ADMIN | SUPERVISOR | LEADER | TASK_MANAGER | HR | MEMBER | GUEST |
|--------|:-----:|:-----:|:----------:|:------:|:------------:|:--:|:------:|:-----:|
| Create workspace (in org) | Y | Y | Y | Y | — | — | — | — |
| View workspace | Y | Y | Y | Y | Y | Y | Y | Y |
| Update workspace settings | Y | Y | — | — | — | — | — | — |
| Delete workspace | Y | — | — | — | — | — | — | — |
| Manage members & roles | Y | Y | — | — | — | — | — | — |
| Invite members | Y | Y | Y | Y | — | — | — | — |
| View audit logs | Y | Y | Y | — | — | — | — | — |

### Teams

| Action | OWNER | ADMIN | SUPERVISOR | LEADER | TASK_MANAGER | HR | MEMBER | GUEST |
|--------|:-----:|:-----:|:----------:|:------:|:------------:|:--:|:------:|:-----:|
| Create team | Y | Y | Y | Y | — | — | — | — |
| Add/remove team members | Y | Y | Y | Y | — | — | — | — |
| View teams | Y | Y | Y | Y | Y | Y | Y | — |
| View team members | Y | Y | Y | Y | Y | Y | Y | — |

### Channels

| Action | OWNER | ADMIN | SUPERVISOR | LEADER | TASK_MANAGER | HR | MEMBER | GUEST |
|--------|:-----:|:-----:|:----------:|:------:|:------------:|:--:|:------:|:-----:|
| Create channel | Y | Y | Y | Y | — | — | — | — |
| Update channel | Y | Y | — | — | — | — | — | — |
| Delete channel | Y | Y | — | — | — | — | — | — |
| View channel (with access) | Y | Y | Y | Y | Y | Y | Y | Y* |
| Send messages | Y | Y | Y | Y | Y | Y | Y | — |
| Add/remove channel members | Y | Y | Y | Y | — | — | — | — |

*GUEST can only view channels they are explicitly added to.

### Projects

| Action | OWNER | ADMIN | SUPERVISOR | LEADER | TASK_MANAGER | HR | MEMBER | GUEST |
|--------|:-----:|:-----:|:----------:|:------:|:------------:|:--:|:------:|:-----:|
| Create project | Y | Y | Y | Y | — | — | — | — |
| Update project | Y | Y | — | — | — | — | — | — |
| Delete project | Y | Y | — | — | — | — | — | — |
| View project (with access) | Y | Y | Y | Y | Y | Y | Y | Y* |
| Add project members | Y | Y | Y | Y | — | — | — | — |

*GUEST can only view projects they are explicitly added to.

### Tasks

| Action | OWNER | ADMIN | SUPERVISOR | LEADER | TASK_MANAGER | HR | MEMBER | GUEST |
|--------|:-----:|:-----:|:----------:|:------:|:------------:|:--:|:------:|:-----:|
| Create task (in project) | Y | Y | Y | Y | Y | — | Y | — |
| Update task | Y | Y | Y | Y | Y | — | Y** | — |
| Delete task | Y | Y | — | — | — | — | — | — |
| Approve / reject task | Y | Y | Y | Y | Y | — | — | — |
| Assign task | Y | Y | Y | Y | Y | — | — | — |

**MEMBER can only update tasks assigned to them or created by them.

### Notes

| Action | OWNER | ADMIN | SUPERVISOR | LEADER | TASK_MANAGER | HR | MEMBER | GUEST |
|--------|:-----:|:-----:|:----------:|:------:|:------------:|:--:|:------:|:-----:|
| Create note | Y | Y | Y | Y | Y | Y | Y | — |
| Update note (collaborator) | Y | Y | Y | Y | Y | Y | Y | — |
| Delete note | Y | Y | — | — | — | — | — | — |
| View note (with access) | Y | Y | Y | Y | Y | Y | Y | Y* |

*GUEST can only view notes they are explicitly added to as a collaborator.

### Files

| Action | OWNER | ADMIN | SUPERVISOR | LEADER | TASK_MANAGER | HR | MEMBER | GUEST |
|--------|:-----:|:-----:|:----------:|:------:|:------------:|:--:|:------:|:-----:|
| Upload file | Y | Y | Y | Y | Y | Y | Y | — |
| Delete file | Y | Y | — | — | — | — | — | — |
| View file (with access) | Y | Y | Y | Y | Y | Y | Y | Y* |

*GUEST can view files in channels/projects they are added to. Uploader can always delete own files.

### Reports & Oversight

| Action | OWNER | ADMIN | SUPERVISOR | LEADER | TASK_MANAGER | HR | MEMBER | GUEST |
|--------|:-----:|:-----:|:----------:|:------:|:------------:|:--:|:------:|:-----:|
| Submit report | Y | Y | Y | Y | Y | Y | Y | — |
| View HR reports | Y | Y | Y | — | — | Y | — | — |
| View workload data | Y | Y | Y | — | — | Y | — | — |
| Supervisor dashboard | Y | Y | Y | — | — | — | — | — |

---

## Data Model

### Roles are workspace-scoped

```
User (global account)
 └── WorkspaceMember (per workspace)
      ├── workspaceId
      ├── userId
      └── role: UserRole   <-- governs all permissions
```

The `User.role` field on the global user document is **not used** for permission
checks. All authorization is based on `WorkspaceMember.role` within the workspace
context of the request.

### Team-based visibility

Resources (channels, projects, notes) can optionally be scoped to specific teams
via a `teamIds` array. When `teamIds` is non-empty, only members of at least one
of those teams (or users with OWNER/ADMIN/SUPERVISOR/LEADER roles) can access the
resource. When `teamIds` is empty, the resource is visible to all workspace members.

---

## Implementation Notes

- All permission checks are centralized in `apps/api/src/common/permissions.ts`.
- The `Permission` enum defines every gated action.
- The `ROLE_PERMISSIONS` map ties each `UserRole` to its allowed `Permission` set.
- The `hasPermission(role, permission)` helper is used by all services.
- The existing `@Roles()` decorator and `RolesGuard` check the **global** user role
  and are **not used**. Workspace-scoped checks happen in services via
  `WorkspacesService.ensureMemberWithRole()` and `hasPermission()`.
