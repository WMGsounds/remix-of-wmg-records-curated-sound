// Shared loading / empty / error states — premium editorial styling.

export const PageLoading = ({ label = "Loading" }: { label?: string }) => (
  <div className="pt-40 pb-32">
    <div className="container-editorial">
      <p className="eyebrow text-muted-foreground animate-pulse">{label}…</p>
      <div className="mt-10 h-px w-24 bg-foreground/20" />
    </div>
  </div>
);

export const PageError = ({ message = "Something went wrong." }: { message?: string }) => (
  <div className="pt-40 pb-32">
    <div className="container-editorial max-w-2xl">
      <p className="eyebrow mb-4">Error</p>
      <h1 className="display-serif text-4xl md:text-5xl mb-6">We couldn't load this page.</h1>
      <p className="text-muted-foreground">{message}</p>
    </div>
  </div>
);

export const PageEmpty = ({
  title = "Nothing here yet.",
  description,
}: {
  title?: string;
  description?: string;
}) => (
  <div className="pt-40 pb-32">
    <div className="container-editorial max-w-2xl">
      <p className="eyebrow mb-4">Coming Soon</p>
      <h1 className="display-serif text-4xl md:text-5xl mb-6">{title}</h1>
      {description && <p className="text-muted-foreground">{description}</p>}
    </div>
  </div>
);

export const InlineSkeleton = ({ count = 4 }: { count?: number }) => (
  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-10">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="animate-pulse">
        <div className="aspect-square bg-muted" />
        <div className="h-4 bg-muted mt-5 w-3/4" />
        <div className="h-3 bg-muted mt-3 w-1/2" />
      </div>
    ))}
  </div>
);
