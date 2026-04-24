import type { PaymentProvider } from "./provider";

export const wiseBusinessProvider: PaymentProvider = {
  async getPaymentDetails() {
    throw new Error("Wise Business provider not implemented yet");
  },
  formatDetailsBlock() {
    throw new Error("Wise Business provider not implemented yet");
  },
};
