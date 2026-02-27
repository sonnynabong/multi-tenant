"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Sidebar } from "@/components/layout/sidebar"
import { toast } from "sonner"
import { hasWorkspacePermission } from "@/lib/permissions"
import type { WorkspaceRole } from "@/lib/constants"

export default function WorkspaceSettingsPage() {
  const params = useParams()
  const router = useRouter()
  const workspaceSlug = params.workspaceSlug as string
  const supabase = createClient()
  
  const [workspace, setWorkspace] = useState<any>(null)
  const [name, setName] = useState("")
  const [slug, setSlug] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [userRole, setUserRole] = useState<WorkspaceRole | null>(null)
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  useEffect(() => {
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
      
      if (workspaceData) {
        setWorkspace(workspaceData)
        setName(workspaceData.name)
        setSlug(workspaceData.slug)

        // Get user's role in this workspace
        const { data: memberData } = await supabase
          .from("workspace_members")
          .select("role")
          .eq("workspace_id", workspaceData.id)
          .eq("user_id", user.id)
          .single()

        setUserRole(memberData?.role || null)
      }
    }
    fetchData()
  }, [workspaceSlug, supabase])

  const canUpdateSettings = isSuperAdmin || hasWorkspacePermission(userRole, "workspace.settings")
  const canDelete = isSuperAdmin || hasWorkspacePermission(userRole, "workspace.delete")

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canUpdateSettings) {
      toast.error("You don't have permission to update workspace settings")
      return
    }
    
    setIsLoading(true)

    const { error } = await supabase
      .from("workspaces")
      .update({ name })
      .eq("slug", workspaceSlug)

    if (error) {
      toast.error(error.message)
    } else {
      toast.success("Workspace updated")
    }
    setIsLoading(false)
  }

  const handleDelete = async () => {
    if (!canDelete) {
      toast.error("You don't have permission to delete this workspace")
      return
    }

    if (!confirm("Are you sure you want to delete this workspace? This action cannot be undone.")) {
      return
    }
    setIsDeleting(true)

    const { error } = await supabase
      .from("workspaces")
      .delete()
      .eq("slug", workspaceSlug)

    if (error) {
      toast.error(error.message)
      setIsDeleting(false)
    } else {
      toast.success("Workspace deleted")
      router.push("/workspace")
    }
  }

  if (!workspace) return null

  return (
    <>
      <Sidebar workspaceSlug={workspaceSlug} />
      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-8">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-3xl font-bold mb-6">Workspace Settings</h1>
          
          <Tabs defaultValue="general">
            <TabsList>
              <TabsTrigger value="general">General</TabsTrigger>
              {canDelete && <TabsTrigger value="danger">Danger Zone</TabsTrigger>}
            </TabsList>
            
            <TabsContent value="general">
              <Card>
                <form onSubmit={handleUpdate}>
                  <CardHeader>
                    <CardTitle>General Settings</CardTitle>
                    <CardDescription>
                      Update your workspace name and settings
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Workspace Name</Label>
                      <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        disabled={!canUpdateSettings}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="slug">Workspace Slug</Label>
                      <Input
                        id="slug"
                        value={slug}
                        disabled
                        className="bg-muted"
                      />
                      <p className="text-sm text-muted-foreground">
                        The slug cannot be changed after creation.
                      </p>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button type="submit" disabled={isLoading || !canUpdateSettings}>
                      {isLoading ? "Saving..." : "Save Changes"}
                    </Button>
                  </CardFooter>
                </form>
              </Card>
            </TabsContent>
            
            {canDelete && (
              <TabsContent value="danger">
                <Card>
                  <CardHeader>
                    <CardTitle>Danger Zone</CardTitle>
                    <CardDescription>
                      Irreversible and destructive actions
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg border-destructive/50">
                      <div>
                        <h4 className="font-medium">Delete Workspace</h4>
                        <p className="text-sm text-muted-foreground">
                          Permanently delete this workspace and all its data
                        </p>
                      </div>
                      <Button
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={isDeleting}
                      >
                        {isDeleting ? "Deleting..." : "Delete Workspace"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>
        </div>
      </main>
    </>
  )
}
