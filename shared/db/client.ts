// Database client abstraction for RSC benchmark
// Uses node-postgres (pg) - works with Next.js, Waku, and React on Rails

import { Pool, type PoolConfig, type QueryResult, type QueryResultRow } from 'pg';

let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    const config: PoolConfig = {
      connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/rsc_benchmark',
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    };
    pool = new Pool(config);
  }
  return pool;
}

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<QueryResult<T>> {
  const client = getPool();
  const start = Date.now();
  const result = await client.query<T>(text, params);

  if (process.env.NODE_ENV === 'development') {
    const duration = Date.now() - start;
    console.log('[DB]', { text: text.slice(0, 100), duration: `${duration}ms`, rows: result.rowCount });
  }

  return result;
}

export async function queryOne<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<T | null> {
  const result = await query<T>(text, params);
  return result.rows[0] || null;
}

export async function queryMany<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<T[]> {
  const result = await query<T>(text, params);
  return result.rows;
}

export async function transaction<T>(
  callback: (client: {
    query: typeof query;
    queryOne: typeof queryOne;
    queryMany: typeof queryMany;
  }) => Promise<T>
): Promise<T> {
  const client = await getPool().connect();

  try {
    await client.query('BEGIN');

    const txQuery = async <R extends QueryResultRow>(text: string, params?: unknown[]) =>
      client.query<R>(text, params);
    const txQueryOne = async <R extends QueryResultRow>(text: string, params?: unknown[]) => {
      const result = await client.query<R>(text, params);
      return result.rows[0] || null;
    };
    const txQueryMany = async <R extends QueryResultRow>(text: string, params?: unknown[]) => {
      const result = await client.query<R>(text, params);
      return result.rows;
    };

    const result = await callback({ query: txQuery, queryOne: txQueryOne, queryMany: txQueryMany });

    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

// SQL builder helpers for common patterns
export function buildWhereClause(
  filters: Record<string, unknown>,
  startIndex: number = 1
): { clause: string; params: unknown[] } {
  const conditions: string[] = [];
  const params: unknown[] = [];
  let paramIndex = startIndex;

  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined || value === null) continue;

    if (Array.isArray(value)) {
      const placeholders = value.map(() => `$${paramIndex++}`).join(', ');
      conditions.push(`${key} = ANY(ARRAY[${placeholders}])`);
      params.push(...value);
    } else if (typeof value === 'object' && value !== null) {
      const obj = value as { min?: number; max?: number; like?: string; ilike?: string };
      if ('min' in obj && obj.min !== undefined) {
        conditions.push(`${key} >= $${paramIndex++}`);
        params.push(obj.min);
      }
      if ('max' in obj && obj.max !== undefined) {
        conditions.push(`${key} <= $${paramIndex++}`);
        params.push(obj.max);
      }
      if ('like' in obj && obj.like !== undefined) {
        conditions.push(`${key} LIKE $${paramIndex++}`);
        params.push(obj.like);
      }
      if ('ilike' in obj && obj.ilike !== undefined) {
        conditions.push(`${key} ILIKE $${paramIndex++}`);
        params.push(obj.ilike);
      }
    } else {
      conditions.push(`${key} = $${paramIndex++}`);
      params.push(value);
    }
  }

  return {
    clause: conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '',
    params,
  };
}

export function buildPagination(
  page: number,
  pageSize: number
): { clause: string; offset: number } {
  const offset = (page - 1) * pageSize;
  return {
    clause: `LIMIT ${pageSize} OFFSET ${offset}`,
    offset,
  };
}

export function buildOrderBy(
  sort: { field: string; direction: 'asc' | 'desc' },
  allowedFields: string[]
): string {
  if (!allowedFields.includes(sort.field)) {
    return '';
  }
  return `ORDER BY ${sort.field} ${sort.direction.toUpperCase()}`;
}
