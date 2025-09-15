"use client";

import Image from "next/image";
import Link from "next/link";
import Logo from "../../../../public/icons/Clogo.png";
import Slider from "@/components/slider/page";
import { useState } from "react";
import { useAuth } from "@/Context/AuthProvider";
import { useRouter, useSearchParams } from "next/navigation";

export default function ResetPasswordPage() {
  const { resetPassword } = useAuth();
  const router = useRouter();
  const sp = useSearchParams();

  const code = sp.get("code") || "";
  const email = sp.get("email") || "";
  const [new_password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (loading) return;

    if (!code && !email) {
      setLocalError(
        "Reset link is invalid or expired. Please request a new one."
      );
      return;
    }
    if (new_password.length < 8) {
      setLocalError("Password must be at least 8 characters.");
      return;
    }
    if (new_password !== confirm) {
      setLocalError("Passwords do not match.");
      return;
    }

    setLocalError("");
    setLoading(true);

    await resetPassword({ code, email, new_password });
    setLoading(false);
    router.replace("/auth/login");
  };

  return (
    <div className="flex min-h-screen font-sans">
      <Slider />

      <div className="w-full md:w-1/2 bg-white p-12 flex flex-col justify-center">
        <div className="max-w-md mx-auto w-full space-y-4">
          <div className="flex justify-center">
            <Image
              src={Logo}
              alt="CounselATU logo"
              width={150}
              height={150}
              priority
            />
          </div>

          <h2 className="text-2xl font-semibold text-center text-[#080e29]">
            Reset your password
          </h2>
          <p className="text-center text-[#131b62] text-sm">
            Enter a new password for your account
          </p>

          {localError ? (
            <div className="text-sm text-red-600 text-center">{localError}</div>
          ) : null}

          <form className="space-y-4" onSubmit={handleSubmit} noValidate>
            <div>
              <label htmlFor="password" className="block text-sm mb-1">
                New Password
              </label>
              <input
                id="password"
                type="password"
                placeholder="Minimum 8 characters"
                className="w-full border border-gray-300 px-4 py-2 rounded-md"
                value={new_password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
              />
            </div>

            <div>
              <label htmlFor="confirm" className="block text-sm mb-1">
                Confirm New Password
              </label>
              <input
                id="confirm"
                type="password"
                placeholder="Re-enter new password"
                className="w-full border border-gray-300 px-4 py-2 rounded-md"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#080e29] to-[#131b62] text-white py-2 rounded-md font-semibold flex justify-center items-center gap-2 disabled:opacity-70"
            >
              {loading ? (
                <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                "Reset Password →"
              )}
            </button>

            <div className="flex items-center justify-between text-sm">
              <div>
                Don’t have a link?{" "}
                <Link
                  href="/auth/forgot-password"
                  className="text-[#3754ed] underline"
                >
                  Request reset
                </Link>
              </div>
              <div>
                <Link href="/auth/login" className="text-[#3754ed] underline">
                  Back to Sign In
                </Link>
              </div>
            </div>
          </form>

          <div className="text-center text-xs text-gray-500 mt-8">
            © 2025 CounselATU •{" "}
            <a href="#" className="underline">
              Privacy Policy
            </a>{" "}
            •{" "}
            <a href="#" className="underline">
              Support
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
