"use client";

import Slider from "@/components/slider/page";
import Image from "next/image";
import Logo from "../../../../public/icons/Clogo.png";
import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/Context/AuthProvider";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState(""); 
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);

    const userId = await register({ name, email, password });
    if (userId) {
      router.replace(`/auth/optVerify?uid=${encodeURIComponent(userId)}`);
      return;
    }

    setLoading(false);
  };

  return (
    <div className="flex min-h-screen font-sans">
      <Slider />

      <div className="w-full md:w-1/2 bg-white p-12 flex flex-col justify-center">
        <div className="max-w-md mx-auto w-full space-y-1.5">
          <div className="flex justify-center">
            <Image
              src={Logo}
              alt="CounselATU logo"
              width={150}
              height={150}
              priority
            />
          </div>

          <h2 className="text-2xl font-semibold text-center">
            Create your account
          </h2>
          <p className="text-center text-gray-500 text-sm">
            Sign up to access ATU Counseling Platform
          </p>

          <form className="space-y-4" onSubmit={onSubmit} noValidate>
            <div>
              <label htmlFor="name" className="block text-sm mb-1">
                Full Name
              </label>
              <input
                id="name"
                type="text"
                placeholder="e.g. John Doe"
                className="w-full border border-gray-300 px-4 py-2 rounded-md"
                required
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                placeholder="e.g. john@atu.edu.gh"
                className="w-full border border-gray-300 px-4 py-2 rounded-md"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                placeholder="Minimum 8 characters"
                className="w-full border border-gray-300 px-4 py-2 rounded-md"
                required
                minLength={8}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
                "Create Account →"
              )}
            </button>

            <div className="flex items-center justify-between">
              <div className="text-sm">
                Do you have an account?{" "}
                <Link href="/auth/login" className="text-[#3754ed] underline">
                  Sign In
                </Link>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
