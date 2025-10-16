import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AlertCircle, Home, ArrowLeft } from "lucide-react";

export function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="rounded-full bg-red-500/10 p-4 border border-red-500/20">
            <AlertCircle className="h-16 w-16 text-red-500" />
          </div>
        </div>

        {/* Error Code */}
        <div className="space-y-2">
          <h1 className="text-6xl font-bold text-slate-100">404</h1>
          <p className="text-xl font-semibold text-slate-300">Page Not Found</p>
        </div>

        {/* Message */}
        <p className="text-slate-400 text-sm">
          The page you're looking for doesn't exist or has been moved.
          Please check the URL or navigate back to safety.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
          <Button
            onClick={() => navigate(-1)}
            variant="outline"
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </Button>
          <Button
            onClick={() => navigate("/")}
            className="gap-2 bg-sky-500 hover:bg-sky-600"
          >
            <Home className="h-4 w-4" />
            Go Home
          </Button>
        </div>

        {/* Additional Info */}
        <div className="pt-6 border-t border-slate-700">
          <p className="text-xs text-slate-500">
            If you believe this is an error, please contact support.
          </p>
        </div>
      </div>
    </div>
  );
}
