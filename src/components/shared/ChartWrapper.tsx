/**
 * ChartWrapper - Wrapper component for Recharts with loading and empty states
 * 
 * Features:
 * - Loading skeleton
 * - Empty state message
 * - Responsive container
 */

import { Component, type ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getSemanticColor } from "@/lib/colors";
import { cn } from "@/lib/utils";
import { BarChart3, AlertTriangle } from "lucide-react";

// ============================================================================
// Types
// ============================================================================

interface ChartWrapperProps {
  title: string;
  loading?: boolean;
  empty?: boolean;
  emptyMessage?: string;
  children: ReactNode;
  className?: string;
}

// ============================================================================
// Error Boundary
// ============================================================================

interface ChartErrorBoundaryProps {
  title: string;
  children: ReactNode;
}

interface ChartErrorBoundaryState {
  hasError: boolean;
}

class ChartErrorBoundary extends Component<
  ChartErrorBoundaryProps,
  ChartErrorBoundaryState
> {
  state: ChartErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ChartErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, info: unknown) {
    console.error("Chart rendering failed:", error, info);
  }

  private handleRetry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      const tone = getSemanticColor("error");
      return (
        <div
          role="alert"
          aria-live="polite"
          className={cn(
            "flex flex-col items-center justify-center gap-3 rounded-lg border p-6 text-center",
            tone.bg,
            tone.border,
            tone.text,
          )}
        >
          <AlertTriangle className={cn("h-10 w-10", tone.icon)} aria-hidden />
          <div className="space-y-1">
            <p className="text-sm font-medium">
              Unable to render {this.props.title}.
            </p>
            <p className={cn("text-xs", tone.subtext)}>
              Please try again or refresh the page.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={this.handleRetry}
            className="mt-2"
          >
            Retry
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

// ============================================================================
// Component
// ============================================================================

export function ChartWrapper({
  title,
  loading = false,
  empty = false,
  emptyMessage = "No data available",
  children,
  className,
}: ChartWrapperProps) {
  const infoTone = getSemanticColor("info");
  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-64 w-full" />
          </div>
        ) : empty ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <BarChart3 className={cn("h-12 w-12 mb-3", infoTone.icon)} />
            <p className={cn("text-sm", infoTone.text)}>{emptyMessage}</p>
          </div>
        ) : (
          <ChartErrorBoundary title={title}>
            <div className="w-full">{children}</div>
          </ChartErrorBoundary>
        )}
      </CardContent>
    </Card>
  );
}
