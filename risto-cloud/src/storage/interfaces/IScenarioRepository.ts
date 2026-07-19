export interface ScenarioRow {
  id: string;
  name: string;
  description: string | null;
  steps: Record<string, unknown>[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateScenarioInput {
  id: string;
  name: string;
  description?: string;
  steps?: Record<string, unknown>[];
}

export interface UpdateScenarioInput {
  name?: string;
  description?: string;
  steps?: Record<string, unknown>[];
  isActive?: boolean;
}

export interface IScenarioRepository {
  create(input: CreateScenarioInput): ScenarioRow;
  findById(id: string): ScenarioRow | undefined;
  listAll(): ScenarioRow[];
  listActive(): ScenarioRow[];
  update(id: string, input: UpdateScenarioInput): ScenarioRow | undefined;
  delete(id: string): boolean;
}
