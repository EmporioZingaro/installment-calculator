import { buildComparisonTable } from './fees';
import { issuerTables, getIssuerTable } from './issuers';

const brl = new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'});
const getSimples = () => (parseFloat(localStorage.getItem('simplesRate')??'5'))/100;

const sel = (id:string)=>document.getElementById(id)!;
const issuerSelect = sel('issuer') as HTMLSelectElement;
const priceInput   = sel('price')  as HTMLInputElement;
const btn          = sel('calc')   as HTMLButtonElement;
const tbody        = sel('tbody')  as HTMLTableSectionElement;
const msg          = sel('msg')    as HTMLDivElement;

// populate dropdown
issuerTables.forEach(({issuer})=>{
  const o=document.createElement('option');o.value=o.textContent=issuer;issuerSelect.append(o);
});

btn.addEventListener('click', ()=>{
  tbody.innerHTML='';msg.textContent='';
  const issuer=issuerSelect.value, base=parseFloat(priceInput.value);
  if(!issuer){msg.textContent='Selecione a bandeira.';return;}
  if(isNaN(base)||base<=0){msg.textContent='Valor inválido.';return;}
  const table=getIssuerTable(issuer);
  if(!table){msg.textContent='Tabela não encontrada.';return;}

  const rows=buildComparisonTable(base,table,getSimples());
  const minExtra=Math.min(...rows.map(r=>r.extraPaidPercent));

  rows.forEach(r=>{
    const tr=document.createElement('tr');
    if(r.extraPaidPercent===minExtra)tr.classList.add('best');
    tr.innerHTML=`
      <td>${r.installments}×</td>
      <td>${r.feePercent.toFixed(2)} %</td>
      <td>${brl.format(r.perInstallment)}</td>
      <td>${brl.format(r.finalPrice)}</td>
      <td>${brl.format(r.surcharge)}</td>
      <td>${r.extraPaidPercent.toFixed(2)} %</td>`;
    tbody.append(tr);
  });
});
