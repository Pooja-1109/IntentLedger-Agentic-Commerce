import { ApprovalRequest } from "../../types";
import { IApprovalRepository } from "../approval.repository";
import { ApprovalModel } from "./models";

export class MongoApprovalRepository implements IApprovalRepository {
  async create(approval: ApprovalRequest): Promise<ApprovalRequest> {
    await ApprovalModel.create({
      _id: approval.id,
      ...approval,
    });
    return approval;
  }

  async findById(id: string): Promise<ApprovalRequest | null> {
    const doc = await ApprovalModel.findById(id).lean();
    if (!doc) return null;
    const { _id, ...rest } = doc as any;
    return { id: _id, ...rest };
  }

  async findPending(): Promise<ApprovalRequest[]> {
    const docs = await ApprovalModel.find({ status: "PENDING" }).sort({ createdAt: -1 }).lean();
    return docs.map((doc: any) => {
      const { _id, ...rest } = doc;
      return { id: _id, ...rest };
    });
  }

  async findByIntentId(intentId: string): Promise<ApprovalRequest[]> {
    const docs = await ApprovalModel.find({ intentId }).sort({ createdAt: -1 }).lean();
    return docs.map((doc: any) => {
      const { _id, ...rest } = doc;
      return { id: _id, ...rest };
    });
  }

  async update(id: string, updates: Partial<ApprovalRequest>): Promise<ApprovalRequest | null> {
    const updated = await ApprovalModel.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true }
    ).lean();
    if (!updated) return null;
    const { _id, ...rest } = updated as any;
    return { id: _id, ...rest };
  }

  async list(): Promise<ApprovalRequest[]> {
    const docs = await ApprovalModel.find().sort({ createdAt: -1 }).lean();
    return docs.map((doc: any) => {
      const { _id, ...rest } = doc;
      return { id: _id, ...rest };
    });
  }

  async count(): Promise<{ total: number; pending: number }> {
    const [total, pending] = await Promise.all([
      ApprovalModel.countDocuments(),
      ApprovalModel.countDocuments({ status: "PENDING" }),
    ]);
    return { total, pending };
  }
}

export const mongoApprovalRepository = new MongoApprovalRepository();
