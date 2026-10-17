"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
} from "react";

import { ORDER_SELECTION_PARAMS, products } from "@/data/products";
import {
  INTEREST_TYPES,
  ORDER_PRODUCTS,
  PACK_PRODUCTS,
  QTY_MAX,
  SUBSCRIPTION_TOTAL_QTY,
  leadSchema,
  zodErrorsToFieldMap,
  type InterestType,
  type OrderProduct,
  type PackProduct,
} from "@/lib/lead-schema";
import { formatBelarusPhoneMask } from "@/lib/phone-mask";
import { readUtm } from "@/lib/utm";

const SUBMIT_TIMEOUT_MS = 15_000;
const FREE_DELIVERY_FROM = 50;
const DELIVERY_FEE = 7;
const SUBSCRIPTION_PRICE = 54;

const INTEREST_OPTIONS: { value: InterestType; label: string }[] = [
  { value: "one_time", label: "Разовый заказ" },
  { value: "subscription", label: "Подписка" },
  { value: "question", label: "Вопрос" },
];

const SUCCESS_NEW = "Спасибо! Ожидайте звонок менеджера!";
const SUCCESS_DUPLICATE =
  "Заявка уже принята — мы свяжемся с вами в течение получаса. Если нужно изменить заказ, скажите об этом менеджеру при звонке.";

type FieldName = "name" | "interestType" | "items" | "phone" | "comment";

type OneTimeQty = Record<(typeof ORDER_PRODUCTS)[number], number>;
type SubscriptionQty = Record<PackProduct, number>;

type FormState = {
  name: string;
  interestType: InterestType | "";
  phone: string;
  comment: string;
  website: string;
};

type FieldErrors = Partial<Record<FieldName, string>>;

type SubmitOutcome =
  | { kind: "success"; duplicate: boolean }
  | { kind: "idle" };

type OrderLine = {
  id: OrderProduct;
  name: string;
  volume: string;
  price: number;
};

const PRODUCT_BY_ID = Object.fromEntries(
  products.map((p) => [p.id, p]),
) as Record<string, (typeof products)[number]>;

function buildLines(ids: readonly OrderProduct[]): OrderLine[] {
  return ids.map((id) => {
    const p = PRODUCT_BY_ID[id];
    return {
      id,
      name: p?.name ?? id,
      volume: p?.volume ?? "",
      price: p?.price ?? 0,
    };
  });
}

const ONE_TIME_LINES = buildLines(ORDER_PRODUCTS);
const SUBSCRIPTION_LINES = buildLines(PACK_PRODUCTS);

function emptyOneTimeQty(): OneTimeQty {
  return { ethiopia: 0, colombia: 0, brazil: 0, drip: 0 };
}

function emptySubscriptionQty(): SubscriptionQty {
  return { ethiopia: 0, colombia: 0, brazil: 0 };
}

function isInterestType(value: string): value is InterestType {
  return (INTEREST_TYPES as readonly string[]).includes(value);
}

function isOrderProduct(value: string): value is OrderProduct {
  return (ORDER_PRODUCTS as readonly string[]).includes(value);
}

function totalQty(map: Record<string, number>): number {
  return Object.values(map).reduce((sum, q) => sum + q, 0);
}

function qtyMapToItems(
  map: Record<string, number>,
): { product: OrderProduct; qty: number }[] {
  return (Object.entries(map) as [OrderProduct, number][])
    .filter(([, qty]) => qty >= 1)
    .map(([product, qty]) => ({ product, qty }));
}

function readPrefillFromUrl(): {
  interestType?: InterestType;
  product?: string;
} {
  const params = new URLSearchParams(window.location.search);
  const interestRaw = params.get(ORDER_SELECTION_PARAMS.interestType) ?? "";
  const productRaw = params.get(ORDER_SELECTION_PARAMS.product) ?? "";

  const next: { interestType?: InterestType; product?: string } = {};

  if (isInterestType(interestRaw)) {
    next.interestType = interestRaw;
  }

  if (productRaw) {
    next.product = productRaw;
  }

  if (next.interestType === "subscription") {
    next.product = "subscription";
  }

  if (
    next.interestType === "one_time" &&
    next.product === "subscription"
  ) {
    next.product = undefined;
  }

  return next;
}

/** UTM необязательны: любая ошибка чтения не блокирует отправку. */
function safeUtmFields(): {
  utmSource?: string;
  utmCampaign?: string;
  landingUrl?: string;
} {
  try {
    const utm = readUtm();
    if (!utm) return {};

    const fields: {
      utmSource?: string;
      utmCampaign?: string;
      landingUrl?: string;
    } = {};

    if (utm.utm_source) fields.utmSource = utm.utm_source;
    if (utm.utm_campaign) fields.utmCampaign = utm.utm_campaign;
    if (utm.landing_url) fields.landingUrl = utm.landing_url;

    return fields;
  } catch {
    return {};
  }
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
  const oneTimeQtyRef = useRef<OneTimeQty>(emptyOneTimeQty());
  const subscriptionQtyRef = useRef<SubscriptionQty>(emptySubscriptionQty());
  const nameRef = useRef<HTMLInputElement>(null);
  const interestRef = useRef<HTMLSelectElement>(null);
  const itemsRef = useRef<HTMLFieldSetElement>(null);
  const firstStepperPlusRef = useRef<HTMLButtonElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const commentRef = useRef<HTMLTextAreaElement>(null);

  const [state, setState] = useState<FormState>({
    name: "",
    interestType: "",
    phone: "",
    comment: "",
    website: "",
  });
  const [oneTimeQty, setOneTimeQty] = useState<OneTimeQty>(emptyOneTimeQty);
  const [subscriptionQty, setSubscriptionQty] =
    useState<SubscriptionQty>(emptySubscriptionQty);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitErrorOffline, setSubmitErrorOffline] = useState(false);
  const [submitErrorCustom, setSubmitErrorCustom] = useState<string | null>(
    null,
  );
  const [hasSubmitError, setHasSubmitError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [outcome, setOutcome] = useState<SubmitOutcome>({ kind: "idle" });

  stateRef.current = state;
  oneTimeQtyRef.current = oneTimeQty;
  subscriptionQtyRef.current = subscriptionQty;

  const subscriptionSelected = totalQty(subscriptionQty);
  const oneTimeSubtotal = ONE_TIME_LINES.reduce(
    (sum, line) => sum + line.price * oneTimeQty[line.id],
    0,
  );

  const buildPayload = useCallback(
    (
      form: FormState,
      oneTime: OneTimeQty,
      subscription: SubscriptionQty,
    ) => {
      let items: { product: OrderProduct; qty: number }[] = [];
      if (form.interestType === "one_time") {
        items = qtyMapToItems(oneTime);
      } else if (form.interestType === "subscription") {
        items = qtyMapToItems(subscription);
      }

      return {
        name: form.name,
        interestType: form.interestType || undefined,
        items,
        phone: form.phone,
        comment: form.comment,
        website: form.website,
        ...safeUtmFields(),
      };
    },
    [],
  );

  const itemsIncomplete = useCallback(
    (
      interestType: InterestType | "",
      oneTime: OneTimeQty,
      subscription: SubscriptionQty,
    ) => {
      if (interestType === "one_time") {
        return totalQty(oneTime) < 1;
      }
      if (interestType === "subscription") {
        return totalQty(subscription) !== SUBSCRIPTION_TOTAL_QTY;
      }
      return false;
    },
    [],
  );

  const focusFirstEmpty = useCallback(
    (
      next: FormState,
      oneTime: OneTimeQty,
      subscription: SubscriptionQty,
    ) => {
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
      if (itemsIncomplete(next.interestType, oneTime, subscription)) {
        focus(firstStepperPlusRef.current ?? itemsRef.current);
        return;
      }
      if (next.phone.replace(/\D/g, "").length < 12) {
        focus(phoneRef.current);
        return;
      }
      focus(commentRef.current);
    },
    [itemsIncomplete],
  );

  const applyPrefill = useCallback(
    (withFocus: boolean) => {
      const prefill = readPrefillFromUrl();
      if (
        prefill.interestType === undefined &&
        prefill.product === undefined
      ) {
        return;
      }

      let nextOneTime = oneTimeQtyRef.current;
      const nextSubscription = subscriptionQtyRef.current;

      if (
        prefill.interestType === "one_time" &&
        prefill.product &&
        isOrderProduct(prefill.product)
      ) {
        const productId = prefill.product;
        if (nextOneTime[productId] < 1) {
          nextOneTime = { ...nextOneTime, [productId]: 1 };
          setOneTimeQty(nextOneTime);
        }
      }

      setState((prev) => {
        const next: FormState = { ...prev };
        if (prefill.interestType !== undefined) {
          next.interestType = prefill.interestType;
        }
        if (withFocus) {
          focusFirstEmpty(next, nextOneTime, nextSubscription);
        }
        return next;
      });

      setErrors((prev) => {
        const cleared = { ...prev };
        delete cleared.interestType;
        delete cleared.items;
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
    setState((prev) => ({ ...prev, [key]: value }));
    setHasSubmitError(false);
    setSubmitErrorCustom(null);
  };

  const changeQty = (productId: OrderProduct, delta: 1 | -1) => {
    setHasSubmitError(false);
    setSubmitErrorCustom(null);

    if (state.interestType === "subscription") {
      if (!(PACK_PRODUCTS as readonly string[]).includes(productId)) return;
      const packId = productId as PackProduct;
      setSubscriptionQty((prev) => {
        const current = prev[packId];
        const nextQty = current + delta;
        if (nextQty < 0 || nextQty > QTY_MAX) return prev;
        if (delta > 0 && totalQty(prev) >= SUBSCRIPTION_TOTAL_QTY) return prev;
        return { ...prev, [packId]: nextQty };
      });
      setErrors((prev) => {
        if (!prev.items) return prev;
        const next = { ...prev };
        delete next.items;
        return next;
      });
      return;
    }

    if (state.interestType === "one_time") {
      setOneTimeQty((prev) => {
        const current = prev[productId];
        const nextQty = current + delta;
        if (nextQty < 0 || nextQty > QTY_MAX) return prev;
        return { ...prev, [productId]: nextQty };
      });
      setErrors((prev) => {
        if (!prev.items) return prev;
        const next = { ...prev };
        delete next.items;
        return next;
      });
    }
  };

  const handleBlur = (field: FieldName) => {
    const current = stateRef.current;
    if (!current) return;

    const result = leadSchema.safeParse(
      buildPayload(
        current,
        oneTimeQtyRef.current,
        subscriptionQtyRef.current,
      ),
    );
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

    const payload = buildPayload(state, oneTimeQty, subscriptionQty);
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

      const body: Record<string, unknown> = {
        name: parsed.data.name,
        interestType: parsed.data.interestType,
        items: parsed.data.items,
        phone: parsed.data.phone,
        comment: parsed.data.comment,
        website: state.website,
      };
      if (parsed.data.utmSource != null) {
        body.utmSource = parsed.data.utmSource;
      }
      if (parsed.data.utmCampaign != null) {
        body.utmCampaign = parsed.data.utmCampaign;
      }
      if (parsed.data.landingUrl != null) {
        body.landingUrl = parsed.data.landingUrl;
      }

      const response = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
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
            "items",
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
  const itemsErrorId = `${formId}-items-error`;
  const phoneErrorId = `${formId}-phone-error`;
  const commentErrorId = `${formId}-comment-error`;
  const formErrorId = `${formId}-form-error`;
  const itemsCounterId = `${formId}-items-counter`;

  const showItems =
    state.interestType === "one_time" ||
    state.interestType === "subscription";
  const lines =
    state.interestType === "subscription"
      ? SUBSCRIPTION_LINES
      : ONE_TIME_LINES;
  const qtyMap: Record<string, number> =
    state.interestType === "subscription" ? subscriptionQty : oneTimeQty;
  const subscriptionAtLimit =
    state.interestType === "subscription" &&
    subscriptionSelected >= SUBSCRIPTION_TOTAL_QTY;

  const summaryAmount =
    state.interestType === "subscription"
      ? SUBSCRIPTION_PRICE
      : oneTimeSubtotal;
  const deliveryHint =
    state.interestType === "subscription"
      ? "Доставка бесплатная"
      : oneTimeSubtotal >= FREE_DELIVERY_FROM
        ? "Доставка бесплатная"
        : `Доставка ${DELIVERY_FEE} BYN (бесплатно от ${FREE_DELIVERY_FROM} BYN)`;

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
              setErrors((prev) => {
                if (!prev.items && !prev.interestType) return prev;
                const next = { ...prev };
                delete next.items;
                delete next.interestType;
                return next;
              });
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

      {showItems ? (
        <fieldset
          ref={itemsRef}
          className="order-items"
          aria-invalid={errors.items ? true : undefined}
          aria-describedby={
            [
              state.interestType === "subscription" ? itemsCounterId : null,
              errors.items ? itemsErrorId : null,
            ]
              .filter(Boolean)
              .join(" ") || undefined
          }
          disabled={submitting}
          onBlur={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
              handleBlur("items");
            }
          }}
        >
          <legend>Состав заказа</legend>

          {state.interestType === "subscription" ? (
            <p
              id={itemsCounterId}
              className="order-items-counter"
              aria-live="polite"
            >
              Выбрано {subscriptionSelected} из {SUBSCRIPTION_TOTAL_QTY}
            </p>
          ) : null}

          <ul className="order-items-list">
            {lines.map((line, index) => {
              const qty = qtyMap[line.id] ?? 0;
              const minusDisabled = submitting || qty <= 0;
              const plusDisabled =
                submitting ||
                qty >= QTY_MAX ||
                (state.interestType === "subscription" &&
                  subscriptionAtLimit);

              return (
                <li key={line.id} className="order-items-row">
                  <div className="order-items-info">
                    <span className="order-items-name">{line.name}</span>
                    <span className="order-items-meta">
                      {line.volume} · {line.price} BYN
                    </span>
                  </div>
                  <div className="order-stepper">
                    <button
                      type="button"
                      className="order-stepper-btn"
                      aria-label={`Убрать ${line.name}`}
                      disabled={minusDisabled}
                      onClick={() => changeQty(line.id, -1)}
                    >
                      −
                    </button>
                    <span className="order-stepper-qty" aria-live="polite">
                      {qty}
                    </span>
                    <button
                      ref={index === 0 ? firstStepperPlusRef : undefined}
                      type="button"
                      className="order-stepper-btn"
                      aria-label={`Добавить ${line.name}`}
                      disabled={plusDisabled}
                      onClick={() => changeQty(line.id, 1)}
                    >
                      +
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="order-items-summary">
            <p className="order-items-total">
              Ориентировочная сумма:{" "}
              {state.interestType === "subscription"
                ? `${summaryAmount} BYN / мес.`
                : `${summaryAmount} BYN`}
            </p>
            <p className="order-items-delivery">{deliveryHint}</p>
          </div>

          <p
            id={itemsErrorId}
            className="order-field-error"
            role="alert"
            aria-live="polite"
          >
            {errors.items ?? ""}
          </p>
        </fieldset>
      ) : null}

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
