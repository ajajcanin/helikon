type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string };

type Steps<T> = {
  request: (input: {
    contentType: string;
    size: number;
  }) => Promise<ActionResult<{ key: string; url: string }>>;
  finish: (key: string) => Promise<ActionResult<T>>;
};

/** Sends a file straight to storage, then has the server check it and make its sizes. Returns an error message or the result. */
export async function uploadImage<T>(file: File, steps: Steps<T>): Promise<{ data: T } | { error: string }> {
  const asked = await steps.request({ contentType: file.type, size: file.size });
  if (!asked.ok) return { error: asked.error };
  const sent = await fetch(asked.data.url, {
    method: "PUT",
    body: file,
    headers: { "content-type": file.type },
  }).catch(() => null);
  if (!sent?.ok) return { error: "Slanje slike nije uspjelo." };
  const done = await steps.finish(asked.data.key);
  return done.ok ? { data: done.data } : { error: done.error };
}
