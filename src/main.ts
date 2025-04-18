/*  ---------------------------------------------------------------------------
    src/main.ts – UI controller (v2, card‑grid layout)
    --------------------------------------------------------------------------- */

import { buildComparisonTable } from './fees';
import { issuerTables, getIssuerTable } from './issuers';

// Import our bundled gear‑icon SVG (via the `@` alias in Vite)
import GearIcon from '@/assets/icons/gear.svg';

/* ────────────────────────────────────────────────────────────────────────── */
/*  Utilities and shorthand selectors                                        */
/* ────────────────────────────────────────────────────────────────────────── */

const brl = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL'
});

const $ = (id: string) => document.getElementById(id)!;

const issuerSelect = $('issuer') as HTMLSelectElement;
const priceInput   = $('price')  as HTMLInputElement;
const calcBtn      = $('calc')   as HTMLButtonElement;
const resetBtn     = $('reset')  as HTMLButtonElement;
const msg          = $('msg')    as HTMLDivElement;

const cardsGrid    = $('cards')  as HTMLDivElement;          // new result area
const tbodyLegacy  = $('tbody')  as HTMLTableSectionElement; // retained but hidden

/*  Simples Nacional stored per‑device in localStorage (default 5 %) */
const getSimples = () =>
  (parseFloat(localStorage.getItem('simplesRate') ?? '5')) / 100;

/*  ---------------------------------------------------------------------------
    1.  Dropdown population (text‑only; logo injection is tackled later)
    --------------------------------------------------------------------------- */
issuerTables.forEach(({ issuer }) => {
  const o = document.createElement('option');
  o.value = issuer;
  o.textContent = issuer;
  issuerSelect.append(o);
});

/*  ---------------------------------------------------------------------------
    2.  Core render helpers
    --------------------------------------------------------------------------- */

/** Clears results and state */
function clearResults() {
  cardsGrid.innerHTML = '';
  tbodyLegacy.innerHTML = '';           // keeps old table empty as well
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
    <div class="total">Total&nbsp;${brl.format(r.finalPrice)}</div>
    <div class="surcharge">Acréscimo&nbsp;${brl.format(r.surcharge)} 
         (${r.extraPaidPercent.toFixed(2)} %)</div>
  `;
  return card;
}

/*  ---------------------------------------------------------------------------
    3.  Event wiring
    --------------------------------------------------------------------------- */

let selectedCard: HTMLDivElement | null = null;

/*  Main "Calcular" click handler   */
calcBtn.addEventListener('click', () => {
  clearResults();

  /* Input validation ------------------------------------------------------ */
  const issuer = issuerSelect.value;
  const base = parseFloat(priceInput.value);

  if (!issuer) {
    msg.textContent = 'Selecione a bandeira.';
    return;
  }
  if (isNaN(base) || base <= 0) {
    msg.textContent = 'Valor inválido.';
    return;
  }

  /* Fetch table + build results ------------------------------------------ */
  const table = getIssuerTable(issuer);
  if (!table) {
    msg.textContent = 'Tabela não encontrada.';
    return;
  }

  const rows = buildComparisonTable(base, table, getSimples());

  rows.forEach((r) => {
    const card = buildCard(r);

    /* click‑to‑select behaviour */
    card.addEventListener('click', () => {
      if (selectedCard) selectedCard.classList.remove('selected');
      card.classList.add('selected');
      selectedCard = card;
    });

    cardsGrid.append(card);
  });

  /* Scroll to the grid for visibility on mobile */
  cardsGrid.scrollIntoView({ behavior: 'smooth' });
});

/*  Keyboard support – press Enter inside price field triggers Calcular */
priceInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') calcBtn.click();
});

/*  Reset button */
resetBtn.addEventListener('click', () => {
  priceInput.value = '';
  issuerSelect.value = '';
  clearResults();
});

/*  ---------------------------------------------------------------------------
    4.  Wire up the gear‑icon <img> src to the imported SVG URL
    --------------------------------------------------------------------------- */
const gearImg = document.getElementById('gear-icon') as HTMLImageElement;
gearImg.src = GearIcon;

/*  ---------------------------------------------------------------------------
    End of module
    --------------------------------------------------------------------------- */
