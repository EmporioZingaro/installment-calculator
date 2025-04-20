# 📦 Calculadora de Parcelamento

> **Web‑app para simular parcelamento no cartão de crédito sem reduzir a receita líquida da loja.**  
> Hospedado em **GitHub Pages** com deploy automático via **GitHub Actions**.

---

## ✨ Visão geral

| Para quem | O que oferece |
|-----------|---------------|
| **Cliente** | Vê, em segundos, quanto pagará a mais ao parcelar e decide a melhor opção. |
| **Atendente (clerk)** | Interface clara: painel de entrada fixo à esquerda + tabela de opções centralizada. Clique num card para selecionar a opção do cliente. |
| **Gerente** | Pode atualizar taxas MDR/Rotativo e alíquota Simples sem mexer em código. |
| **Dev** | Projeto TypeScript/Vite organizado, teste local rápido e CI/CD configurado. |

---

## 🖥️ Uso diário (Clerk)

1. Abra o atalho da **Calculadora** no navegador do PDV  
   (desktop ‑ o app não é optimizado para mobile).
2. **Bandeira** → selecione Visa, Mastercard, etc.
3. **Valor da compra** → digite o preço à vista.
4. Clique **Calcular**.
5. Leia os cartões de parcelas no painel da direita  
   (4 cards por linha, distância uniforme de 24 px).  
   Clique num card para realçar a opção que o cliente escolheu.
6. Para limpar, clique **Limpar**.

### Página de Configurações

- **Alíquota Simples Nacional**: altere caso a empresa mude de faixa.
- **Atualizar tabelas**: força o download de novas taxas (após o gerente atualizar o repositório).

---

## 🛠️ Fluxo para Gerentes

| Tarefa | Como fazer |
|--------|------------|
| **Atualizar taxas** MDR/Rotativo | Editar ou substituir o JSON correspondente em `src/data/` e fazer *commit* na branch `main`. |
| **Adicionar nova bandeira** | Criar novo `src/data/amex.json` (mesmo schema). A lista carrega automaticamente. |
| **Definir ordem preferencial** | Editar array `preferredOrder` em `src/issuers.ts`. Bandeiras não listadas aparecem no final. |
| **Mudar alíquota Simples padrão** | Via interface *Configurações* → **Salvar**. (Valor fica em `localStorage`, portanto é por dispositivo). |

---

## 💻 Para Desenvolvedores

### Requisitos

- **Node ≥ 20**
- **pnpm ≥ 9**

### Instalação & Dev server

```bash
pnpm install      # instala dependências
pnpm run dev      # localhost:5173 com HMR
```

### Build & preview

```bash
pnpm run build    # gera /dist
pnpm run preview  # serve dist em localhost:4173
```

### Deploy (CI/CD)

Push na branch **main** desencadeia:

1. `pnpm install`
2. `pnpm run build`
3. Upload de `/dist` como artefato Pages
4. Publicação automática (configuração "GitHub Actions" em _Settings → Pages_)

Estado do deploy → *Actions → “pages build and deployment”*.

### Estrutura

```
project
├── index.html            # calculadora
├── settings.html         # página de configurações
├── style.css             # tema global
├── logo.svg              # logomarca
├── src/
│   ├── main.ts           # lógica UI + cálculo
│   ├── settings.ts       # página de config
│   ├── fees.ts           # função pura que calcula acréscimo
│   ├── issuers.ts        # carrega JSON, define ordem
│   └── data/             # arquivos de taxa por bandeira
│       ├── visa.json
│       └── ...
└── .github/workflows/ci.yml
```

### Layout / Design system (resumo)

| Token / Regra | Valor |
|---------------|-------|
| Gap entre painéis | 24 px fixos (flex `column‑gap`) |
| Largura cards | 260 px |
| Grade | 4 colunas × 3 linhas (cabe até 12 parcelas sem rolagem em 1080p) |
| Larguras painel‑direito | `--panel-init` 960 px → `--panel-expand` 1160 px |
| Botão reset | rótulo **Limpar** (antes era “Resetar”) |

*Observação:* O painel de entrada não se desloca mais nem muda opacidade; apenas o painel de resultados expande suavemente.

---

## 🪪 Licença

MIT © 2025 Emporio Zingaro
