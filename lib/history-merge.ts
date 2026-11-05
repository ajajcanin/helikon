const WINDOW_MS = 15 * 60 * 1000;

type Change = { field: string; from: unknown; to: unknown };
type Entry = {
  at: Date;
  userName: string | null;
  tableName: string;
  recordId: string | null;
  title: string;
  shown: Change[];
};

/**
 * Joins one person's edits to the same record within 15 minutes into one row, with each field's first and last value.
 * Only for showing: every change stays stored on its own. Rows come newest first, and those without values stay apart.
 */
export function mergeEdits<E extends Entry>(rows: E[]): E[] {
  const merged: E[] = [];
  const latest = new Map<string, E>();
  for (const row of rows) {
    if (row.shown.length === 0 || !row.recordId) {
      merged.push(row);
      continue;
    }
    const key = [row.userName, row.tableName, row.recordId, row.title].join("|");
    const group = latest.get(key);
    if (group && group.at.getTime() - row.at.getTime() <= WINDOW_MS) {
      for (const older of row.shown) {
        const same = group.shown.find((c) => c.field === older.field);
        if (same) same.from = older.from;
        else group.shown.push({ ...older });
      }
    } else {
      const copy = { ...row, shown: row.shown.map((c) => ({ ...c })) };
      latest.set(key, copy);
      merged.push(copy);
    }
  }
  return merged;
}
