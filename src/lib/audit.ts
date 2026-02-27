import { createClient } from "./supabase/client"

interface AuditLogEntry {
  workspaceId?: string
  projectId?: string
  action: string
  targetType?: string
  targetId?: string
  metadata?: Record<string, any>
}

export async function logAction(entry: AuditLogEntry) {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  // Get IP address (this will be the client IP)
  let ipAddress = null
  try {
    const response = await fetch("https://api.ipify.org?format=json")
    const data = await response.json()
    ipAddress = data.ip
  } catch {
    // Ignore IP fetch errors
  }

  const { error } = await supabase
    .from("audit_logs")
    .insert({
      workspace_id: entry.workspaceId || null,
      project_id: entry.projectId || null,
      user_id: user.id,
      action: entry.action,
      target_type: entry.targetType || null,
      target_id: entry.targetId || null,
      metadata: entry.metadata || {},
      ip_address: ipAddress,
    })

  if (error) {
    console.error("Failed to log audit entry:", error)
  }
}

// Predefined audit actions
export const AuditActions = {
  // Workspace actions
  WORKSPACE_CREATED: "workspace.created",
  WORKSPACE_UPDATED: "workspace.updated",
  WORKSPACE_DELETED: "workspace.deleted",
  
  // Member actions
  MEMBER_INVITED: "member.invited",
  MEMBER_JOINED: "member.joined",
  MEMBER_REMOVED: "member.removed",
  MEMBER_ROLE_CHANGED: "member.role_changed",
  
  // Project actions
  PROJECT_CREATED: "project.created",
  PROJECT_UPDATED: "project.updated",
  PROJECT_DELETED: "project.deleted",
  PROJECT_ARCHIVED: "project.archived",
  PROJECT_UNARCHIVED: "project.unarchived",
  
  // Project member actions
  PROJECT_MEMBER_ADDED: "project_member.added",
  PROJECT_MEMBER_REMOVED: "project_member.removed",
  PROJECT_MEMBER_ROLE_CHANGED: "project_member.role_changed",
  
  // User actions
  USER_UPDATED: "user.updated",
  USER_PASSWORD_CHANGED: "user.password_changed",
  
  // Admin actions
  ADMIN_PROMOTED: "admin.promoted",
  ADMIN_DEMOTED: "admin.demoted",
} as const
