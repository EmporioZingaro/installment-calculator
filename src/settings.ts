// src/settings.ts
const simpInput = document.getElementById('simp')  as HTMLInputElement;
const saveBtn   = document.getElementById('save')  as HTMLButtonElement;
const refreshBtn= document.getElementById('refresh') as HTMLButtonElement;
const msg       = document.getElementById('msg')   as HTMLDivElement;

// --- initialise field with stored value or default 5%
simpInput.value = localStorage.getItem('simplesRate') ?? '5.00';

// --- save Simples % ---------------------------------------------------------
saveBtn.addEventListener('click', () => {
  const value = parseFloat(simpInput.value);
  if (isNaN(value) || value <= 0 || value >= 100) {
    msg.textContent = 'Digite uma porcentagem entre 0 e 100.';
    return;
  }
  localStorage.setItem('simplesRate', value.toString());
  msg.textContent = 'Salvo! Agora volte para a calculadora.';
});

// --- force‑refresh fee tables ----------------------------------------------
refreshBtn.addEventListener('click', () => {
  // simple cache‑buster value: current timestamp
  localStorage.setItem('jsonCacheBuster', Date.now().toString());
  msg.textContent = 'Pronto! As tabelas serão baixadas novamente.';
});
