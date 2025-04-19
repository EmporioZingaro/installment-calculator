/* ---------------------------------------------------------------------------
   src/main.ts – v4.1: tweaks → left panel always visible, fixed card width,
                       “Limpar” button, no JS grid cols
--------------------------------------------------------------------------- */
import '../style.css';
import { buildComparisonTable, type CalcResult } from './fees';
import { issuerTables, getIssuerTable } from './issuers';
import GearIcon from '@/assets/icons/gear.svg';

/* Load issuer SVGs */
const issuerIcons = import.meta.glob<string>(
  '@/assets/icons/issuers/*.svg',
  { eager: true, import: 'default' }
) as Record<string, string>;

const brl = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL'
});
const $ = (id: string) => document.getElementById(id)!;

/* ── DOM refs ──────────────────────────────────────────────────────────── */
const panelLeft   = $('panel-left')  as HTMLElement;
const panelRight  = $('panel-right') as HTMLElement;
const placeholder = $('placeholder') as HTMLDivElement;

const nativeSelect = $('issuer')          as HTMLSelectElement;
const combo        = $('issuer-combo')    as HTMLDivElement;
const comboLabel   = combo.querySelector('.combo-label') as HTMLSpanElement;
const comboIcon    = combo.querySelector('.combo-icon')  as HTMLImageElement;
const listbox      = $('issuer-list')     as HTMLUListElement;

const priceInput = $('price')   as HTMLInputElement;
const calcBtn    = $('calc')    as HTMLButtonElement;
const resetBtn   = $('reset')   as HTMLButtonElement;
const msg        = $('msg')     as HTMLDivElement;
const cardsGrid  = $('cards')   as HTMLDivElement;
const tbody      = $('tbody')   as HTMLTableSectionElement;

/* ── state ─────────────────────────────────────────────────────────────── */
let selectedCard: HTMLDivElement | null = null;
let summaryBanner: HTMLDivElement | null = null;

/* helpers */
const getSimples = () =>
  parseFloat(localStorage.getItem('simplesRate') ?? '5') / 100;

/* --------------------------------------------------------------------- */
/* 1. Build combobox list                                                */
/* --------------------------------------------------------------------- */
issuerTables.forEach(({ issuer }) => {
  /* hidden <option> */
  const opt = document.createElement('option');
  opt.value = issuer;
  opt.textContent = issuer;
  nativeSelect.append(opt);

  /* visible <li> */
  const li = document.createElement('li');
  li.setAttribute('role', 'option');
  li.dataset.value = issuer;

  const iconPath =
    issuerIcons[`/src/assets/icons/issuers/${issuer.toLowerCase()}.svg`];
  li.innerHTML = `<img src="${iconPath ?? ''}" alt="" /><span>${issuer}</span>`;
  listbox.append(li);
});

/* open / close */
function openList() { listbox.hidden = false; combo.setAttribute('aria-expanded','true'); }
function closeList() { listbox.hidden = true;  combo.setAttribute('aria-expanded','false'); }

/* sync selection */
function selectIssuer(value: string) {
  nativeSelect.value = value;
  comboLabel.textContent = value;
  const path = issuerIcons[`/src/assets/icons/issuers/${value.toLowerCase()}.svg`];
  comboIcon.src = path ?? '';
  comboIcon.style.opacity = path ? '1' : '0';

  /* highlight in list */
  listbox.querySelectorAll('li').forEach((li) => {
    li.setAttribute('aria-selected', li.dataset.value === value ? 'true' : 'false');
  });
  closeList();
  markNeedsRecalc();
}

/* combobox events */
combo.addEventListener('click', () => { listbox.hidden ? openList() : closeList(); });
listbox.addEventListener('click', (e) => {
  const li = (e.target as HTMLElement).closest('li') as HTMLLIElement | null;
  if (li) selectIssuer(li.dataset.value!);
});
document.addEventListener('click', (e) => {
  if (!combo.contains(e.target as Node) && !listbox.contains(e.target as Node)) closeList();
});
combo.addEventListener('keydown', (e) => {
  const items = Array.from(listbox.querySelectorAll<HTMLLIElement>('li'));
  const current = items.findIndex(li => li.getAttribute('aria-selected') === 'true');
  switch (e.key) {
    case 'ArrowDown':
      e.preventDefault(); openList();
      items[(current + 1) % items.length].focus(); break;
    case 'ArrowUp':
      e.preventDefault(); openList();
      items[(current - 1 + items.length) % items.length].focus(); break;
    case 'Enter':
      if (!listbox.hidden) e.preventDefault(); break;
    case 'Escape':
      closeList(); break;
  }
});
selectIssuer(''); /* initial blank */

/* --------------------------------------------------------------------- */
/* 2. Landing / expanded helpers                                         */
/* --------------------------------------------------------------------- */
function enterExpanded() {
  panelLeft.classList.add('shrunk');
  panelRight.classList.add('expanded');
  placeholder.classList.add('hidden');
}

function returnToLanding() {
  panelLeft.classList.remove('shrunk');
  panelRight.classList.remove('expanded');
  placeholder.classList.remove('hidden');
  removeSummary();
  selectedCard = null;
  calcBtn.textContent = 'Calcular';
}

function removeSummary() {
  summaryBanner?.remove();
  summaryBanner = null;
}

function showSummary(r: CalcResult) {
  if (!summaryBanner) {
    summaryBanner = document.createElement('div');
    summaryBanner.className = 'summary';
    panelRight.append(summaryBanner);
  }
  summaryBanner.textContent = `→ ${r.installments}× de ${brl.format(
    r.perInstallment
  )}  |  Total ${brl.format(r.finalPrice)}`;
}

function markNeedsRecalc() {
  if (cardsGrid.children.length) {
    calcBtn.textContent = 'Recalcular';
    removeSummary();
  }
}

/* --------------------------------------------------------------------- */
/* 3. Card rendering                                                     */
/* --------------------------------------------------------------------- */
function clearResults() {
  cardsGrid.innerHTML = '';
  tbody.innerHTML = '';
  msg.textContent = '';
  cardsGrid.style.gridTemplateColumns = ''; /* rely on CSS auto‑fill */
  removeSummary();
}

function buildCard(r: ReturnType<typeof buildComparisonTable>[number], index: number) {
  const card = document.createElement('div');
  card.className = 'card';
  card.style.setProperty('--i', index.toString());
  card.innerHTML = `
    <div class="installments">${r.installments}×</div>
    <div class="per">${brl.format(r.perInstallment)}</div>
    <div class="total">Total ${brl.format(r.finalPrice)}</div>
    <div class="surcharge">Acréscimo ${brl.format(r.surcharge)} (${r.extraPaidPercent.toFixed(2)} %)</div>`;
  return card;
}

/* --------------------------------------------------------------------- */
/* 4. Calculate button handler                                           */
/* --------------------------------------------------------------------- */
calcBtn.addEventListener('click', () => {
  clearResults();

  const issuer = nativeSelect.value;
  const base = parseFloat(priceInput.value);
  if (!issuer) { msg.textContent = 'Selecione a bandeira.'; return; }
  if (isNaN(base) || base <= 0) { msg.textContent = 'Valor inválido.'; return; }

  const table = getIssuerTable(issuer);
  if (!table) { msg.textContent = 'Tabela não encontrada.'; return; }

  enterExpanded();

  const rows = buildComparisonTable(base, table, getSimples());

  rows.forEach((r, idx) => {
    const card = buildCard(r, idx);
    card.addEventListener('click', () => {
      selectedCard?.classList.remove('selected');
      card.classList.add('selected');
      selectedCard = card;
      showSummary(r);
    });
    cardsGrid.append(card);
  });

  calcBtn.textContent = 'Recalcular';
});

/* enter‑to‑calc */
priceInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') calcBtn.click(); });
priceInput.addEventListener('input', markNeedsRecalc);

/* reset / limpar */
resetBtn.addEventListener('click', () => {
  priceInput.value = '';
  nativeSelect.value = '';
  selectIssuer('');
  clearResults();
  returnToLanding();
});

/* gear icon */
const gearImg = $('gear-icon') as HTMLImageElement;
gearImg.src = GearIcon; gearImg.width = 18; gearImg.height = 18;
