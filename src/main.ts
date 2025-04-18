import { buildComparisonTable } from './fees';
import { issuerTables, getIssuerTable } from './issuers';

const brl = new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'});
const getSimples = () => (parseFloat(localStorage.getItem('simplesRate') ?? '5'))/100;

const $ = (id:string)=>document.getElementById(id)!;
const issuerSelect = $('issuer') as HTMLSelectElement;
const priceInput   = $('price')  as HTMLInputElement;
const calcBtn      = $('calc')   as HTMLButtonElement;
const resetBtn     = $('reset')  as HTMLButtonElement;
const tbody        = $('tbody')  as HTMLTableSectionElement;
const msg          = $('msg')    as HTMLDivElement;

// populate issuers
issuerTables.forEach(({issuer})=>{
  const o = document.createElement('option');
  o.value = o.textContent = issuer;
  issuerSelect.append(o);
});

let selectedRow: HTMLTableRowElement | null = null;

calcBtn.addEventListener('click', () => {
  // clear previous results and messages
  tbody.innerHTML = '';
  msg.textContent = '';
  selectedRow = null;

  // read inputs
  const issuer = issuerSelect.value;
  const base   = parseFloat(priceInput.value);

  // validation
  if (!issuer) {
    msg.textContent = 'Selecione a bandeira.';
    return;
  }
  if (isNaN(base) || base <= 0) {
    msg.textContent = 'Valor inválido.';
    return;
  }

  // fetch table and build rows
  const table = getIssuerTable(issuer);
  if (!table) {
    msg.textContent = 'Tabela não encontrada.';
    return;
  }

  const rows = buildComparisonTable(base, table, getSimples());

  rows.forEach(r => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${r.installments}×</td>
      <td>${brl.format(r.perInstallment)}</td>
      <td>${brl.format(r.finalPrice)}</td>
      <td>${brl.format(r.surcharge)}</td>
      <td>${r.extraPaidPercent.toFixed(2)} %</td>
    `;
    // row selection handler
    tr.addEventListener('click', () => {
      if (selectedRow) selectedRow.classList.remove('selected');
      tr.classList.add('selected');
      selectedRow = tr;
    });
    tbody.append(tr);
  });

  // Auto‑scroll the last row into view
  tbody.lastElementChild?.scrollIntoView({ behavior: 'smooth' });
});

resetBtn.addEventListener('click', () => {
  priceInput.value = '';
  issuerSelect.value = '';
  tbody.innerHTML = '';
  msg.textContent = '';
  selectedRow = null;
});
