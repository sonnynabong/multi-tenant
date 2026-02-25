"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  Building2, 
  Users, 
  FolderKanban, 
  Shield, 
  Zap,
  CheckCircle2,
  ArrowRight,
  Github,
  Twitter
} from "lucide-react"

export default function LandingPage() {
  const features = [
    {
      icon: Building2,
      title: "Multi-Workspace",
      description: "Create and manage multiple workspaces for different teams or organizations."
    },
    {
      icon: Users,
      title: "Role-Based Access",
      description: "Granular permissions with owner, admin, manager, and member roles."
    },
    {
      icon: FolderKanban,
      title: "Project Management",
      description: "Organize work into projects with custom settings and member access."
    },
    {
      icon: Shield,
      title: "Row-Level Security",
      description: "Enterprise-grade security with PostgreSQL RLS policies."
    },
    {
      icon: Zap,
      title: "Real-time Updates",
      description: "Live data synchronization across all connected clients."
    },
    {
      icon: CheckCircle2,
      title: "Audit Logging",
      description: "Complete activity tracking for compliance and monitoring."
    }
  ]

  const workspaceRoles = [
    { role: "Owner", desc: "Full control & billing access" },
    { role: "Admin", desc: "Manage members & settings" },
    { role: "Manager", desc: "Create projects & invite" },
    { role: "Member", desc: "Access assigned projects" },
    { role: "Viewer", desc: "Read-only access" },
  ]

  return (
    <div className="flex min-h-screen flex-col">
      {/* Navigation */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-14 items-center justify-between">
            <Link href="/" className="flex items-center gap-2 font-bold text-xl">
              <Building2 className="h-6 w-6 text-primary" />
              <span>TenantHub</span>
            </Link>
            
            <nav className="hidden md:flex items-center gap-6">
              <Link href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Features
              </Link>
              <Link href="#roles" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Roles
              </Link>
              <Separator orientation="vertical" className="h-4" />
              <Link href="/login">
                <Button variant="ghost" size="sm">Sign In</Button>
              </Link>
              <Link href="/signup">
                <Button size="sm">Get Started</Button>
              </Link>
            </nav>
            
            {/* Mobile nav */}
            <div className="flex items-center gap-2 md:hidden">
              <Link href="/login">
                <Button variant="ghost" size="sm">Sign In</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 md:py-32">
            <div className="flex flex-col items-center text-center">
              <Badge variant="secondary" className="mb-4">
                ✨ Built with Next.js + Supabase
              </Badge>
              
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight max-w-3xl">
                Multi-Tenant SaaS Platform{" "}
                <span className="text-primary">Made Simple</span>
              </h1>
              
              <p className="mt-6 text-xl text-muted-foreground max-w-2xl">
                A production-ready multi-tenant application with role-based access control, 
                workspace management, and real-time collaboration.
              </p>
              
              <div className="mt-10 flex flex-col sm:flex-row gap-4">
                <Link href="/signup">
                  <Button size="lg" className="gap-2">
                    Get Started Free
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/login">
                  <Button size="lg" variant="outline">
                    Sign In
                  </Button>
                </Link>
              </div>

              {/* Stats */}
              <div className="mt-16 pt-16 border-t w-full max-w-lg grid grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="text-3xl font-bold">3</div>
                  <div className="text-sm text-muted-foreground">Hierarchy Levels</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold">11</div>
                  <div className="text-sm text-muted-foreground">Role Types</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold">100%</div>
                  <div className="text-sm text-muted-foreground">TypeScript</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 bg-muted/50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">Everything You Need</h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Built-in features for modern SaaS applications. 
                Focus on your product, not the infrastructure.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, i) => (
                <Card key={i} className="border-0 shadow-sm bg-background">
                  <CardContent className="pt-6">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Hierarchy Section */}
        <section id="roles" className="py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">Three-Tier Hierarchy</h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Flexible permission system from platform to project level
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {/* Super Admin */}
              <Card className="relative overflow-hidden border-primary/20">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-primary/50" />
                <CardContent className="pt-6">
                  <Badge className="mb-4">Platform Level</Badge>
                  <h3 className="font-bold text-xl mb-2">Super Admin</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    God-mode access to manage all workspaces, users, and platform settings.
                  </p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      Manage all workspaces
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      View audit logs
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      Platform analytics
                    </li>
                  </ul>
                </CardContent>
              </Card>

              {/* Workspace */}
              <Card className="relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-blue-300" />
                <CardContent className="pt-6">
                  <Badge variant="secondary" className="mb-4">Organization Level</Badge>
                  <h3 className="font-bold text-xl mb-2">Workspace</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Tenant boundary with members, billing, and project management.
                  </p>
                  <div className="space-y-2">
                    {workspaceRoles.slice(0, 3).map((r) => (
                      <div key={r.role} className="flex items-center justify-between text-sm p-2 rounded bg-muted">
                        <span className="font-medium">{r.role}</span>
                        <span className="text-xs text-muted-foreground">{r.desc}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Project */}
              <Card className="relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 to-green-300" />
                <CardContent className="pt-6">
                  <Badge variant="outline" className="mb-4">Work Unit Level</Badge>
                  <h3 className="font-bold text-xl mb-2">Project</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Scoped work units with their own members and settings.
                  </p>
                  <div className="space-y-2">
                    {["Owner", "Admin", "Editor", "Viewer"].map((role) => (
                      <div key={role} className="flex items-center gap-2 text-sm p-2 rounded bg-muted">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <span className="font-medium">{role}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-muted/50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
              <p className="text-muted-foreground mb-8">
                Build your multi-tenant SaaS application with a solid foundation.
                Fully open source and ready to customize.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/signup">
                  <Button size="lg" className="gap-2">
                    Create Free Account
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="https://github.com" target="_blank">
                  <Button size="lg" variant="outline" className="gap-2">
                    <Github className="h-4 w-4" />
                    View on GitHub
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              <span className="font-semibold">TenantHub</span>
            </div>
            
            <p className="text-sm text-muted-foreground">
              Built with Next.js, Supabase, and shadcn/ui
            </p>
            
            <div className="flex items-center gap-4">
              <Link href="https://twitter.com" target="_blank" className="text-muted-foreground hover:text-foreground">
                <Twitter className="h-5 w-5" />
              </Link>
              <Link href="https://github.com" target="_blank" className="text-muted-foreground hover:text-foreground">
                <Github className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
