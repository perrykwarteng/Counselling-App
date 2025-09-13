"use client";

import Slider from "@/components/slider/page";
import Image from "next/image";
import Logo from "../../../../public/icons/Clogo.png";
import Link from "next/link";

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen font-sans">
      {/* Left Section */}
      <Slider />

      {/* Right Section */}
      <div className="w-1/2 bg-white p-12 flex flex-col justify-center">
        <div className="max-w-md mx-auto w-full space-y-1.5">
          <div className="flex justify-center">
            <Image src={Logo} alt="logo" width={150} height={150} />
          </div>
          <h2 className="text-2xl font-semibold text-center">
            Create your account
          </h2>
          <p className="text-center text-gray-500 text-sm">
            Sign up to access ATU Counseling Platform
          </p>

          {/* Registration form */}
          <form className="space-y-4">
            <div>
              <label className="block text-sm mb-1">Full Name</label>
              <input
                type="text"
                placeholder="e.g. John Doe"
                className="w-full border border-gray-300 px-4 py-2 rounded-md"
                required
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Email / Student or Staff ID</label>
              <input
                type="email"
                placeholder="e.g. john@atu.edu.gh or 01239764D"
                className="w-full border border-gray-300 px-4 py-2 rounded-md"
                required
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Password</label>
              <input
                type="password"
                placeholder="Minimum 8 characters"
                className="w-full border border-gray-300 px-4 py-2 rounded-md"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-[#080e29] to-[#131b62] text-white py-2 rounded-md font-semibold"
            >
              Create Account →
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
