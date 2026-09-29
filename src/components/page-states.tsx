import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export function LoadingBlock() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-28 w-full" />
      <Skeleton className="h-28 w-full" />
    </div>
  );
}

export function ErrorBlock({ onRetry, message }: { onRetry?: () => void; message?: string }) {
  return (
    <div className="panel rounded-xl p-6 text-center">
      <p className="font-medium">{message ?? "We couldn't load this right now."}</p>
      <p className="mt-1 text-sm text-muted-foreground">Check your connection and try again.</p>
      {onRetry && (
        <Button className="mt-4" variant="outline" onClick={onRetry}>
          Retry
        </Button>
      )}
    </div>
  );
}

export function PageTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  const t = useT();
  return (
    <div className="mb-5">
      <h1 className="font-display text-2xl font-bold">{t(title)}</h1>
      {subtitle && <p className="mt-1 text-sm text-muted-foreground">{t(subtitle)}</p>}
    </div>
  );
}

export const SUBJECT_NAMES: Record<string, string> = {
  quant: "Quant",
  reasoning: "Reasoning",
  english: "English",
  banking: "Banking Awareness",
  ga: "General Awareness",
  other: "Other",
};
