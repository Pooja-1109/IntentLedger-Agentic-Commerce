import { Intent } from "../types";
import { isMongoConnected } from "../config/database";
import { mongoIntentRepository } from "./mongodb/mongo-intent.repository";

export interface IIntentRepository {
  create(intent: Intent): Promise<Intent>;
  findById(id: string): Promise<Intent | null>;
  findAll(filters?: { userId?: string; status?: string }): Promise<Intent[]>;
  update(id: string, updates: Partial<Intent>): Promise<Intent | null>;
  count(): Promise<number>;
}

class InMemoryIntentRepository implements IIntentRepository {
  private intents: Map<string, Intent> = new Map();

  constructor() {
    this.seedInitialData();
  }

  seedInitialData(): void {
    const initialIntents: Intent[] = [
      {
        id: "intent_demo_running_shoes",
        userId: "user_dev_01",
        rawText: "Buy me running shoes under ₹4,000 and ask me before purchasing.",
        category: "shopping",
        constraints: {
          maxAmount: 4000,
          currency: "INR",
          productCategory: "running shoes",
          allowedMerchants: ["Nike India", "Adidas", "Amazon", "Flipkart"],
          requiresApproval: true,
          quantity: 1,
        },
        permissions: {
          canPurchase: true,
          canSubscribe: false,
          canTransfer: false,
          canChangeQuantity: false,
        },
        status: "active",
        createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        updatedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      },
      {
        id: "intent_demo_office_stationery",
        userId: "user_dev_01",
        rawText: "Buy office stationery under ₹1,000 automatically without asking.",
        category: "shopping",
        constraints: {
          maxAmount: 1000,
          currency: "INR",
          productCategory: "office supplies",
          requiresApproval: false,
          quantity: 2,
        },
        permissions: {
          canPurchase: true,
          canSubscribe: false,
          canTransfer: false,
          canChangeQuantity: true,
        },
        status: "active",
        createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
        updatedAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
      },
    ];

    initialIntents.forEach((intent) => {
      this.intents.set(intent.id, intent);
    });
  }

  async create(intent: Intent): Promise<Intent> {
    this.intents.set(intent.id, intent);
    return intent;
  }

  async findById(id: string): Promise<Intent | null> {
    return this.intents.get(id) || null;
  }

  async findAll(filters?: { userId?: string; status?: string }): Promise<Intent[]> {
    let result = Array.from(this.intents.values());
    if (filters?.userId) {
      result = result.filter((i) => i.userId === filters.userId);
    }
    if (filters?.status) {
      result = result.filter((i) => i.status === filters.status);
    }
    return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async update(id: string, updates: Partial<Intent>): Promise<Intent | null> {
    const existing = this.intents.get(id);
    if (!existing) return null;
    const updated: Intent = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.intents.set(id, updated);
    return updated;
  }

  async count(): Promise<number> {
    return this.intents.size;
  }
}

export const inMemoryIntentRepository = new InMemoryIntentRepository();

// Delegating Proxy Repository (Uses MongoDB when connected, In-Memory otherwise)
export const intentRepository: IIntentRepository = {
  async create(intent: Intent) {
    if (isMongoConnected()) {
      return mongoIntentRepository.create(intent);
    }
    return inMemoryIntentRepository.create(intent);
  },
  async findById(id: string) {
    if (isMongoConnected()) {
      return mongoIntentRepository.findById(id);
    }
    return inMemoryIntentRepository.findById(id);
  },
  async findAll(filters) {
    if (isMongoConnected()) {
      return mongoIntentRepository.findAll(filters);
    }
    return inMemoryIntentRepository.findAll(filters);
  },
  async update(id: string, updates: Partial<Intent>) {
    if (isMongoConnected()) {
      return mongoIntentRepository.update(id, updates);
    }
    return inMemoryIntentRepository.update(id, updates);
  },
  async count() {
    if (isMongoConnected()) {
      return mongoIntentRepository.count();
    }
    return inMemoryIntentRepository.count();
  },
};
