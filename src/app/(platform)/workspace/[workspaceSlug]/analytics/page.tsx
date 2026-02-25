"use client"

import { useParams } from "next/navigation"
import { Sidebar } from "@/components/layout/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TrendingUp, Users, FolderKanban, Activity } from "lucide-react"

export default function AnalyticsPage() {
  const params = useParams()
  const workspaceSlug = params.workspaceSlug as string

  // Mock analytics data
  const stats = [
    {
      title: "Total Projects",
      value: "12",
      change: "+3 this month",
      icon: FolderKanban,
      trend: "up",
    },
    {
      title: "Total Members",
      value: "8",
      change: "+2 this month",
      icon: Users,
      trend: "up",
    },
    {
      title: "Workspace Activity",
      value: "94%",
      change: "+5% from last week",
      icon: Activity,
      trend: "up",
    },
  ]

  const recentActivity = [
    { action: "New project created", user: "John Doe", time: "2 hours ago" },
    { action: "Member invited", user: "Jane Smith", time: "5 hours ago" },
    { action: "Project updated", user: "Mike Johnson", time: "1 day ago" },
    { action: "Task completed", user: "Sarah Williams", time: "2 days ago" },
  ]

  return (
    <>
      <Sidebar workspaceSlug={workspaceSlug} />
      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-8">
        <div className="mx-auto max-w-7xl">
          <h1 className="text-3xl font-bold mb-6">Analytics</h1>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-3 mb-8">
            {stats.map((stat) => (
              <Card key={stat.title}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {stat.title}
                  </CardTitle>
                  <stat.icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <TrendingUp className="h-3 w-3 text-green-500" />
                    {stat.change}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Tabs */}
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="projects">Projects</TabsTrigger>
              <TabsTrigger value="members">Members</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>
                    Latest actions in your workspace
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentActivity.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between border-b last:border-0 pb-4 last:pb-0"
                      >
                        <div>
                          <p className="font-medium">{item.action}</p>
                          <p className="text-sm text-muted-foreground">
                            by {item.user}
                          </p>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {item.time}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Workspace Health</CardTitle>
                  <CardDescription>
                    Overall workspace performance metrics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Storage Usage</span>
                        <span className="text-sm text-muted-foreground">65%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary w-[65%]" />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">API Calls</span>
                        <span className="text-sm text-muted-foreground">42%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-green-500 w-[42%]" />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Active Sessions</span>
                        <span className="text-sm text-muted-foreground">78%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 w-[78%]" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="projects">
              <Card>
                <CardHeader>
                  <CardTitle>Project Analytics</CardTitle>
                  <CardDescription>
                    Detailed project metrics and statistics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Project-specific analytics will be displayed here.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="members">
              <Card>
                <CardHeader>
                  <CardTitle>Member Analytics</CardTitle>
                  <CardDescription>
                    Team member activity and contributions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Member-specific analytics will be displayed here.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </>
  )
}
