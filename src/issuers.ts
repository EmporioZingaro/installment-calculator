import { IssuerTable } from './fees';

/**
 * import.meta.glob returns values typed as unknown.
 * We cast them to our IssuerTable so the compiler is happy.
 */
const issuerModules = import.meta.glob('./data/*.json', {
  eager: true,
  import: 'default'
}) as Record<string, IssuerTable>;

/** All issuer tables, sorted alphabetically by issuer name. */
export const issuerTables: IssuerTable[] = Object.values(issuerModules).sort(
  (a, b) => a.issuer.localeCompare(b.issuer)
);

/** Helper: find a table by name (case‑insensitive). */
export function getIssuerTable(name: string): IssuerTable | undefined {
  return issuerTables.find(
    (t) => t.issuer.toLowerCase() === name.toLowerCase()
  );
}
