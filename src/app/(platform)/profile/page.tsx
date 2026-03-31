"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import type { User } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/client"
import type { Database } from "@/types/database"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "sonner"
import { Upload } from "lucide-react"

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"]

export default function ProfilePage() {
  const router = useRouter()
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<ProfileRow | null>(null)
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push("/login")
      return
    }
    
    setUser(user)
    setEmail(user.email || "")

    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single()

    if (profileData) {
      setProfile(profileData as ProfileRow)
      setFullName(profileData.full_name || "")
      setAvatarUrl(profileData.avatar_url)
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    if (!user) return

    const { error } = await supabase
      .from("profiles")
      .update({ 
        full_name: fullName,
        updated_at: new Date().toISOString()
      })
      .eq("id", user.id)

    if (error) {
      toast.error(error.message)
    } else {
      toast.success("Profile updated")
    }
    setIsLoading(false)
  }

  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file")
      return
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("File size must be less than 2MB")
      return
    }

    setIsUploading(true)

    if (!user) return

    try {
      // Upload to Supabase Storage
      const fileExt = file.name.split(".").pop()
      const fileName = `${user.id}-${Date.now()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from("user-avatars")
        .upload(filePath, file)

      if (uploadError) {
        // If bucket doesn't exist, try without bucket
        if (uploadError.message.includes("bucket")) {
          // Just update with a data URL for demo
          const reader = new FileReader()
          reader.onloadend = async () => {
            const base64 = reader.result as string
            const { error: updateError } = await supabase
              .from("profiles")
              .update({ avatar_url: base64 })
              .eq("id", user.id)
            
            if (updateError) {
              toast.error(updateError.message)
            } else {
              setAvatarUrl(base64)
              toast.success("Avatar updated")
            }
          }
          reader.readAsDataURL(file)
          setIsUploading(false)
          return
        }
        throw uploadError
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("user-avatars")
        .getPublicUrl(filePath)

      // Update profile
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", user.id)

      if (updateError) throw updateError

      setAvatarUrl(publicUrl)
      toast.success("Avatar updated")
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Something went wrong")
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="flex-1 px-4 sm:px-6 lg:px-8 py-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-3xl font-bold mb-6">Your Profile</h1>
        
        <Card>
          <form onSubmit={handleUpdate}>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your personal information and avatar
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar */}
              <div className="flex items-center gap-6">
                <div 
                  className="relative cursor-pointer group"
                  onClick={handleAvatarClick}
                >
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={avatarUrl || ""} alt={fullName || ""} />
                    <AvatarFallback className="text-2xl">
                      {fullName?.charAt(0) || email?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                    <Upload className="h-6 w-6 text-white" />
                  </div>
                  {isUploading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                      <div className="h-6 w-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <div>
                  <h3 className="font-medium">Profile Picture</h3>
                  <p className="text-sm text-muted-foreground">
                    Click the avatar to upload a new image (max 2MB)
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="John Doe"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-sm text-muted-foreground">
                    Email cannot be changed. Contact support if you need to update it.
                  </p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => router.back()} type="button">
                Back
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Saving..." : "Save Changes"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}
