import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { ApiResponse, AvailabilityResult, AgentProposal } from "../types";
import { intentRepository } from "../repositories/intent.repository";
import { availabilityService } from "../services/availability.service";
import { AppError } from "../middleware/error.middleware";

export const getAvailabilityHandler = async (
  req: Request,
  res: Response<ApiResponse<AvailabilityResult>>,
  next: NextFunction
): Promise<void> => {
  try {
    const { intentId } = req.params;
    if (!intentId) {
      throw new AppError("intentId is required", 400, "INVALID_INPUT");
    }

    const intent = await intentRepository.findById(intentId);
    if (!intent) {
      throw new AppError(`Intent with ID '${intentId}' not found`, 404, "INTENT_NOT_FOUND");
    }

    const result = availabilityService.getCandidatesForIntent(intent);

    res.status(200).json({
      success: true,
      data: result,
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

const proposeSchema = z.object({
  intentId: z.string().min(1, "intentId is required"),
  candidateId: z.string().optional(),
});

export const proposeCandidateHandler = async (
  req: Request,
  res: Response<ApiResponse<AgentProposal>>,
  next: NextFunction
): Promise<void> => {
  try {
    const { intentId, candidateId } = proposeSchema.parse(req.body);

    const intent = await intentRepository.findById(intentId);
    if (!intent) {
      throw new AppError(`Intent with ID '${intentId}' not found`, 404, "INTENT_NOT_FOUND");
    }

    const proposal = availabilityService.generateProposalForIntent(intent, candidateId);

    res.status(200).json({
      success: true,
      data: proposal,
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};
