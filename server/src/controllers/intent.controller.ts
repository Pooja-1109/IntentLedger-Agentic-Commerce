import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { ApiResponse, Intent } from "../types";
import { intentService } from "../services/intent.service";
import { AppError } from "../middleware/error.middleware";

const compileIntentSchema = z.object({
  rawText: z.string().min(3, "Raw intent text must be at least 3 characters long"),
});

const createIntentSchema = z.object({
  rawText: z.string().min(3, "Raw intent text must be at least 3 characters long"),
  userId: z.string().optional(),
  category: z.enum(["shopping", "payment", "subscription", "transfer", "other"]).optional(),
  constraints: z
    .object({
      maxAmount: z.number().positive().optional(),
      currency: z.string().optional(),
      merchant: z.string().optional(),
      productCategory: z.string().optional(),
      allowedMerchants: z.array(z.string()).optional(),
      blockedMerchants: z.array(z.string()).optional(),
      quantity: z.number().int().positive().optional(),
      requiresApproval: z.boolean(),
    })
    .optional(),
  permissions: z
    .object({
      canPurchase: z.boolean().optional(),
      canSubscribe: z.boolean().optional(),
      canTransfer: z.boolean().optional(),
      canChangeQuantity: z.boolean().optional(),
    })
    .optional(),
});

export const compileIntentHandler = async (
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction
): Promise<void> => {
  try {
    const validated = compileIntentSchema.parse(req.body);
    const compiled = await intentService.compileRawIntent(validated.rawText);

    res.status(200).json({
      success: true,
      data: compiled,
      meta: {
        timestamp: new Date().toISOString(),
        mode: compiled.mode,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createIntentHandler = async (
  req: Request,
  res: Response<ApiResponse<Intent>>,
  next: NextFunction
): Promise<void> => {
  try {
    const validated = createIntentSchema.parse(req.body);
    const created = await intentService.createIntent(validated);

    res.status(201).json({
      success: true,
      data: created,
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getAllIntentsHandler = async (
  req: Request,
  res: Response<ApiResponse<Intent[]>>,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId, status } = req.query as { userId?: string; status?: string };
    const intents = await intentService.getAllIntents({ userId, status });

    res.status(200).json({
      success: true,
      data: intents,
      meta: {
        timestamp: new Date().toISOString(),
        total: intents.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getIntentByIdHandler = async (
  req: Request,
  res: Response<ApiResponse<Intent>>,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const intent = await intentService.getIntentById(id);

    if (!intent) {
      throw new AppError(`Intent with ID '${id}' not found`, 404, "INTENT_NOT_FOUND");
    }

    res.status(200).json({
      success: true,
      data: intent,
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};
