import { IssuerTable } from './fees';

const issuerModules = import.meta.glob('./data/*.json', {
  eager: true,
  import: 'default'
}) as Record<string, IssuerTable>;

export const issuerTables: IssuerTable[] =
  Object.values(issuerModules).sort((a,b)=>a.issuer.localeCompare(b.issuer));

export function getIssuerTable(name:string){
  return issuerTables.find(t=>t.issuer.toLowerCase()===name.toLowerCase());
}
