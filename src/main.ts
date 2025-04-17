import { buildComparisonTable, IssuerTable } from './fees';

/* ------------------------------------------------------------------------
   1.  List of card brands available (must match JSON filenames in /public/data)
   ---------------------------------------------------------------------- */
const issuers = [
  'Visa',
  'Mastercard',
  'Elo',
  'Hipercard',
  'Cabal',
  'Diners',
  'JCB',
  'Sorocred'
];

/* ------------------------------------------------------------------------
   2.  Helper: fetch JSON with cache‑buster so “Atualizar tabelas” works
   ---------------------------------------------------------------------- */
async function loadIssuerTable(name: string): Promise<IssuerTable> {
  const buster = localStorage.getItem('jsonCacheBuster') ?? '0';          // timestamp or 0
  const file   = `/data/${name.toLowerCase()}.json?v=${buster}`;
  const res    = await fetch(file, { cache: 'reload' });
  if (!res.ok) throw new Error(`Tabela não encontrada: ${file}`);
  return res.json();
}

/* ------------------------------------------------------------------------
   3.  Helper: get Simples Nacional value stored in Settings page
   ---------------------------------------------------------------------- */
function getSimplesDecimal(): number {
  const storedPercent = parseFloat(localStorage.getItem('simplesRate') ?? '5');
  return storedPercent / 100; // convert e.g. “5” → 0.05
}

/* ------------------------------------------------------------------------
   4.  DOM element references
   ---------------------------------------------------------------------- */
const issuerSelect = document.getElementById('issuer') as HTMLSelectElement;
const priceInput   = document.getElementById('price')  as HTMLInputElement;
const calcBtn      = document.getElementById('calc')   as HTMLButtonElement;
const tbody        = document.getElementById('tbody')  as HTMLTableSectionElement;
const msg          = document.getElementById('msg')    as HTMLDivElement;

/* ------------------------------------------------------------------------
   5.  Populate issuer dropdown
   ---------------------------------------------------------------------- */
issuers.forEach((brand) => {
  const opt = document.createElement('option');
  opt.value = brand;
  opt.textContent = brand;
  issuerSelect.appendChild(opt);
});

/* ------------------------------------------------------------------------
   6.  Calculate and render table
   ---------------------------------------------------------------------- */
calcBtn.addEventListener('click', async () => {
  tbody.innerHTML = '';
  msg.textContent = '';

  const issuer = issuerSelect.value;
  const base   = parseFloat(priceInput.value);

  if (!issuer) {
    msg.textContent = 'Selecione a bandeira.';
    return;
  }
  if (isNaN(base) || base <= 0) {
    msg.textContent = 'Digite um valor válido.';
    return;
  }

  try {
    const issuerData = await loadIssuerTable(issuer);
    const table = buildComparisonTable(base, issuerData, getSimplesDecimal());

    table.forEach((row) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${row.installments}×</td>
        <td>${row.feePercent.toFixed(2)} %</td>
        <td>R$ ${row.perInstallment.toFixed(2)}</td>
        <td>R$ ${row.finalPrice.toFixed(2)}</td>
        <td>R$ ${row.surcharge.toFixed(2)}</td>
        <td>${row.extraPaidPercent.toFixed(2)} %</td>`;
      tbody.appendChild(tr);
    });
  } catch (err: any) {
    msg.textContent = err.message || 'Erro ao carregar a tabela.';
  }
});
