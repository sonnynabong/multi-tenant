"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Sidebar } from "@/components/layout/sidebar"
import { toast } from "sonner"
import { hasProjectPermission, hasWorkspacePermission } from "@/lib/permissions"
import type { ProjectRole, WorkspaceRole } from "@/lib/constants"

export default function ProjectSettingsPage() {
  const params = useParams()
  const router = useRouter()
  const workspaceSlug = params.workspaceSlug as string
  const projectSlug = params.projectSlug as string
  const supabase = createClient()
  
  const [project, setProject] = useState<any>(null)
  const [workspace, setWorkspace] = useState<any>(null)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [isArchived, setIsArchived] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [projectRole, setProjectRole] = useState<ProjectRole | null>(null)
  const [workspaceRole, setWorkspaceRole] = useState<WorkspaceRole | null>(null)
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
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

      // Get workspace role
      const { data: wsMemberData } = await supabase
        .from("workspace_members")
        .select("role")
        .eq("workspace_id", workspaceData.id)
        .eq("user_id", user.id)
        .single()

      setWorkspaceRole(wsMemberData?.role || null)

      // Get project
      const { data: projectData } = await supabase
        .from("projects")
        .select("*")
        .eq("workspace_id", workspaceData.id)
        .eq("slug", projectSlug)
        .single()

      if (projectData) {
        setProject(projectData)
        setName(projectData.name)
        setDescription(projectData.description || "")
        setIsArchived(projectData.is_archived || false)

        // Get project role
        const { data: projMemberData } = await supabase
          .from("project_members")
          .select("role")
          .eq("project_id", projectData.id)
          .eq("user_id", user.id)
          .single()

        setProjectRole(projMemberData?.role || null)
      }
    }
    fetchData()
  }, [workspaceSlug, projectSlug, supabase])

  const canUpdateSettings = isSuperAdmin || 
    hasProjectPermission(projectRole, "project.settings") ||
    hasWorkspacePermission(workspaceRole, "workspace.settings")

  const canDelete = isSuperAdmin || 
    hasProjectPermission(projectRole, "project.delete") ||
    workspaceRole === "owner"

  const canArchive = canUpdateSettings

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canUpdateSettings) {
      toast.error("You don't have permission to update project settings")
      return
    }

    setIsLoading(true)

    const { data: workspace } = await supabase
      .from("workspaces")
      .select("id")
      .eq("slug", workspaceSlug)
      .single()

    const { error } = await supabase
      .from("projects")
      .update({ name, description, is_archived: isArchived })
      .eq("workspace_id", workspace!.id)
      .eq("slug", projectSlug)

    if (error) {
      toast.error(error.message)
    } else {
      toast.success("Project updated")
    }
    setIsLoading(false)
  }

  const handleDelete = async () => {
    if (!canDelete) {
      toast.error("You don't have permission to delete this project")
      return
    }

    if (!confirm("Are you sure you want to delete this project? This action cannot be undone.")) return
    
    setIsDeleting(true)
    const { data: workspace } = await supabase
      .from("workspaces")
      .select("id")
      .eq("slug", workspaceSlug)
      .single()

    const { error } = await supabase
      .from("projects")
      .delete()
      .eq("workspace_id", workspace!.id)
      .eq("slug", projectSlug)

    if (error) {
      toast.error(error.message)
      setIsDeleting(false)
    } else {
      toast.success("Project deleted")
      router.push(`/workspace/${workspaceSlug}/projects`)
    }
  }

  if (!project) return null

  return (
    <>
      <Sidebar workspaceSlug={workspaceSlug} projectSlug={projectSlug} />
      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-8">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-3xl font-bold mb-6">Project Settings</h1>
          
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
                      Update your project details
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Project Name</Label>
                      <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        disabled={!canUpdateSettings}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={4}
                        disabled={!canUpdateSettings}
                      />
                    </div>
                    {canArchive && (
                      <div className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <Label htmlFor="archive">Archive Project</Label>
                          <p className="text-sm text-muted-foreground">
                            Archived projects are read-only and hidden from active lists
                          </p>
                        </div>
                        <Switch
                          id="archive"
                          checked={isArchived}
                          onCheckedChange={setIsArchived}
                        />
                      </div>
                    )}
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
                      Irreversible actions for this project
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg border-destructive/50">
                      <div>
                        <h4 className="font-medium">Delete Project</h4>
                        <p className="text-sm text-muted-foreground">
                          Permanently delete this project and all its data
                        </p>
                      </div>
                      <Button
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={isDeleting}
                      >
                        {isDeleting ? "Deleting..." : "Delete Project"}
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
