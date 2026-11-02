export type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export const param = (value: string | string[] | undefined) => (typeof value === "string" ? value : "");
export const pageParam = (value: string | string[] | undefined) => Math.max(1, Number(param(value)) || 1);

/** Query for links: only the filters that are set. */
export const activeQuery = (values: Record<string, string>) =>
  Object.fromEntries(Object.entries(values).filter(([, v]) => v));
