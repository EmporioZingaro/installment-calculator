/* ---------------------------------------------------------------------------
   src/main.ts – v4: animated layout shift + centered right panel + combobox fix
--------------------------------------------------------------------------- */
import '../style.css';
import { buildComparisonTable } from './fees';
import { issuerTables, getIssuerTable } from './issuers';
import GearIcon from '@/assets/icons/gear.svg';

// Load issuer SVGs
const issuerIcons = import.meta.glob<string>(
  '@/assets/icons/issuers/*.svg', { eager: true, import: 'default' }
) as Record<string, string>;

// Helpers
const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const $ = (id: string) => document.getElementById(id)!;

// DOM refs
const nativeSelect = $('issuer') as HTMLSelectElement;
const combo = $('issuer-combo') as HTMLDivElement;
const comboLabel = combo.querySelector('.combo-label') as HTMLSpanElement;
const comboIcon = combo.querySelector('.combo-icon') as HTMLImageElement;
const listbox = $('issuer-list') as HTMLUListElement;

const priceInput = $('price') as HTMLInputElement;
const calcBtn = $('calc') as HTMLButtonElement;
const resetBtn = $('reset') as HTMLButtonElement;
const msg = $('msg') as HTMLDivElement;
const cardsGrid = $('cards') as HTMLDivElement;
const tbody = $('tbody') as HTMLTableSectionElement;
const placeholder = $('placeholder') as HTMLDivElement | null;

const panelLeft = document.querySelector('.panel-left') as HTMLDivElement;
const panelRight = document.querySelector('.panel-right') as HTMLDivElement;

function getSimples() {
  return (parseFloat(localStorage.getItem('simplesRate') ?? '5') || 5) / 100;
}

/* --------------------------------------------------------------------- */
/* 1. Build accessible combobox list                                      */
/* --------------------------------------------------------------------- */
issuerTables.forEach(({ issuer }) => {
  // Native option
  const opt = document.createElement('option');
  opt.value = issuer;
  opt.textContent = issuer;
  nativeSelect.append(opt);

  // Custom list item
  const li = document.createElement('li');
  li.setAttribute('role', 'option');
  li.dataset.value = issuer;
  const iconPath = issuerIcons[`/src/assets/icons/issuers/${issuer.toLowerCase()}.svg`];
  li.innerHTML = `<img src="${iconPath ?? ''}" alt="" /><span>${issuer}</span>`;
  listbox.append(li);
});

function openList() {
  listbox.hidden = false;
  combo.setAttribute('aria-expanded', 'true');
}
function closeList() {
  listbox.hidden = true;
  combo.setAttribute('aria-expanded', 'false');
}

function resetCombo() {
  // default placeholder
  comboLabel.textContent = '-- escolha --';
  comboIcon.style.opacity = '0';
  nativeSelect.value = '';
  listbox.querySelectorAll('li').forEach(li => li.setAttribute('aria-selected', 'false'));
}

function selectIssuer(value: string) {
  nativeSelect.value = value;
  comboLabel.textContent = value;
  const path = issuerIcons[`/src/assets/icons/issuers/${value.toLowerCase()}.svg`];
  if (path) {
    comboIcon.src = path;
    comboIcon.style.opacity = '1';
  } else {
    comboIcon.style.opacity = '0';
  }
  listbox.querySelectorAll('li').forEach(li => {
    li.setAttribute('aria-selected', li.dataset.value === value ? 'true' : 'false');
  });
  closeList();
}

// Events for combobox
combo.addEventListener('click', () => listbox.hidden ? openList() : closeList());
listbox.addEventListener('click', e => {
  const li = (e.target as HTMLElement).closest('li');
  if (li && li.dataset.value) selectIssuer(li.dataset.value);
});
document.addEventListener('click', e => {
  if (!combo.contains(e.target as Node) && !listbox.contains(e.target as Node)) closeList();
});
combo.addEventListener('keydown', e => {
  const items = Array.from(listbox.querySelectorAll<HTMLLIElement>('li'));
  const currentIndex = items.findIndex(i => i.getAttribute('aria-selected') === 'true');
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    openList();
    const next = items[(currentIndex + 1) % items.length];
    next.focus();
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    openList();
    const prev = items[(currentIndex - 1 + items.length) % items.length];
    prev.focus();
  } else if (e.key === 'Escape') {
    closeList();
  }
});

// Initialize combobox
resetCombo();

/* --------------------------------------------------------------------- */
/* 2. Render and animate panels                                          */
/* --------------------------------------------------------------------- */
function clearResults() {
  cardsGrid.innerHTML = '';
  tbody.innerHTML = '';
  msg.textContent = '';
  cardsGrid.style.gridTemplateColumns = '';
  if (placeholder) placeholder.style.display = 'block';
  panelLeft.classList.remove('hidden');
  panelRight.classList.remove('expanded');
}

function buildCard(r: ReturnType<typeof buildComparisonTable>[number]) {
  const card = document.createElement('div');
  card.className = 'card';
  card.innerHTML = `
    <div class="installments">${r.installments}×</div>
    <div class="per">${brl.format(r.perInstallment)}</div>
    <div class="total">Total ${brl.format(r.finalPrice)}</div>
    <div class="surcharge">Acréscimo ${brl.format(r.surcharge)} (${r.extraPaidPercent.toFixed(2)} %)</div>
  `;
  return card;
}

let selectedCard: HTMLDivElement | null = null;

calcBtn.addEventListener('click', () => {
  const issuer = nativeSelect.value;
  const base = parseFloat(priceInput.value || '');
  clearResults();
  if (!issuer) { msg.textContent = 'Selecione a bandeira.'; return; }
  if (isNaN(base) || base <= 0) { msg.textContent = 'Valor inválido.'; return; }

  const table = getIssuerTable(issuer);
  if (!table) { msg.textContent = 'Tabela não encontrada.'; return; }

  const rows = buildComparisonTable(base, table, getSimples());
  const maxRows = 3;
  const cols = Math.ceil(rows.length / maxRows);
  cardsGrid.style.gridTemplateColumns = `repeat(${cols},1fr)`;

  rows.forEach(r => {
    const card = buildCard(r);
    card.addEventListener('click', () => {
      selectedCard?.classList.remove('selected');
      card.classList.add('selected');
      selectedCard = card;
    });
    cardsGrid.append(card);
  });

  if (placeholder) placeholder.style.display = 'none';
  panelLeft.classList.add('hidden');
  panelRight.classList.add('expanded');
  cardsGrid.scrollIntoView({ behavior: 'smooth' });
});

// Enter to calculate
priceInput.addEventListener('keydown', e => { if (e.key === 'Enter') calcBtn.click(); });

// Reset button
resetBtn.addEventListener('click', () => {
  priceInput.value = '';
  resetCombo();
  clearResults();
});

// Gear icon
const gearImg = $('gear-icon') as HTMLImageElement;
gearImg.src = GearIcon;
gearImg.width = 18;
gearImg.height = 18;
