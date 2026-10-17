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

      <div className="relative z-10 flex min-h-svh flex-col px-5 pb-10 pt-5 sm:px-8 sm:pb-14 sm:pt-6 lg:px-16">
        <Image
          src={logo}
          alt="Кварта"
          width={48}
          height={48}
          className="h-10 w-10 sm:h-12 sm:w-12"
          sizes="48px"
        />

        <div className="flex flex-1 flex-col justify-center py-6 sm:py-10">
          <h1 className="font-display max-w-3xl text-[1.75rem] leading-tight tracking-tight text-white sm:text-4xl lg:text-6xl">
            Кофе, который не успевает остыть на складе.
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-white/85 sm:mt-6 sm:text-lg lg:text-xl">
            Мастерская «Кварта». Обжариваем спешелти-зерно партиями по 5 кг и
            привозим к вам домой на 1–3 день после обжарки.
          </p>
          <a
            href="#products"
            className="mt-7 inline-flex w-fit items-center rounded-lg bg-accent px-5 py-3 text-sm text-surface transition-colors hover:bg-accent-hover sm:mt-10 sm:px-6 sm:py-3.5 sm:text-base"
          >
            Выбрать свой кофе ↓
          </a>
        </div>
      </div>
    </section>
  );
}
