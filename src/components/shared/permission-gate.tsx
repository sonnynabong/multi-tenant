"use client"

import { usePermissions } from "@/hooks/use-permissions"
import type { WorkspacePermission, ProjectPermission } from "@/lib/constants"
import type { WorkspaceRole, ProjectRole } from "@/lib/constants"

interface PermissionGateProps {
  workspaceRole?: WorkspaceRole | null
  projectRole?: ProjectRole | null
  isSuperAdmin?: boolean
  workspace?: WorkspacePermission
  project?: ProjectPermission
  fallback?: React.ReactNode
  children: React.ReactNode
}

export function PermissionGate({
  workspaceRole,
  projectRole,
  isSuperAdmin = false,
  workspace,
  project,
  fallback = null,
  children,
}: PermissionGateProps) {
  const { checkWorkspace, checkProject } = usePermissions({
    workspaceRole,
    projectRole,
    isSuperAdmin,
  })

  if (isSuperAdmin) return <>{children}</>

  if (workspace && !checkWorkspace(workspace)) return <>{fallback}</>
  if (project && !checkProject(project)) return <>{fallback}</>

  return <>{children}</>
}
