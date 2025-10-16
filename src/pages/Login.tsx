/**
 * Login Page - User authentication
 * 
 * Features:
 * - Username input (case-insensitive)
 * - 6-digit OTP-style passcode input
 * - Form validation with client-side checks
 * - Loading states during authentication
 * - Error display for failed login attempts
 * - Responsive design for mobile and desktop
 * - Dark theme styling with shadcn blocks
 * - Auto-redirect after successful login
 * - No page refresh on error
 */

import { useState, useEffect, useRef } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { useAuth } from "@/lib/hooks/useAuth";
import { PASSCODE_LENGTH } from "@/lib/constants";
import { Loader2, Droplet } from "lucide-react";

export function Login() {
  const navigate = useNavigate();
  const { login, isAuthenticated, isLoggingIn, loginError } = useAuth();

  // Form state
  const [username, setUsername] = useState("");
  const [passcode, setPasscode] = useState("");
  const [clientError, setClientError] = useState<string | null>(null);
  
  // Ref for passcode input to refocus after error
  const passcodeRef = useRef<HTMLInputElement>(null);

  // Redirect if already authenticated (without login attempt) or after successful login
  useEffect(() => {
    // If already authenticated and not in the middle of login attempt, redirect immediately
    if (isAuthenticated && !isLoggingIn) {
      // Check if there's an intended destination stored
      const intendedPath = sessionStorage.getItem("intendedDestination");
      if (intendedPath) {
        sessionStorage.removeItem("intendedDestination");
        navigate(intendedPath, { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    }
  }, [isAuthenticated, isLoggingIn, navigate]);

  // Clear passcode on error and refocus
  useEffect(() => {
    if (loginError) {
      setPasscode("");
      // Refocus the passcode input after clearing for better UX
      setTimeout(() => {
        passcodeRef.current?.focus();
      }, 0);
    }
  }, [loginError]);

  /**
   * Validate form inputs
   */
  const validateForm = (): boolean => {
    if (!username.trim()) {
      setClientError("Username is required");
      return false;
    }

    if (!passcode.trim()) {
      setClientError("Passcode is required");
      return false;
    }

    if (passcode.length !== PASSCODE_LENGTH) {
      setClientError(`Passcode must be ${PASSCODE_LENGTH} digits`);
      return false;
    }

    setClientError(null);
    return true;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Clear previous errors
    setClientError(null);

    // Validate form
    if (!validateForm()) {
      return;
    }

    // Attempt login (username will be case-insensitive on backend)
    await login(username.trim(), passcode);

    // Navigation handled by useEffect above if successful
    // loginError state will be displayed in UI if failed
  };

  // Combined error display (client validation or server error)
  const displayError = clientError || loginError;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo and Title */}
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="h-12 w-12 rounded-full bg-sky-500/20 flex items-center justify-center">
              <Droplet className="h-6 w-6 text-sky-500" />
            </div>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            Water Refilling Ledger
          </h1>
          <p className="text-sm text-muted-foreground">
            Sign in to manage your sales
          </p>
        </div>

        {/* Login Card */}
        <Card>
          <CardHeader>
            <CardTitle>Welcome back</CardTitle>
            <CardDescription>
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Username Input */}
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isLoggingIn}
                  autoComplete="username"
                  autoFocus
                  className="h-11"
                />
                <p className="text-xs text-muted-foreground">
                  Not case-sensitive
                </p>
              </div>

              {/* Passcode Input (OTP Style) */}
              <div className="space-y-2">
                <Label htmlFor="passcode">Passcode</Label>
                <div className="flex justify-center">
                  <InputOTP
                    ref={passcodeRef}
                    maxLength={PASSCODE_LENGTH}
                    value={passcode}
                    onChange={(value) => setPasscode(value)}
                    disabled={isLoggingIn}
                    pattern={REGEXP_ONLY_DIGITS}
                    autoFocus={!!loginError || !!clientError}
                  >
                    <InputOTPGroup>
                      {Array.from({ length: PASSCODE_LENGTH }).map((_, index) => (
                        <InputOTPSlot key={index} index={index} />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                <p className="text-xs text-center text-muted-foreground">
                  Enter your {PASSCODE_LENGTH}-digit passcode
                </p>
              </div>

              {/* Error Display */}
              {displayError && (
                <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3">
                  <p className="text-sm text-destructive text-center">
                    {displayError}
                  </p>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoggingIn || passcode.length !== PASSCODE_LENGTH}
                className="w-full h-11"
                size="lg"
              >
                {isLoggingIn ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Help Text */}
        <p className="text-center text-sm text-muted-foreground">
          Need help? Contact your administrator
        </p>
      </div>
    </div>
  );
}
