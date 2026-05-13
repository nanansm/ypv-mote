import {
  getActiveNonIndonesiaMethods,
  getDefaultIndonesiaMethod,
  type PaymentMethodRow,
} from "@/lib/payment-methods";
import { formatAmount } from "@/lib/payment-methods/presets";

export type ResolvedPayment = {
  defaultMethod: PaymentMethodRow;
  alternativeMethods: PaymentMethodRow[];
  currency: string;
  amount: number;
  amountFormatted: string;
  fallbackNote: "indonesia_default_missing" | "no_active_methods" | null;
};

type SessionLike = {
  priceUsd: number;
  priceIdr: number | null;
};

type SubmissionLike = {
  country: string | null;
};

function amountFor(method: PaymentMethodRow, session: SessionLike): { amount: number; formatted: string } {
  if (method.currencyLabel.toUpperCase() === "IDR" && session.priceIdr != null && session.priceIdr > 0) {
    return { amount: session.priceIdr, formatted: formatAmount(session.priceIdr, "IDR") };
  }
  return {
    amount: session.priceUsd,
    formatted: formatAmount(session.priceUsd, method.currencyLabel),
  };
}

export async function resolvePaymentMethod(
  submission: SubmissionLike,
  session: SessionLike
): Promise<ResolvedPayment | null> {
  const isIndonesian = submission.country === "Indonesia";

  if (isIndonesian) {
    const idMethod = getDefaultIndonesiaMethod();
    if (idMethod) {
      const { amount, formatted } = amountFor(idMethod, session);
      return {
        defaultMethod: idMethod,
        alternativeMethods: [],
        currency: idMethod.currencyLabel,
        amount,
        amountFormatted: formatted,
        fallbackNote: null,
      };
    }
    const others = getActiveNonIndonesiaMethods();
    if (others.length === 0) return null;
    const [first, ...rest] = others;
    const { amount, formatted } = amountFor(first, session);
    return {
      defaultMethod: first,
      alternativeMethods: rest,
      currency: first.currencyLabel,
      amount,
      amountFormatted: formatted,
      fallbackNote: "indonesia_default_missing",
    };
  }

  const others = getActiveNonIndonesiaMethods();
  if (others.length === 0) {
    const idMethod = getDefaultIndonesiaMethod();
    if (idMethod) {
      const { amount, formatted } = amountFor(idMethod, session);
      return {
        defaultMethod: idMethod,
        alternativeMethods: [],
        currency: idMethod.currencyLabel,
        amount,
        amountFormatted: formatted,
        fallbackNote: "no_active_methods",
      };
    }
    return null;
  }
  const [first, ...rest] = others;
  const { amount, formatted } = amountFor(first, session);
  return {
    defaultMethod: first,
    alternativeMethods: rest,
    currency: first.currencyLabel,
    amount,
    amountFormatted: formatted,
    fallbackNote: null,
  };
}

/** Lightweight badge resolution for admin lists — returns the default method
 * label (display_name + currency) for a submission's country, or null. */
export function quickPaymentMethodLabel(submission: SubmissionLike): {
  displayName: string;
  currency: string;
  key: string;
} | null {
  const isIndonesian = submission.country === "Indonesia";
  if (isIndonesian) {
    const idMethod = getDefaultIndonesiaMethod();
    if (idMethod) {
      return {
        displayName: idMethod.displayName,
        currency: idMethod.currencyLabel,
        key: idMethod.key,
      };
    }
  }
  const others = getActiveNonIndonesiaMethods();
  if (others.length > 0) {
    const m = others[0];
    return {
      displayName: m.displayName,
      currency: m.currencyLabel,
      key: m.key,
    };
  }
  return null;
}
