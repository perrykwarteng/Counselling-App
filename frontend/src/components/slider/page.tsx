"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import "swiper/css";
import Image from "next/image";


const slides = [
  {
    image: "/images/slide1.jpg",
    title: "A Safe Space to Find Your Peace and Clarity",
    highlight1: "Peace",
    highlight2: "Clarity",
    description:
      "Get the emotional support you need in a judgment-free zone.\nWe're here to listen and guide you.",
  },
  {
    image: "/images/slide2.jpg",
    title: "Real Help from Real Professionals Anytime",
    highlight1: "Help",
    highlight2: "Professionals",
    description:
      "Talk to licensed counselors confidentially.\nAccessible 24/7 to support your mental wellness journey.",
  },
  {
    image: "/images/slide3.jpg",
    title: "Empower Yourself with Personalized Guidance",
    highlight1: "Empower",
    highlight2: "Guidance",
    description:
      "Take steps toward healing with sessions tailored just for you.\nYour mental health matters every day.",
  },
];

export default function Slider() {
  return (
    <div className="w-1/2 h-screen">
      <Swiper
        modules={[Autoplay]}
        autoplay={{ delay: 2000, disableOnInteraction: false }}
        spaceBetween={0}
        slidesPerView={1}
        loop
        className="h-full"
      >
        {slides.map((slide, index) => (
          <SwiperSlide key={index}>
            <div className="relative w-full h-full">
              {/* Background Image */}
              <Image
                src={slide.image}
                alt={`Slide ${index + 1}`}
                fill
                sizes="100vw"
                className="object-cover z-0"
              />

              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-black/80 to-gray-900/80 z-10" />

              {/* Text Content */}
              <div className="relative z-20 flex items-center justify-center h-full text-white p-12">
                <div className="text-center max-w-xl space-y-6">
                  <h2 className="text-4xl font-semibold leading-snug">
                    {slide.title.split(slide.highlight1)[0]}
                    <span className="text-gray-400">{slide.highlight1}</span>
                    {
                      slide.title
                        .split(slide.highlight1)[1]
                        .split(slide.highlight2)[0]
                    }
                    <span className="text-gray-400">{slide.highlight2}</span>
                  </h2>
                  <p className="text-md text-gray-300 whitespace-pre-line">
                    {slide.description}
                  </p>
                </div>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
