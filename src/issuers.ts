// src/issuers.ts
import { IssuerTable } from './fees';

const issuerModules: Record<string, IssuerTable> = import.meta.glob(
  '/data/*.json',
  { eager: true, import: 'default' }
);

export const issuerTables: IssuerTable[] = Object.values(issuerModules).sort((a, b) =>
  a.issuer.localeCompare(b.issuer)
);

export function getIssuerTable(name: string): IssuerTable | undefined {
  return issuerTables.find((t) => t.issuer.toLowerCase() === name.toLowerCase());
}
