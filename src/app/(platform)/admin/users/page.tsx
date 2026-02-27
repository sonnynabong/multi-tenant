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
  const [isLoading, setIsLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    setIsLoading(true)
    
    // Get all profiles
    const { data: profilesData } = await supabase
      .from("profiles")
      .select(`
        id,
        full_name,
        is_super_admin,
        created_at
      `)
      .order("created_at", { ascending: false })

    if (!profilesData) {
      setIsLoading(false)
      return
    }

    // Get workspace counts for each user
    const usersWithCounts = await Promise.all(
      profilesData.map(async (profile) => {
        const { count } = await supabase
          .from("workspace_members")
          .select("*", { count: "exact", head: true })
          .eq("user_id", profile.id)
        
        return {
          ...profile,
          workspaces: [{ count: count || 0 }],
        }
      })
    )

    setUsers(usersWithCounts)
    setIsLoading(false)
  }

  const toggleSuperAdmin = async (userId: string, currentStatus: boolean) => {
    setUpdatingId(userId)
    
    const { error } = await supabase
      .from("profiles")
      .update({ is_super_admin: !currentStatus })
      .eq("id", userId)

    if (error) {
      toast.error(error.message)
    } else {
      toast.success(
        currentStatus 
          ? "User demoted from super admin" 
          : "User promoted to super admin"
      )
      
      // Log the action
      await logAction({
        action: currentStatus ? AuditActions.ADMIN_DEMOTED : AuditActions.ADMIN_PROMOTED,
        targetType: "user",
        targetId: userId,
        metadata: { previous_status: currentStatus },
      })
      
      fetchUsers()
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
                    <TableCell>{user.workspaces?.[0]?.count || 0}</TableCell>
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
                      {new Date(user.created_at!).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleSuperAdmin(user.id, user.is_super_admin || false)}
                        disabled={updatingId === user.id}
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
