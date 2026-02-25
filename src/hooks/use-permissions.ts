"use client"

import { hasWorkspacePermission, hasProjectPermission } from "@/lib/permissions"
import type { WorkspaceRole, ProjectRole } from "@/lib/constants"
import type { WorkspacePermission, ProjectPermission } from "@/lib/constants"

interface UsePermissionsProps {
  workspaceRole?: WorkspaceRole | null
  projectRole?: ProjectRole | null
  isSuperAdmin?: boolean
}

export function usePermissions({
  workspaceRole,
  projectRole,
  isSuperAdmin = false,
}: UsePermissionsProps) {
  const checkWorkspace = (permission: WorkspacePermission): boolean => {
    if (isSuperAdmin) return true
    return hasWorkspacePermission(workspaceRole, permission)
  }

  const checkProject = (permission: ProjectPermission): boolean => {
    if (isSuperAdmin) return true
    return hasProjectPermission(projectRole, permission)
  }

  return {
    checkWorkspace,
    checkProject,
    isSuperAdmin,
  }
}
