import { Intent } from "../../types";
import { IIntentRepository } from "../intent.repository";
import { IntentModel } from "./models";

export class MongoIntentRepository implements IIntentRepository {
  async create(intent: Intent): Promise<Intent> {
    await IntentModel.create({
      _id: intent.id,
      ...intent,
    });
    return intent;
  }

  async findById(id: string): Promise<Intent | null> {
    const doc = await IntentModel.findById(id).lean();
    if (!doc) return null;
    const { _id, ...rest } = doc as any;
    return { id: _id, ...rest };
  }

  async findAll(filters?: { userId?: string; status?: string }): Promise<Intent[]> {
    const query: any = {};
    if (filters?.userId) query.userId = filters.userId;
    if (filters?.status) query.status = filters.status;

    const docs = await IntentModel.find(query).sort({ createdAt: -1 }).lean();
    return docs.map((doc: any) => {
      const { _id, ...rest } = doc;
      return { id: _id, ...rest };
    });
  }

  async update(id: string, updates: Partial<Intent>): Promise<Intent | null> {
    const updated = await IntentModel.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true }
    ).lean();
    if (!updated) return null;
    const { _id, ...rest } = updated as any;
    return { id: _id, ...rest };
  }

  async count(): Promise<number> {
    return IntentModel.countDocuments();
  }
}

export const mongoIntentRepository = new MongoIntentRepository();
