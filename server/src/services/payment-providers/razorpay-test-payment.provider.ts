import Razorpay from "razorpay";
import { AuthorizedPaymentContext } from "../../types";
import { toMinorUnits } from "../../utils/currency.util";
import { verifyRazorpaySignature } from "../../integrations/razorpay/razorpay.util";
import {
  IPaymentProvider,
  OrderCreationResult,
  VerificationParams,
  VerificationResult,
} from "./payment-provider.interface";

export class RazorpayTestPaymentProvider implements IPaymentProvider {
  name = "razorpay_test" as const;
  private instance: Razorpay | null = null;

  private getKeyId(): string | undefined {
    return process.env.RAZORPAY_KEY_ID;
  }

  private getKeySecret(): string | undefined {
    return process.env.RAZORPAY_KEY_SECRET;
  }

  isConfigured(): boolean {
    const keyId = this.getKeyId();
    const keySecret = this.getKeySecret();
    return !!(keyId && keyId.trim() !== "" && keySecret && keySecret.trim() !== "");
  }

  private getInstance(): Razorpay {
    const keyId = this.getKeyId();
    const keySecret = this.getKeySecret();

    if (!keyId || !keySecret) {
      throw new Error("Razorpay credentials (RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET) are missing.");
    }

    if (!this.instance) {
      this.instance = new Razorpay({
        key_id: keyId,
        key_secret: keySecret,
      });
    }

    return this.instance;
  }

  async createOrder(context: AuthorizedPaymentContext): Promise<OrderCreationResult> {
    const instance = this.getInstance();
    const minorUnits = toMinorUnits(context.amount, context.currency);
    const keyId = this.getKeyId()!;

    // Create official Razorpay Test-Mode Order
    const orderOptions = {
      amount: minorUnits,
      currency: context.currency || "INR",
      receipt: `rcpt_${context.decisionId.substring(0, 10)}`,
      notes: {
        intent_id: context.intentId,
        decision_id: context.decisionId,
        approval_id: context.approvalId || "auto",
        action: context.action,
      },
    };

    const order = await instance.orders.create(orderOptions);

    return {
      orderId: order.id,
      amount: context.amount,
      amountInMinorUnits: minorUnits,
      currency: context.currency || "INR",
      keyId,
      paymentRail: "razorpay_test",
      receipt: order.receipt,
      notes: orderOptions.notes,
    };
  }

  async verifyPayment(params: VerificationParams): Promise<VerificationResult> {
    const keySecret = this.getKeySecret();
    if (!keySecret) {
      return {
        verified: false,
        gatewayTransactionId: params.paymentId,
        amount: params.expectedAmount,
        currency: params.expectedCurrency,
        error: "RAZORPAY_SECRET_MISSING",
      };
    }

    if (!params.signature) {
      return {
        verified: false,
        gatewayTransactionId: params.paymentId,
        amount: params.expectedAmount,
        currency: params.expectedCurrency,
        error: "SIGNATURE_MISSING",
      };
    }

    const isValid = verifyRazorpaySignature(
      params.orderId,
      params.paymentId,
      params.signature,
      keySecret
    );

    if (!isValid) {
      return {
        verified: false,
        gatewayTransactionId: params.paymentId,
        amount: params.expectedAmount,
        currency: params.expectedCurrency,
        error: "INVALID_RAZORPAY_SIGNATURE",
      };
    }

    return {
      verified: true,
      gatewayTransactionId: params.paymentId,
      amount: params.expectedAmount,
      currency: params.expectedCurrency,
    };
  }
}

export const razorpayTestPaymentProvider = new RazorpayTestPaymentProvider();
