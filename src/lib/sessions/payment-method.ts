import { getBcaConfig, getWiseConfig } from "@/lib/config";

export type PaymentMethod = "bca" | "wise";

export type ResolvedPayment =
  | {
      method: "bca";
      currency: "IDR";
      amount: number;
      amountFormatted: string;
      account: {
        holder: string;
        number: string;
        bankName: string;
        bankBranch: string;
      };
      fallbackNote: null;
    }
  | {
      method: "wise";
      currency: "USD";
      amount: number;
      amountFormatted: string;
      account: {
        holder: string;
        number: string;
        swiftBic: string;
        bankName: string;
        bankAddress: string;
        referenceInstruction: string;
      };
      fallbackNote: "idr_not_offered" | "bca_not_configured" | null;
    };

type SessionLike = {
  priceUsd: number;
  priceIdr: number | null;
};

type SubmissionLike = {
  country: string | null;
};

function formatIdr(amount: number): string {
  return `Rp ${amount.toLocaleString("id-ID")}`;
}

function formatUsd(amount: number): string {
  return `$${amount.toFixed(2)} USD`;
}

function isBcaConfigured(bca: {
  accountHolder: string;
  accountNumber: string;
}): boolean {
  return Boolean(bca.accountHolder && bca.accountNumber);
}

export async function resolvePaymentMethod(
  submission: SubmissionLike,
  session: SessionLike
): Promise<ResolvedPayment> {
  const isIndonesian = submission.country === "Indonesia";
  const hasIdrPrice = session.priceIdr != null && session.priceIdr > 0;

  if (isIndonesian) {
    const bca = await getBcaConfig();
    if (!hasIdrPrice) {
      const wise = await getWiseConfig();
      return buildWise(session, wise, "idr_not_offered");
    }
    if (!isBcaConfigured(bca)) {
      const wise = await getWiseConfig();
      return buildWise(session, wise, "bca_not_configured");
    }
    return {
      method: "bca",
      currency: "IDR",
      amount: session.priceIdr!,
      amountFormatted: formatIdr(session.priceIdr!),
      account: {
        holder: bca.accountHolder,
        number: bca.accountNumber,
        bankName: bca.bankName,
        bankBranch: bca.bankBranch,
      },
      fallbackNote: null,
    };
  }

  const wise = await getWiseConfig();
  return buildWise(session, wise, null);
}

function buildWise(
  session: SessionLike,
  wise: Awaited<ReturnType<typeof getWiseConfig>>,
  fallbackNote: "idr_not_offered" | "bca_not_configured" | null
): ResolvedPayment {
  return {
    method: "wise",
    currency: "USD",
    amount: session.priceUsd,
    amountFormatted: formatUsd(session.priceUsd),
    account: {
      holder: wise.accountHolder,
      number: wise.accountNumber,
      swiftBic: wise.swiftBic,
      bankName: wise.bankName,
      bankAddress: wise.bankAddress,
      referenceInstruction: wise.referenceInstruction,
    },
    fallbackNote,
  };
}

/** Same eligibility logic as `resolvePaymentMethod` but synchronous — for callers that
 * already have BCA configuration on hand (eg. admin bookings list, computed once per request). */
export function quickPaymentMethod(
  submission: SubmissionLike,
  session: SessionLike,
  bcaConfigured: boolean
): PaymentMethod {
  const isIndonesian = submission.country === "Indonesia";
  const hasIdrPrice = session.priceIdr != null && session.priceIdr > 0;
  return isIndonesian && hasIdrPrice && bcaConfigured ? "bca" : "wise";
}

export function isBcaSettingsConfigured(bca: {
  accountHolder: string;
  accountNumber: string;
}): boolean {
  return isBcaConfigured(bca);
}
