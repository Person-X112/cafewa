// Cloudflare D1 Database Binding
// In Next.js on Cloudflare Pages (Edge Runtime), 
// the database is available via process.env.DB

export interface D1Database {
  prepare: (query: string) => D1PreparedStatement;
  batch: (statements: D1PreparedStatement[]) => Promise<any[]>;
}

export interface D1PreparedStatement {
  bind: (...values: any[]) => D1PreparedStatement;
  all: <T = any>() => Promise<{ results: T[] }>;
  run: () => Promise<{ success: boolean; meta: any }>;
  first: <T = any>(column?: string) => Promise<T | null>;
}

// Support for D1 HTTP API when native binding is missing (e.g. local 'next dev')
class D1HttpClient implements D1Database {
  private apiToken = process.env.CLOUDFLARE_D1_API_TOKEN;
  private accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  private databaseId = process.env.CLOUDFLARE_DATABASE_ID;

  prepare(query: string): D1PreparedStatement {
    return {
      bind: (...values: any[]) => this.createPreparedStatement(query, values),
      all: () => this.execute(query, []),
      run: () => this.execute(query, []),
      first: async (column?: string) => {
        const { results } = await this.execute(query, []);
        if (results.length === 0) return null;
        return column ? (results[0] as any)[column] : results[0];
      }
    } as D1PreparedStatement;
  }

  private createPreparedStatement(query: string, values: any[]): D1PreparedStatement {
    return {
      all: () => this.execute(query, values),
      run: () => this.execute(query, values),
      bind: () => { throw new Error('Already bound'); },
      first: async (column?: string) => {
        const { results } = await this.execute(query, values);
        if (results.length === 0) return null;
        return column ? (results[0] as any)[column] : results[0];
      }
    } as D1PreparedStatement;
  }

  private async execute(sql: string, params: any[]): Promise<any> {
    if (!this.apiToken || !this.accountId || !this.databaseId) {
      throw new Error('D1 HTTP API credentials missing in environment variables');
    }

    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/d1/database/${this.databaseId}/query`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sql, params }),
      }
    );

    const data = await response.json();
    if (!data.success) {
      throw new Error(`D1 HTTP API Error: ${data.errors?.[0]?.message || 'Unknown error'}`);
    }

    // Adapt D1 HTTP API response to D1 binding structure
    const results = data.result[0].results || [];
    const meta = data.result[0].meta || {};
    return { results, success: true, meta };
  }

  async batch(statements: D1PreparedStatement[]): Promise<any[]> {
    // Basic implementation for batch via sequences of HTTP requests
    // (Actual D1 HTTP API supports batches, but this is a shim)
    const results = [];
    for (const stmt of statements) {
      results.push(await stmt.run());
    }
    return results;
  }
}

const db: D1Database = (process.env.DB as unknown as D1Database) || new D1HttpClient();

// Helper to mimic the mysql2 pool.query behavior where possible
export const query = async (sql: string, params: any[] = []) => {
  const stmt = db.prepare(sql).bind(...params);
  const isSelect = sql.trim().toUpperCase().startsWith('SELECT');
  
  if (isSelect) {
    const { results } = await stmt.all();
    return [results];
  } else {
    const result = await stmt.run();
    return [result];
  }
};

export default {
  query,
  prepare: (sql: string) => db.prepare(sql),
  batch: (statements: any[]) => db.batch(statements),
};
