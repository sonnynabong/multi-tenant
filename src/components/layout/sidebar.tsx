"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  LayoutDashboard,
  Settings,
  Users,
  FolderKanban,
  BarChart3,
  FileText,
} from "lucide-react"

interface SidebarProps {
  workspaceSlug?: string
  projectSlug?: string
}

export function Sidebar({ workspaceSlug, projectSlug }: SidebarProps) {
  const pathname = usePathname()

  const workspaceLinks = [
    {
      href: `/workspace/${workspaceSlug}`,
      label: "Dashboard",
      icon: LayoutDashboard,
    },
    {
      href: `/workspace/${workspaceSlug}/projects`,
      label: "Projects",
      icon: FolderKanban,
    },
    {
      href: `/workspace/${workspaceSlug}/members`,
      label: "Members",
      icon: Users,
    },
    {
      href: `/workspace/${workspaceSlug}/analytics`,
      label: "Analytics",
      icon: BarChart3,
    },
    {
      href: `/workspace/${workspaceSlug}/settings`,
      label: "Settings",
      icon: Settings,
    },
  ]

  const projectLinks = projectSlug
    ? [
        {
          href: `/workspace/${workspaceSlug}/project/${projectSlug}`,
          label: "Overview",
          icon: LayoutDashboard,
        },
        {
          href: `/workspace/${workspaceSlug}/project/${projectSlug}/members`,
          label: "Members",
          icon: Users,
        },
        {
          href: `/workspace/${workspaceSlug}/project/${projectSlug}/settings`,
          label: "Settings",
          icon: Settings,
        },
      ]
    : []

  return (
    <TooltipProvider>
      <aside className="w-64 border-r bg-background">
        <ScrollArea className="h-full py-4">
          <div className="px-3 py-2">
            <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
              Workspace
            </h2>
            <div className="space-y-1">
              {workspaceLinks.map((link) => (
                <Tooltip key={link.href}>
                  <TooltipTrigger asChild>
                    <Button
                      variant={pathname === link.href ? "secondary" : "ghost"}
                      className={cn("w-full justify-start", {
                        "bg-secondary": pathname === link.href,
                      })}
                      asChild
                    >
                      <Link href={link.href}>
                        <link.icon className="mr-2 h-4 w-4" />
                        {link.label}
                      </Link>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">{link.label}</TooltipContent>
                </Tooltip>
              ))}
            </div>
          </div>
          {projectSlug && (
            <>
              <Separator className="my-4" />
              <div className="px-3 py-2">
                <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
                  Project
                </h2>
                <div className="space-y-1">
                  {projectLinks.map((link) => (
                    <Tooltip key={link.href}>
                      <TooltipTrigger asChild>
                        <Button
                          variant={pathname === link.href ? "secondary" : "ghost"}
                          className={cn("w-full justify-start", {
                            "bg-secondary": pathname === link.href,
                          })}
                          asChild
                        >
                          <Link href={link.href}>
                            <link.icon className="mr-2 h-4 w-4" />
                            {link.label}
                          </Link>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="right">{link.label}</TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              </div>
            </>
          )}
        </ScrollArea>
      </aside>
    </TooltipProvider>
  )
}
