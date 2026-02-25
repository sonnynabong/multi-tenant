import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Building2 } from "lucide-react"

export default async function WorkspacesPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  // Query workspace memberships and join workspace data
  const { data: memberships } = await supabase
    .from("workspace_members")
    .select("role, workspace:workspaces(*)")
    .eq("user_id", user.id)

  // Extract workspaces from memberships
  const workspaces = memberships?.map(m => ({
    ...m.workspace,
    members: [{ role: m.role }]
  }))

  if (!workspaces || workspaces.length === 0) {
    redirect("/onboarding")
  }

  return (
    <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8 xl:px-12 py-12">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Workspaces</h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Select a workspace to continue
          </p>
        </div>
        <Button asChild size="lg" className="shrink-0">
          <Link href="/workspace/new">
            <Plus className="mr-2 h-5 w-5" />
            New Workspace
          </Link>
        </Button>
      </div>

      {/* Workspaces Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {workspaces?.map((workspace) => (
          <Card key={workspace.id} className="hover:border-primary/50 transition-all hover:shadow-md group">
            <Link href={`/workspace/${workspace.slug}`}>
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-xl group-hover:text-primary transition-colors">
                        {workspace.name}
                      </CardTitle>
                      <CardDescription className="mt-1 capitalize">
                        {workspace.members?.[0]?.role}
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium capitalize">
                    {workspace.plan}
                  </span>
                  <span>•</span>
                  <span>Click to open</span>
                </div>
              </CardContent>
            </Link>
          </Card>
        ))}
      </div>
    </div>
  )
}
