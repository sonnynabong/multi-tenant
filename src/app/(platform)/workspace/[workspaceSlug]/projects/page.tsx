"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Sidebar } from "@/components/layout/sidebar"
import { Plus, FolderOpen } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import { logAction, AuditActions } from "@/lib/audit"
import { hasWorkspacePermission } from "@/lib/permissions"
import type { WorkspaceRole } from "@/lib/constants"
import { Skeleton } from "@/components/ui/skeleton"

interface Project {
  id: string
  name: string
  slug: string
  description: string | null
  is_archived: boolean | null
}

export default function ProjectsPage() {
  const params = useParams()
  const router = useRouter()
  const workspaceSlug = params.workspaceSlug as string
  const supabase = createClient()
  
  const [projects, setProjects] = useState<Project[]>([])
  const [workspace, setWorkspace] = useState<any>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [userRole, setUserRole] = useState<WorkspaceRole | null>(null)
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)

  useEffect(() => {
    fetchData()
  }, [workspaceSlug])

  const fetchData = async () => {
    setIsLoading(true)
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setIsLoading(false)
      return
    }

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

    if (!workspaceData) {
      setIsLoading(false)
      return
    }
    
    setWorkspace(workspaceData)

    // Get user's workspace role
    const { data: memberData } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", workspaceData.id)
      .eq("user_id", user.id)
      .single()

    setUserRole(memberData?.role || null)

    // Get projects
    fetchProjects(workspaceData.id)
  }

  const fetchProjects = async (workspaceId: string) => {
    const { data } = await supabase
      .from("projects")
      .select("*")
      .eq("workspace_id", workspaceId)
      .eq("is_archived", false)
      .order("created_at", { ascending: false })
    
    setProjects(data || [])
    setIsLoading(false)
  }

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
  }

  const canCreateProject = isSuperAdmin || 
    hasWorkspacePermission(userRole, "workspace.projects.create")

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!canCreateProject) {
      toast.error("You don't have permission to create projects")
      return
    }
    
    setIsCreating(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!workspace || !user) return

    const { data: project, error } = await supabase
      .from("projects")
      .insert({
        workspace_id: workspace.id,
        name,
        slug: generateSlug(name),
        description,
        created_by: user.id,
      })
      .select()
      .single()

    if (error) {
      toast.error(error.message)
    } else {
      toast.success("Project created")
      setName("")
      setDescription("")
      setIsOpen(false)
      fetchProjects(workspace.id)
      
      // Log the action
      await logAction({
        workspaceId: workspace.id,
        projectId: project?.id,
        action: AuditActions.PROJECT_CREATED,
        targetType: "project",
        targetId: project?.id,
        metadata: { name, description },
      })
    }
    setIsCreating(false)
  }

  return (
    <>
      <Sidebar workspaceSlug={workspaceSlug} />
      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold">Projects</h1>
              <p className="text-muted-foreground">Manage your workspace projects</p>
            </div>
            
            {canCreateProject && (
              <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    New Project
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <form onSubmit={handleCreate}>
                    <DialogHeader>
                      <DialogTitle>Create Project</DialogTitle>
                      <DialogDescription>
                        Create a new project in this workspace
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Project Name</Label>
                        <Input
                          id="name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          rows={3}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit" disabled={isCreating}>
                        {isCreating ? "Creating..." : "Create Project"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>

          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
            </div>
          ) : projects.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FolderOpen className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No projects yet</h3>
                <p className="text-muted-foreground text-center max-w-sm mb-4">
                  Get started by creating your first project in this workspace
                </p>
                {canCreateProject && (
                  <Button onClick={() => setIsOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Project
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {projects.map((project) => (
                <Link
                  key={project.id}
                  href={`/workspace/${workspaceSlug}/project/${project.slug}`}
                >
                  <Card className="hover:border-primary/50 transition-colors h-full">
                    <CardHeader>
                      <CardTitle>{project.name}</CardTitle>
                      {project.description && (
                        <CardDescription>{project.description}</CardDescription>
                      )}
                    </CardHeader>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  )
}
