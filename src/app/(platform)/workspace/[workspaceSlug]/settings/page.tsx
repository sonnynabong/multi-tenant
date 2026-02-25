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

export default function WorkspaceSettingsPage() {
  const params = useParams()
  const router = useRouter()
  const workspaceSlug = params.workspaceSlug as string
  const supabase = createClient()
  
  const [workspace, setWorkspace] = useState<any>(null)
  const [name, setName] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    const fetchWorkspace = async () => {
      const { data } = await supabase
        .from("workspaces")
        .select("*")
        .eq("slug", workspaceSlug)
        .single()
      
      if (data) {
        setWorkspace(data)
        setName(data.name)
      }
    }
    fetchWorkspace()
  }, [workspaceSlug, supabase])

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
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
              <TabsTrigger value="danger">Danger Zone</TabsTrigger>
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
                    Irreversible and destructive actions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={isDeleting}
                  >
                    {isDeleting ? "Deleting..." : "Delete Workspace"}
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
