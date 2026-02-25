import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

export default async function AdminWorkspacesPage() {
  const supabase = await createClient()

  const { data: workspaces } = await supabase
    .from("workspaces")
    .select(`
      *,
      members:workspace_members(count),
      projects:projects(count)
    `)
    .order("created_at", { ascending: false })

  return (
    <div className="flex-1 flex flex-col space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Workspaces</h1>
        <p className="text-muted-foreground">Manage all workspaces on the platform</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Workspaces</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Members</TableHead>
                <TableHead>Projects</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {workspaces?.map((workspace) => (
                <TableRow key={workspace.id}>
                  <TableCell className="font-medium">
                    <Link
                      href={`/workspace/${workspace.slug}`}
                      className="hover:underline"
                    >
                      {workspace.name}
                    </Link>
                  </TableCell>
                  <TableCell>{workspace.slug}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="capitalize">
                      {workspace.plan}
                    </Badge>
                  </TableCell>
                  <TableCell>{workspace.members?.[0]?.count || 0}</TableCell>
                  <TableCell>{workspace.projects?.[0]?.count || 0}</TableCell>
                  <TableCell>
                    {new Date(workspace.created_at!).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
