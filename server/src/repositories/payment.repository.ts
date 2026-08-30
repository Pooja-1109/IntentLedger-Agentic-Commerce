import { PaymentExecution } from "../types";
import { isMongoConnected } from "../config/database";
import { mongoPaymentRepository } from "./mongodb/mongo-payment.repository";

export interface IPaymentRepository {
  create(payment: PaymentExecution): Promise<PaymentExecution>;
  findById(id: string): Promise<PaymentExecution | null>;
  findByIntentId(intentId: string): Promise<PaymentExecution[]>;
  update(id: string, updates: Partial<PaymentExecution>): Promise<PaymentExecution | null>;
  list(): Promise<PaymentExecution[]>;
  count(): Promise<{ total: number; completed: number; blocked: number }>;
}

class InMemoryPaymentRepository implements IPaymentRepository {
  private payments: Map<string, PaymentExecution> = new Map();

  async create(payment: PaymentExecution): Promise<PaymentExecution> {
    this.payments.set(payment.id, payment);
    return payment;
  }

  async findById(id: string): Promise<PaymentExecution | null> {
    return this.payments.get(id) || null;
  }

  async findByIntentId(intentId: string): Promise<PaymentExecution[]> {
    return Array.from(this.payments.values())
      .filter((p) => p.intentId === intentId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async update(id: string, updates: Partial<PaymentExecution>): Promise<PaymentExecution | null> {
    const existing = this.payments.get(id);
    if (!existing) return null;
    const updated: PaymentExecution = {
      ...existing,
      ...updates,
    };
    this.payments.set(id, updated);
    return updated;
  }

  async list(): Promise<PaymentExecution[]> {
    return Array.from(this.payments.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async count(): Promise<{ total: number; completed: number; blocked: number }> {
    const all = Array.from(this.payments.values());
    const completed = all.filter((p) => p.status === "COMPLETED").length;
    const blocked = all.filter((p) => p.status === "BLOCKED").length;
    return { total: all.length, completed, blocked };
  }
}

export const inMemoryPaymentRepository = new InMemoryPaymentRepository();

export const paymentRepository: IPaymentRepository = {
  async create(payment: PaymentExecution) {
    if (isMongoConnected()) {
      return mongoPaymentRepository.create(payment);
    }
    return inMemoryPaymentRepository.create(payment);
  },
  async findById(id: string) {
    if (isMongoConnected()) {
      return mongoPaymentRepository.findById(id);
    }
    return inMemoryPaymentRepository.findById(id);
  },
  async findByIntentId(intentId: string) {
    if (isMongoConnected()) {
      return mongoPaymentRepository.findByIntentId(intentId);
    }
    return inMemoryPaymentRepository.findByIntentId(intentId);
  },
  async update(id: string, updates: Partial<PaymentExecution>) {
    if (isMongoConnected()) {
      return mongoPaymentRepository.update(id, updates);
    }
    return inMemoryPaymentRepository.update(id, updates);
  },
  async list() {
    if (isMongoConnected()) {
      return mongoPaymentRepository.list();
    }
    return inMemoryPaymentRepository.list();
  },
  async count() {
    if (isMongoConnected()) {
      return mongoPaymentRepository.count();
    }
    return inMemoryPaymentRepository.count();
  },
};
