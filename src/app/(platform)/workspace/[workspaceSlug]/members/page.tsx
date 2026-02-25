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
import { WORKSPACE_ROLES } from "@/lib/constants"
import type { WorkspaceRole } from "@/lib/constants"

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
  const [email, setEmail] = useState("")
  const [role, setRole] = useState<WorkspaceRole>("member")
  const [isInviting, setIsInviting] = useState(false)

  useEffect(() => {
    fetchMembers()
  }, [workspaceSlug])

  const fetchMembers = async () => {
    const { data: workspace } = await supabase
      .from("workspaces")
      .select("id")
      .eq("slug", workspaceSlug)
      .single()

    if (workspace) {
      const { data } = await supabase
        .from("workspace_members")
        .select(`
          id,
          user_id,
          role,
          profile:profiles(full_name)
        `)
        .eq("workspace_id", workspace.id)
      
      setMembers((data as unknown as Member[]) || [])
    }
  }

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsInviting(true)

    const { data: workspace } = await supabase
      .from("workspaces")
      .select("id")
      .eq("slug", workspaceSlug)
      .single()

    if (!workspace) return

    const { error } = await supabase
      .from("workspace_invitations")
      .insert({
        workspace_id: workspace.id,
        email,
        role,
      })

    if (error) {
      toast.error(error.message)
    } else {
      toast.success("Invitation sent")
      setEmail("")
    }
    setIsInviting(false)
  }

  const handleRemoveMember = async (memberId: string) => {
    const { error } = await supabase
      .from("workspace_members")
      .delete()
      .eq("id", memberId)

    if (error) {
      toast.error(error.message)
    } else {
      toast.success("Member removed")
      fetchMembers()
    }
  }

  return (
    <>
      <Sidebar workspaceSlug={workspaceSlug} />
      <main className="flex-1 p-8">
        <div className="max-w-4xl">
          <h1 className="text-3xl font-bold mb-6">Workspace Members</h1>
          
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
                    {WORKSPACE_ROLES.map((r) => (
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
            </CardContent>
          </Card>

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
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {member.user_id.slice(0, 8)}...
                      </p>
                      <span className="text-xs bg-secondary px-2 py-1 rounded mt-1 inline-block capitalize">
                        {member.role}
                      </span>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleRemoveMember(member.id)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  )
}
