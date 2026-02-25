import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

export default async function AdminAuditLogPage() {
  const supabase = await createClient()

  const { data: logs } = await supabase
    .from("audit_logs")
    .select(`
      *,
      user:profiles(full_name),
      workspace:workspaces(name)
    `)
    .order("created_at", { ascending: false })
    .limit(100)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Audit Log</h1>
        <p className="text-muted-foreground">Track all platform activities</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activities</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Action</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Workspace</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs?.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    <Badge variant="outline">{log.action}</Badge>
                  </TableCell>
                  <TableCell>{log.user?.full_name || "System"}</TableCell>
                  <TableCell>{log.workspace?.name || "-"}</TableCell>
                  <TableCell>{log.target_type || "-"}</TableCell>
                  <TableCell>
                    {new Date(log.created_at!).toLocaleString()}
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
