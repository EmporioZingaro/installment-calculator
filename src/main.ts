/* ---------------------------------------------------------------------------
   src/main.ts – v3: custom combobox, fixed grid, issuer icons, card grid
--------------------------------------------------------------------------- */
import '../style.css';
import { buildComparisonTable } from './fees';
import { issuerTables, getIssuerTable } from './issuers';
import GearIcon from '@/assets/icons/gear.svg';

/* Load issuer SVGs */
const issuerIcons = import.meta.glob<string>(
  '@/assets/icons/issuers/*.svg', { eager:true, import:'default' }
) as Record<string,string>;

/* ───────────────────────────────────────────────────────────────────────── */

const brl = new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'});
const $ = (id:string)=>document.getElementById(id)!;

/* DOM refs */
const nativeSelect  = $('issuer')            as HTMLSelectElement; // hidden
const combo         = $('issuer-combo')      as HTMLDivElement;
const comboLabel    = combo.querySelector('.combo-label') as HTMLSpanElement;
const comboIcon     = combo.querySelector('.combo-icon')  as HTMLImageElement;
const listbox       = $('issuer-list')       as HTMLUListElement;

const priceInput = $('price')   as HTMLInputElement;
const calcBtn    = $('calc')    as HTMLButtonElement;
const resetBtn   = $('reset')   as HTMLButtonElement;
const msg        = $('msg')     as HTMLDivElement;
const cardsGrid  = $('cards')   as HTMLDivElement;
const tbody      = $('tbody')   as HTMLTableSectionElement;

/* helpers */
const getSimples = () => (parseFloat(localStorage.getItem('simplesRate') ?? '5'))/100;

/* --------------------------------------------------------------------- */
/* 1. Build combobox list                                                */
/* --------------------------------------------------------------------- */
issuerTables.forEach(({issuer})=>{
  /* hidden <option> for semantics */
  const opt=document.createElement('option');
  opt.value=issuer;opt.textContent=issuer;
  nativeSelect.append(opt);

  /* visible <li> */
  const li=document.createElement('li');
  li.setAttribute('role','option');
  li.dataset.value=issuer;

  const iconPath = issuerIcons[`/src/assets/icons/issuers/${issuer.toLowerCase()}.svg`];
  li.innerHTML=`<img src="${iconPath ?? ''}" alt="" /><span>${issuer}</span>`;
  listbox.append(li);
});

/* open / close */
function openList(){
  listbox.hidden=false; combo.setAttribute('aria-expanded','true');
}
function closeList(){
  listbox.hidden=true;  combo.setAttribute('aria-expanded','false');
}

/* sync selection */
function selectIssuer(value:string){
  nativeSelect.value=value;
  comboLabel.textContent=value;
  const path = issuerIcons[`/src/assets/icons/issuers/${value.toLowerCase()}.svg`];
  comboIcon.src = path ?? '';
  comboIcon.style.opacity = path ? '1':'0';

  /* highlight in list */
  listbox.querySelectorAll('li').forEach(li=>{
    li.setAttribute('aria-selected', li.dataset.value===value ? 'true':'false');
  });
  closeList();
}

/* events */
combo.addEventListener('click', () => {
  if (listbox.hidden) openList(); else closeList();
});
listbox.addEventListener('click', (e)=>{
  const li=(e.target as HTMLElement).closest('li') as HTMLLIElement;
  if(li) selectIssuer(li.dataset.value!);
});
document.addEventListener('click',e=>{
  if(!combo.contains(e.target as Node) && !listbox.contains(e.target as Node)) closeList();
});
combo.addEventListener('keydown', e=>{
  const visibleItems = Array.from(listbox.querySelectorAll<HTMLLIElement>('li'));
  const current = visibleItems.findIndex(li=>li.getAttribute('aria-selected')==='true');
  switch(e.key){
    case 'ArrowDown':
      e.preventDefault();
      openList();
      const next = visibleItems[(current+1)%visibleItems.length];
      next.focus(); break;
    case 'ArrowUp':
      e.preventDefault();
      openList();
      const prev = visibleItems[(current-1+visibleItems.length)%visibleItems.length];
      prev.focus(); break;
    case 'Enter': if(!listbox.hidden) e.preventDefault(); break;
    case 'Escape': closeList(); break;
  }
});
/* initial state */
selectIssuer('');

/* --------------------------------------------------------------------- */
/* 2. Card rendering                                                     */
/* --------------------------------------------------------------------- */
function clearResults(){
  cardsGrid.innerHTML=''; tbody.innerHTML=''; msg.textContent='';
  cardsGrid.style.gridTemplateColumns='';                      // reset grid
}

function buildCard(r:ReturnType<typeof buildComparisonTable>[number]){
  const card=document.createElement('div'); card.className='card';
  card.innerHTML=`
    <div class="installments">${r.installments}×</div>
    <div class="per">${brl.format(r.perInstallment)}</div>
    <div class="total">Total ${brl.format(r.finalPrice)}</div>
    <div class="surcharge">Acréscimo ${brl.format(r.surcharge)} (${r.extraPaidPercent.toFixed(2)} %)</div>`;
  return card;
}

let selectedCard:HTMLDivElement|null=null;

calcBtn.addEventListener('click',()=>{
  clearResults();
  const issuer=nativeSelect.value;
  const base=parseFloat(priceInput.value);
  if(!issuer){msg.textContent='Selecione a bandeira.';return;}
  if(isNaN(base)||base<=0){msg.textContent='Valor inválido.';return;}

  const table=getIssuerTable(issuer);
  if(!table){msg.textContent='Tabela não encontrada.';return;}

  const rows=buildComparisonTable(base,table,getSimples());
  const maxRows=3; const cols=Math.ceil(rows.length/maxRows);
  cardsGrid.style.gridTemplateColumns=`repeat(${cols},1fr)`;

  rows.forEach(r=>{
    const card=buildCard(r);
    card.addEventListener('click',()=>{
      selectedCard?.classList.remove('selected');
      card.classList.add('selected'); selectedCard=card;
    });
    cardsGrid.append(card);
  });
  cardsGrid.scrollIntoView({behavior:'smooth'});
});

/* enter‑to‑calc */
priceInput.addEventListener('keydown',e=>{ if(e.key==='Enter') calcBtn.click(); });

/* reset */
resetBtn.addEventListener('click',()=>{
  priceInput.value=''; nativeSelect.value=''; selectIssuer('');
  clearResults();
});

/* gear icon */
const gearImg=document.getElementById('gear-icon') as HTMLImageElement;
gearImg.src=GearIcon; gearImg.width=18; gearImg.height=18;
