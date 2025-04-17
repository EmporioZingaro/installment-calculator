import { calcFinalPrice } from './fees';

// Grab the inputs once
const priceInput        = document.getElementById('price')        as HTMLInputElement;
const installmentsInput = document.getElementById('installments') as HTMLInputElement;
const feeInput          = document.getElementById('fee')          as HTMLInputElement;
const output            = document.getElementById('out')          as HTMLPreElement;
const button            = document.getElementById('calc')!;

button.addEventListener('click', () => {
  const basePrice = parseFloat(priceInput.value);
  const feePct    = parseFloat(feeInput.value);
  const n         = parseInt(installmentsInput.value, 10);

  const { finalPrice, surcharge } = calcFinalPrice(basePrice, feePct);

  const perInst = (finalPrice / n).toFixed(2);

  output.textContent =
    `${n}× de R$ ${perInst}\n` +
    `Total: R$ ${finalPrice.toFixed(2)}  (acréscimo R$ ${surcharge.toFixed(2)})`;
});
