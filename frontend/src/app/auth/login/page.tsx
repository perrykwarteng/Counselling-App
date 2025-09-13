"use client";

import Image from "next/image";
import Link from "next/link";
import Logo from "../../../../public/icons/Clogo.png";
import Slider from "@/components/slider/page";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen font-sans">
      {/* Left Section */}
      <Slider />

      {/* Right Section */}
      <div className="w-1/2 bg-white p-12 flex flex-col justify-center">
        <div className="max-w-md mx-auto w-full space-y-4">
          <div className="flex justify-center">
            <Image src={Logo} alt="logo" width={150} height={150} />
          </div>
          <h2 className="text-2xl font-semibold text-center text-[#080e29]">
            Welcome back to CounselATU!
          </h2>
          <p className="text-center text-[#131b62] text-sm">
            Please enter your details to sign in
          </p>

          <form className="space-y-4">
            <div>
              <label className="block text-sm mb-1">
                Email / Student or Staff ID
              </label>
              <input
                type="email"
                placeholder="john@atu.edu.gh or 01239764D"
                className="w-full border border-gray-300 px-4 py-2 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Password</label>
              <input
                type="password"
                placeholder="Minimum 8 characters"
                className="w-full border border-gray-300 px-4 py-2 rounded-md"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-[#080e29] to-[#131b62] text-white py-2 rounded-md font-semibold"
            >
              Sign In →
            </button>
            <div className="flex items-center justify-between">
              <div className="text-sm">
                Don’t have an account?{" "}
                <Link
                  href="/auth/register"
                  className="text-[#3754ed] underline"
                >
                  Sign Up
                </Link>
              </div>
              <div className="text-sm">
                <Link
                  href="/auth/forgetPassword"
                  className="text-[#3754ed] underline"
                >
                  Forgot password?
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
