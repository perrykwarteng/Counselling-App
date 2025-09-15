"use client";

import Image from "next/image";
import Link from "next/link";
import Logo from "../../../../public/icons/Clogo.png";
import Slider from "@/components/slider/page";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/Context/AuthProvider";
import { useRouter } from "next/navigation";

type Step = "request" | "code";

export default function ForgotPage() {
  const { forgotPassword } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState("");
  const [step, setStep] = useState<Step>("request");

  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const [otp, setOtp] = useState<string[]>(Array(6).fill(""));

  useEffect(() => {
    if (step === "code") inputRefs.current[0]?.focus();
  }, [step]);

  const handleEmailSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (loading) return;

    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      setLocalError("Please enter a valid email address.");
      return;
    }
    setLocalError("");
    setLoading(true);

    await forgotPassword({ email });
    setLoading(false);
    setStep("code");
  };

  const onOtpChange = (e: React.ChangeEvent<HTMLInputElement>, idx: number) => {
    const v = e.target.value;
    if (!/^\d?$/.test(v)) return;

    const next = [...otp];
    next[idx] = v;
    setOtp(next);
    if (v && idx < 5) inputRefs.current[idx + 1]?.focus();
  };

  const onOtpKey = (e: React.KeyboardEvent<HTMLInputElement>, idx: number) => {
    if (e.key === "Backspace" && !otp[idx] && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && idx > 0) inputRefs.current[idx - 1]?.focus();
    if (e.key === "ArrowRight" && idx < 5) inputRefs.current[idx + 1]?.focus();
  };

  const onPaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!text) return;
    const next = Array(6)
      .fill("")
      .map((_, i) => text[i] ?? "");
    setOtp(next);
    const last = Math.min(text.length, 6) - 1;
    inputRefs.current[Math.max(0, last)]?.focus();
    e.preventDefault();
  };

  const continueToReset = () => {
    const code = otp.join("");
    if (code.length !== 6) {
      setLocalError("Enter the 6-digit code sent to your email.");
      return;
    }
    setLocalError("");
    router.replace(
      `/auth/resetPassword?email=${encodeURIComponent(
        email
      )}&code=${encodeURIComponent(code)}`
    );
  };

  const resendCode = async () => {
    if (!email) return;
    setLoading(true);
    await forgotPassword({ email });
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen font-sans">
      <Slider />

      <div className="w-full md:w-1/2 bg-white p-12 flex flex-col justify-center">
        <div
          className="max-w-md mx-auto w-full space-y-4"
          onPaste={step === "code" ? onPaste : undefined}
        >
          <div className="flex justify-center">
            <Image src={Logo} alt="logo" width={150} height={150} priority />
          </div>

          <h2 className="text-2xl font-semibold text-center text-[#080e29]">
            Forgot Password
          </h2>
          <p className="text-center text-[#131b62] text-sm">
            {step === "request"
              ? "Enter your email to receive a reset code."
              : `We sent a 6-digit code to ${email}. Paste or type it below.`}
          </p>

          {localError ? (
            <div className="text-sm text-red-600 text-center">{localError}</div>
          ) : null}

          {/* request code */}
          {step === "request" && (
            <form className="space-y-4" onSubmit={handleEmailSubmit} noValidate>
              <div>
                <label htmlFor="email" className="block text-sm mb-1">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="johndoe@atu.edu.gh"
                  className="w-full border border-gray-300 px-4 py-2 rounded-md"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
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
                  "Send Reset Code →"
                )}
              </button>

              <div className="flex items-center justify-between text-sm">
                <div>
                  Remembered your password?{" "}
                  <Link href="/auth/login" className="text-[#3754ed] underline">
                    Sign In
                  </Link>
                </div>
                <div>
                  <Link
                    href="/auth/register"
                    className="text-[#3754ed] underline"
                  >
                    Create account
                  </Link>
                </div>
              </div>
            </form>
          )}

          {/* enter code */}
          {step === "code" && (
            <div className="space-y-4">
              <div className="flex justify-between gap-2">
                {otp.map((value, index) => (
                  <input
                    key={index}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={value}
                    ref={(el) => {
                      inputRefs.current[index] = el;
                    }}
                    onChange={(e) => onOtpChange(e, index)}
                    onKeyDown={(e) => onOtpKey(e, index)}
                    className="w-12 h-12 text-center text-xl border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#080e29]"
                  />
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={continueToReset}
                  className="w-full bg-gradient-to-r from-[#080e29] to-[#131b62] text-white py-2 rounded-md font-semibold"
                >
                  Continue to Reset →
                </button>
              </div>

              <div className="flex items-center justify-between text-sm">
                <button
                  type="button"
                  onClick={resendCode}
                  disabled={loading}
                  className="underline text-[#3754ed] disabled:opacity-70"
                >
                  Resend code
                </button>
                <Link href="/auth/login" className="text-[#3754ed] underline">
                  Back to Sign In
                </Link>
              </div>
            </div>
          )}

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
