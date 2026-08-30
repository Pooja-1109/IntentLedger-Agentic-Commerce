import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import {
  ApiResponse,
  PaymentExecution,
  RazorpayCheckoutData,
} from "../types";
import { paymentService } from "../services/payment.service";
import { AppError } from "../middleware/error.middleware";
import { verifyRazorpayWebhookSignature } from "../integrations/razorpay/razorpay.util";
import { ledgerRepository } from "../repositories/ledger.repository";

const authorizeSchema = z.object({
  intentId: z.string().min(1, "intentId is required"),
  proposal: z.object({
    id: z.string(),
    intentId: z.string(),
    agentId: z.string().optional(),
    agentName: z.string().optional(),
    product: z.string().min(1, "Product name is required"),
    merchant: z.string().min(1, "Merchant name is required"),
    amount: z.number().positive("Amount must be a positive number"),
    currency: z.string().default("INR"),
    quantity: z.number().int().positive().default(1),
    action: z.enum(["purchase", "subscribe", "transfer", "quote", "reserve"]).default("purchase"),
    isSubscription: z.boolean().optional(),
    subscriptionFrequency: z.enum(["weekly", "monthly", "yearly"]).optional(),
    proposedAt: z.string().optional(),
  }),
  approvalId: z.string().optional(),
  approvalToken: z.string().optional(),
});

const createOrderSchema = z.object({
  paymentId: z.string().min(1, "paymentId is required"),
});

const verifyPaymentSchema = z.object({
  razorpay_order_id: z.string().min(1, "razorpay_order_id is required"),
  razorpay_payment_id: z.string().min(1, "razorpay_payment_id is required"),
  razorpay_signature: z.string().min(1, "razorpay_signature is required"),
  internalPaymentId: z.string().min(1, "internalPaymentId is required"),
});

export const authorizePaymentHandler = async (
  req: Request,
  res: Response<ApiResponse<PaymentExecution>>,
  next: NextFunction
): Promise<void> => {
  try {
    const validated = authorizeSchema.parse(req.body);

    const payment = await paymentService.authorizePayment({
      intentId: validated.intentId,
      proposal: {
        ...validated.proposal,
        proposedAt: validated.proposal.proposedAt || new Date().toISOString(),
      },
      approvalId: validated.approvalId,
      approvalToken: validated.approvalToken,
    });

    res.status(200).json({
      success: true,
      data: payment,
      meta: {
        timestamp: new Date().toISOString(),
        paymentRail: payment.paymentRail,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createOrderHandler = async (
  req: Request,
  res: Response<ApiResponse<RazorpayCheckoutData>>,
  next: NextFunction
): Promise<void> => {
  try {
    const paymentId = req.params.id || req.body.paymentId;
    const validated = createOrderSchema.parse({ paymentId });

    const checkoutData = await paymentService.createPaymentOrder(validated.paymentId);

    res.status(200).json({
      success: true,
      data: checkoutData,
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const verifyPaymentHandler = async (
  req: Request,
  res: Response<ApiResponse<PaymentExecution>>,
  next: NextFunction
): Promise<void> => {
  try {
    const validated = verifyPaymentSchema.parse(req.body);

    const verifiedPayment = await paymentService.verifyPayment(validated);

    res.status(200).json({
      success: true,
      data: verifiedPayment,
      meta: {
        timestamp: new Date().toISOString(),
        status: "VERIFIED",
      },
    });
  } catch (error) {
    next(error);
  }
};

export const completePaymentHandler = async (
  req: Request,
  res: Response<ApiResponse<PaymentExecution>>,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const completed = await paymentService.completePayment(id);

    res.status(200).json({
      success: true,
      data: completed,
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getPaymentByIdHandler = async (
  req: Request,
  res: Response<ApiResponse<PaymentExecution>>,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const payment = await paymentService.getPaymentById(id);

    if (!payment) {
      throw new AppError(`Payment with ID '${id}' not found`, 404, "PAYMENT_NOT_FOUND");
    }

    res.status(200).json({
      success: true,
      data: payment,
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const listPaymentsHandler = async (
  req: Request,
  res: Response<ApiResponse<PaymentExecution[]>>,
  next: NextFunction
): Promise<void> => {
  try {
    const { intentId } = req.query as { intentId?: string };

    let payments: PaymentExecution[];
    if (intentId) {
      payments = await paymentService.getPaymentsByIntentId(intentId);
    } else {
      payments = await paymentService.listPayments();
    }

    res.status(200).json({
      success: true,
      data: payments,
      meta: {
        timestamp: new Date().toISOString(),
        total: payments.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const razorpayWebhookHandler = async (
  req: Request,
  res: Response<ApiResponse<{ message: string }>>,
  next: NextFunction
): Promise<void> => {
  try {
    const signature = req.headers["x-razorpay-signature"] as string;
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (webhookSecret && signature) {
      const rawBody = JSON.stringify(req.body);
      const isValid = verifyRazorpayWebhookSignature(rawBody, signature, webhookSecret);
      if (!isValid) {
        throw new AppError("Invalid Razorpay webhook signature", 400, "INVALID_WEBHOOK_SIGNATURE");
      }
    }

    const event = req.body.event || "unknown_event";
    const entity = req.body.payload?.payment?.entity || {};

    await ledgerRepository.append({
      id: `evt_wh_${Date.now()}`,
      intentId: entity.notes?.intent_id || "intent_webhook",
      eventType: "WEBHOOK_RECEIVED",
      timestamp: new Date().toISOString(),
      actor: "PAYMENT_GATEWAY",
      summary: `Razorpay Webhook received: Event '${event}' for payment '${entity.id || "N/A"}'.`,
      metadata: {
        event,
        paymentId: entity.id,
        amount: entity.amount,
      },
    });

    res.status(200).json({
      success: true,
      data: { message: "Webhook acknowledged" },
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    next(error);
  }
};
