import { Skeleton } from "@/components/ui/skeleton";

// Dashboard Page Skeleton
export const DashboardSkeleton = () => (
  <div className="min-h-screen flex flex-col">
    {/* Navbar Skeleton */}
    <div className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Skeleton className="h-8 w-32" />
        <div className="flex gap-4">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-20" />
        </div>
      </div>
    </div>
    
    <div className="container mx-auto px-4 py-8 flex-1">
      <div className="flex items-center justify-between mb-8">
        <div>
          <Skeleton className="h-10 w-64 mb-2" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-10 w-28" />
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-6 rounded-lg border bg-card">
            <div className="flex items-center justify-between mb-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-4" />
            </div>
            <Skeleton className="h-8 w-16 mb-1" />
            <Skeleton className="h-3 w-40" />
          </div>
        ))}
      </div>

      {/* Tabs */}
      <Skeleton className="h-10 w-80 mb-6" />
      
      {/* Model Cards */}
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-6 rounded-lg border bg-card">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-5 w-20" />
                </div>
                <Skeleton className="h-4 w-full max-w-lg" />
              </div>
              <Skeleton className="h-8 w-24" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-9 w-28" />
              <Skeleton className="h-9 w-36" />
              <Skeleton className="h-9 w-28" />
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* Footer Skeleton */}
    <div className="border-t py-6 mt-8">
      <div className="container mx-auto px-4">
        <Skeleton className="h-4 w-48 mx-auto" />
      </div>
    </div>
  </div>
);

// Datasets Page Skeleton
export const DatasetsSkeleton = () => (
  <div className="min-h-screen flex flex-col">
    {/* Navbar */}
    <div className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Skeleton className="h-8 w-32" />
        <div className="flex gap-4">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-20" />
        </div>
      </div>
    </div>

    {/* Hero Section */}
    <section className="gradient-primary py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <Skeleton className="h-16 w-16 mx-auto rounded-full bg-white/20" />
          <Skeleton className="h-12 w-64 mx-auto bg-white/20" />
          <Skeleton className="h-6 w-96 mx-auto bg-white/20" />
          <Skeleton className="h-12 w-48 mx-auto bg-white/20" />
        </div>
      </div>
    </section>

    {/* Search Section */}
    <section className="py-8 border-b">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row gap-4">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-44" />
        </div>
      </div>
    </section>

    {/* Dataset Grid */}
    <section className="py-12 flex-1">
      <div className="container mx-auto px-4">
        <Skeleton className="h-4 w-48 mb-6" />
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="rounded-lg border bg-card p-4">
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-24 mb-4" />
              <Skeleton className="h-16 w-full mb-4" />
              <div className="flex gap-2 mb-4">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-5 w-16" />
              </div>
              <div className="grid grid-cols-2 gap-2 mb-4">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-20" />
              </div>
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* Footer */}
    <div className="border-t py-6">
      <div className="container mx-auto px-4">
        <Skeleton className="h-4 w-48 mx-auto" />
      </div>
    </div>
  </div>
);

// Marketplace Page Skeleton
export const MarketplaceSkeleton = () => (
  <div className="min-h-screen flex flex-col">
    {/* Navbar */}
    <div className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Skeleton className="h-8 w-32" />
        <div className="flex gap-4">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-20" />
        </div>
      </div>
    </div>

    {/* Search Header */}
    <div className="border-b bg-muted/30">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-9 w-56" />
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-32" />
            <Skeleton className="h-9 w-24" />
          </div>
        </div>
        <Skeleton className="h-12 w-full" />
      </div>
    </div>

    <div className="container mx-auto px-4 py-8 flex-1">
      <div className="grid lg:grid-cols-4 gap-8">
        {/* Filters Sidebar */}
        <aside className="lg:col-span-1">
          <div className="sticky top-24 space-y-6 p-4 rounded-lg bg-card/50 border">
            <Skeleton className="h-6 w-20 mb-4" />
            <div className="space-y-4">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-6 w-full" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-10 w-full" />
            </div>
            <Skeleton className="h-10 w-full" />
          </div>
        </aside>

        {/* Models Grid */}
        <main className="lg:col-span-3">
          <Skeleton className="h-4 w-36 mb-6" />
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="rounded-lg border bg-card p-4">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-16 w-full mb-3" />
                <div className="flex gap-2 mb-3">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-16" />
                </div>
                <div className="flex justify-between items-center">
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-9 w-24" />
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>

    {/* Footer */}
    <div className="border-t py-6">
      <div className="container mx-auto px-4">
        <Skeleton className="h-4 w-48 mx-auto" />
      </div>
    </div>
  </div>
);

// Model Details Page Skeleton
export const ModelDetailsSkeleton = () => (
  <div className="min-h-screen flex flex-col">
    {/* Navbar */}
    <div className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Skeleton className="h-8 w-32" />
        <div className="flex gap-4">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-20" />
        </div>
      </div>
    </div>

    <div className="container mx-auto px-4 py-8 flex-1">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <Skeleton className="h-10 w-64" />
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-6 w-24" />
            </div>
            <Skeleton className="h-4 w-48" />
          </div>
          <div className="text-right">
            <Skeleton className="h-9 w-28 mb-1" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>

        <div className="flex gap-2 mb-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-6 w-16" />
          ))}
        </div>

        <div className="flex gap-3">
          <Skeleton className="h-12 w-48" />
          <Skeleton className="h-12 w-32" />
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          <div className="rounded-lg border bg-card p-6">
            <Skeleton className="h-6 w-28 mb-4" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-3/4" />
          </div>

          <div className="rounded-lg border bg-card p-6">
            <Skeleton className="h-10 w-64 mb-6" />
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex justify-between items-center p-3 bg-muted/50 rounded">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-5 w-48" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <aside className="space-y-6">
          <div className="rounded-lg border bg-card p-6">
            <Skeleton className="h-6 w-28 mb-4" />
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="h-5 w-5" />
                  <Skeleton className="h-5 w-32" />
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border bg-card p-6">
            <Skeleton className="h-6 w-24 mb-4" />
            <div className="flex gap-2">
              <Skeleton className="h-10 w-20" />
              <Skeleton className="h-10 w-20" />
            </div>
          </div>
        </aside>
      </div>
    </div>

    {/* Footer */}
    <div className="border-t py-6 mt-8">
      <div className="container mx-auto px-4">
        <Skeleton className="h-4 w-48 mx-auto" />
      </div>
    </div>
  </div>
);

// Profile Page Skeleton
export const ProfileSkeleton = () => (
  <div className="min-h-screen flex flex-col">
    {/* Navbar */}
    <div className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Skeleton className="h-8 w-32" />
        <div className="flex gap-4">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-20" />
        </div>
      </div>
    </div>

    <div className="container mx-auto px-4 py-8 flex-1">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <Skeleton className="h-10 w-40 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {/* Profile Card */}
          <div className="md:col-span-2 rounded-lg border bg-card p-6">
            <div className="flex items-center gap-2 mb-6">
              <Skeleton className="h-5 w-5" />
              <Skeleton className="h-6 w-40" />
            </div>
            <div className="flex items-center gap-4 mb-6">
              <Skeleton className="h-20 w-20 rounded-full" />
              <div>
                <Skeleton className="h-6 w-32 mb-2" />
                <Skeleton className="h-4 w-48" />
              </div>
            </div>
            <Skeleton className="h-px w-full mb-6" />
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-5 w-5" />
                  <div>
                    <Skeleton className="h-3 w-16 mb-1" />
                    <Skeleton className="h-5 w-32" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Stats Card */}
          <div className="rounded-lg border bg-card p-6">
            <Skeleton className="h-6 w-24 mb-4" />
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="text-center p-4 bg-muted/50 rounded-lg">
                  <Skeleton className="h-8 w-12 mx-auto mb-1" />
                  <Skeleton className="h-4 w-24 mx-auto" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Models Card */}
        <div className="rounded-lg border bg-card p-6 mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Skeleton className="h-5 w-5" />
            <Skeleton className="h-6 w-28" />
          </div>
          <Skeleton className="h-4 w-64 mb-4" />
          <Skeleton className="h-10 w-80 mb-4" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="flex-1">
                  <Skeleton className="h-5 w-32 mb-2" />
                  <Skeleton className="h-4 w-48 mb-1" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-9 w-28" />
                  <Skeleton className="h-9 w-16" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Wallet Card */}
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center gap-2 mb-2">
            <Skeleton className="h-5 w-5" />
            <Skeleton className="h-6 w-40" />
          </div>
          <Skeleton className="h-4 w-72 mb-4" />
          <Skeleton className="h-10 w-40" />
        </div>
      </div>
    </div>

    {/* Footer */}
    <div className="border-t py-6">
      <div className="container mx-auto px-4">
        <Skeleton className="h-4 w-48 mx-auto" />
      </div>
    </div>
  </div>
);

// Upload Page Skeleton
export const UploadSkeleton = () => (
  <div className="min-h-screen flex flex-col">
    {/* Navbar */}
    <div className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Skeleton className="h-8 w-32" />
        <div className="flex gap-4">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-20" />
        </div>
      </div>
    </div>

    <div className="container mx-auto px-4 py-8 flex-1">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <Skeleton className="h-10 w-48 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>

        <div className="rounded-lg border bg-card p-6 mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Skeleton className="h-5 w-5" />
            <Skeleton className="h-6 w-36" />
          </div>
          <Skeleton className="h-4 w-72 mb-6" />

          {/* File Upload Area */}
          <div className="border-2 border-dashed rounded-lg p-8 mb-6">
            <Skeleton className="h-12 w-12 mx-auto mb-4" />
            <Skeleton className="h-5 w-48 mx-auto mb-2" />
            <Skeleton className="h-4 w-64 mx-auto" />
          </div>

          {/* Form Fields */}
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div>
                <Skeleton className="h-4 w-16 mb-2" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
            <div>
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-24 w-full" />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Skeleton className="h-4 w-16 mb-2" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div>
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </div>
    </div>

    {/* Footer */}
    <div className="border-t py-6">
      <div className="container mx-auto px-4">
        <Skeleton className="h-4 w-48 mx-auto" />
      </div>
    </div>
  </div>
);

// UploadDataset Page Skeleton
export const UploadDatasetSkeleton = () => (
  <div className="min-h-screen flex flex-col">
    {/* Navbar */}
    <div className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Skeleton className="h-8 w-32" />
        <div className="flex gap-4">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-20" />
        </div>
      </div>
    </div>

    {/* Hero Section */}
    <section className="gradient-primary py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto text-center space-y-4">
          <Skeleton className="h-12 w-12 mx-auto rounded-full bg-white/20" />
          <Skeleton className="h-9 w-48 mx-auto bg-white/20" />
          <Skeleton className="h-5 w-72 mx-auto bg-white/20" />
        </div>
      </div>
    </section>

    {/* Form */}
    <section className="py-12 flex-1">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center gap-2 mb-2">
            <Skeleton className="h-5 w-5" />
            <Skeleton className="h-6 w-40" />
          </div>
          <Skeleton className="h-4 w-80 mb-6" />

          <div className="space-y-6">
            <div>
              <Skeleton className="h-4 w-28 mb-2" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div>
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-24 w-full" />
            </div>
            <div>
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div>
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div>
              <Skeleton className="h-4 w-12 mb-2" />
              <div className="flex gap-2">
                <Skeleton className="h-10 flex-1" />
                <Skeleton className="h-10 w-16" />
              </div>
            </div>
            <div>
              <Skeleton className="h-4 w-28 mb-2" />
              <div className="border-2 border-dashed rounded-lg p-6">
                <Skeleton className="h-10 w-10 mx-auto mb-2" />
                <Skeleton className="h-5 w-56 mx-auto mb-1" />
                <Skeleton className="h-4 w-44 mx-auto" />
              </div>
            </div>
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </div>
    </section>

    {/* Footer */}
    <div className="border-t py-6">
      <div className="container mx-auto px-4">
        <Skeleton className="h-4 w-48 mx-auto" />
      </div>
    </div>
  </div>
);

// Auth Pages Skeleton (SignIn / SignUp)
export const AuthSkeleton = () => (
  <div className="min-h-screen flex flex-col">
    {/* Navbar */}
    <div className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Skeleton className="h-8 w-32" />
        <div className="flex gap-4">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-20" />
        </div>
      </div>
    </div>

    <main className="flex-1 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-6xl flex flex-col md:flex-row items-center gap-8">
        <div className="w-full md:w-1/2 flex items-center justify-center h-[520px]">
          <div className="w-full max-w-md rounded-lg border bg-card p-6 h-full flex flex-col">
            <div className="space-y-1 mb-6">
              <Skeleton className="h-8 w-32 mx-auto" />
              <Skeleton className="h-4 w-64 mx-auto" />
            </div>
            <div className="flex-1 space-y-4">
              <div>
                <Skeleton className="h-4 w-16 mb-2" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div>
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-10 w-full" />
              </div>
              <Skeleton className="h-10 w-full" />
              <div className="flex items-center gap-4 py-4">
                <Skeleton className="h-px flex-1" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-px flex-1" />
              </div>
              <Skeleton className="h-10 w-full" />
            </div>
            <Skeleton className="h-4 w-48 mx-auto mt-4" />
          </div>
        </div>
        <div className="hidden md:block md:w-1/2 h-[520px]">
          <Skeleton className="w-full h-full rounded-lg" />
        </div>
      </div>
    </main>

    {/* Footer */}
    <div className="border-t py-6">
      <div className="container mx-auto px-4">
        <Skeleton className="h-4 w-48 mx-auto" />
      </div>
    </div>
  </div>
);

// Welcome Page Skeleton
export const WelcomeSkeleton = () => (
  <div className="min-h-screen bg-background relative overflow-x-hidden">
    {/* Hero Section */}
    <div className="min-h-screen flex flex-col items-center justify-center relative">
      <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/40 to-background/80" />
      
      <div className="relative z-10 text-center px-6 max-w-3xl mx-auto">
        <Skeleton className="h-20 w-48 mx-auto mb-6" />
        <Skeleton className="h-8 w-96 mx-auto mb-4" />
        <Skeleton className="h-5 w-80 mx-auto mb-12" />
        
        <div className="flex flex-col md:flex-row justify-center items-stretch gap-8 mb-12">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex flex-col items-center gap-2 p-6 rounded-xl backdrop-blur-md bg-white/10 border border-white/20 flex-1 min-h-[140px]">
              <Skeleton className="h-8 w-8 rounded-full bg-white/20" />
              <Skeleton className="h-5 w-24 bg-white/20" />
              <Skeleton className="h-4 w-32 bg-white/20" />
            </div>
          ))}
        </div>
        
        <Skeleton className="h-14 w-48 mx-auto" />
      </div>
      
      <div className="absolute bottom-12 flex flex-col items-center gap-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-6 w-6 rounded-full" />
      </div>
    </div>
  </div>
);
