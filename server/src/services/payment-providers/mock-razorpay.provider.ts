import { v4 as uuidv4 } from "uuid";
import { AuthorizedPaymentContext } from "../../types";
import { toMinorUnits } from "../../utils/currency.util";
import { verifyRazorpaySignature } from "../../integrations/razorpay/razorpay.util";
import {
  IPaymentProvider,
  OrderCreationResult,
  VerificationParams,
  VerificationResult,
} from "./payment-provider.interface";

export class MockRazorpayProvider implements IPaymentProvider {
  name = "razorpay_test" as const;
  public mockSecret = "mock_secret_key_12345";
  public mockKeyId = "rzp_test_mock_12345";
  public shouldFailSignature = false;
  public lastCreatedOrder: OrderCreationResult | null = null;

  isConfigured(): boolean {
    return true;
  }

  async createOrder(context: AuthorizedPaymentContext): Promise<OrderCreationResult> {
    const orderId = `order_mock_${uuidv4().substring(0, 10)}`;
    const minorUnits = toMinorUnits(context.amount, context.currency);

    const result: OrderCreationResult = {
      orderId,
      amount: context.amount,
      amountInMinorUnits: minorUnits,
      currency: context.currency || "INR",
      keyId: this.mockKeyId,
      paymentRail: "razorpay_test",
      receipt: `rcpt_mock_${context.decisionId.substring(0, 8)}`,
      notes: {
        intent_id: context.intentId,
        decision_id: context.decisionId,
        approval_id: context.approvalId || "auto",
        action: context.action,
      },
    };

    this.lastCreatedOrder = result;
    return result;
  }

  async verifyPayment(params: VerificationParams): Promise<VerificationResult> {
    if (this.shouldFailSignature) {
      return {
        verified: false,
        gatewayTransactionId: params.paymentId,
        amount: params.expectedAmount,
        currency: params.expectedCurrency,
        error: "INVALID_RAZORPAY_SIGNATURE",
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
      this.mockSecret
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

export const mockRazorpayProvider = new MockRazorpayProvider();
