import Image from "next/image";

import poster from "@/assets/bgposter.jpg";
import logo from "@/assets/logo.png";
import { HeroBackgroundVideo } from "@/components/HeroBackgroundVideo";

export function Hero() {
  return (
    <section id="hero" className="relative isolate min-h-svh overflow-hidden">
      <Image
        src={poster}
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover"
        placeholder="blur"
      />

      <HeroBackgroundVideo />

      <div className="hero-overlay absolute inset-0 z-[1]" aria-hidden />
      <div className="hero-glow" aria-hidden />

      <div className="relative z-10 flex min-h-svh flex-col px-5 pb-12 pt-5 sm:px-8 sm:pb-16 sm:pt-6 lg:px-16 lg:pb-[100px]">
        <Image
          src={logo}
          alt="Кварта"
          width={60}
          height={60}
          className="h-[60px] w-[60px] rounded-[20px]"
          sizes="60px"
        />

        <div className="flex flex-1 flex-col justify-center py-6 sm:py-10">
          <h1 className="font-display max-w-3xl text-[34px] leading-tight tracking-tight text-white sm:text-4xl lg:text-6xl xl:max-w-5xl xl:text-[70px]">
            Кофе, который не успевает остыть на складе.
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-white/85 sm:mt-6 sm:text-lg lg:text-xl xl:text-[22px]">
            Мастерская «Кварта». Обжариваем спешелти-зерно партиями по 5 кг и
            привозим к вам домой на 1–3 день после обжарки.
          </p>
        </div>
        <a href="#products" className="product-cta mx-auto">
          Выбрать свой кофе
        </a>
      </div>
    </section>
  );
}
