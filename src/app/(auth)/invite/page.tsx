"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import Link from "next/link"
import { Skeleton } from "@/components/ui/skeleton"
import type { Database } from "@/types/database"

type InvitationPreview = Database["public"]["Functions"]["get_invitation_by_token"]["Returns"][number]

function AcceptInviteContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const supabase = createClient()

  const token = searchParams.get("token")

  const [invitation, setInvitation] = useState<InvitationPreview | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAccepting, setIsAccepting] = useState(false)
  const [isDeclining, setIsDeclining] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!token) {
      setError("Invalid invitation link")
      setIsLoading(false)
      return
    }

    const fetchInvitation = async () => {
      setIsLoading(true)

      const { data, error: rpcError } = await supabase.rpc("get_invitation_by_token", {
        invite_token: token,
      })

      const invitationData = data?.[0]

      if (rpcError || !invitationData) {
        setError("Invitation not found or has expired")
        setIsLoading(false)
        return
      }

      if (invitationData.expires_at && new Date(invitationData.expires_at) < new Date()) {
        setError("This invitation has expired")
        setIsLoading(false)
        return
      }

      if (invitationData.status !== "pending") {
        setError(`This invitation has already been ${invitationData.status}`)
        setIsLoading(false)
        return
      }

      setInvitation(invitationData)
      setIsLoading(false)
    }

    void fetchInvitation()
  }, [token, supabase])

  const handleAccept = async () => {
    if (!token) return
    setIsAccepting(true)

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push(`/login?redirect=${encodeURIComponent(`/invite?token=${token}`)}`)
      return
    }

    const { error: acceptError } = await supabase.rpc("accept_workspace_invitation", {
      invite_token: token,
    })

    if (acceptError) {
      toast.error(acceptError.message)
      setIsAccepting(false)
      return
    }

    setSuccess(true)
    toast.success("You have joined the workspace!")

    setTimeout(() => {
      if (invitation?.workspace_slug) {
        router.push(`/workspace/${invitation.workspace_slug}`)
      } else {
        router.push("/workspace")
      }
    }, 2000)

    setIsAccepting(false)
  }

  const handleDecline = async () => {
    if (!token) return
    if (!confirm("Are you sure you want to decline this invitation?")) return

    setIsDeclining(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push(`/login?redirect=${encodeURIComponent(`/invite?token=${token}`)}`)
      return
    }

    const { error: declineError } = await supabase.rpc("decline_workspace_invitation", {
      invite_token: token,
    })

    if (declineError) {
      toast.error(declineError.message)
    } else {
      toast.success("Invitation declined")
      setTimeout(() => {
        router.push("/workspace")
      }, 1500)
    }
    setIsDeclining(false)
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-24" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Invitation Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{error}</p>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link href="/workspace">Go to Workspaces</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-green-600">Success!</CardTitle>
            <CardDescription>
              You have successfully joined {invitation?.workspace_name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Redirecting you to the workspace...
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Workspace Invitation</CardTitle>
          <CardDescription>
            You have been invited to join a workspace
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">Workspace</p>
            <p className="text-lg font-semibold">{invitation?.workspace_name}</p>
          </div>
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">Role</p>
            <p className="text-lg font-semibold capitalize">{invitation?.role}</p>
          </div>
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">Invited Email</p>
            <p className="text-lg font-semibold">{invitation?.email}</p>
          </div>
        </CardContent>
        <CardFooter className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleDecline}
            disabled={isDeclining || isAccepting}
          >
            {isDeclining ? "Declining..." : "Decline"}
          </Button>
          <Button
            className="flex-1"
            onClick={handleAccept}
            disabled={isAccepting || isDeclining}
          >
            {isAccepting ? "Accepting..." : "Accept Invitation"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-24" />
          </CardContent>
        </Card>
      </div>
    }>
      <AcceptInviteContent />
    </Suspense>
  )
}
