import { WORKSPACE_PERMISSIONS, PROJECT_PERMISSIONS, type WorkspaceRole, type ProjectRole } from './constants'

export function hasWorkspacePermission(
  role: WorkspaceRole | undefined | null,
  permission: keyof typeof WORKSPACE_PERMISSIONS
): boolean {
  if (!role) return false
  return WORKSPACE_PERMISSIONS[permission].includes(role as WorkspaceRole)
}

export function hasProjectPermission(
  role: ProjectRole | undefined | null,
  permission: keyof typeof PROJECT_PERMISSIONS
): boolean {
  if (!role) return false
  return PROJECT_PERMISSIONS[permission].includes(role as ProjectRole)
}

export function getWorkspacePermissions(role: WorkspaceRole | undefined | null): string[] {
  if (!role) return []
  return Object.entries(WORKSPACE_PERMISSIONS)
    .filter(([_, roles]) => roles.includes(role as WorkspaceRole))
    .map(([permission]) => permission)
}

export function getProjectPermissions(role: ProjectRole | undefined | null): string[] {
  if (!role) return []
  return Object.entries(PROJECT_PERMISSIONS)
    .filter(([_, roles]) => roles.includes(role as ProjectRole))
    .map(([permission]) => permission)
}
