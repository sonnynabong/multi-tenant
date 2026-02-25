import Link from "next/link"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect("/workspace")
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="px-6 lg:px-8 h-14 flex items-center border-b">
        <Link href="/" className="font-bold text-xl">
          Multi-Tenant SaaS
        </Link>
        <nav className="ml-auto flex gap-4">
          <Button variant="ghost" asChild>
            <Link href="/login">Sign In</Link>
          </Button>
          <Button asChild>
            <Link href="/signup">Get Started</Link>
          </Button>
        </nav>
      </header>
      <main className="flex-1">
        <section className="py-24 px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl mb-6">
              Multi-Tenant SaaS Platform
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              A production-ready multi-tenant application built with Next.js, 
              Supabase, and shadcn/ui. Features role-based access control, 
              workspace management, and project collaboration.
            </p>
            <div className="flex justify-center gap-4">
              <Button size="lg" asChild>
                <Link href="/signup">Get Started</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/login">Sign In</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
