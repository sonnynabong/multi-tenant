"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Sidebar } from "@/components/layout/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TrendingUp, Users, FolderKanban, Activity, Clock } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

interface AnalyticsData {
  totalProjects: number
  totalMembers: number
  activeProjects: number
  archivedProjects: number
  recentActivity: Array<{
    action: string
    user: string
    time: string
  }>
}

export default function AnalyticsPage() {
  const params = useParams()
  const workspaceSlug = params.workspaceSlug as string
  const supabase = createClient()
  
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [workspace, setWorkspace] = useState<any>(null)

  useEffect(() => {
    fetchAnalytics()
  }, [workspaceSlug])

  const fetchAnalytics = async () => {
    setIsLoading(true)
    
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

    // Get projects count
    const { count: totalProjects } = await supabase
      .from("projects")
      .select("*", { count: "exact", head: true })
      .eq("workspace_id", workspaceData.id)

    const { count: activeProjects } = await supabase
      .from("projects")
      .select("*", { count: "exact", head: true })
      .eq("workspace_id", workspaceData.id)
      .eq("is_archived", false)

    const { count: archivedProjects } = await supabase
      .from("projects")
      .select("*", { count: "exact", head: true })
      .eq("workspace_id", workspaceData.id)
      .eq("is_archived", true)

    // Get members count
    const { count: totalMembers } = await supabase
      .from("workspace_members")
      .select("*", { count: "exact", head: true })
      .eq("workspace_id", workspaceData.id)

    // Get recent activity from audit logs
    const { data: auditLogs } = await supabase
      .from("audit_logs")
      .select(`
        action,
        created_at,
        user:profiles(full_name)
      `)
      .eq("workspace_id", workspaceData.id)
      .order("created_at", { ascending: false })
      .limit(10)

    const recentActivity = auditLogs?.map(log => ({
      action: log.action,
      user: (log.user as any)?.full_name || "Unknown",
      time: formatTimeAgo(new Date(log.created_at || "")),
    })) || []

    // If no audit logs, generate some placeholder activity based on projects
    if (recentActivity.length === 0) {
      const { data: recentProjects } = await supabase
        .from("projects")
        .select(`
          name,
          created_at,
          created_by,
          creator:profiles!projects_created_by_fkey(full_name)
        `)
        .eq("workspace_id", workspaceData.id)
        .order("created_at", { ascending: false })
        .limit(5)

      recentProjects?.forEach(proj => {
        recentActivity.push({
          action: `Project "${proj.name}" created`,
          user: (proj as any).creator?.full_name || "Unknown",
          time: formatTimeAgo(new Date(proj.created_at || "")),
        })
      })
    }

    setAnalytics({
      totalProjects: totalProjects || 0,
      totalMembers: totalMembers || 0,
      activeProjects: activeProjects || 0,
      archivedProjects: archivedProjects || 0,
      recentActivity,
    })
    
    setIsLoading(false)
  }

  const formatTimeAgo = (date: Date): string => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (minutes < 1) return "just now"
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`
    if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`
    if (days < 30) return `${days} day${days > 1 ? "s" : ""} ago`
    return date.toLocaleDateString()
  }

  const stats = [
    {
      title: "Total Projects",
      value: analytics?.totalProjects || 0,
      icon: FolderKanban,
      trend: "up",
    },
    {
      title: "Active Projects",
      value: analytics?.activeProjects || 0,
      icon: Activity,
      trend: "up",
    },
    {
      title: "Total Members",
      value: analytics?.totalMembers || 0,
      icon: Users,
      trend: "up",
    },
  ]

  return (
    <>
      <Sidebar workspaceSlug={workspaceSlug} />
      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-8">
        <div className="mx-auto max-w-7xl">
          <h1 className="text-3xl font-bold mb-6">Analytics</h1>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-3 mb-8">
            {isLoading ? (
              <>
                <Skeleton className="h-32" />
                <Skeleton className="h-32" />
                <Skeleton className="h-32" />
              </>
            ) : (
              stats.map((stat) => (
                <Card key={stat.title}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      {stat.title}
                    </CardTitle>
                    <stat.icon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stat.value}</div>
                  </CardContent>
                </Card>
              ))
            )}
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
                  {isLoading ? (
                    <div className="space-y-4">
                      <Skeleton className="h-12" />
                      <Skeleton className="h-12" />
                      <Skeleton className="h-12" />
                    </div>
                  ) : analytics?.recentActivity && analytics.recentActivity.length > 0 ? (
                    <div className="space-y-4">
                      {analytics.recentActivity.map((item, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between border-b last:border-0 pb-4 last:pb-0"
                        >
                          <div className="flex items-center gap-3">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="font-medium">{item.action}</p>
                              <p className="text-sm text-muted-foreground">
                                by {item.user}
                              </p>
                            </div>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {item.time}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-8">
                      No recent activity to display
                    </p>
                  )}
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
                  {isLoading ? (
                    <Skeleton className="h-48" />
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-muted rounded-lg">
                          <p className="text-sm text-muted-foreground">Active Projects</p>
                          <p className="text-2xl font-bold">{analytics?.activeProjects || 0}</p>
                        </div>
                        <div className="p-4 bg-muted rounded-lg">
                          <p className="text-sm text-muted-foreground">Archived Projects</p>
                          <p className="text-2xl font-bold">{analytics?.archivedProjects || 0}</p>
                        </div>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary transition-all" 
                          style={{ 
                            width: analytics?.totalProjects 
                              ? `${(analytics.activeProjects / analytics.totalProjects) * 100}%` 
                              : "0%" 
                          }} 
                        />
                      </div>
                      <p className="text-sm text-muted-foreground text-center">
                        {analytics?.totalProjects 
                          ? `${Math.round((analytics.activeProjects / analytics.totalProjects) * 100)}% of projects are active`
                          : "No projects yet"
                        }
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="members">
              <Card>
                <CardHeader>
                  <CardTitle>Member Analytics</CardTitle>
                  <CardDescription>
                    Team member statistics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <Skeleton className="h-48" />
                  ) : (
                    <div className="space-y-4">
                      <div className="p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">Total Members</p>
                        <p className="text-2xl font-bold">{analytics?.totalMembers || 0}</p>
                      </div>
                      <p className="text-muted-foreground">
                        Detailed member analytics will be expanded in future updates.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </>
  )
}
