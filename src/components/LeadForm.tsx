"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
} from "react";

import { ORDER_SELECTION_PARAMS } from "@/data/products";
import {
  INTEREST_TYPES,
  PRODUCTS,
  leadSchema,
  zodErrorsToFieldMap,
  type InterestType,
  type Product,
} from "@/lib/lead-schema";
import { formatBelarusPhoneMask } from "@/lib/phone-mask";
import { readUtm } from "@/lib/utm";

const SUBMIT_TIMEOUT_MS = 15_000;

const INTEREST_OPTIONS: { value: InterestType; label: string }[] = [
  { value: "one_time", label: "Разовый заказ" },
  { value: "subscription", label: "Подписка" },
  { value: "question", label: "Вопрос" },
];

const PRODUCT_OPTIONS: { value: Product; label: string }[] = [
  { value: "ethiopia", label: "Эфиопия" },
  { value: "colombia", label: "Колумбия" },
  { value: "brazil", label: "Бразилия" },
  { value: "drip", label: "Дрип-пакеты" },
  { value: "subscription", label: "Кофейная подписка" },
];

const SUCCESS_NEW = "Спасибо! Мы свяжемся с вами в течение получаса";
const SUCCESS_DUPLICATE =
  "Заявка уже принята — мы свяжемся с вами в течение получаса. Повторно отправлять не нужно.";

type FieldName = "name" | "interestType" | "product" | "phone" | "comment";

type FormState = {
  name: string;
  interestType: InterestType | "";
  product: Product | "";
  phone: string;
  comment: string;
  website: string;
};

type FieldErrors = Partial<Record<FieldName, string>>;

type SubmitOutcome =
  | { kind: "success"; duplicate: boolean }
  | { kind: "idle" };

function isInterestType(value: string): value is InterestType {
  return (INTEREST_TYPES as readonly string[]).includes(value);
}

function isProduct(value: string): value is Product {
  return (PRODUCTS as readonly string[]).includes(value);
}

function readPrefillFromUrl(): Partial<FormState> {
  const params = new URLSearchParams(window.location.search);
  const interestRaw = params.get(ORDER_SELECTION_PARAMS.interestType) ?? "";
  const productRaw = params.get(ORDER_SELECTION_PARAMS.product) ?? "";

  const next: Partial<FormState> = {};

  if (isInterestType(interestRaw)) {
    next.interestType = interestRaw;
  }

  if (isProduct(productRaw)) {
    next.product = productRaw;
  }

  if (next.interestType === "subscription") {
    next.product = "subscription";
  }

  if (
    next.interestType === "one_time" &&
    next.product === "subscription"
  ) {
    next.product = "";
  }

  return next;
}

function buildPayload(state: FormState) {
  const utm = readUtm();
  return {
    name: state.name,
    interestType: state.interestType || undefined,
    product: state.product === "" ? null : state.product,
    phone: state.phone,
    comment: state.comment,
    website: state.website,
    utm_source: utm?.utm_source ?? null,
    utm_campaign: utm?.utm_campaign ?? null,
    landing_url: utm?.landing_url ?? null,
  };
}

function FormErrorMessage({
  offline,
  custom,
}: {
  offline: boolean;
  custom: string | null;
}) {
  if (custom) {
    return <p>{custom}</p>;
  }

  if (offline) {
    return (
      <p>
        Похоже, нет подключения к интернету. Проверьте сеть и нажмите
        «Отправить ещё раз». Если не получается, свяжитесь с нами{" "}
        <a href="#contacts" className="order-form-error-link">
          по контактам ниже
        </a>
      </p>
    );
  }

  return (
    <p>
      Не удалось отправить заявку. Ваши данные сохранены в форме — нажмите
      «Отправить ещё раз». Если не получается, свяжитесь с нами{" "}
      <a href="#contacts" className="order-form-error-link">
        по контактам ниже
      </a>
    </p>
  );
}

export function LeadForm() {
  const formId = useId();
  const submittingRef = useRef(false);
  const stateRef = useRef<FormState | null>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const interestRef = useRef<HTMLSelectElement>(null);
  const productRef = useRef<HTMLSelectElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const commentRef = useRef<HTMLTextAreaElement>(null);

  const [state, setState] = useState<FormState>({
    name: "",
    interestType: "",
    product: "",
    phone: "",
    comment: "",
    website: "",
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitErrorOffline, setSubmitErrorOffline] = useState(false);
  const [submitErrorCustom, setSubmitErrorCustom] = useState<string | null>(
    null,
  );
  const [hasSubmitError, setHasSubmitError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [outcome, setOutcome] = useState<SubmitOutcome>({ kind: "idle" });

  stateRef.current = state;

  const productLocked = state.interestType === "subscription";
  const productOptional = state.interestType === "question";

  const focusFirstEmpty = useCallback((next: FormState) => {
    const focus = (el: HTMLElement | null) => {
      window.setTimeout(() => el?.focus(), 350);
    };

    if (!next.name.trim()) {
      focus(nameRef.current);
      return;
    }
    if (!next.interestType) {
      focus(interestRef.current);
      return;
    }
    if (
      next.interestType === "one_time" &&
      (!next.product || next.product === "subscription")
    ) {
      focus(productRef.current);
      return;
    }
    if (next.phone.replace(/\D/g, "").length < 12) {
      focus(phoneRef.current);
      return;
    }
    focus(commentRef.current);
  }, []);

  const applyPrefill = useCallback(
    (withFocus: boolean) => {
      const prefill = readPrefillFromUrl();
      if (
        prefill.interestType === undefined &&
        prefill.product === undefined
      ) {
        return;
      }

      setState((prev) => {
        const next = { ...prev, ...prefill };
        if (withFocus) {
          focusFirstEmpty(next);
        }
        return next;
      });
      setErrors((prev) => {
        const cleared = { ...prev };
        delete cleared.interestType;
        delete cleared.product;
        return cleared;
      });
    },
    [focusFirstEmpty],
  );

  useEffect(() => {
    applyPrefill(true);

    const onPrefill = () => applyPrefill(true);
    window.addEventListener("kvarta:order-prefill", onPrefill);
    window.addEventListener("popstate", onPrefill);
    window.addEventListener("hashchange", onPrefill);

    return () => {
      window.removeEventListener("kvarta:order-prefill", onPrefill);
      window.removeEventListener("popstate", onPrefill);
      window.removeEventListener("hashchange", onPrefill);
    };
  }, [applyPrefill]);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setState((prev) => {
      const next = { ...prev, [key]: value };

      if (key === "interestType") {
        if (value === "subscription") {
          next.product = "subscription";
        } else if (
          prev.interestType === "subscription" &&
          prev.product === "subscription"
        ) {
          next.product = "";
        }
      }

      return next;
    });
    setHasSubmitError(false);
    setSubmitErrorCustom(null);
  };

  const handleBlur = (field: FieldName) => {
    const current = stateRef.current;
    if (!current) return;

    const result = leadSchema.safeParse(buildPayload(current));
    if (result.success) {
      setErrors((prev) => {
        if (!prev[field]) return prev;
        const next = { ...prev };
        delete next[field];
        return next;
      });
      return;
    }

    const map = zodErrorsToFieldMap(result.error);
    setErrors((prev) => {
      const next = { ...prev };
      if (map[field]) {
        next[field] = map[field];
      } else {
        delete next[field];
      }
      return next;
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submittingRef.current) return;

    setHasSubmitError(false);
    setSubmitErrorCustom(null);

    const payload = buildPayload(state);
    const parsed = leadSchema.safeParse(payload);

    if (!parsed.success) {
      setErrors(zodErrorsToFieldMap(parsed.error) as FieldErrors);
      return;
    }

    submittingRef.current = true;
    setSubmitting(true);

    const controller = new AbortController();
    const timeoutId = window.setTimeout(
      () => controller.abort(),
      SUBMIT_TIMEOUT_MS,
    );

    try {
      if (typeof navigator !== "undefined" && navigator.onLine === false) {
        setSubmitErrorOffline(true);
        setHasSubmitError(true);
        return;
      }

      const response = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...parsed.data,
          website: state.website,
        }),
        signal: controller.signal,
      });

      let data: unknown = null;
      try {
        data = await response.json();
      } catch {
        data = null;
      }

      if (response.status === 400 && data && typeof data === "object") {
        const errorsBag = (data as { errors?: Record<string, string> }).errors;
        if (errorsBag) {
          const fieldErrs: FieldErrors = {};
          for (const key of [
            "name",
            "interestType",
            "product",
            "phone",
            "comment",
          ] as const) {
            if (errorsBag[key]) {
              fieldErrs[key] = errorsBag[key];
            }
          }
          setErrors(fieldErrs);
          if (errorsBag._form) {
            setSubmitErrorOffline(false);
            setSubmitErrorCustom(errorsBag._form);
            setHasSubmitError(true);
          }
          return;
        }
      }

      if (!response.ok) {
        setSubmitErrorOffline(false);
        setSubmitErrorCustom(null);
        setHasSubmitError(true);
        return;
      }

      const ok = Boolean((data as { ok?: boolean } | null)?.ok);
      const duplicate = Boolean(
        (data as { duplicate?: boolean } | null)?.duplicate,
      );

      if (!ok) {
        setSubmitErrorOffline(false);
        setSubmitErrorCustom(null);
        setHasSubmitError(true);
        return;
      }

      setErrors({});
      setOutcome({ kind: "success", duplicate });
    } catch {
      const offline =
        typeof navigator !== "undefined" && navigator.onLine === false;
      setSubmitErrorOffline(offline);
      setSubmitErrorCustom(null);
      setHasSubmitError(true);
    } finally {
      window.clearTimeout(timeoutId);
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  if (outcome.kind === "success") {
    return (
      <div className="order-success" role="status" aria-live="polite">
        <p className="font-display text-xl leading-snug tracking-tight sm:text-2xl">
          {outcome.duplicate ? SUCCESS_DUPLICATE : SUCCESS_NEW}
        </p>
      </div>
    );
  }

  const nameErrorId = `${formId}-name-error`;
  const interestErrorId = `${formId}-interest-error`;
  const productErrorId = `${formId}-product-error`;
  const phoneErrorId = `${formId}-phone-error`;
  const commentErrorId = `${formId}-comment-error`;
  const formErrorId = `${formId}-form-error`;

  const buttonLabel = submitting
    ? "Отправляем…"
    : hasSubmitError
      ? "Отправить ещё раз"
      : "Отправить заявку";

  return (
    <form
      className="order-form"
      onSubmit={handleSubmit}
      noValidate
      aria-describedby={hasSubmitError ? formErrorId : undefined}
    >
      <div className="order-honeypot" aria-hidden="true">
        <label htmlFor={`${formId}-website`}>Website</label>
        <input
          id={`${formId}-website`}
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={state.website}
          onChange={(e) => setField("website", e.target.value)}
        />
      </div>

      <div className="order-field">
        <label htmlFor={`${formId}-name`}>Ваше имя</label>
        <input
          ref={nameRef}
          id={`${formId}-name`}
          name="name"
          type="text"
          autoComplete="name"
          value={state.name}
          onChange={(e) => setField("name", e.target.value)}
          onBlur={() => handleBlur("name")}
          aria-invalid={errors.name ? true : undefined}
          aria-describedby={errors.name ? nameErrorId : undefined}
          disabled={submitting}
        />
        <p
          id={nameErrorId}
          className="order-field-error"
          role="alert"
          aria-live="polite"
        >
          {errors.name ?? ""}
        </p>
      </div>

      <div className="order-field">
        <label htmlFor={`${formId}-interest`}>Тип обращения</label>
        <div className="order-select-wrap">
          <select
            ref={interestRef}
            id={`${formId}-interest`}
            name="interestType"
            value={state.interestType}
            onChange={(e) => {
              const value = e.target.value;
              setField(
                "interestType",
                value === "" ? "" : (value as InterestType),
              );
            }}
            onBlur={() => handleBlur("interestType")}
            aria-invalid={errors.interestType ? true : undefined}
            aria-describedby={
              errors.interestType ? interestErrorId : undefined
            }
            disabled={submitting}
          >
            <option value="">Выберите тип обращения</option>
            {INTEREST_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <p
          id={interestErrorId}
          className="order-field-error"
          role="alert"
          aria-live="polite"
        >
          {errors.interestType ?? ""}
        </p>
      </div>

      <div className="order-field">
        <label htmlFor={`${formId}-product`}>
          Что вы выбрали
          {productOptional ? (
            <span className="order-optional"> (необязательно)</span>
          ) : null}
        </label>
        <div className="order-select-wrap">
          <select
            ref={productRef}
            id={`${formId}-product`}
            name="product"
            value={state.product}
            onChange={(e) => {
              const value = e.target.value;
              setField("product", value === "" ? "" : (value as Product));
            }}
            onBlur={() => handleBlur("product")}
            aria-invalid={errors.product ? true : undefined}
            aria-describedby={errors.product ? productErrorId : undefined}
            disabled={submitting || productLocked}
          >
            <option value="">Выберите продукт</option>
            {PRODUCT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <p
          id={productErrorId}
          className="order-field-error"
          role="alert"
          aria-live="polite"
        >
          {errors.product ?? ""}
        </p>
      </div>

      <div className="order-field">
        <label htmlFor={`${formId}-phone`}>Номер телефона</label>
        <input
          ref={phoneRef}
          id={`${formId}-phone`}
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="+375 (XX) XXX-XX-XX"
          value={state.phone}
          onChange={(e) =>
            setField("phone", formatBelarusPhoneMask(e.target.value))
          }
          onBlur={() => handleBlur("phone")}
          aria-invalid={errors.phone ? true : undefined}
          aria-describedby={errors.phone ? phoneErrorId : undefined}
          disabled={submitting}
        />
        <p
          id={phoneErrorId}
          className="order-field-error"
          role="alert"
          aria-live="polite"
        >
          {errors.phone ?? ""}
        </p>
      </div>

      <div className="order-field">
        <label htmlFor={`${formId}-comment`}>Комментарий к заказу</label>
        <textarea
          ref={commentRef}
          id={`${formId}-comment`}
          name="comment"
          rows={4}
          placeholder="Например: нужен помол под турку или доставка в офис"
          value={state.comment}
          onChange={(e) => setField("comment", e.target.value)}
          onBlur={() => handleBlur("comment")}
          aria-invalid={errors.comment ? true : undefined}
          aria-describedby={errors.comment ? commentErrorId : undefined}
          disabled={submitting}
        />
        <p
          id={commentErrorId}
          className="order-field-error"
          role="alert"
          aria-live="polite"
        >
          {errors.comment ?? ""}
        </p>
      </div>

      {hasSubmitError ? (
        <div
          id={formErrorId}
          className="order-form-error"
          role="alert"
          aria-live="assertive"
        >
          <FormErrorMessage
            offline={submitErrorOffline}
            custom={submitErrorCustom}
          />
        </div>
      ) : null}

      <button
        type="submit"
        className="order-submit"
        disabled={submitting}
        aria-busy={submitting || undefined}
      >
        {buttonLabel}
      </button>
    </form>
  );
}
