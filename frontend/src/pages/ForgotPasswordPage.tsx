import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { BookOpen, Mail, Loader2, CheckCircle } from "lucide-react";
import { requestPasswordReset } from "@/api/auth";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const resetMutation = useMutation({
    mutationFn: requestPasswordReset,
    onSuccess: () => setSubmitted(true),
    onError: () => setError("Failed to send reset email. Please try again."),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    resetMutation.mutate(email);
  };

  if (submitted) {
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
            Check Your Email
          </h1>
          <p className="text-codex-brown/70 mb-6">
            If an account exists for <strong className="text-codex-ink">{email}</strong>,
            you'll receive a password reset link shortly.
          </p>
          <Link to="/login" className="btn-primary">
            Return to Sign In
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
            Reset Password
          </h1>
          <p className="text-codex-brown/70 mt-1">
            Enter your email to receive a reset link
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
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-codex-brown/50" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input pl-10"
                placeholder="you@example.com"
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
              "Send Reset Link"
            )}
          </button>
        </form>

        <p className="text-center text-codex-brown/70 mt-4">
          Remember your password?{" "}
          <Link
            to="/login"
            className="text-codex-dark hover:text-codex-olive font-medium"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
