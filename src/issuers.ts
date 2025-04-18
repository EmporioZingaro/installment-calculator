import { IssuerTable } from './fees';

// Load all issuer JSON files from src/data/
const issuerModules = import.meta.glob('./data/*.json', {
  eager: true,
  import: 'default'
}) as Record<string, IssuerTable>;

// Define your preferred order manually
const preferredOrder = [
  'Visa',
  'Mastercard',
  'Elo',
  'Hipercard',
  'Cabal',
  'Sorocred',
  'JCB',
  'Diners'
];

// Custom sort function:
// - preferred issuers first (in order)
// - unlisted issuers alphabetically after
function sortByPreferred(a: IssuerTable, b: IssuerTable) {
  const aIndex = preferredOrder.indexOf(a.issuer);
  const bIndex = preferredOrder.indexOf(b.issuer);

  if (aIndex !== -1 && bIndex !== -1) {
    return aIndex - bIndex;
  }
  if (aIndex !== -1) return -1;
  if (bIndex !== -1) return 1;

  return a.issuer.localeCompare(b.issuer);
}

// Final issuer table list in sorted order
export const issuerTables: IssuerTable[] =
  Object.values(issuerModules).sort(sortByPreferred);

// Helper to find a table by name
export function getIssuerTable(name: string): IssuerTable | undefined {
  return issuerTables.find(
    (t) => t.issuer.toLowerCase() === name.toLowerCase()
  );
}
