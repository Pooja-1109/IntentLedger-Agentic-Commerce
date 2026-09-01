import axios, { AxiosError } from "axios";
import {
  ApiResponse,
  Intent,
  LedgerEvent,
  DecisionResult,
  AgentProposal,
  DemoScenario,
  ApprovalRequest,
  PaymentExecution,
  SystemStats,
  RazorpayCheckoutData,
  RazorpayVerificationPayload,
} from "../types";

const api = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

export interface HealthCheckData {
  status: string;
  service: string;
  version: string;
  uptime: number;
  environment: string;
  services: {
    api: string;
    database: string;
    intentCompiler: string;
    decisionEngine: string;
    ledger: string;
    paymentRail: string;
  };
  paymentRail: {
    mode: string;
    status: string;
    keyIdConfigured: boolean;
    keySecretConfigured: boolean;
  };
  database: {
    type: string;
    status: string;
    stats: {
      activeIntents: number;
      ledgerEvents: number;
    };
  };
  aiCompiler: {
    provider: string;
    status: string;
    mode: string;
  };
}

export interface CompiledIntentResponse {
  category: Intent["category"];
  constraints: Intent["constraints"];
  permissions: Intent["permissions"];
  mode: "ai" | "deterministic_fallback";
  compiler: "gemini" | "rules";
  confidenceScore: number | null;
  interpretation?: {
    budget: string;
    category: string;
    approval: string;
    permissions: string;
    productName?: string;
    quantity?: number;
    merchant?: string;
    prohibitions?: string;
  };
  warnings?: string[];
}

export interface DashboardSummaryData {
  activeIntents: number;
  decisionsEvaluated: number;
  driftDetected: number;
  approvalRequests: number;
  payments: number;
  blockedActions: number;
  successfulPayments: number;
  razorpayTestOrders: number;
  verifiedPayments: number;
  paymentFailures: number;
  contextMismatches: number;
}

export interface EvaluateProposalPayload {
  intentId: string;
  proposal: {
    product: string;
    merchant: string;
    amount: number;
    currency: string;
    quantity: number;
    action: AgentProposal["action"];
    isSubscription?: boolean;
    subscriptionFrequency?: "weekly" | "monthly" | "yearly";
    agentName?: string;
  };
}

export const apiService = {
  // Health & Stats
  async getHealth(): Promise<HealthCheckData> {
    try {
      const response = await api.get<ApiResponse<HealthCheckData>>("/health");
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error("Failed to fetch health data");
    } catch (error) {
      if (error instanceof AxiosError && error.response?.data?.error?.message) {
        throw new Error(error.response.data.error.message);
      }
      throw error;
    }
  },

  async getStats(): Promise<SystemStats> {
    try {
      const response = await api.get<ApiResponse<SystemStats>>("/stats");
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error("Failed to fetch system stats");
    } catch (error) {
      if (error instanceof AxiosError && error.response?.data?.error?.message) {
        throw new Error(error.response.data.error.message);
      }
      throw error;
    }
  },

  // Dashboard Live Data
  async getDashboardSummary(): Promise<DashboardSummaryData> {
    try {
      const response = await api.get<ApiResponse<DashboardSummaryData>>("/dashboard/summary");
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error("Failed to fetch dashboard summary");
    } catch (error) {
      if (error instanceof AxiosError && error.response?.data?.error?.message) {
        throw new Error(error.response.data.error.message);
      }
      throw error;
    }
  },

  async getDashboardActivity(): Promise<LedgerEvent[]> {
    try {
      const response = await api.get<ApiResponse<LedgerEvent[]>>("/dashboard/activity");
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      return [];
    } catch (error) {
      if (error instanceof AxiosError && error.response?.data?.error?.message) {
        throw new Error(error.response.data.error.message);
      }
      throw error;
    }
  },

  async resetDemo(): Promise<string> {
    try {
      const response = await api.post<ApiResponse<{ message: string }>>("/demo/reset");
      return response.data.data?.message || "Demo state reset successfully.";
    } catch (error) {
      if (error instanceof AxiosError && error.response?.data?.error?.message) {
        throw new Error(error.response.data.error.message);
      }
      throw error;
    }
  },

  // Intent Compilation
  async compileIntent(rawText: string): Promise<CompiledIntentResponse> {
    try {
      const response = await api.post<ApiResponse<CompiledIntentResponse>>("/intents/compile", { rawText });
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error("Compilation response invalid");
    } catch (error) {
      if (error instanceof AxiosError && error.response?.data?.error?.message) {
        throw new Error(error.response.data.error.message);
      }
      throw error;
    }
  },

  // Intent Creation
  async createIntent(data: {
    rawText: string;
    userId?: string;
    category?: Intent["category"];
    constraints?: Partial<Intent["constraints"]>;
    permissions?: Partial<Intent["permissions"]>;
  }): Promise<Intent> {
    try {
      const response = await api.post<ApiResponse<Intent>>("/intents", data);
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error("Failed to create intent");
    } catch (error) {
      if (error instanceof AxiosError && error.response?.data?.error?.message) {
        throw new Error(error.response.data.error.message);
      }
      throw error;
    }
  },

  // Get all intents
  async getIntents(filters?: { userId?: string; status?: string }): Promise<Intent[]> {
    try {
      const response = await api.get<ApiResponse<Intent[]>>("/intents", { params: filters });
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      return [];
    } catch (error) {
      if (error instanceof AxiosError && error.response?.data?.error?.message) {
        throw new Error(error.response.data.error.message);
      }
      throw error;
    }
  },

  // Get intent by ID
  async getIntentById(id: string): Promise<Intent> {
    try {
      const response = await api.get<ApiResponse<Intent>>(`/intents/${id}`);
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error(`Intent ${id} not found`);
    } catch (error) {
      if (error instanceof AxiosError && error.response?.data?.error?.message) {
        throw new Error(error.response.data.error.message);
      }
      throw error;
    }
  },

  // Decision Evaluation
  async evaluateProposal(payload: EvaluateProposalPayload): Promise<DecisionResult> {
    try {
      const response = await api.post<ApiResponse<DecisionResult>>("/decisions/evaluate", payload);
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error("Decision evaluation failed");
    } catch (error) {
      if (error instanceof AxiosError && error.response?.data?.error?.message) {
        throw new Error(error.response.data.error.message);
      }
      throw error;
    }
  },

  // Get decision history for an intent
  async getDecisionsByIntentId(intentId: string): Promise<DecisionResult[]> {
    try {
      const response = await api.get<ApiResponse<DecisionResult[]>>(`/decisions/${intentId}`);
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      return [];
    } catch (error) {
      if (error instanceof AxiosError && error.response?.data?.error?.message) {
        throw new Error(error.response.data.error.message);
      }
      throw error;
    }
  },

  // Get Demo Scenarios
  async getDemoScenarios(): Promise<DemoScenario[]> {
    try {
      const response = await api.get<ApiResponse<DemoScenario[]>>("/demo/scenarios");
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      return [];
    } catch (error) {
      if (error instanceof AxiosError && error.response?.data?.error?.message) {
        throw new Error(error.response.data.error.message);
      }
      throw error;
    }
  },

  // Approvals
  async getApprovals(status?: string, intentId?: string): Promise<ApprovalRequest[]> {
    try {
      const response = await api.get<ApiResponse<ApprovalRequest[]>>("/approvals", {
        params: { status, intentId },
      });
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      return [];
    } catch (error) {
      if (error instanceof AxiosError && error.response?.data?.error?.message) {
        throw new Error(error.response.data.error.message);
      }
      throw error;
    }
  },

  async getApprovalById(id: string): Promise<ApprovalRequest> {
    try {
      const response = await api.get<ApiResponse<ApprovalRequest>>(`/approvals/${id}`);
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error(`Approval ${id} not found`);
    } catch (error) {
      if (error instanceof AxiosError && error.response?.data?.error?.message) {
        throw new Error(error.response.data.error.message);
      }
      throw error;
    }
  },

  async approveApproval(id: string): Promise<ApprovalRequest> {
    try {
      const response = await api.post<ApiResponse<ApprovalRequest>>(`/approvals/${id}/approve`);
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error("Approval failed");
    } catch (error) {
      if (error instanceof AxiosError && error.response?.data?.error?.message) {
        throw new Error(error.response.data.error.message);
      }
      throw error;
    }
  },

  async rejectApproval(id: string, reason?: string): Promise<ApprovalRequest> {
    try {
      const response = await api.post<ApiResponse<ApprovalRequest>>(`/approvals/${id}/reject`, { reason });
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error("Rejection failed");
    } catch (error) {
      if (error instanceof AxiosError && error.response?.data?.error?.message) {
        throw new Error(error.response.data.error.message);
      }
      throw error;
    }
  },

  // Payments
  async authorizePayment(payload: {
    intentId: string;
    proposal: AgentProposal;
    approvalId?: string;
    approvalToken?: string;
  }): Promise<PaymentExecution> {
    try {
      const response = await api.post<ApiResponse<PaymentExecution>>("/payments/authorize", payload);
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error("Payment authorization failed");
    } catch (error) {
      if (error instanceof AxiosError && error.response?.data?.error?.message) {
        throw new Error(error.response.data.error.message);
      }
      throw error;
    }
  },

  async createRazorpayOrder(paymentId: string): Promise<RazorpayCheckoutData> {
    try {
      const response = await api.post<ApiResponse<RazorpayCheckoutData>>(`/payments/${paymentId}/order`);
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error("Order creation failed");
    } catch (error) {
      if (error instanceof AxiosError && error.response?.data?.error?.message) {
        throw new Error(error.response.data.error.message);
      }
      throw error;
    }
  },

  async verifyRazorpayPayment(payload: RazorpayVerificationPayload): Promise<PaymentExecution> {
    try {
      const response = await api.post<ApiResponse<PaymentExecution>>("/payments/razorpay/verify", payload);
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error("Payment signature verification failed");
    } catch (error) {
      if (error instanceof AxiosError && error.response?.data?.error?.message) {
        throw new Error(error.response.data.error.message);
      }
      throw error;
    }
  },

  async completePayment(id: string): Promise<PaymentExecution> {
    try {
      const response = await api.post<ApiResponse<PaymentExecution>>(`/payments/${id}/complete`);
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error("Payment completion failed");
    } catch (error) {
      if (error instanceof AxiosError && error.response?.data?.error?.message) {
        throw new Error(error.response.data.error.message);
      }
      throw error;
    }
  },

  async getPayments(intentId?: string): Promise<PaymentExecution[]> {
    try {
      const response = await api.get<ApiResponse<PaymentExecution[]>>("/payments", {
        params: { intentId },
      });
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      return [];
    } catch (error) {
      if (error instanceof AxiosError && error.response?.data?.error?.message) {
        throw new Error(error.response.data.error.message);
      }
      throw error;
    }
  },

  // Ledger
  async getLedgerEvents(filters?: { intentId?: string; eventType?: string }): Promise<LedgerEvent[]> {
    try {
      const response = await api.get<ApiResponse<LedgerEvent[]>>("/ledger", { params: filters });
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      return [];
    } catch (error) {
      if (error instanceof AxiosError && error.response?.data?.error?.message) {
        throw new Error(error.response.data.error.message);
      }
      throw error;
    }
  },

  async getLedgerByIntentId(intentId: string): Promise<LedgerEvent[]> {
    try {
      const response = await api.get<ApiResponse<LedgerEvent[]>>(`/ledger/${intentId}`);
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      return [];
    } catch (error) {
      if (error instanceof AxiosError && error.response?.data?.error?.message) {
        throw new Error(error.response.data.error.message);
      }
      throw error;
    }
  },
};

export default api;
