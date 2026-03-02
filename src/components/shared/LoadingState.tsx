import { Loader2Icon } from "lucide-react";

interface LoadingStateProps {
  message?: string;
}

export function LoadingState({
  message = "読み込み中...",
}: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <Loader2Icon className="text-muted-foreground h-8 w-8 animate-spin" />
      <p className="text-muted-foreground mt-2 text-sm">{message}</p>
    </div>
  );
}
