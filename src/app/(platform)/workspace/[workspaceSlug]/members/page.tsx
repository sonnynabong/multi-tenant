"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sidebar } from "@/components/layout/sidebar"
import { toast } from "sonner"
import { WORKSPACE_ROLES, INVITEABLE_WORKSPACE_ROLES } from "@/lib/constants"
import type { WorkspaceRole } from "@/lib/constants"
import { logAction, AuditActions } from "@/lib/audit"

interface Member {
  id: string
  user_id: string
  role: WorkspaceRole
  profile: {
    full_name: string | null
  } | null
}

export default function WorkspaceMembersPage() {
  const params = useParams()
  const workspaceSlug = params.workspaceSlug as string
  const supabase = createClient()
  
  const [members, setMembers] = useState<Member[]>([])
  const [workspace, setWorkspace] = useState<any>(null)
  const [currentUserRole, setCurrentUserRole] = useState<WorkspaceRole | null>(null)
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  
  const [email, setEmail] = useState("")
  const [role, setRole] = useState<WorkspaceRole>("member")
  const [isInviting, setIsInviting] = useState(false)
  const [inviteLink, setInviteLink] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [workspaceSlug])

  const fetchData = async () => {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setCurrentUserId(user.id)

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
    const { data: userMemberData } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", workspaceData.id)
      .eq("user_id", user.id)
      .single()

    setCurrentUserRole(userMemberData?.role || null)

    // Get members
    fetchMembers(workspaceData.id)
  }

  const fetchMembers = async (workspaceId: string) => {
    const { data } = await supabase
      .from("workspace_members")
      .select(`
        id,
        user_id,
        role,
        profile:profiles(full_name)
      `)
      .eq("workspace_id", workspaceId)
    
    setMembers((data as unknown as Member[]) || [])
  }

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!workspace) {
      toast.error("Workspace not found")
      return
    }
    
    setIsInviting(true)

    const { data: invitation, error } = await supabase
      .from("workspace_invitations")
      .insert({
        workspace_id: workspace.id,
        email,
        role,
        invited_by: currentUserId,
      })
      .select()
      .single()

    if (error) {
      toast.error(error.message)
    } else {
      const link = `${window.location.origin}/invite?token=${invitation.token}`
      setInviteLink(link)
      try {
        await navigator.clipboard.writeText(link)
        toast.success("Invitation created. Link copied to clipboard.")
      } catch {
        toast.success("Invitation created. Copy the link below to share it.")
      }
      setEmail("")
      
      // Log the action
      await logAction({
        workspaceId: workspace.id,
        action: AuditActions.MEMBER_INVITED,
        targetType: "invitation",
        targetId: invitation?.id,
        metadata: { email, role },
      })
    }
    setIsInviting(false)
  }

  const handleUpdateRole = async (memberId: string, userId: string, newRole: WorkspaceRole) => {
    // Get current role for logging
    const member = members.find(m => m.id === memberId)
    const oldRole = member?.role

    const { error } = await supabase
      .from("workspace_members")
      .update({ role: newRole })
      .eq("id", memberId)

    if (error) {
      toast.error(error.message)
    } else {
      toast.success("Role updated")
      if (workspace) fetchMembers(workspace.id)
      
      // Log the action
      await logAction({
        workspaceId: workspace?.id,
        action: AuditActions.MEMBER_ROLE_CHANGED,
        targetType: "member",
        targetId: userId,
        metadata: { old_role: oldRole, new_role: newRole },
      })
    }
  }

  const handleRemoveMember = async (memberId: string, userId: string) => {
    // Don't allow removing yourself if you're the owner
    if (userId === currentUserId && currentUserRole === "owner") {
      toast.error("You cannot remove yourself as the owner. Transfer ownership first.")
      return
    }

    if (!confirm("Are you sure you want to remove this member?")) return

    const { error } = await supabase
      .from("workspace_members")
      .delete()
      .eq("id", memberId)

    if (error) {
      toast.error(error.message)
    } else {
      toast.success("Member removed")
      if (workspace) fetchMembers(workspace.id)
      
      // Log the action
      await logAction({
        workspaceId: workspace?.id,
        action: AuditActions.MEMBER_REMOVED,
        targetType: "member",
        targetId: userId,
      })
    }
  }

  const canInvite = isSuperAdmin || 
    currentUserRole === "owner" || 
    currentUserRole === "admin" || 
    currentUserRole === "manager"

  const canManageRoles = isSuperAdmin || 
    currentUserRole === "owner" || 
    currentUserRole === "admin"

  const canRemove = isSuperAdmin || 
    currentUserRole === "owner" || 
    currentUserRole === "admin"

  return (
    <>
      <Sidebar workspaceSlug={workspaceSlug} />
      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-8">
        <div className="mx-auto max-w-4xl">
          <h1 className="text-3xl font-bold mb-6">Workspace Members</h1>
          
          {/* Invite Section */}
          {canInvite && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Invite Member</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleInvite} className="flex gap-4">
                  <div className="flex-1">
                    <Label htmlFor="email" className="sr-only">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="colleague@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <Select value={role} onValueChange={(v) => setRole(v as WorkspaceRole)}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {INVITEABLE_WORKSPACE_ROLES.map((r) => (
                        <SelectItem key={r} value={r}>
                          {r}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button type="submit" disabled={isInviting}>
                    {isInviting ? "Inviting..." : "Invite"}
                  </Button>
                </form>
                {inviteLink && (
                  <div className="mt-4 space-y-2">
                    <Label htmlFor="invite-link">Invitation link</Label>
                    <div className="flex gap-2">
                      <Input id="invite-link" readOnly value={inviteLink} />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(inviteLink)
                            toast.success("Link copied")
                          } catch {
                            toast.error("Could not copy link")
                          }
                        }}
                      >
                        Copy
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Members List */}
          <Card>
            <CardHeader>
              <CardTitle>Current Members</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">
                        {member.profile?.full_name || "Unknown"}
                        {member.user_id === currentUserId && (
                          <span className="ml-2 text-xs text-muted-foreground">(You)</span>
                        )}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {member.user_id.slice(0, 8)}...
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {canManageRoles && member.user_id !== currentUserId ? (
                        <Select
                          value={member.role}
                          onValueChange={(v) => handleUpdateRole(member.id, member.user_id, v as WorkspaceRole)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {WORKSPACE_ROLES.map((r) => (
                              <SelectItem key={r} value={r}>
                                {r}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <span className="text-sm bg-secondary px-2 py-1 rounded capitalize">
                          {member.role}
                        </span>
                      )}
                      
                      {canRemove && member.user_id !== currentUserId && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleRemoveMember(member.id, member.user_id)}
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                
                {members.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    No members found in this workspace
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  )
}
