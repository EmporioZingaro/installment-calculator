const simpInput = document.getElementById('simp') as HTMLInputElement;
const saveBtn   = document.getElementById('save') as HTMLButtonElement;
const refreshBtn= document.getElementById('refresh') as HTMLButtonElement;
const msg       = document.getElementById('msg') as HTMLDivElement;

simpInput.value = localStorage.getItem('simplesRate') ?? '5.00';

saveBtn.onclick = ()=>{
  const v=parseFloat(simpInput.value);
  if(isNaN(v)||v<=0||v>=100){msg.textContent='% inválida';return;}
  localStorage.setItem('simplesRate',v.toString());
  msg.textContent='Salvo!';
};

refreshBtn.onclick=()=>{
  localStorage.setItem('jsonCacheBuster',Date.now().toString());
  msg.textContent='Tabelas serão atualizadas no próximo cálculo.';
};

