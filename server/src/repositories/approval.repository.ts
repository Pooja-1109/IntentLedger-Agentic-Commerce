import { ApprovalRequest } from "../types";
import { isMongoConnected } from "../config/database";
import { mongoApprovalRepository } from "./mongodb/mongo-approval.repository";

export interface IApprovalRepository {
  create(approval: ApprovalRequest): Promise<ApprovalRequest>;
  findById(id: string): Promise<ApprovalRequest | null>;
  findPending(): Promise<ApprovalRequest[]>;
  findByIntentId(intentId: string): Promise<ApprovalRequest[]>;
  update(id: string, updates: Partial<ApprovalRequest>): Promise<ApprovalRequest | null>;
  list(): Promise<ApprovalRequest[]>;
  count(): Promise<{ total: number; pending: number }>;
}

class InMemoryApprovalRepository implements IApprovalRepository {
  private approvals: Map<string, ApprovalRequest> = new Map();

  async create(approval: ApprovalRequest): Promise<ApprovalRequest> {
    this.approvals.set(approval.id, approval);
    return approval;
  }

  async findById(id: string): Promise<ApprovalRequest | null> {
    return this.approvals.get(id) || null;
  }

  async findPending(): Promise<ApprovalRequest[]> {
    return Array.from(this.approvals.values())
      .filter((a) => a.status === "PENDING")
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async findByIntentId(intentId: string): Promise<ApprovalRequest[]> {
    return Array.from(this.approvals.values())
      .filter((a) => a.intentId === intentId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async update(id: string, updates: Partial<ApprovalRequest>): Promise<ApprovalRequest | null> {
    const existing = this.approvals.get(id);
    if (!existing) return null;
    const updated: ApprovalRequest = {
      ...existing,
      ...updates,
    };
    this.approvals.set(id, updated);
    return updated;
  }

  async list(): Promise<ApprovalRequest[]> {
    return Array.from(this.approvals.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async count(): Promise<{ total: number; pending: number }> {
    const all = Array.from(this.approvals.values());
    const pending = all.filter((a) => a.status === "PENDING").length;
    return { total: all.length, pending };
  }
}

export const inMemoryApprovalRepository = new InMemoryApprovalRepository();

export const approvalRepository: IApprovalRepository = {
  async create(approval: ApprovalRequest) {
    if (isMongoConnected()) {
      return mongoApprovalRepository.create(approval);
    }
    return inMemoryApprovalRepository.create(approval);
  },
  async findById(id: string) {
    if (isMongoConnected()) {
      return mongoApprovalRepository.findById(id);
    }
    return inMemoryApprovalRepository.findById(id);
  },
  async findPending() {
    if (isMongoConnected()) {
      return mongoApprovalRepository.findPending();
    }
    return inMemoryApprovalRepository.findPending();
  },
  async findByIntentId(intentId: string) {
    if (isMongoConnected()) {
      return mongoApprovalRepository.findByIntentId(intentId);
    }
    return inMemoryApprovalRepository.findByIntentId(intentId);
  },
  async update(id: string, updates: Partial<ApprovalRequest>) {
    if (isMongoConnected()) {
      return mongoApprovalRepository.update(id, updates);
    }
    return inMemoryApprovalRepository.update(id, updates);
  },
  async list() {
    if (isMongoConnected()) {
      return mongoApprovalRepository.list();
    }
    return inMemoryApprovalRepository.list();
  },
  async count() {
    if (isMongoConnected()) {
      return mongoApprovalRepository.count();
    }
    return inMemoryApprovalRepository.count();
  },
};
