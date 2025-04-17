import { buildComparisonTable, IssuerTable } from './fees';

// -----------------------------------------------------------------------------
// Configuration: list the names that match your JSON files (case-insensitive)
// -----------------------------------------------------------------------------

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

// -----------------------------------------------------------------------------
// Load the corresponding JSON file from /public/data/{issuer}.json
// -----------------------------------------------------------------------------

async function loadIssuerTable(name: string): Promise<IssuerTable> {
  const file = `/data/${name.toLowerCase()}.json`;
  const res = await fetch(file);
  if (!res.ok) throw new Error(`Tabela não encontrada: ${file}`);
  return res.json();
}

// -----------------------------------------------------------------------------
// DOM references
// -----------------------------------------------------------------------------

const issuerSelect = document.getElementById('issuer') as HTMLSelectElement;
const priceInput   = document.getElementById('price')  as HTMLInputElement;
const calcBtn      = document.getElementById('calc')   as HTMLButtonElement;
const tbody        = document.getElementById('tbody')  as HTMLTableSectionElement;
const msg          = document.getElementById('msg')    as HTMLDivElement;

// -----------------------------------------------------------------------------
// Populate issuer dropdown
// -----------------------------------------------------------------------------

issuers.forEach((brand) => {
  const opt = document.createElement('option');
  opt.value = brand;
  opt.textContent = brand;
  issuerSelect.appendChild(opt);
});

// -----------------------------------------------------------------------------
// Calculation logic
// -----------------------------------------------------------------------------

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
    const table = buildComparisonTable(base, issuerData);

    table.forEach((row) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${row.installments}×</td>
        <td>${row.feePercent.toFixed(2)} %</td>
        <td>R$ ${(row.perInstallment).toFixed(2)}</td>
        <td>R$ ${row.finalPrice.toFixed(2)}</td>
        <td>R$ ${row.surcharge.toFixed(2)}</td>
        <td>${row.extraPaidPercent.toFixed(2)} %</td>`;
      tbody.appendChild(tr);
    });

  } catch (err: any) {
    msg.textContent = err.message || 'Erro ao carregar a tabela.';
  }
});
