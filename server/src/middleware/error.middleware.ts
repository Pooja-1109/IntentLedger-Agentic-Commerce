import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { ApiResponse } from "../types";

export class AppError extends Error {
  public statusCode: number;
  public code: string;
  public details?: unknown;

  constructor(message: string, statusCode = 400, code = "BAD_REQUEST", details?: unknown) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export const errorHandler = (
  err: Error | AppError | ZodError,
  _req: Request,
  res: Response<ApiResponse>,
  _next: NextFunction
): void => {
  // Check if Zod Validation Error
  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid request payload schema",
        details: err.errors.map((e) => ({
          path: e.path.join("."),
          message: e.message,
        })),
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
    return;
  }

  // Check if Custom AppError
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
    return;
  }

  // Fallback 500
  console.error("[ServerError]:", err);
  res.status(500).json({
    success: false,
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: err.message || "An unexpected internal server error occurred",
    },
    meta: {
      timestamp: new Date().toISOString(),
    },
  });
};
