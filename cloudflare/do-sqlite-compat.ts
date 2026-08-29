export type DoSqliteRow = Record<string, unknown>;

export type DoSqliteRunResult = {
  changes: number;
  lastInsertRowid: number;
};

export type DoSqliteStatement = {
  get<T = DoSqliteRow>(...args: unknown[]): T | undefined;
  all<T = DoSqliteRow>(...args: unknown[]): T[];
  run(...args: unknown[]): DoSqliteRunResult;
};

export type DoSqliteCompat = {
  prepare(sql: string): DoSqliteStatement;
  exec(sql: string): void;
  transaction<TArgs extends unknown[], TResult>(
    callback: (...args: TArgs) => TResult
  ): (...args: TArgs) => TResult;
};

type CursorLike = {
  toArray(): DoSqliteRow[];
  rowsWritten?: number;
};

type StorageLike = {
  sql: {
    exec(sql: string, ...bindings: unknown[]): CursorLike;
  };
  transactionSync<TResult>(callback: () => TResult): TResult;
};

function asStorage(value: unknown): StorageLike {
  const storage = value as StorageLike;

  if (
    !storage ||
    !storage.sql ||
    typeof storage.sql.exec !== "function" ||
    typeof storage.transactionSync !== "function"
  ) {
    throw new Error("RKN_DO_SQL_STORAGE_UNAVAILABLE");
  }

  return storage;
}

function isParameterObject(
  value: unknown
): value is Record<string, unknown> {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    !(value instanceof ArrayBuffer) &&
    !ArrayBuffer.isView(value)
  );
}

function normalizeBinding(value: unknown): unknown {
  if (value === undefined) {
    throw new Error("RKN_DO_SQL_UNDEFINED_BINDING");
  }

  if (typeof value === "boolean") {
    return value ? 1 : 0;
  }

  return value;
}

function getNamedValue(
  values: Record<string, unknown>,
  prefix: string,
  name: string
): unknown {
  const candidates = [
    name,
    prefix + name,
    "@" + name,
    ":" + name,
    "$" + name,
  ];

  for (const key of candidates) {
    if (Object.prototype.hasOwnProperty.call(values, key)) {
      return normalizeBinding(values[key]);
    }
  }

  throw new Error("RKN_DO_SQL_NAMED_BINDING_MISSING:" + name);
}

function rewriteNamedBindings(
  sql: string,
  values: Record<string, unknown>
): { sql: string; bindings: unknown[] } {
  let output = "";
  const bindings: unknown[] = [];

  let i = 0;
  let state:
    | "NORMAL"
    | "SINGLE"
    | "DOUBLE"
    | "BACKTICK"
    | "BRACKET"
    | "LINE_COMMENT"
    | "BLOCK_COMMENT" = "NORMAL";

  while (i < sql.length) {
    const ch = sql[i];
    const next = i + 1 < sql.length ? sql[i + 1] : "";
    const code = ch.charCodeAt(0);
    const nextCode = next.length > 0 ? next.charCodeAt(0) : -1;

    if (state === "LINE_COMMENT") {
      output += ch;
      if (code === 10 || code === 13) state = "NORMAL";
      i++;
      continue;
    }

    if (state === "BLOCK_COMMENT") {
      output += ch;
      if (code === 42 && nextCode === 47) {
        output += next;
        i += 2;
        state = "NORMAL";
        continue;
      }
      i++;
      continue;
    }

    if (state === "SINGLE") {
      output += ch;
      if (code === 39 && nextCode === 39) {
        output += next;
        i += 2;
        continue;
      }
      if (code === 39) state = "NORMAL";
      i++;
      continue;
    }

    if (state === "DOUBLE") {
      output += ch;
      if (code === 34 && nextCode === 34) {
        output += next;
        i += 2;
        continue;
      }
      if (code === 34) state = "NORMAL";
      i++;
      continue;
    }

    if (state === "BACKTICK") {
      output += ch;
      if (code === 96) state = "NORMAL";
      i++;
      continue;
    }

    if (state === "BRACKET") {
      output += ch;
      if (code === 93) state = "NORMAL";
      i++;
      continue;
    }

    if (code === 45 && nextCode === 45) {
      output += ch + next;
      i += 2;
      state = "LINE_COMMENT";
      continue;
    }

    if (code === 47 && nextCode === 42) {
      output += ch + next;
      i += 2;
      state = "BLOCK_COMMENT";
      continue;
    }

    if (code === 39) {
      output += ch;
      state = "SINGLE";
      i++;
      continue;
    }

    if (code === 34) {
      output += ch;
      state = "DOUBLE";
      i++;
      continue;
    }

    if (code === 96) {
      output += ch;
      state = "BACKTICK";
      i++;
      continue;
    }

    if (code === 91) {
      output += ch;
      state = "BRACKET";
      i++;
      continue;
    }

    if (
      (code === 64 || code === 58 || code === 36) &&
      /[A-Za-z_]/.test(next)
    ) {
      let j = i + 1;
      while (j < sql.length && /[A-Za-z0-9_]/.test(sql[j])) j++;

      const name = sql.slice(i + 1, j);
      bindings.push(getNamedValue(values, ch, name));
      output += "?";
      i = j;
      continue;
    }

    output += ch;
    i++;
  }

  return { sql: output, bindings };
}

function normalizeExecution(
  sql: string,
  args: unknown[]
): { sql: string; bindings: unknown[] } {
  if (args.length === 1 && isParameterObject(args[0])) {
    const rewritten = rewriteNamedBindings(sql, args[0]);

    if (rewritten.bindings.length === 0) {
      throw new Error(
        "RKN_DO_SQL_OBJECT_BINDING_WITHOUT_NAMED_PLACEHOLDER"
      );
    }

    return rewritten;
  }

  return {
    sql,
    bindings: args.map(normalizeBinding),
  };
}

export function createDoSqliteCompat(
  storageValue: unknown
): DoSqliteCompat {
  const storage = asStorage(storageValue);

  function execute(sql: string, args: unknown[]) {
    const normalized = normalizeExecution(sql, args);
    return storage.sql.exec(normalized.sql, ...normalized.bindings);
  }

  return {
    prepare(sql: string): DoSqliteStatement {
      if (typeof sql !== "string" || sql.trim().length === 0) {
        throw new Error("RKN_DO_SQL_EMPTY_PREPARE");
      }

      return {
        get<T = DoSqliteRow>(...args: unknown[]): T | undefined {
          const rows = execute(sql, args).toArray();
          return rows[0] as T | undefined;
        },

        all<T = DoSqliteRow>(...args: unknown[]): T[] {
          return execute(sql, args).toArray() as T[];
        },

        run(...args: unknown[]): DoSqliteRunResult {
          const cursor = execute(sql, args);
          cursor.toArray();

          const changes = Number(cursor.rowsWritten || 0);
          const idRow = storage.sql
            .exec("SELECT last_insert_rowid() AS value")
            .toArray()[0];

          const lastInsertRowid = Number(
            idRow && idRow.value !== undefined ? idRow.value : 0
          );

          return { changes, lastInsertRowid };
        },
      };
    },

    exec(sql: string): void {
      if (typeof sql !== "string" || sql.trim().length === 0) {
        throw new Error("RKN_DO_SQL_EMPTY_EXEC");
      }

      storage.sql.exec(sql).toArray();
    },

    transaction<TArgs extends unknown[], TResult>(
      callback: (...args: TArgs) => TResult
    ): (...args: TArgs) => TResult {
      if (typeof callback !== "function") {
        throw new Error("RKN_DO_SQL_TRANSACTION_CALLBACK_REQUIRED");
      }

      return (...args: TArgs): TResult =>
        storage.transactionSync(() => callback(...args));
    },
  };
}
