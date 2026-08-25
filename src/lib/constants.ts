export const WORKSPACE_ROLES = [
  'owner',
  'admin', 
  'manager',
  'member',
  'viewer',
  'billing_admin',
] as const

export const PROJECT_ROLES = [
  'owner',
  'admin',
  'editor', 
  'commenter',
  'viewer',
] as const

export const INVITEABLE_WORKSPACE_ROLES = WORKSPACE_ROLES.filter(
  (role) => role !== "owner"
)

export const ASSIGNABLE_PROJECT_ROLES_NON_OWNER = PROJECT_ROLES.filter(
  (role) => role !== "owner"
)

export function assignableWorkspaceRoles(
  actor: WorkspaceRole | null,
  isSuperAdmin: boolean
): readonly WorkspaceRole[] {
  if (isSuperAdmin || actor === "owner") return WORKSPACE_ROLES
  return INVITEABLE_WORKSPACE_ROLES
}

export function assignableProjectRoles(
  projectRole: ProjectRole | null,
  workspaceRole: WorkspaceRole | null,
  isSuperAdmin: boolean
): readonly ProjectRole[] {
  if (isSuperAdmin || projectRole === "owner" || workspaceRole === "owner") {
    return PROJECT_ROLES
  }
  return ASSIGNABLE_PROJECT_ROLES_NON_OWNER
}

export type WorkspaceRole = typeof WORKSPACE_ROLES[number]
export type ProjectRole = typeof PROJECT_ROLES[number]

export const WORKSPACE_PERMISSIONS: Record<string, readonly string[]> = {
  'workspace.delete':         ['owner'],
  'workspace.transfer':       ['owner'],
  'workspace.billing':        ['owner', 'billing_admin'],
  'workspace.settings':       ['owner', 'admin'],
  'workspace.members.manage': ['owner', 'admin'],
  'workspace.members.invite': ['owner', 'admin', 'manager'],
  'workspace.projects.create':['owner', 'admin', 'manager'],
  'workspace.projects.viewAll':['owner', 'admin', 'manager'],
  'workspace.analytics':      ['owner', 'admin', 'manager', 'viewer'],
  'workspace.audit':          ['owner', 'admin'],
}

export const PROJECT_PERMISSIONS: Record<string, readonly string[]> = {
  'project.delete':           ['owner'],
  'project.settings':         ['owner', 'admin'],
  'project.members.manage':   ['owner', 'admin'],
  'project.content.create':   ['owner', 'admin', 'editor'],
  'project.content.edit':     ['owner', 'admin', 'editor'],
  'project.content.delete':   ['owner', 'admin', 'editor'],
  'project.comment':          ['owner', 'admin', 'editor', 'commenter'],
  'project.view':             ['owner', 'admin', 'editor', 'commenter', 'viewer'],
  'project.export':           ['owner', 'admin', 'editor'],
}

export type WorkspacePermission = keyof typeof WORKSPACE_PERMISSIONS
export type ProjectPermission = keyof typeof PROJECT_PERMISSIONS
