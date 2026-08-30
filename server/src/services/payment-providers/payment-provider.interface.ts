import { AuthorizedPaymentContext, PaymentRail } from "../../types";

export interface OrderCreationResult {
  orderId: string;
  amount: number; // standard currency unit (e.g. ₹3,499)
  amountInMinorUnits: number; // e.g. 349900 paise
  currency: string;
  keyId?: string;
  paymentRail: PaymentRail;
  receipt?: string;
  notes?: Record<string, string>;
}

export interface VerificationParams {
  orderId: string;
  paymentId: string;
  signature?: string;
  expectedAmount: number;
  expectedCurrency: string;
}

export interface VerificationResult {
  verified: boolean;
  gatewayTransactionId: string;
  amount: number;
  currency: string;
  error?: string;
}

export interface IPaymentProvider {
  name: PaymentRail;
  isConfigured(): boolean;
  createOrder(context: AuthorizedPaymentContext): Promise<OrderCreationResult>;
  verifyPayment(params: VerificationParams): Promise<VerificationResult>;
}
