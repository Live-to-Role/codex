import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { BookOpen, Mail, Lock, User, Loader2 } from "lucide-react";
import { register } from "@/api/auth";

export function RegisterPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const registerMutation = useMutation({
    mutationFn: register,
    onSuccess: () => navigate("/"),
    onError: (err: unknown) => {
      const axiosError = err as { response?: { data?: Record<string, string[]> } };
      const data = axiosError?.response?.data;
      if (data) {
        // Show first error message from response
        const firstKey = Object.keys(data)[0];
        const messages = data[firstKey];
        setError(Array.isArray(messages) ? messages[0] : String(messages));
      } else {
        setError("Registration failed. Please try again.");
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
    registerMutation.mutate({ email, username, password1: password, password2: confirmPassword });
  };

  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-codex-dark flex items-center justify-center mx-auto mb-4 border border-codex-ink" style={{ borderRadius: '2px' }}>
            <BookOpen className="w-7 h-7 text-codex-tan" />
          </div>
          <h1 className="font-display text-2xl font-semibold text-codex-ink tracking-wide">Join the Archives</h1>
          <p className="text-codex-brown/70 mt-1">Become a keeper of knowledge</p>
        </div>

        <form onSubmit={handleSubmit} className="card p-6 space-y-4">
          {error && <div className="bg-red-900/10 text-red-900 px-4 py-2 text-sm border border-red-900/20" style={{ borderRadius: '2px' }}>{error}</div>}

          <div>
            <label className="block text-sm font-medium text-codex-brown mb-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-codex-brown/50" />
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input pl-10" placeholder="you@example.com" required />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-codex-brown mb-1">Username</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-codex-brown/50" />
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="input pl-10" placeholder="username" required />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-codex-brown mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-codex-brown/50" />
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="input pl-10" placeholder="••••••••" required minLength={8} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-codex-brown mb-1">Confirm Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-codex-brown/50" />
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="input pl-10" placeholder="••••••••" required />
            </div>
          </div>

          <button type="submit" disabled={registerMutation.isPending} className="btn-primary w-full">
            {registerMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Begin Your Journey"}
          </button>
        </form>

        <p className="text-center text-codex-brown/70 mt-4">
          Already have an account? <Link to="/login" className="text-codex-dark hover:text-codex-olive font-medium">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
