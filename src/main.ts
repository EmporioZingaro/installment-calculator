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
  const o=document.createElement('option');
  o.value=o.textContent=issuer;
  issuerSelect.append(o);
});

let selectedRow: HTMLTableRowElement | null = null;

calcBtn.addEventListener('click', ()=>{
  tbody.innerHTML=''; msg.textContent='';
  selectedRow=null;

  const issuer=issuerSelect.value;
  const base=parseFloat(priceInput.value);

  if(!issuer){msg.textContent='Selecione a bandeira.';return;}
  if(isNaN(base)||base<=0){msg.textContent='Valor inválido.';return;}

  const table=getIssuerTable(issuer);
  if(!table){msg.textContent='Tabela não encontrada.';return;}

  const rows=buildComparisonTable(base,table,getSimples());

  rows.forEach(r=>{
    const tr=document.createElement('tr');
    tr.innerHTML=`
      <td>${r.installments}×</td>
      <td>${brl.format(r.perInstallment)}</td>
      <td>${brl.format(r.finalPrice)}</td>
      <td>${brl.format(r.surcharge)}</td>
      <td>${r.extraPaidPercent.toFixed(2)} %</td>
    `;
    // selection handler
    tr.addEventListener('click', ()=>{
      if(selectedRow) selectedRow.classList.remove('selected');
      tr.classList.add('selected');
      selectedRow = tr;
    });
    tbody.append(tr);
  });
});

resetBtn.addEventListener('click', ()=>{
  priceInput.value='';
  issuerSelect.value='';
  tbody.innerHTML='';
  msg.textContent='';
  selectedRow=null;
});
