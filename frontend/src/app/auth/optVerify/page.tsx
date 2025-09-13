"use client";

import Slider from "@/components/slider/page";
import Image from "next/image";
import { useRef, useState, FormEvent, KeyboardEvent, ChangeEvent } from "react";
import Logo from "../../../../public/icons/Clogo.png";

export default function VerifyPage() {
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const [otp, setOtp] = useState<string[]>(new Array(6).fill(""));

  const handleChange = (e: ChangeEvent<HTMLInputElement>, index: number) => {
    const value = e.target.value;

    if (!/^\d?$/.test(value)) return;

    const updatedOtp = [...otp];
    updatedOtp[index] = value;
    setOtp(updatedOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const code = otp.join("");
    console.log("Entered code:", code);
    // Add verification logic here
  };

  return (
    <div className="flex min-h-screen font-sans">
      {/* Left Section */}
      <Slider />

      {/* Right Section */}

      <div className="w-1/2 bg-white p-12 flex flex-col justify-center">
        <div className="max-w-md mx-auto w-full space-y-6">
          <div className="flex justify-center">
            <Image src={Logo} alt="logo" width={150} height={150} />
          </div>
          <h2 className="text-2xl font-semibold text-center text-[#080e29]">
            Enter Verification Code
          </h2>

          <form onSubmit={handleSubmit}>
            <div className="flex justify-between gap-2 mb-6">
              {otp.map((value, index) => {
                if (!inputRefs.current[index]) {
                  inputRefs.current[index] = null;
                }

                return (
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
                );
              })}
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-[#080e29] to-[#131b62] text-white py-2 rounded-md font-semibold"
            >
              Verify Code
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
