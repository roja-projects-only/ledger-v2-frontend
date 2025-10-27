/**
 * DebtErrorBoundary - Error boundary specifically for debt-related components
 * 
 * Provides graceful error handling for debt integration features with
 * user-friendly fallback UI and retry functionality.
 */

import { Component, type ErrorInfo, type ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw } from "lucide-react";

// ============================================================================
// Types
// ============================================================================

interface DebtErrorBoundaryProps {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
  onRetry?: () => void;
}

interface DebtErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

// ============================================================================
// Component
// ============================================================================

export class DebtErrorBoundary extends Component<
  DebtErrorBoundaryProps,
  DebtErrorBoundaryState
> {
  constructor(props: DebtErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): DebtErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Debt integration error:", error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
    this.props.onRetry?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <Card className="border-destructive/20 bg-destructive/5">
          <CardContent className="py-6">
            <div className="text-center">
              <AlertCircle className="h-8 w-8 mx-auto mb-3 text-destructive" />
              <h3 className="text-sm font-medium text-destructive mb-1">
                {this.props.fallbackTitle || "Debt Information Unavailable"}
              </h3>
              <p className="text-xs text-muted-foreground mb-4">
                {this.props.fallbackMessage || 
                  "Unable to load debt information. This may be due to a network issue or the debt service being temporarily unavailable."}
              </p>
              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={this.handleRetry}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="h-3 w-3" />
                  Try Again
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}