import { LedgerEvent } from "../types";
import { isMongoConnected } from "../config/database";
import { mongoLedgerRepository } from "./mongodb/mongo-ledger.repository";

export interface ILedgerRepository {
  append(event: LedgerEvent): Promise<LedgerEvent>;
  findAll(filters?: { intentId?: string; eventType?: string }): Promise<LedgerEvent[]>;
  findByIntentId(intentId: string): Promise<LedgerEvent[]>;
  count(): Promise<number>;
}

class InMemoryLedgerRepository implements ILedgerRepository {
  private events: LedgerEvent[] = [];

  constructor() {
    this.seedInitialEvents();
  }

  seedInitialEvents(): void {
    this.events = [
      {
        id: "evt_init_01",
        intentId: "intent_demo_running_shoes",
        eventType: "INTENT_CREATED",
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        actor: "USER",
        summary: 'User registered intent: "Buy me running shoes under ₹4,000 and ask me before purchasing."',
        metadata: {
          category: "shopping",
          maxAmount: 4000,
          currency: "INR",
          requiresApproval: true,
        },
      },
      {
        id: "evt_init_02",
        intentId: "intent_demo_running_shoes",
        eventType: "INTENT_COMPILED",
        timestamp: new Date(Date.now() - 1000 * 60 * 29).toISOString(),
        actor: "INTENT_ENGINE",
        summary: "Compiled intent boundary with strict ₹4,000 ceiling, verified merchant list, and mandatory human approval policy.",
        metadata: {
          compiler: "rules",
          confidenceScore: 0.98,
        },
      },
      {
        id: "evt_init_03",
        intentId: "intent_demo_office_stationery",
        eventType: "INTENT_CREATED",
        timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
        actor: "USER",
        summary: 'User registered intent: "Buy office stationery under ₹1,000 automatically without asking."',
        metadata: {
          category: "shopping",
          maxAmount: 1000,
          currency: "INR",
          requiresApproval: false,
        },
      },
    ];
  }

  async append(event: LedgerEvent): Promise<LedgerEvent> {
    this.events.unshift(event);
    return event;
  }

  async findAll(filters?: { intentId?: string; eventType?: string }): Promise<LedgerEvent[]> {
    let result = [...this.events];
    if (filters?.intentId) {
      result = result.filter((e) => e.intentId === filters.intentId);
    }
    if (filters?.eventType) {
      result = result.filter((e) => e.eventType === filters.eventType);
    }
    return result.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  async findByIntentId(intentId: string): Promise<LedgerEvent[]> {
    return this.events
      .filter((e) => e.intentId === intentId)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  async count(): Promise<number> {
    return this.events.length;
  }
}

export const inMemoryLedgerRepository = new InMemoryLedgerRepository();

export const ledgerRepository: ILedgerRepository = {
  async append(event: LedgerEvent) {
    if (isMongoConnected()) {
      return mongoLedgerRepository.append(event);
    }
    return inMemoryLedgerRepository.append(event);
  },
  async findAll(filters) {
    if (isMongoConnected()) {
      return mongoLedgerRepository.findAll(filters);
    }
    return inMemoryLedgerRepository.findAll(filters);
  },
  async findByIntentId(intentId: string) {
    if (isMongoConnected()) {
      return mongoLedgerRepository.findByIntentId(intentId);
    }
    return inMemoryLedgerRepository.findByIntentId(intentId);
  },
  async count() {
    if (isMongoConnected()) {
      return mongoLedgerRepository.count();
    }
    return inMemoryLedgerRepository.count();
  },
};
