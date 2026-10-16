export function Hero() {
  return (
    <section
      id="hero"
      className="flex min-h-dvh flex-col justify-center px-5 py-16 sm:px-8 lg:px-16"
    >
      <p className="mb-4 text-sm tracking-wide text-accent sm:text-base">
        Секция Hero
      </p>
      <h1 className="font-display max-w-3xl text-4xl leading-tight tracking-tight sm:text-5xl lg:text-6xl">
        Кофе, который не успевает остыть на складе.
      </h1>
      <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted sm:text-xl">
        Заглушка главного экрана. Видео и кнопка появятся позже.
      </p>
      <a
        href="#products"
        className="mt-10 inline-flex w-fit items-center rounded-lg bg-accent px-6 py-3.5 text-base text-surface transition-colors hover:bg-accent-hover"
      >
        Выбрать свой кофе ↓
      </a>
    </section>
  );
}
