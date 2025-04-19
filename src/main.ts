/* ---------------------------------------------------------------------------
   src/main.ts – v4.1: Fixed selectIssuer scope issue
--------------------------------------------------------------------------- */
import '../style.css';
import { buildComparisonTable, CalcResult } from './fees';
import { issuerTables, getIssuerTable } from './issuers';
import GearIcon from '@/assets/icons/gear.svg';

/* Load issuer SVGs */
const issuerIcons = import.meta.glob<string>(
  '@/assets/icons/issuers/*.svg', { eager:true, import:'default' }
) as Record<string,string>;

/* ───────────────────────────────────────────────────────────────────────── */

// Intl Formatters
const brl = new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'});
const percent = new Intl.NumberFormat('pt-BR', {style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2});

// DOM element selector helper
const $ = <T extends HTMLElement>(selector: string): T => document.querySelector<T>(selector)!;

/* DOM refs */
const contentDiv    = $('.content')          as HTMLDivElement;
const nativeSelect  = $('#issuer')           as HTMLSelectElement;
const combo         = $('#issuer-combo')     as HTMLDivElement;
const comboLabel    = combo.querySelector('.combo-label') as HTMLSpanElement;
const comboIcon     = combo.querySelector('.combo-icon')  as HTMLImageElement;
const listbox       = $('#issuer-list')      as HTMLUListElement;

const priceInput = $('#price')   as HTMLInputElement;
const calcBtn    = $('#calc')    as HTMLButtonElement;
const resetBtn   = $('#reset')   as HTMLButtonElement;
const msg        = $('#msg')     as HTMLDivElement;
const cardsGrid  = $('#cards')   as HTMLDivElement;

// State variable for selected card
let selectedCard: HTMLDivElement | null = null;

/* Helpers */
const getSimples = () => (parseFloat(localStorage.getItem('simplesRate') ?? '5')) / 100;
const MAX_ROWS_PER_COLUMN = 3;
const PANEL_TRANSITION_DURATION = 400;

/* --------------------------------------------------------------------- */
/* 1. Initialize State & Combobox                                        */
/* --------------------------------------------------------------------- */

// --- Moved selectIssuer function here ---
// Sync selection visual <-> hidden select
function selectIssuer(value: string) {
  nativeSelect.value = value; // Update hidden select
  const selectedTable = getIssuerTable(value);
  comboLabel.textContent = selectedTable ? selectedTable.issuer : '-- escolha --'; // Display formatted name or placeholder

  const iconFileName = value.toLowerCase().replace(/\s+/g, '');
  const path = value ? issuerIcons[`/src/assets/icons/issuers/${iconFileName}.svg`] : '';
  comboIcon.src = path ?? '';
  comboIcon.alt = value ? `${value} logo` : '';
  comboIcon.style.opacity = path ? '1' : '0';

  // Highlight selected item in the listbox
  listbox.querySelectorAll('li').forEach(li => {
    li.setAttribute('aria-selected', li.dataset.value === value ? 'true' : 'false');
  });
  // We still need closeList, define it or move it too if needed elsewhere
  // Assuming closeList is only needed within setupCombobox for now
  const listboxElement = $('#issuer-list'); // Re-get ref if needed
  if (listboxElement) listboxElement.hidden = true;
  combo.setAttribute('aria-expanded', 'false');
}

// --- Moved closeList function here ---
function closeList() {
    listbox.hidden = true;
    combo.setAttribute('aria-expanded', 'false');
}

function initializeApp() {
  // Set initial state class
  contentDiv.classList.add('state-initial');
  contentDiv.classList.remove('state-results-visible');

  // Populate combobox
  issuerTables.forEach(({ issuer }) => {
    const opt = document.createElement('option');
    opt.value = issuer;
    opt.textContent = issuer;
    nativeSelect.append(opt);

    const li = document.createElement('li');
    li.setAttribute('role', 'option');
    li.dataset.value = issuer;

    const iconFileName = issuer.toLowerCase().replace(/\s+/g, '');
    const iconPath = issuerIcons[`/src/assets/icons/issuers/${iconFileName}.svg`];
    li.innerHTML = `<img src="${iconPath ?? ''}" alt="${issuer} logo" /><span>${issuer}</span>`;
    listbox.append(li);
  });

  // Setup combobox interactions
  setupCombobox();

  // Set initial empty state for combobox
  selectIssuer('');

  // Set gear icon
  const gearImg = document.getElementById('gear-icon') as HTMLImageElement;
  if (gearImg) {
    gearImg.src = GearIcon;
    gearImg.width = 18;
    gearImg.height = 18;
  }
}

function setupCombobox() {
  // Open/close listbox
  function openList() {
    listbox.hidden = false;
    combo.setAttribute('aria-expanded', 'true');
    const selectedLi = listbox.querySelector<HTMLLIElement>('[aria-selected="true"]');
    selectedLi?.focus();
  }
  // closeList is now defined outside

  // Event Listeners
  combo.addEventListener('click', () => {
    if (listbox.hidden) openList(); else closeList();
  });

  listbox.addEventListener('click', (e) => {
    const li = (e.target as HTMLElement).closest('li');
    if (li && li.dataset.value) {
      selectIssuer(li.dataset.value); // Calls the outer function
      // closeList() is called inside selectIssuer now
    }
  });

  // Close on outside click
  document.addEventListener('click', e => {
    if (!combo.contains(e.target as Node) && !listbox.contains(e.target as Node)) {
      closeList();
    }
  });

   // Keyboard navigation for combobox trigger
  combo.addEventListener('keydown', e => {
    if (listbox.hidden && (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault(); openList(); return;
    }
    if (!listbox.hidden) {
      handleListboxKeydown(e); // Delegate listbox keys
    }
  });
  // Keyboard navigation for list items themselves
  listbox.addEventListener('keydown', handleListboxKeydown); // Delegate listbox keys

  function handleListboxKeydown(e: KeyboardEvent) {
    const items = Array.from(listbox.querySelectorAll<HTMLLIElement>('li'));
    const active = document.activeElement?.closest('li');
    let currentIdx = active ? items.indexOf(active) : -1;
    let shouldClose = false;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        currentIdx = (currentIdx + 1) % items.length;
        items[currentIdx]?.focus();
        break;
      case 'ArrowUp':
        e.preventDefault();
        currentIdx = (currentIdx - 1 + items.length) % items.length;
        items[currentIdx]?.focus();
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (active && active.dataset.value) {
          selectIssuer(active.dataset.value); // Calls outer function
          shouldClose = true;
        }
        break;
      case 'Escape':
        shouldClose = true;
        break;
      case 'Tab':
        shouldClose = true; // Close listbox on tab away
        break;
      default: return; // Ignore other keys
    }

    if (shouldClose) {
      closeList();
      combo.focus(); // Return focus to the combo trigger
    }
  }
}


/* --------------------------------------------------------------------- */
/* 2. Calculation & Rendering Logic                                      */
/* --------------------------------------------------------------------- */

function clearResults() {
  cardsGrid.innerHTML = '';
  msg.textContent = '';
  selectedCard?.classList.remove('selected');
  selectedCard = null;
}

function buildCard(result: CalcResult, index: number): HTMLDivElement {
  const card = document.createElement('div');
  card.className = 'card';
  card.innerHTML = `
    <div class="installments">${result.installments}×</div>
    <div class="per">${brl.format(result.perInstallment)}</div>
    <div class="total">Total ${brl.format(result.finalPrice)}</div>
    <div class="surcharge">Acréscimo ${brl.format(result.surcharge)} (${percent.format(result.extraPaidPercent)}%)</div>`;

  card.style.transitionDelay = `${index * 50}ms`;

  card.addEventListener('click', () => {
    selectedCard?.classList.remove('selected');
    card.classList.add('selected');
    selectedCard = card;
  });

  return card;
}

function calculateAndDisplay() {
  clearResults();

  const issuerName = nativeSelect.value;
  const basePrice = parseFloat(priceInput.value);

  if (!issuerName) {
    msg.textContent = 'Selecione a bandeira.';
    combo.focus(); // Focus combo box trigger instead of hidden input
    return;
  }
  if (isNaN(basePrice) || basePrice <= 0) {
    msg.textContent = 'Valor da compra inválido.';
    priceInput.focus();
    priceInput.select();
    return;
  }

  const issuerTable = getIssuerTable(issuerName);
  if (!issuerTable) {
    msg.textContent = 'Tabela de taxas não encontrada para esta bandeira.';
    return;
  }

  const results = buildComparisonTable(basePrice, issuerTable, getSimples());

  contentDiv.classList.remove('state-initial');
  contentDiv.classList.add('state-results-visible');

  const viewportWidth = window.innerWidth;
  let columns = 1;
  if (viewportWidth > 960) {
      columns = Math.ceil(results.length / MAX_ROWS_PER_COLUMN);
      columns = Math.min(columns, 4);
      cardsGrid.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;
  } else {
      cardsGrid.style.gridTemplateColumns = ''; // Let CSS handle it for stacked view
  }


  results.forEach((result, index) => {
    const card = buildCard(result, index);
    cardsGrid.append(card);
  });

  setTimeout(() => {
      const elementToScroll = viewportWidth <= 960 ? cardsGrid : $('#panel-right');
      elementToScroll?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, PANEL_TRANSITION_DURATION / 2);
}

function resetCalculator() {
  priceInput.value = '';
  selectIssuer(''); // Calls the outer function - THIS IS LINE 324 now (approx)

  clearResults();

  contentDiv.classList.remove('state-results-visible');
  contentDiv.classList.add('state-initial');
}

/* --------------------------------------------------------------------- */
/* 3. Event Listeners                                                    */
/* --------------------------------------------------------------------- */

calcBtn.addEventListener('click', calculateAndDisplay);
resetBtn.addEventListener('click', resetCalculator);

priceInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    e.preventDefault();
    calcBtn.click();
  }
});

/* --------------------------------------------------------------------- */
/* 4. App Initialization                                                 */
/* --------------------------------------------------------------------- */

initializeApp();
