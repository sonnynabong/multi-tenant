"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type { Workspace, WorkspaceMember, Profile } from "@/types/database"

interface WorkspaceWithMembers extends Workspace {
  members: (WorkspaceMember & { profile: Profile })[]
}

export function useWorkspace(workspaceId?: string) {
  const [workspace, setWorkspace] = useState<WorkspaceWithMembers | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const supabase = createClient()

  useEffect(() => {
    if (!workspaceId) {
      setIsLoading(false)
      return
    }

    const fetchWorkspace = async () => {
      try {
        const { data: workspace, error } = await supabase
          .from("workspaces")
          .select("*, members:workspace_members(*, profile:profiles(*))")
          .eq("id", workspaceId)
          .single()

        if (error) throw error
        setWorkspace(workspace as WorkspaceWithMembers)
      } catch (err) {
        setError(err as Error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchWorkspace()
  }, [workspaceId, supabase])

  return { workspace, isLoading, error }
}
