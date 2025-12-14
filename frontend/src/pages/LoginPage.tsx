import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { BookOpen, Mail, Lock, Loader2 } from "lucide-react";
import { login } from "@/api/auth";

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: () => navigate("/"),
    onError: () => setError("Invalid email or password"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    loginMutation.mutate({ email, password });
  };

  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-codex-dark flex items-center justify-center mx-auto mb-4 border border-codex-ink" style={{ borderRadius: '2px' }}>
            <BookOpen className="w-7 h-7 text-codex-tan" />
          </div>
          <h1 className="font-display text-2xl font-semibold text-codex-ink tracking-wide">Welcome Back</h1>
          <p className="text-codex-brown/70 mt-1">Sign in to access the archives</p>
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
            <label className="block text-sm font-medium text-codex-brown mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-codex-brown/50" />
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="input pl-10" placeholder="••••••••" required />
            </div>
          </div>

          <button type="submit" disabled={loginMutation.isPending} className="btn-primary w-full">
            {loginMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Enter the Archives"}
          </button>
        </form>

        <p className="text-center text-codex-brown/70 mt-4">
          Don't have an account? <Link to="/register" className="text-codex-dark hover:text-codex-olive font-medium">Sign up</Link>
        </p>
      </div>
    </div>
  );
}
