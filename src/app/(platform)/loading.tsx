import { Skeleton } from "@/components/ui/skeleton"

export default function PlatformLoading() {
  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <Skeleton className="h-9 w-48 max-w-md" />
      <Skeleton className="h-4 w-full max-w-lg" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-32 rounded-xl" />
      </div>
    </div>
  )
}
