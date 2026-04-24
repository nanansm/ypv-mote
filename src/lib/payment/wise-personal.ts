import { getWiseConfig } from "@/lib/config";
import type { PaymentProvider, PaymentDetails } from "./provider";

export const wisePersonalProvider: PaymentProvider = {
  async getPaymentDetails(): Promise<PaymentDetails> {
    const cfg = await getWiseConfig();
    return {
      accountHolder: cfg.accountHolder,
      accountNumber: cfg.accountNumber,
      swiftBic: cfg.swiftBic,
      bankName: cfg.bankName,
      bankAddress: cfg.bankAddress,
      referenceInstruction: cfg.referenceInstruction,
    };
  },

  formatDetailsBlock(details: PaymentDetails): string {
    return [
      `Account holder: ${details.accountHolder || "[Not configured]"}`,
      `Account number: ${details.accountNumber || "[Not configured]"}`,
      `SWIFT/BIC: ${details.swiftBic || "[Not configured]"}`,
      `Bank name: ${details.bankName || "Wise"}`,
      `Bank address: ${details.bankAddress || "[Not configured]"}`,
    ].join("\n");
  },
};
