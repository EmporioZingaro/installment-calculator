/*  ---------------------------------------------------------------------------
    src/main.ts – UI controller (v3, inline logos, row‑wise flow, two‑column grid)
    --------------------------------------------------------------------------- */

import '../style.css';
import { buildComparisonTable } from './fees';
import { issuerTables, getIssuerTable } from './issuers';
import GearIcon from '@/assets/icons/gear.svg';

const issuerIcons = import.meta.glob<string>(
  '@/assets/icons/issuers/*.svg',
  { eager: true, import: 'default' }
) as Record<string, string>;

/* ────────────────────────────────────────────────────────────────────────── */
/*  Utilities and shorthand selectors                                        */
/* ────────────────────────────────────────────────────────────────────────── */
const brl = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL'
});

const $ = (id: string) => document.getElementById(id)!;

const issuerSelect  = $('issuer')          as HTMLSelectElement;
const issuerPreview = $('issuer-preview')  as HTMLImageElement;
const priceInput    = $('price')           as HTMLInputElement;
const calcBtn       = $('calc')            as HTMLButtonElement;
const resetBtn      = $('reset')           as HTMLButtonElement;
const msg           = $('msg')             as HTMLDivElement;
const cardsGrid     = $('cards')           as HTMLDivElement;
const tbodyLegacy   = $('tbody')           as HTMLTableSectionElement;

/*  Simples Nacional stored per‑device in localStorage (default 5 %) */
const getSimples = () =>
  (parseFloat(localStorage.getItem('simplesRate') ?? '5')) / 100;

/* ────────────────────────────────────────────────────────────────────────── */
/*  1. Populate dropdown & wire up issuer logo preview                      */
/* ────────────────────────────────────────────────────────────────────────── */
issuerTables.forEach(({ issuer }) => {
  const o = document.createElement('option');
  o.value = issuer;
  o.textContent = issuer;
  issuerSelect.append(o);
});

issuerSelect.addEventListener('change', () => {
  const key = issuerSelect.value.toLowerCase();
  const path = issuerIcons[`/src/assets/icons/issuers/${key}.svg`];
  if (path) {
    issuerPreview.src = path;
    issuerPreview.style.opacity = '1';
  } else {
    issuerPreview.src = '';
    issuerPreview.style.opacity = '0';
  }
});

/* ────────────────────────────────────────────────────────────────────────── */
/*  2. Core render helpers                                                   */
/* ────────────────────────────────────────────────────────────────────────── */
/** Clears results and state */
function clearResults() {
  cardsGrid.innerHTML = '';
  tbodyLegacy.innerHTML = '';
  msg.textContent = '';
  selectedCard = null;
}

/** Builds a single result card element */
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

/* ────────────────────────────────────────────────────────────────────────── */
/*  3. Event wiring                                                          */
/* ────────────────────────────────────────────────────────────────────────── */
let selectedCard: HTMLDivElement | null = null;

/* Main “Calcular” click handler */
calcBtn.addEventListener('click', () => {
  clearResults();

  // Input validation
  const issuer = issuerSelect.value;
  const base   = parseFloat(priceInput.value);
  if (!issuer) {
    msg.textContent = 'Selecione a bandeira.';
    return;
  }
  if (isNaN(base) || base <= 0) {
    msg.textContent = 'Valor inválido.';
    return;
  }

  // Fetch table + build cards
  const table = getIssuerTable(issuer);
  if (!table) {
    msg.textContent = 'Tabela não encontrada.';
    return;
  }

  const rows = buildComparisonTable(base, table, getSimples());

  // 3‑row cap, adjust columns
  const MAX_ROWS = 3;
  const cols = Math.ceil(rows.length / MAX_ROWS);
  cardsGrid.style.gridTemplateColumns = `repeat(${cols},1fr)`;

  rows.forEach(r => {
    const card = buildCard(r);

    // Click‑to‑select behavior
    card.addEventListener('click', () => {
      if (selectedCard) selectedCard.classList.remove('selected');
      card.classList.add('selected');
      selectedCard = card;
      selectedCard.scrollIntoView({ block: 'center', behavior: 'smooth' });
    });

    cardsGrid.append(card);
  });

  // Scroll to the grid for visibility on mobile
  cardsGrid.scrollIntoView({ behavior: 'smooth' });
});

/* Keyboard support – press Enter inside price field triggers Calcular */
priceInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') calcBtn.click();
});

/* Reset button */
resetBtn.addEventListener('click', () => {
  priceInput.value = '';
  issuerSelect.value = '';
  issuerPreview.src = '';
  issuerPreview.style.opacity = '0';
  clearResults();
});

/* ────────────────────────────────────────────────────────────────────────── */
/*  4. Wire up the gear‑icon <img> src to the imported SVG URL              */
/* ────────────────────────────────────────────────────────────────────────── */
const gearImg = document.getElementById('gear-icon') as HTMLImageElement;
gearImg.src = GearIcon;
gearImg.width = 18;
gearImg.height = 18;

/* ────────────────────────────────────────────────────────────────────────── */
/*  End of module                                                            */
/* ────────────────────────────────────────────────────────────────────────── */
