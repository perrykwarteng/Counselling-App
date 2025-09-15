"use client";

import Slider from "@/components/slider/page";
import Image from "next/image";
import Logo from "../../../../public/icons/Clogo.png";
import {
  useEffect,
  useRef,
  useState,
  FormEvent,
  KeyboardEvent,
  ChangeEvent,
  ClipboardEvent,
} from "react";
import { useAuth } from "@/Context/AuthProvider";
import { useRouter, useSearchParams } from "next/navigation";

export default function VerifyPage() {
  const { verifyOtp, logout } = useAuth();
  const router = useRouter();
  const sp = useSearchParams();

  const uid = sp.get("uid") || "";

  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (e: ChangeEvent<HTMLInputElement>, index: number) => {
    const value = e.target.value;
    if (!/^\d?$/.test(value)) return;

    const next = [...otp];
    next[index] = value;
    setOtp(next);

    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && index > 0)
      inputRefs.current[index - 1]?.focus();
    if (e.key === "ArrowRight" && index < 5)
      inputRefs.current[index + 1]?.focus();
  };

  const handlePaste = (e: ClipboardEvent<HTMLDivElement>) => {
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

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (loading || !uid) return;

    const code = otp.join("");
    if (code.length !== 6) return;

    setLoading(true);
    const user = await verifyOtp({ user_id: uid, code });

    if (user) {
      await logout();
      router.replace("/auth/login");
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen font-sans">
      <Slider />
      <div className="w-full md:w-1/2 bg-white p-12 flex flex-col justify-center">
        <div
          className="max-w-md mx-auto w-full space-y-6"
          onPaste={handlePaste}
        >
          <div className="flex justify-center">
            <Image src={Logo} alt="logo" width={150} height={150} priority />
          </div>
          <h2 className="text-2xl font-semibold text-center text-[#080e29]">
            Enter Verification Code
          </h2>
          <p className="text-center text-gray-600 text-sm">
            We sent a 6-digit code to your email. Paste or type it below.
          </p>

          <form onSubmit={handleSubmit} noValidate>
            <div className="flex justify-between gap-2 mb-6">
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
                  onChange={(e) => handleChange(e, index)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  className="w-12 h-12 text-center text-xl border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#080e29]"
                />
              ))}
            </div>

            <button
              type="submit"
              disabled={loading || !uid}
              className="w-full bg-gradient-to-r from-[#080e29] to-[#131b62] text-white py-2 rounded-md font-semibold disabled:opacity-70"
            >
              {loading ? "Verifying..." : "Verify Code"}
            </button>
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
