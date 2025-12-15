import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { BookOpen, Lock, Loader2, CheckCircle } from "lucide-react";
import { confirmPasswordReset } from "@/api/auth";

export function ResetPasswordPage() {
  const { uid, token } = useParams<{ uid: string; token: string }>();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const resetMutation = useMutation({
    mutationFn: () => confirmPasswordReset(uid!, token!, password, confirmPassword),
    onSuccess: () => setSuccess(true),
    onError: (err: unknown) => {
      const axiosError = err as { response?: { data?: Record<string, string[]> } };
      const data = axiosError?.response?.data;
      if (data) {
        const firstKey = Object.keys(data)[0];
        const messages = data[firstKey];
        setError(Array.isArray(messages) ? messages[0] : String(messages));
      } else {
        setError("Failed to reset password. The link may have expired.");
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    resetMutation.mutate();
  };

  if (success) {
    return (
      <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md text-center">
          <div
            className="w-16 h-16 bg-codex-olive/20 flex items-center justify-center mx-auto mb-6 border border-codex-olive"
            style={{ borderRadius: "2px" }}
          >
            <CheckCircle className="w-10 h-10 text-codex-olive" />
          </div>
          <h1 className="font-display text-2xl font-semibold text-codex-ink tracking-wide mb-2">
            Password Reset Complete
          </h1>
          <p className="text-codex-brown/70 mb-6">
            Your password has been successfully reset.
          </p>
          <button onClick={() => navigate("/login")} className="btn-primary">
            Sign In
          </button>
        </div>
      </div>
    );
  }

  if (!uid || !token) {
    return (
      <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md text-center">
          <BookOpen className="w-12 h-12 text-codex-brown/40 mx-auto mb-4" />
          <h1 className="font-display text-2xl font-semibold text-codex-ink tracking-wide mb-2">
            Invalid Reset Link
          </h1>
          <p className="text-codex-brown/70 mb-6">
            This password reset link is invalid or has expired.
          </p>
          <Link to="/forgot-password" className="btn-primary">
            Request New Link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div
            className="w-12 h-12 bg-codex-dark flex items-center justify-center mx-auto mb-4 border border-codex-ink"
            style={{ borderRadius: "2px" }}
          >
            <BookOpen className="w-7 h-7 text-codex-tan" />
          </div>
          <h1 className="font-display text-2xl font-semibold text-codex-ink tracking-wide">
            Set New Password
          </h1>
          <p className="text-codex-brown/70 mt-1">
            Enter your new password below
          </p>
        </div>

        <form onSubmit={handleSubmit} className="card p-6 space-y-4">
          {error && (
            <div
              className="bg-red-900/10 text-red-900 px-4 py-2 text-sm border border-red-900/20"
              style={{ borderRadius: "2px" }}
            >
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-codex-brown mb-1">
              New Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-codex-brown/50" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input pl-10"
                placeholder="••••••••"
                required
                minLength={8}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-codex-brown mb-1">
              Confirm New Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-codex-brown/50" />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input pl-10"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={resetMutation.isPending}
            className="btn-primary w-full"
          >
            {resetMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "Reset Password"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
