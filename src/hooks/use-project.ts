"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type { Project, ProjectMember, Profile } from "@/types/database"

interface ProjectWithMembers extends Project {
  members: (ProjectMember & { profile: Profile })[]
}

export function useProject(projectId?: string) {
  const [project, setProject] = useState<ProjectWithMembers | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const supabase = createClient()

  useEffect(() => {
    if (!projectId) {
      setIsLoading(false)
      return
    }

    const fetchProject = async () => {
      try {
        const { data: project, error } = await supabase
          .from("projects")
          .select("*, members:project_members(*, profile:profiles(*))")
          .eq("id", projectId)
          .single()

        if (error) throw error
        setProject(project as ProjectWithMembers)
      } catch (err) {
        setError(err as Error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchProject()
  }, [projectId, supabase])

  return { project, isLoading, error }
}
