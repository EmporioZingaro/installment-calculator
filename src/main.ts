/* ---------------------------------------------------------------------------
   src/main.ts – v4: State-driven layout, centered results, animations
--------------------------------------------------------------------------- */
import '../style.css';
import { buildComparisonTable, CalcResult } from './fees'; // Added CalcResult type
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
const contentDiv    = $('.content')          as HTMLDivElement; // Main content wrapper
const nativeSelect  = $('#issuer')           as HTMLSelectElement; // hidden
const combo         = $('#issuer-combo')     as HTMLDivElement;
const comboLabel    = combo.querySelector('.combo-label') as HTMLSpanElement;
const comboIcon     = combo.querySelector('.combo-icon')  as HTMLImageElement;
const listbox       = $('#issuer-list')      as HTMLUListElement;

const priceInput = $('#price')   as HTMLInputElement;
const calcBtn    = $('#calc')    as HTMLButtonElement;
const resetBtn   = $('#reset')   as HTMLButtonElement;
const msg        = $('#msg')     as HTMLDivElement;
const cardsGrid  = $('#cards')   as HTMLDivElement;
// const tbody      = $('#tbody')   as HTMLTableSectionElement; // Legacy table not used for display

// State variable for selected card
let selectedCard: HTMLDivElement | null = null;

/* Helpers */
const getSimples = () => (parseFloat(localStorage.getItem('simplesRate') ?? '5')) / 100;
const MAX_ROWS_PER_COLUMN = 3; // How many cards before adding a new column (adjust as needed)
const PANEL_TRANSITION_DURATION = 400; // Should match --transition-duration in CSS (in ms)

/* --------------------------------------------------------------------- */
/* 1. Initialize State & Combobox                                        */
/* --------------------------------------------------------------------- */

function initializeApp() {
  // Set initial state class
  contentDiv.classList.add('state-initial');
  contentDiv.classList.remove('state-results-visible');

  // Populate combobox
  issuerTables.forEach(({ issuer }) => {
    // hidden <option> for semantics
    const opt = document.createElement('option');
    opt.value = issuer;
    opt.textContent = issuer;
    nativeSelect.append(opt);

    // visible <li>
    const li = document.createElement('li');
    li.setAttribute('role', 'option');
    li.dataset.value = issuer;

    const iconFileName = issuer.toLowerCase().replace(/\s+/g, ''); // Handle names like "Hiper Card" if needed
    const iconPath = issuerIcons[`/src/assets/icons/issuers/${iconFileName}.svg`];
    li.innerHTML = `<img src="${iconPath ?? ''}" alt="${issuer} logo" /><span>${issuer}</span>`;
    listbox.append(li);
  });

  // Setup combobox interactions (no changes from previous version needed here)
  setupCombobox();

  // Set gear icon
  const gearImg = document.getElementById('gear-icon') as HTMLImageElement;
  if (gearImg) {
    gearImg.src = GearIcon;
    gearImg.width = 18;
    gearImg.height = 18;
  }
}

function setupCombobox() {
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
    closeList();
  }

  // Open/close listbox
  function openList() {
    listbox.hidden = false;
    combo.setAttribute('aria-expanded', 'true');
    // Optional: focus the currently selected item when opening
    const selectedLi = listbox.querySelector<HTMLLIElement>('[aria-selected="true"]');
    selectedLi?.focus();
  }
  function closeList() {
    listbox.hidden = true;
    combo.setAttribute('aria-expanded', 'false');
  }

  // Event Listeners
  combo.addEventListener('click', () => {
    if (listbox.hidden) openList(); else closeList();
  });

  listbox.addEventListener('click', (e) => {
    const li = (e.target as HTMLElement).closest('li');
    if (li && li.dataset.value) {
      selectIssuer(li.dataset.value);
    }
  });

  // Close on outside click
  document.addEventListener('click', e => {
    if (!combo.contains(e.target as Node) && !listbox.contains(e.target as Node)) {
      closeList();
    }
  });

  // Keyboard navigation for combobox
  combo.addEventListener('keydown', e => {
    if (listbox.hidden && (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      openList();
      return;
    }
    if (!listbox.hidden) {
      const items = Array.from(listbox.querySelectorAll<HTMLLIElement>('li'));
      const active = document.activeElement?.closest('li');
      let currentIdx = active ? items.indexOf(active) : -1;

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
        case ' ': // Select on space as well
          e.preventDefault();
          if (active && active.dataset.value) {
            selectIssuer(active.dataset.value);
          }
          closeList();
          combo.focus(); // Return focus to the combo trigger
          break;
        case 'Escape':
          closeList();
          combo.focus();
          break;
        case 'Tab':
          closeList(); // Close listbox on tab away
          break;
      }
    }
  });
  // Keyboard navigation for list items themselves
  listbox.addEventListener('keydown', (e) => {
     const items = Array.from(listbox.querySelectorAll<HTMLLIElement>('li'));
     const active = document.activeElement?.closest('li');
     let currentIdx = active ? items.indexOf(active) : -1;

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
             selectIssuer(active.dataset.value);
          }
          closeList();
          combo.focus();
          break;
        case 'Escape':
           closeList();
           combo.focus();
           break;
        case 'Tab':
           closeList();
           break;
     }
  });

  // Set initial empty state
  selectIssuer(''); // Ensure combobox starts empty

  // Make the hidden native select sync *to* the custom one if needed (rarely necessary)
  // nativeSelect.addEventListener('change', () => selectIssuer(nativeSelect.value));
}


/* --------------------------------------------------------------------- */
/* 2. Calculation & Rendering Logic                                      */
/* --------------------------------------------------------------------- */

function clearResults() {
  cardsGrid.innerHTML = ''; // Clear only the cards
  msg.textContent = '';     // Clear any previous error messages
  selectedCard?.classList.remove('selected'); // Unselect previous card
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

  // Add staggering animation delay
  card.style.transitionDelay = `${index * 50}ms`; // 50ms stagger

  // Add click listener for selection
  card.addEventListener('click', () => {
    selectedCard?.classList.remove('selected'); // Remove from previous
    card.classList.add('selected');
    selectedCard = card;
    // Optionally, announce selection for accessibility
    // console.log(`Selecionado: ${result.installments} parcelas`);
  });

  return card;
}

function calculateAndDisplay() {
  clearResults(); // Clear previous results first

  const issuerName = nativeSelect.value;
  const basePrice = parseFloat(priceInput.value);

  // --- Validation ---
  if (!issuerName) {
    msg.textContent = 'Selecione a bandeira.';
    priceInput.focus(); // Focus the relevant field
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
    // Maybe reset the selection?
    // selectIssuer('');
    return;
  }

  // --- Calculation ---
  const results = buildComparisonTable(basePrice, issuerTable, getSimples());

  // --- Display ---
  // 1. Switch state
  contentDiv.classList.remove('state-initial');
  contentDiv.classList.add('state-results-visible');

  // 2. Calculate grid columns (consider viewport width for responsiveness)
  const viewportWidth = window.innerWidth;
  let columns = 1; // Default for stacked view
  if (viewportWidth > 960) { // Only calculate columns if not stacked (matches CSS breakpoint)
      columns = Math.ceil(results.length / MAX_ROWS_PER_COLUMN);
      // Clamp columns to a max reasonable number, e.g., 4
      columns = Math.min(columns, 4);
  }
  // Apply grid style - CSS media query should override this on small screens if needed
  cardsGrid.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;


  // 3. Populate cards
  results.forEach((result, index) => {
    const card = buildCard(result, index);
    cardsGrid.append(card);
  });

  // 4. Scroll results into view after animation starts
  // Use setTimeout matching panel transition duration for smooth effect
  setTimeout(() => {
      // Scroll the grid itself or the right panel into view
      const elementToScroll = viewportWidth <= 960 ? cardsGrid : $('#panel-right');
      elementToScroll?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, PANEL_TRANSITION_DURATION / 2); // Scroll slightly before transition ends
}

function resetCalculator() {
  // Clear inputs
  priceInput.value = '';
  selectIssuer(''); // Reset combobox (this calls clearList)

  clearResults(); // Clear cards and messages

  // Switch back to initial state
  contentDiv.classList.remove('state-results-visible');
  contentDiv.classList.add('state-initial');

  // Optional: Scroll back to top or to the input panel
  // $('.panel-left').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* --------------------------------------------------------------------- */
/* 3. Event Listeners                                                    */
/* --------------------------------------------------------------------- */

calcBtn.addEventListener('click', calculateAndDisplay);
resetBtn.addEventListener('click', resetCalculator);

// Allow calculation on Enter key press in the price input
priceInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    e.preventDefault(); // Prevent form submission if it were inside a form
    calcBtn.click();    // Trigger calculation
  }
});

/* --------------------------------------------------------------------- */
/* 4. App Initialization                                                 */
/* --------------------------------------------------------------------- */

initializeApp(); // Setup combobox and initial state when script loads
