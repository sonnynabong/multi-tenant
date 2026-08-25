"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { logAction, AuditActions } from "@/lib/audit"
import { Shield, ShieldOff } from "lucide-react"

interface User {
  id: string
  full_name: string | null
  is_super_admin: boolean | null
  created_at: string | null
  workspaces: { count: number }[]
}

export default function AdminUsersPage() {
  const supabase = createClient()
  const [users, setUsers] = useState<User[]>([])
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    setIsLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    setCurrentUserId(user?.id ?? null)

    // Get all profiles with workspace counts
    const { data: profilesData } = await supabase
      .from("profiles")
      .select(`
        id,
        full_name,
        is_super_admin,
        created_at,
        workspaces:workspace_members(count)
      `)
      .order("created_at", { ascending: false })

    if (!profilesData) {
      setIsLoading(false)
      return
    }

    setUsers(profilesData as unknown as User[])
    setIsLoading(false)
  }

  const toggleSuperAdmin = async (userId: string, currentStatus: boolean) => {
    setUpdatingId(userId)

    try {
      const { error } = await supabase.rpc("set_super_admin", {
        target_user_id: userId,
        make_admin: !currentStatus,
      })

      if (error) {
        throw error
      }

      toast.success(
        currentStatus
          ? "User demoted from super admin"
          : "User promoted to super admin"
      )

      await logAction({
        action: currentStatus ? AuditActions.ADMIN_DEMOTED : AuditActions.ADMIN_PROMOTED,
        targetType: "user",
        targetId: userId,
        metadata: { previous_status: currentStatus },
      })

      fetchUsers()
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to update user")
    }

    setUpdatingId(null)
  }

  return (
    <div className="flex-1 flex flex-col space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Users</h1>
        <p className="text-muted-foreground">Manage all users on the platform</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>ID</TableHead>
                <TableHead>Workspaces</TableHead>
                <TableHead>Super Admin</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    Loading users...
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      {user.full_name || "N/A"}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {user.id.slice(0, 8)}...
                    </TableCell>
                    <TableCell>{(user.workspaces as any)?.[0]?.count || 0}</TableCell>
                    <TableCell>
                      {user.is_super_admin ? (
                        <Badge variant="default" className="bg-yellow-500 hover:bg-yellow-600">
                          <Shield className="h-3 w-3 mr-1" />
                          Admin
                        </Badge>
                      ) : (
                        <Badge variant="secondary">No</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {user.created_at ? new Date(user.created_at).toLocaleDateString() : "-"}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleSuperAdmin(user.id, user.is_super_admin || false)}
                        disabled={updatingId === user.id || user.id === currentUserId}
                      >
                        {user.is_super_admin ? (
                          <>
                            <ShieldOff className="h-4 w-4 mr-1" />
                            Demote
                          </>
                        ) : (
                          <>
                            <Shield className="h-4 w-4 mr-1" />
                            Promote
                          </>
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
