"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sidebar } from "@/components/layout/sidebar"
import { toast } from "sonner"
import { assignableProjectRoles } from "@/lib/constants"
import type { ProjectRole, WorkspaceRole } from "@/lib/constants"
import { PermissionGate } from "@/components/shared/permission-gate"

interface ProjectMember {
  id: string
  user_id: string
  role: ProjectRole
  profile: {
    full_name: string | null
  } | null
}

interface WorkspaceMember {
  user_id: string
  role: WorkspaceRole
  profile: {
    full_name: string | null
  } | null
}

export default function ProjectMembersPage() {
  const params = useParams()
  const workspaceSlug = params.workspaceSlug as string
  const projectSlug = params.projectSlug as string
  const supabase = createClient()
  
  const [members, setMembers] = useState<ProjectMember[]>([])
  const [workspaceMembers, setWorkspaceMembers] = useState<WorkspaceMember[]>([])
  const [project, setProject] = useState<any>(null)
  const [workspace, setWorkspace] = useState<any>(null)
  const [currentUserRole, setCurrentUserRole] = useState<ProjectRole | null>(null)
  const [currentWorkspaceRole, setCurrentWorkspaceRole] = useState<WorkspaceRole | null>(null)
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [workspaceSlug, projectSlug])

  const fetchData = async () => {
    setIsLoading(true)
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Get user's super admin status
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_super_admin")
      .eq("id", user.id)
      .single()
    
    setIsSuperAdmin(profile?.is_super_admin || false)

    // Get workspace
    const { data: workspaceData } = await supabase
      .from("workspaces")
      .select("*")
      .eq("slug", workspaceSlug)
      .single()

    if (!workspaceData) return
    setWorkspace(workspaceData)

    // Get user's workspace role
    const { data: workspaceMemberData } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", workspaceData.id)
      .eq("user_id", user.id)
      .single()

    setCurrentWorkspaceRole(workspaceMemberData?.role || null)

    // Get project
    const { data: projectData } = await supabase
      .from("projects")
      .select("*")
      .eq("workspace_id", workspaceData.id)
      .eq("slug", projectSlug)
      .single()

    if (!projectData) return
    setProject(projectData)

    // Get user's project role
    const { data: projectMemberData } = await supabase
      .from("project_members")
      .select("role")
      .eq("project_id", projectData.id)
      .eq("user_id", user.id)
      .single()

    setCurrentUserRole(projectMemberData?.role || null)

    // Get project members
    const { data: membersData } = await supabase
      .from("project_members")
      .select(`
        id,
        user_id,
        role,
        profile:profiles(full_name)
      `)
      .eq("project_id", projectData.id)

    setMembers((membersData as unknown as ProjectMember[]) || [])

    // Get workspace members not in project
    const { data: wsMembersData } = await supabase
      .from("workspace_members")
      .select(`
        user_id,
        role,
        profile:profiles(full_name)
      `)
      .eq("workspace_id", workspaceData.id)

    setWorkspaceMembers((wsMembersData as unknown as WorkspaceMember[]) || [])
    setIsLoading(false)
  }

  const handleAddMember = async (userId: string, role: ProjectRole = "viewer") => {
    if (!project) return

    const { error } = await supabase
      .from("project_members")
      .insert({
        project_id: project.id,
        user_id: userId,
        role,
      })

    if (error) {
      toast.error(error.message)
    } else {
      toast.success("Member added to project")
      fetchData()
    }
  }

  const handleUpdateRole = async (memberId: string, newRole: ProjectRole) => {
    const { error } = await supabase
      .from("project_members")
      .update({ role: newRole })
      .eq("id", memberId)

    if (error) {
      toast.error(error.message)
    } else {
      toast.success("Role updated")
      fetchData()
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm("Are you sure you want to remove this member from the project?")) return

    const { error } = await supabase
      .from("project_members")
      .delete()
      .eq("id", memberId)

    if (error) {
      toast.error(error.message)
    } else {
      toast.success("Member removed from project")
      fetchData()
    }
  }

  // Get workspace members not in the project
  const availableMembers = workspaceMembers.filter(
    wsMember => !members.find(pm => pm.user_id === wsMember.user_id)
  )

  return (
    <>
      <Sidebar workspaceSlug={workspaceSlug} projectSlug={projectSlug} />
      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-8">
        <div className="mx-auto max-w-4xl">
          <h1 className="text-3xl font-bold mb-6">Project Members</h1>
          
          {/* Add Members Section */}
          <PermissionGate
            isSuperAdmin={isSuperAdmin}
            workspaceRole={currentWorkspaceRole}
            projectRole={currentUserRole}
            project="project.members.manage"
          >
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Add Workspace Members</CardTitle>
              </CardHeader>
              <CardContent>
                {availableMembers.length === 0 ? (
                  <p className="text-muted-foreground">
                    All workspace members are already in this project.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {availableMembers.map((member) => (
                      <div
                        key={member.user_id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div>
                          <p className="font-medium">
                            {member.profile?.full_name || "Unknown"}
                          </p>
                          <p className="text-sm text-muted-foreground capitalize">
                            Workspace {member.role}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleAddMember(member.user_id)}
                        >
                          Add to Project
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </PermissionGate>

          {/* Current Members */}
          <Card>
            <CardHeader>
              <CardTitle>Current Members</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-muted-foreground">Loading...</p>
              ) : members.length === 0 ? (
                <p className="text-muted-foreground">No members yet</p>
              ) : (
                <div className="space-y-4">
                  {members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div>
                        <p className="font-medium">
                          {member.profile?.full_name || "Unknown"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {member.user_id.slice(0, 8)}...
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <PermissionGate
                          isSuperAdmin={isSuperAdmin}
                          workspaceRole={currentWorkspaceRole}
                          projectRole={currentUserRole}
                          project="project.members.manage"
                          fallback={
                            <span className="text-sm bg-secondary px-2 py-1 rounded capitalize">
                              {member.role}
                            </span>
                          }
                        >
                          <Select
                            value={member.role}
                            onValueChange={(v) => handleUpdateRole(member.id, v as ProjectRole)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {assignableProjectRoles(currentUserRole, currentWorkspaceRole, isSuperAdmin).map((r) => (
                                <SelectItem key={r} value={r}>
                                  {r}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleRemoveMember(member.id)}
                          >
                            Remove
                          </Button>
                        </PermissionGate>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  )
}
