# 📦 Calculadora de Parcelamento

> **Web‑app para simular parcelamento no cartão de crédito sem reduzir a receita líquida da loja.**  
> Hospedado em **GitHub Pages** com deploy automático via **GitHub Actions**.

---

## ✨ Visão geral

| Para quem | O que oferece |
|-----------|---------------|
| **Cliente** | Vê, em segundos, quanto pagará a mais ao parcelar e decide a melhor opção. |
| **Atendente (clerk)** | Ferramenta clara para mostrar todas as opções e registrar a escolhida (linha clicável). |
| **Gerente** | Pode atualizar taxas MDR/Rotativo e alíquota Simples sem mexer em código. |
| **Dev** | Projeto TypeScript/Vite organizado, teste local rápido e CI/CD configurado. |

---

## 🖥️ Uso diário (Clerk)

1. Abra o atalho da **Calculadora** no navegador do PDV.
2. **Bandeira** → selecione Visa, Mastercard, etc.
3. **Valor da compra** → digite o preço à vista.
4. Clique **Calcular**.
5. Leia a tabela. Clique numa linha para realçar a opção que o cliente escolheu.
6. Se precisar limpar, clique **Resetar**.

> **Dica:** após calcular, a página rola suavemente até a tabela completa, garantindo que todas as parcelas fiquem visíveis para o cliente.

### Página de Configurações

- **Alíquota Simples Nacional**: altere caso a empresa mude de faixa.
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

- **Node ≥ 20**
- **pnpm ≥ 9**

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
4. Publicação automática (configuração "GitHub Actions" em _Settings → Pages_)

Estado do deploy → *Actions → pages build and deployment*.

### Estrutura

```
project
├── index.html            # calculadora
├── settings.html         # página de configurações
├── style.css             # tema global (Inter, accent blue)
├── logo.svg              # logomarca
├── src/
│   ├── main.ts           # lógica UI + cálculo + seleção de linha
│   ├── settings.ts       # lógica da página de config
│   ├── fees.ts           # função pura que calcula acréscimo
│   ├── issuers.ts        # carrega JSON, define ordem
│   └── data/             # arquivos de taxa por bandeira
│       ├── visa.json
│       └── ...
├── vite.config.ts        # Vite + PWA (offline first)
└── .github/workflows/ci.yml
```

### PWA / Offline

- `vite-plugin-pwa` gera service‑worker
- **Primeiro acesso online** → assets e JSON são armazenados; app funciona sem internet.
- Botão **Atualizar tabelas** invalida cache (`jsonCacheBuster`).

### Ajustes rápidos

| Deseja… | Onde alterar |
|---------|--------------|
| Diminuir altura das linhas | `style.css` → `th,td { padding: .3rem ... }` |
| Mudar cor de seleção | `--selected` variável CSS |
| Alterar ordem das bandeiras | `src/issuers.ts` → `preferredOrder` |
| Trocar cor principal | `--accent` em `:root` |

---

## 🧩 Roadmap (ideias futuras)

- **Alinhamento decimal perfeito** nas colunas em R$
- **Exportar** resultado para PDF ou impressão térmica
- **Modo acessibilidade** (alto contraste / teclas rápidas)
- **Teste automatizado** (Playwright) no fluxo principal

Contribuições são bem‑vindas! Abra uma *issue* ou *pull request*.

---

## 🪪 Licença

MIT © 2025 Emporio Zingaro

