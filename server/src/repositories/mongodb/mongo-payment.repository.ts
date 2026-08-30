import { PaymentExecution } from "../../types";
import { IPaymentRepository } from "../payment.repository";
import { PaymentModel } from "./models";

export class MongoPaymentRepository implements IPaymentRepository {
  async create(payment: PaymentExecution): Promise<PaymentExecution> {
    await PaymentModel.create({
      _id: payment.id,
      ...payment,
    });
    return payment;
  }

  async findById(id: string): Promise<PaymentExecution | null> {
    const doc = await PaymentModel.findById(id).lean();
    if (!doc) return null;
    const { _id, ...rest } = doc as any;
    return { id: _id, ...rest };
  }

  async findByIntentId(intentId: string): Promise<PaymentExecution[]> {
    const docs = await PaymentModel.find({ intentId }).sort({ createdAt: -1 }).lean();
    return docs.map((doc: any) => {
      const { _id, ...rest } = doc;
      return { id: _id, ...rest };
    });
  }

  async update(id: string, updates: Partial<PaymentExecution>): Promise<PaymentExecution | null> {
    const updated = await PaymentModel.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true }
    ).lean();
    if (!updated) return null;
    const { _id, ...rest } = updated as any;
    return { id: _id, ...rest };
  }

  async list(): Promise<PaymentExecution[]> {
    const docs = await PaymentModel.find().sort({ createdAt: -1 }).lean();
    return docs.map((doc: any) => {
      const { _id, ...rest } = doc;
      return { id: _id, ...rest };
    });
  }

  async count(): Promise<{ total: number; completed: number; blocked: number }> {
    const [total, completed, blocked] = await Promise.all([
      PaymentModel.countDocuments(),
      PaymentModel.countDocuments({ status: "COMPLETED" }),
      PaymentModel.countDocuments({ status: "BLOCKED" }),
    ]);
    return { total, completed, blocked };
  }
}

export const mongoPaymentRepository = new MongoPaymentRepository();
