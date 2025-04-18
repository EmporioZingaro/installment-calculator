import { buildComparisonTable } from './fees';
import { issuerTables, getIssuerTable } from './issuers';

/* ---------------------------------------------------------- */
/* Helpers                                                    */
/* ---------------------------------------------------------- */

// Brazilian currency formatter
const brl = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL'
});

// Read Simples rate saved in settings (default 5 %)
function getSimplesDecimal(): number {
  const stored = parseFloat(localStorage.getItem('simplesRate') ?? '5');
  return stored / 100; // e.g. "5" → 0.05
}

/* ---------------------------------------------------------- */
/* DOM references                                             */
/* ---------------------------------------------------------- */

const issuerSelect = document.getElementById('issuer') as HTMLSelectElement;
const priceInput   = document.getElementById('price')  as HTMLInputElement;
const calcBtn      = document.getElementById('calc')   as HTMLButtonElement;
const tbody        = document.getElementById('tbody')  as HTMLTableSectionElement;
const msg          = document.getElementById('msg')    as HTMLDivElement;

/* ---------------------------------------------------------- */
/* Populate issuer dropdown automatically                     */
/* ---------------------------------------------------------- */

issuerTables.forEach(({ issuer }) => {
  const opt = document.createElement('option');
  opt.value = opt.textContent = issuer;
  issuerSelect.appendChild(opt);
});

/* ---------------------------------------------------------- */
/* Main action                                                */
/* ---------------------------------------------------------- */

calcBtn.addEventListener('click', () => {
  tbody.innerHTML = '';
  msg.textContent = '';

  const issuerName = issuerSelect.value;
  const basePrice  = parseFloat(priceInput.value);

  if (!issuerName) {
    msg.textContent = 'Selecione a bandeira.';
    return;
  }
  if (isNaN(basePrice) || basePrice <= 0) {
    msg.textContent = 'Digite um valor válido.';
    return;
  }

  // Get table already loaded in memory
  const issuerData = getIssuerTable(issuerName);
  if (!issuerData) {
    msg.textContent = `Tabela não encontrada para ${issuerName}.`;
    return;
  }

  // Build comparison rows
  const table = buildComparisonTable(
    basePrice,
    issuerData,
    getSimplesDecimal()
  );

  // Render
  table.forEach((row) => {
    const tr = document.createElement('tr');
    if (row.extraPaidPercent === minExtra) tr.classList.add('best');

    tr.innerHTML = `
      <td>${row.installments}×</td>
      <td>${row.feePercent.toFixed(2)} %</td>
      <td>${brl.format(row.perInstallment)}</td>
      <td>${brl.format(row.finalPrice)}</td>
      <td>${brl.format(row.surcharge)}</td>
      <td>${row.extraPaidPercent.toFixed(2)} %</td>
    `;

    tbody.appendChild(tr);
  });
});
