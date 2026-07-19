import Database from 'better-sqlite3';
import type { DatabaseWrapper } from './Database.js';
import type { IScenarioRepository, ScenarioRow, CreateScenarioInput, UpdateScenarioInput } from '../interfaces/IScenarioRepository.js';

/**
 * SQLite implementation of IScenarioRepository.
 */
export class ScenarioRepository implements IScenarioRepository {
  private stmtCreate: Database.Statement;
  private stmtFindById: Database.Statement;
  private stmtListAll: Database.Statement;
  private stmtListActive: Database.Statement;
  private stmtUpdate: Database.Statement;
  private stmtDelete: Database.Statement;

  constructor(private db: DatabaseWrapper) {
    const raw = db.getRaw();
    this.stmtCreate = raw.prepare(
      `INSERT INTO scenarios (id, name, description, steps)
       VALUES (?, ?, ?, ?) RETURNING *`,
    );
    this.stmtFindById = raw.prepare('SELECT * FROM scenarios WHERE id = ?');
    this.stmtListAll = raw.prepare('SELECT * FROM scenarios ORDER BY created_at DESC');
    this.stmtListActive = raw.prepare('SELECT * FROM scenarios WHERE is_active = 1');
    this.stmtUpdate = raw.prepare(
      `UPDATE scenarios SET name = ?, description = ?, steps = ?, is_active = ?,
       updated_at = datetime('now') WHERE id = ? RETURNING *`,
    );
    this.stmtDelete = raw.prepare('DELETE FROM scenarios WHERE id = ?');
  }

  create(input: CreateScenarioInput): ScenarioRow {
    const row = this.stmtCreate.get(
      input.id,
      input.name,
      input.description ?? null,
      JSON.stringify(input.steps ?? []),
    ) as Record<string, unknown>;
    return this.mapRow(row);
  }

  findById(id: string): ScenarioRow | undefined {
    const row = this.stmtFindById.get(id) as Record<string, unknown> | undefined;
    return row ? this.mapRow(row) : undefined;
  }

  listAll(): ScenarioRow[] {
    const rows = this.stmtListAll.all() as Record<string, unknown>[];
    return rows.map(this.mapRow);
  }

  listActive(): ScenarioRow[] {
    const rows = this.stmtListActive.all() as Record<string, unknown>[];
    return rows.map(this.mapRow);
  }

  update(id: string, input: UpdateScenarioInput): ScenarioRow | undefined {
    const current = this.findById(id);
    if (!current) return undefined;

    const merged = {
      name: input.name ?? current.name,
      description: input.description ?? current.description,
      steps: input.steps ?? current.steps,
      isActive: input.isActive ?? current.isActive,
    };

    const row = this.stmtUpdate.get(
      merged.name,
      merged.description,
      JSON.stringify(merged.steps),
      merged.isActive ? 1 : 0,
      id,
    ) as Record<string, unknown> | undefined;

    return row ? this.mapRow(row) : undefined;
  }

  delete(id: string): boolean {
    const result = this.stmtDelete.run(id);
    return result.changes > 0;
  }

  private mapRow(row: Record<string, unknown>): ScenarioRow {
    return {
      id: row.id as string,
      name: row.name as string,
      description: (row.description as string | null) ?? null,
      steps: JSON.parse(row.steps as string) as Record<string, unknown>[],
      isActive: (row.is_active as number) === 1,
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string,
    };
  }
}
