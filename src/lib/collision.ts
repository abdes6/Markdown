export function resolveUniqueName(
  names: ReadonlySet<string>,
  preferred: string,
): string {
  if (!names.has(preferred)) return preferred;
  const dot = preferred.lastIndexOf('.');
  const base = dot > 0 ? preferred.slice(0, dot) : preferred;
  const ext = dot > 0 ? preferred.slice(dot) : '';
  let i = 1;
  while (names.has(`${base}-${i}${ext}`)) i++;
  return `${base}-${i}${ext}`;
}