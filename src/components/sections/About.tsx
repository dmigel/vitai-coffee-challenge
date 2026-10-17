import Image from "next/image";

import annaPhoto from "@/assets/Anna.jpg";
import dmitryPhoto from "@/assets/Dmitry.jpg";

function SecretIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 28 28"
      fill="none"
      aria-hidden
    >
      <path
        d="M14 3.5c.4 2.8 1.6 4.6 3.5 6.2 1.7 1.5 3.3 3.2 3.3 5.8a6.8 6.8 0 1 1-13.6 0c0-2.6 1.6-4.3 3.3-5.8C12.4 8.1 13.6 6.3 14 3.5Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path
        d="M14 16.5v5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ScheduleIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 28 28"
      fill="none"
      aria-hidden
    >
      <rect
        x="4.5"
        y="6.5"
        width="19"
        height="17"
        rx="3"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      <path
        d="M4.5 11.5h19"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <path
        d="M9.5 4.5v4M18.5 4.5v4"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <circle cx="10" cy="16.5" r="1.25" fill="currentColor" />
      <circle cx="14" cy="16.5" r="1.25" fill="currentColor" />
      <circle cx="18" cy="16.5" r="1.25" fill="currentColor" />
    </svg>
  );
}

export function About() {
  return (
    <section
      id="about"
      className="scroll-mt-6 bg-background px-5 py-14 sm:px-8 sm:py-20 lg:px-16"
    >
      <div className="about-layout mx-auto flex w-full max-w-[1280px] flex-col">
        <h2 className="about-title font-display max-w-3xl text-3xl leading-tight tracking-tight sm:text-4xl lg:text-5xl">
          Привет! Мы — Дима и Аня.
        </h2>

        <p className="about-intro max-w-3xl text-base leading-relaxed text-muted sm:text-lg">
          Раньше мы работали бариста и каждый день варили кофе для сотен гостей.
          В 2019 году мы поняли, что хотим контролировать вкус еще на этапе
          обжарки, и открыли маленькую мастерскую «Кварта».
        </p>

        <ul className="about-photos m-0 flex list-none gap-8 p-0">
          <li className="min-w-0 flex-1">
            <figure className="m-0">
              <div className="about-photo relative overflow-hidden rounded-lg">
                <Image
                  src={dmitryPhoto}
                  alt="Дмитрий, сооснователь мастерской «Кварта»"
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1280px) 40vw, 620px"
                  className="object-cover"
                  placeholder="blur"
                />
              </div>
            </figure>
          </li>
          <li className="min-w-0 flex-1">
            <figure className="m-0">
              <div className="about-photo relative overflow-hidden rounded-lg">
                <Image
                  src={annaPhoto}
                  alt="Аня, сооснователь мастерской «Кварта»"
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1280px) 40vw, 620px"
                  className="object-cover"
                  placeholder="blur"
                />
              </div>
            </figure>
          </li>
        </ul>

        <div className="about-accents flex max-w-3xl flex-col gap-6 sm:gap-8">
          <div className="flex gap-3 sm:gap-4">
            <span className="mt-0.5 shrink-0 text-accent">
              <SecretIcon />
            </span>
            <div>
              <h3 className="font-display text-lg leading-snug tracking-tight sm:text-xl">
                В чем наш секрет?
              </h3>
              <p className="mt-2 text-base leading-relaxed text-muted sm:text-lg">
                Мы принципиально не обжариваем кофе «про запас». Наш ростер
                вмещает всего 5 кг зерен — это позволяет следить за каждой
                секундой процесса.
              </p>
            </div>
          </div>

          <div className="flex gap-3 sm:gap-4">
            <span className="mt-0.5 shrink-0 text-accent">
              <ScheduleIcon />
            </span>
            <div>
              <h3 className="font-display text-lg leading-snug tracking-tight sm:text-xl">
                Наш график
              </h3>
              <p className="mt-2 text-base leading-relaxed text-muted sm:text-lg">
                Каждый четверг мы обжариваем свежую партию. А уже в пятницу
                развозим её по Минску. В итоге вы получаете зерно на пике его
                вкуса и аромата — всего через 1–3 дня после обжарки.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
