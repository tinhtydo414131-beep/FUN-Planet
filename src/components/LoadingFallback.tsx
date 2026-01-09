import { Loader2 } from "lucide-react";

export const LoadingFallback = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20">
      <div className="flex flex-col items-center gap-4 animate-fade-in">
        <div className="animate-spin">
          <Loader2 className="w-8 h-8 text-primary" />
        </div>
        <p className="text-sm text-muted-foreground">
          Đang tải...
        </p>
      </div>
    </div>
  );
};
