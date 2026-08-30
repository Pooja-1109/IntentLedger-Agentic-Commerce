import { DecisionResult } from "../../types";
import { IDecisionRepository } from "../decision.repository";
import { DecisionModel } from "./models";

export class MongoDecisionRepository implements IDecisionRepository {
  async save(decision: DecisionResult): Promise<DecisionResult> {
    await DecisionModel.findByIdAndUpdate(
      decision.id,
      { _id: decision.id, ...decision },
      { upsert: true, new: true }
    );
    return decision;
  }

  async findById(id: string): Promise<DecisionResult | null> {
    const doc = await DecisionModel.findById(id).lean();
    if (!doc) return null;
    const { _id, ...rest } = doc as any;
    return { id: _id, ...rest };
  }

  async findByIntentId(intentId: string): Promise<DecisionResult[]> {
    const docs = await DecisionModel.find({ intentId }).sort({ evaluatedAt: -1 }).lean();
    return docs.map((doc: any) => {
      const { _id, ...rest } = doc;
      return { id: _id, ...rest };
    });
  }

  async findAll(): Promise<DecisionResult[]> {
    const docs = await DecisionModel.find().sort({ evaluatedAt: -1 }).lean();
    return docs.map((doc: any) => {
      const { _id, ...rest } = doc;
      return { id: _id, ...rest };
    });
  }

  async count(): Promise<number> {
    return DecisionModel.countDocuments();
  }
}

export const mongoDecisionRepository = new MongoDecisionRepository();
