"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import Logo from "../../../public/icons/Clogo.png";

const COUNSELLING_QUOTES = [
  {
    text: "The curious paradox is that when I accept myself just as I am, then I can change.",
    author: "Carl Rogers",
  },
  {
    text: "Between stimulus and response there is a space. In that space is our power to choose our response.",
    author: "Viktor E. Frankl",
  },
  {
    text: "Owning our story and loving ourselves through that process is the bravest thing we’ll ever do.",
    author: "Brené Brown",
  },
  {
    text: "You are not a drop in the ocean. You are the entire ocean in a drop.",
    author: "Rumi",
  },
];

export default function LandingPage() {
  return (
    <main className="relative min-h-screen text-white overflow-x-clip">
      <div className="absolute inset-0 -z-10">
        <Image
          src="/images/HeroImg.jpg"
          alt="Farmer harvesting in a green field at sunrise"
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/45" />
        <div className="pointer-events-none absolute -top-24 -right-24 h-80 w-80 rounded-full bg-yellow-200/40 blur-3xl" />
      </div>

      <header className="relative z-20">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 pt-10">
          <div className="bg-white w-[100px]">
            <Image className="w-full" src={Logo} alt="Logo" />
          </div>

          <div className="hidden items-center gap-5 md:flex">
            <Link
              href="/auth/register"
              className="text-white/85 hover:text-white"
            >
              Get Started
            </Link>
            <Link
              href="/auth/login"
              className="rounded-full bg-gradient-to-r from-[#080e29] to-[#131b62] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
            >
              Login
            </Link>
          </div>

          <button className="md:hidden rounded-xl bg-white/10 p-2 backdrop-blur-sm">
            <span className="sr-only">Menu</span>
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden
            >
              <path
                d="M4 6h16M4 12h16M4 18h16"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      </header>

      <section className="relative z-10">
        <div className="mx-auto grid max-w-7xl gap-8 px-6 pb-20 pt-15 md:grid-cols-12 md:pb-28 md:pt-18">
          {/* Left */}
          <div className="md:col-span-7 lg:col-span-6">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-medium backdrop-blur-sm">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-gradient-to-r from-[#080e29] to-[#131b62]" />
              Student Mental Health Support
            </div>

            <h1 className="max-w-xl text-4xl font-semibold leading-tight md:text-5xl">
              Empowering Students Through Guidance and Emotional Support.
            </h1>

            <p className="mt-5 max-w-xl text-base text-white/85 md:text-lg">
              Our ounselling platform connects students with professional
              guidance, emotional support, and personalized wellness
              resources—anytime, anywhere. Your mental well-being matters.
            </p>

            <div className="mt-8 flex items-center gap-4">
              <Link
                href="#"
                className="group inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-[#080e29] to-[#131b62] px-5 py-3 font-semibold text-white"
              >
                Get Started
                <span className="grid h-8 w-8 place-items-center rounded-full bg-white text-[#080e29] group-hover:font-semibold">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden
                    className="transition-transform group-hover:translate-x-0.5"
                  >
                    <path
                      d="M5 12h14M13 5l7 7-7 7"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                  </svg>
                </span>
              </Link>
            </div>
          </div>

          <div className="md:col-span-5 lg:col-span-6">
            <QuoteCard />
          </div>
        </div>
      </section>
    </main>
  );
}

function QuoteCard() {
  const [index, setIndex] = useState(0);

  const next = () => setIndex((i) => (i + 1) % COUNSELLING_QUOTES.length);
  const prev = () =>
    setIndex(
      (i) => (i - 1 + COUNSELLING_QUOTES.length) % COUNSELLING_QUOTES.length
    );

  useEffect(() => {
    const id = setInterval(next, 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative mt-8 md:mt-0 md:flex md:justify-end">
      <div className="w-full max-w-sm rounded-2xl border border-white/15 bg-white/10 p-5 text-white backdrop-blur-md">
        <h3 className="mb-2 text-base font-semibold">Counselling Quotes</h3>

        <div className="overflow-hidden" aria-live="polite">
          <div
            className="flex transition-transform duration-700 ease-in-out"
            style={{ transform: `translateX(-${index * 100}%)` }}
          >
            {COUNSELLING_QUOTES.map((q, i) => (
              <div key={i} className="min-w-full pr-1">
                <p className="text-sm text-white/90">“{q.text}”</p>
                <p className="mt-3 text-xs font-semibold text-white/80">
                  — {q.author}
                </p>
              </div>
            ))}
          </div>
        </div>

        <Link
          href="#"
          className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-white/90"
        >
          Learn More
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden
          >
            <path
              d="M5 12h14M13 5l7 7-7 7"
              stroke="currentColor"
              strokeWidth="2"
            />
          </svg>
        </Link>
      </div>

      <div className="absolute right-0 top-1/2 hidden -translate-y-1/2 flex-col gap-2 md:flex">
        <button
          onClick={prev}
          aria-label="Previous quote"
          className="rounded-full bg-white/15 p-2 backdrop-blur-md"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden
          >
            <path d="M15 19l-7-7 7-7" stroke="white" strokeWidth="2" />
          </svg>
        </button>
        <button
          onClick={next}
          aria-label="Next quote"
          className="rounded-full bg-white/15 p-2 backdrop-blur-md"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden
          >
            <path d="M9 5l7 7-7 7" stroke="white" strokeWidth="2" />
          </svg>
        </button>
      </div>
    </div>
  );
}
