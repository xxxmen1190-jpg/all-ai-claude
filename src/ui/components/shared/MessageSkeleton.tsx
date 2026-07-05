export function MessageSkeleton() {
  return (
    <div className="flex gap-3 animate-pulse">
      <div className="w-8 h-8 rounded-full bg-muted flex-shrink-0" />
      <div className="flex-1 max-w-[78%] space-y-2">
        <div className="h-3 w-20 bg-muted rounded" />
        <div className="bg-card border border-border rounded-2xl rounded-tl-sm p-3 space-y-2">
          <div className="h-3 bg-muted rounded w-3/4" />
          <div className="h-3 bg-muted rounded w-1/2" />
        </div>
      </div>
    </div>
  )
}
