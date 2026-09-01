import { DecisionResult } from "../types";
import { isMongoConnected } from "../config/database";
import { mongoDecisionRepository } from "./mongodb/mongo-decision.repository";

export interface IDecisionRepository {
  save(decision: DecisionResult): Promise<DecisionResult>;
  findById(id: string): Promise<DecisionResult | null>;
  findByIntentId(intentId: string): Promise<DecisionResult[]>;
  findAll(): Promise<DecisionResult[]>;
  count(): Promise<number>;
}

class InMemoryDecisionRepository implements IDecisionRepository {
  private decisions: Map<string, DecisionResult> = new Map();

  async save(decision: DecisionResult): Promise<DecisionResult> {
    this.decisions.set(decision.id, decision);
    return decision;
  }

  async findById(id: string): Promise<DecisionResult | null> {
    return this.decisions.get(id) || null;
  }

  async findByIntentId(intentId: string): Promise<DecisionResult[]> {
    return Array.from(this.decisions.values())
      .filter((d) => d.intentId === intentId)
      .sort((a, b) => new Date(b.evaluatedAt).getTime() - new Date(a.evaluatedAt).getTime());
  }

  async findAll(): Promise<DecisionResult[]> {
    return Array.from(this.decisions.values()).sort(
      (a, b) => new Date(b.evaluatedAt).getTime() - new Date(a.evaluatedAt).getTime()
    );
  }

  async count(): Promise<number> {
    return this.decisions.size;
  }

  clear(): void {
    this.decisions.clear();
  }
}

export const inMemoryDecisionRepository = new InMemoryDecisionRepository();

export const decisionRepository: IDecisionRepository = {
  async save(decision: DecisionResult) {
    if (isMongoConnected()) {
      return mongoDecisionRepository.save(decision);
    }
    return inMemoryDecisionRepository.save(decision);
  },
  async findById(id: string) {
    if (isMongoConnected()) {
      return mongoDecisionRepository.findById(id);
    }
    return inMemoryDecisionRepository.findById(id);
  },
  async findByIntentId(intentId: string) {
    if (isMongoConnected()) {
      return mongoDecisionRepository.findByIntentId(intentId);
    }
    return inMemoryDecisionRepository.findByIntentId(intentId);
  },
  async findAll() {
    if (isMongoConnected()) {
      return mongoDecisionRepository.findAll();
    }
    return inMemoryDecisionRepository.findAll();
  },
  async count() {
    if (isMongoConnected()) {
      return mongoDecisionRepository.count();
    }
    return inMemoryDecisionRepository.count();
  },
};
