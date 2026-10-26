// Next.js prefixes the base path onto <Link> and router navigation, but not
// onto fetch(), <img src>, plain <a href> or absolute URLs — use withBase there.
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

export function withBase(path: string): string {
  return `${BASE_PATH}${path}`;
}
