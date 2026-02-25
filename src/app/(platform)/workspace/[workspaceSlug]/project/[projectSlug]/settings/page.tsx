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
import { Sidebar } from "@/components/layout/sidebar"
import { toast } from "sonner"

export default function ProjectSettingsPage() {
  const params = useParams()
  const router = useRouter()
  const workspaceSlug = params.workspaceSlug as string
  const projectSlug = params.projectSlug as string
  const supabase = createClient()
  
  const [project, setProject] = useState<any>(null)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    const fetchProject = async () => {
      const { data: workspace } = await supabase
        .from("workspaces")
        .select("id")
        .eq("slug", workspaceSlug)
        .single()

      if (workspace) {
        const { data } = await supabase
          .from("projects")
          .select("*")
          .eq("workspace_id", workspace.id)
          .eq("slug", projectSlug)
          .single()
        
        if (data) {
          setProject(data)
          setName(data.name)
          setDescription(data.description || "")
        }
      }
    }
    fetchProject()
  }, [workspaceSlug, projectSlug, supabase])

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    const { data: workspace } = await supabase
      .from("workspaces")
      .select("id")
      .eq("slug", workspaceSlug)
      .single()

    const { error } = await supabase
      .from("projects")
      .update({ name, description })
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
    if (!confirm("Are you sure you want to delete this project?")) return
    
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
              <TabsTrigger value="danger">Danger Zone</TabsTrigger>
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
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={4}
                      />
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? "Saving..." : "Save Changes"}
                    </Button>
                  </CardFooter>
                </form>
              </Card>
            </TabsContent>
            
            <TabsContent value="danger">
              <Card>
                <CardHeader>
                  <CardTitle>Danger Zone</CardTitle>
                  <CardDescription>
                    Irreversible actions for this project
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={isDeleting}
                  >
                    {isDeleting ? "Deleting..." : "Delete Project"}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </>
  )
}
