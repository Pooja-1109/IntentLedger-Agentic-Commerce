import { v4 as uuidv4 } from "uuid";
import { AuthorizedPaymentContext } from "../../types";
import { toMinorUnits } from "../../utils/currency.util";
import {
  IPaymentProvider,
  OrderCreationResult,
  VerificationParams,
  VerificationResult,
} from "./payment-provider.interface";

export class SimulatedPaymentProvider implements IPaymentProvider {
  name = "simulated" as const;

  isConfigured(): boolean {
    return true;
  }

  async createOrder(context: AuthorizedPaymentContext): Promise<OrderCreationResult> {
    const orderId = `order_sim_${uuidv4().substring(0, 10)}`;
    const minorUnits = toMinorUnits(context.amount, context.currency);

    return {
      orderId,
      amount: context.amount,
      amountInMinorUnits: minorUnits,
      currency: context.currency,
      paymentRail: "simulated",
      receipt: `rcpt_sim_${context.decisionId.substring(0, 8)}`,
      notes: {
        intent_id: context.intentId,
        decision_id: context.decisionId,
        approval_id: context.approvalId || "auto",
        action: context.action,
      },
    };
  }

  async verifyPayment(params: VerificationParams): Promise<VerificationResult> {
    const txId = params.paymentId || `rzp_sim_${uuidv4().substring(0, 10)}`;
    return {
      verified: true,
      gatewayTransactionId: txId,
      amount: params.expectedAmount,
      currency: params.expectedCurrency,
    };
  }
}

export const simulatedPaymentProvider = new SimulatedPaymentProvider();
