import { buildComparisonTable, IssuerTable } from './fees';

// -----------------------------------------------------------------------------
// Configs
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

const brl = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL'
});

// -----------------------------------------------------------------------------
// Utils
// -----------------------------------------------------------------------------

function getSimplesDecimal(): number {
  const stored = parseFloat(localStorage.getItem('simplesRate') ?? '5');
  return stored / 100; // convert “5” → 0.05
}

async function loadIssuerTable(name: string): Promise<IssuerTable> {
  const buster = localStorage.getItem('jsonCacheBuster') ?? '0';
  const file = `/data/${name.toLowerCase()}.json?v=${buster}`;
  const res = await fetch(file, { cache: 'reload' });
  if (!res.ok) throw new Error(`Tabela não encontrada: ${file}`);
  return res.json();
}

// -----------------------------------------------------------------------------
// DOM references
// -----------------------------------------------------------------------------

const issuerSelect = document.getElementById('issuer') as HTMLSelectElement;
const priceInput = document.getElementById('price') as HTMLInputElement;
const calcBtn = document.getElementById('calc') as HTMLButtonElement;
const tbody = document.getElementById('tbody') as HTMLTableSectionElement;
const msg = document.getElementById('msg') as HTMLDivElement;

// -----------------------------------------------------------------------------
// Populate dropdown
// -----------------------------------------------------------------------------

issuers.forEach((brand) => {
  const opt = document.createElement('option');
  opt.value = brand;
  opt.textContent = brand;
  issuerSelect.appendChild(opt);
});

// -----------------------------------------------------------------------------
// Main Action
// -----------------------------------------------------------------------------

calcBtn.addEventListener('click', async () => {
  tbody.innerHTML = '';
  msg.textContent = '';

  const issuer = issuerSelect.value;
  const base = parseFloat(priceInput.value);

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

    const minExtra = Math.min(...table.map((r) => r.extraPaidPercent));

    table.forEach((row) => {
      const tr = document.createElement('tr');
      if (row.extraPaidPercent === minExtra) {
        tr.classList.add('best');
      }

      tr.innerHTML = `
        <td>${row.installments}×</td>
        <td>${row.feePercent.toFixed(2)} %</td>
        <td>${brl.format(row.perInstallment)}</td>
        <td>${brl.format(row.finalPrice)}</td>
        <td>${brl.format(row.surcharge)}</td>
        <td>${row.extraPaidPercent.toFixed(2)} %</td>
      `;
      tbody.appendChild(tr);
    });

  } catch (err: any) {
    msg.textContent = err.message || 'Erro ao carregar a tabela.';
  }
});
