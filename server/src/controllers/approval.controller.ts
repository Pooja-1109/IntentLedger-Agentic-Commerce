import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { ApiResponse, ApprovalRequest } from "../types";
import { approvalService } from "../services/approval.service";
import { AppError } from "../middleware/error.middleware";

export const getApprovalsHandler = async (
  req: Request,
  res: Response<ApiResponse<ApprovalRequest[]>>,
  next: NextFunction
): Promise<void> => {
  try {
    const { status, intentId } = req.query as { status?: string; intentId?: string };

    let approvals: ApprovalRequest[];
    if (intentId) {
      approvals = await approvalService.getApprovalsByIntentId(intentId);
    } else if (status === "all") {
      approvals = await approvalService.getAllApprovals();
    } else {
      approvals = await approvalService.getPendingApprovals();
    }

    res.status(200).json({
      success: true,
      data: approvals,
      meta: {
        timestamp: new Date().toISOString(),
        total: approvals.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getApprovalByIdHandler = async (
  req: Request,
  res: Response<ApiResponse<ApprovalRequest>>,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const approval = await approvalService.getApprovalById(id);

    if (!approval) {
      throw new AppError(`Approval request '${id}' not found`, 404, "APPROVAL_NOT_FOUND");
    }

    res.status(200).json({
      success: true,
      data: approval,
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const approveApprovalHandler = async (
  req: Request,
  res: Response<ApiResponse<ApprovalRequest>>,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const approved = await approvalService.approveRequest(id);

    res.status(200).json({
      success: true,
      data: approved,
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

const rejectSchema = z.object({
  reason: z.string().optional(),
});

export const rejectApprovalHandler = async (
  req: Request,
  res: Response<ApiResponse<ApprovalRequest>>,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const body = rejectSchema.parse(req.body || {});
    const rejected = await approvalService.rejectRequest(id, body.reason);

    res.status(200).json({
      success: true,
      data: rejected,
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};
