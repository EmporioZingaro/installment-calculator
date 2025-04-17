import { buildComparisonTable, IssuerTable } from './fees';

// --- Small helper to fetch the JSON file for the chosen issuer ----------
async function loadIssuerTable(name: string): Promise<IssuerTable> {
  // slugify: "Visa" → "visa"
  const file = `/data/${name.toLowerCase()}.json`;
  const res = await fetch(file);
  if (!res.ok) throw new Error(`Tabela não encontrada: ${file}`);
  return res.json();
}

// --- Grab HTML elements once -------------------------------------------
const issuerSelect = document.getElementById('issuer') as HTMLSelectElement;
const priceInput   = document.getElementById('price')  as HTMLInputElement;
const calcBtn      = document.getElementById('calc')   as HTMLButtonElement;
const tbody        = document.getElementById('tbody')  as HTMLTableSectionElement;
const msg          = document.getElementById('msg')    as HTMLDivElement;

// --- Populate dropdown (hard‑coded list for now) ------------------------
['Visa'].forEach((brand) => {
  const opt = document.createElement('option');
  opt.value = opt.textContent = brand;
  issuerSelect.appendChild(opt);
});

// --- Action -------------------------------------------------------------
calcBtn.addEventListener('click', async () => {
  tbody.innerHTML = '';          // clear old table rows
  msg.textContent = '';          // clear messages

  const issuer = issuerSelect.value;
  const base   = parseFloat(priceInput.value);

  if (!issuer) return (msg.textContent = 'Selecione a bandeira.');
  if (isNaN(base) || base <= 0) return (msg.textContent = 'Digite um valor válido.');

  try {
    const table = buildComparisonTable(base, await loadIssuerTable(issuer));
    table.forEach((row) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${row.installments}×</td>
        <td>${row.feePercent.toFixed(2)} %</td>
        <td>R$ ${(row.perInstallment).toFixed(2)}</td>
        <td>R$ ${row.finalPrice.toFixed(2)}</td>
        <td>R$ ${row.surcharge.toFixed(2)}</td>
        <td>${row.extraPaidPercent.toFixed(2)} %</td>`;
      tbody.appendChild(tr);
    });
  } catch (err: any) {
    msg.textContent = err.message;
  }
});
