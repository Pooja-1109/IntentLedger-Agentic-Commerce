import { LedgerEvent } from "../../types";
import { ILedgerRepository } from "../ledger.repository";
import { LedgerModel } from "./models";

export class MongoLedgerRepository implements ILedgerRepository {
  /**
   * Append-only event insertion
   */
  async append(event: LedgerEvent): Promise<LedgerEvent> {
    await LedgerModel.create({
      _id: event.id,
      ...event,
    });
    return event;
  }

  async findAll(filters?: { intentId?: string; eventType?: string }): Promise<LedgerEvent[]> {
    const query: any = {};
    if (filters?.intentId) query.intentId = filters.intentId;
    if (filters?.eventType) query.eventType = filters.eventType;

    const docs = await LedgerModel.find(query).sort({ timestamp: -1 }).lean();
    return docs.map((doc: any) => {
      const { _id, ...rest } = doc;
      return { id: _id, ...rest };
    });
  }

  async findByIntentId(intentId: string): Promise<LedgerEvent[]> {
    const docs = await LedgerModel.find({ intentId }).sort({ timestamp: 1 }).lean();
    return docs.map((doc: any) => {
      const { _id, ...rest } = doc;
      return { id: _id, ...rest };
    });
  }

  async count(): Promise<number> {
    return LedgerModel.countDocuments();
  }
}

export const mongoLedgerRepository = new MongoLedgerRepository();
