import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import apiClient from "@/api/client";

export function VerifyEmailPage() {
  const { key } = useParams<{ key: string }>();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!key) {
      setStatus("error");
      setErrorMessage("Invalid verification link.");
      return;
    }

    const verifyEmail = async () => {
      try {
        await apiClient.post("/auth/registration/verify-email/", { key });
        setStatus("success");
      } catch (err: unknown) {
        setStatus("error");
        const axiosError = err as { response?: { data?: { detail?: string } } };
        setErrorMessage(
          axiosError?.response?.data?.detail ||
            "Failed to verify email. The link may have expired."
        );
      }
    };

    verifyEmail();
  }, [key]);

  if (status === "loading") {
    return (
      <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md text-center">
          <Loader2 className="w-12 h-12 animate-spin text-codex-olive mx-auto mb-4" />
          <h1 className="font-display text-2xl font-semibold text-codex-ink tracking-wide">
            Verifying Your Email
          </h1>
          <p className="text-codex-brown/70 mt-2">Please wait...</p>
        </div>
      </div>
    );
  }

  if (status === "success") {
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
            Email Verified!
          </h1>
          <p className="text-codex-brown/70 mb-6">
            Your email has been successfully verified. You can now sign in to your account.
          </p>
          <Link to="/login" className="btn-primary">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md text-center">
        <div
          className="w-16 h-16 bg-red-100 flex items-center justify-center mx-auto mb-6 border border-red-300"
          style={{ borderRadius: "2px" }}
        >
          <XCircle className="w-10 h-10 text-red-600" />
        </div>
        <h1 className="font-display text-2xl font-semibold text-codex-ink tracking-wide mb-2">
          Verification Failed
        </h1>
        <p className="text-codex-brown/70 mb-6">{errorMessage}</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/register" className="btn-primary">
            Register Again
          </Link>
          <Link to="/login" className="btn-ghost">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
