export interface PaymentDetails {
  accountHolder: string;
  accountNumber: string;
  swiftBic: string;
  bankName: string;
  bankAddress: string;
  referenceInstruction: string;
}

export interface PaymentProvider {
  getPaymentDetails(): Promise<PaymentDetails>;
  formatDetailsBlock(details: PaymentDetails): string;
}
