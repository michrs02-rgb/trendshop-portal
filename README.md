# 🛍️ TrendShop — Portal de Curadoria de Ofertas Shopee

> **Slogan:** *Curadoria Inteligente das Melhores Ofertas*  
> Projeto desenvolvido com arquitetura Full-Stack moderna (HTML5, CSS3, JavaScript ES6+ puro) e pipeline automatizado em Python com IA para extração do catálogo DOCX e geração/tratamento de 5 ângulos fotográficos fotorrealistas por produto.

---

## 🚀 Estrutura de Arquivos

```text
trendshop-portal/
├── assets/
│   ├── css/
│   │   └── style.css            # Sistema de design completo (Neon, responsivo, dark/light)
│   ├── img/
│   │   ├── logo.svg             # Logotipo SVG circular neon oficial TrendShop
│   │   ├── 01-1.jpg .. 60-5.jpg # 300 imagens (5 ângulos para cada um dos 60 produtos)
│   └── js/
│       ├── main.js              # Lógica da vitrine (busca, filtros, cronômetro, URL ?destaque=XX)
│       ├── produto.js           # Lógica da página interna (galeria 5 fotos, conversão, avaliações)
│       └── admin.js             # Lógica do painel admin (login por senha, edição, exportação JSON)
├── data/
│   └── produtos.json            # Banco de dados estruturado dos 60 produtos com metadados ricos
├── admin.html                   # Painel administrativo protegido por senha (trendshop2026)
├── index.html                   # Página inicial da vitrine responsiva com 60 cards
├── produto.html                 # Página interna do produto de alta conversão
├── gerar_catalogo.py            # Script Python de extração do DOCX + IA Google Gemini
└── README.md                    # Documentação técnica e guia de execução
```

---

## 📦 Fase 1: Pipeline em Python (`gerar_catalogo.py`)

O script `gerar_catalogo.py`:
1. Lê o arquivo DOCX original (`catalogo-60-produtos-trendshop_2.docx` ou `catalogo-60-produtos-trendshop.docx`).
2. Extrai os 60 produtos com seus links oficiais de afiliado Shopee e extrai a imagem original embutida na tabela como `assets/img/XX-1.jpg`.
3. Corrige obrigatoriamente as especificações de títulos nos itens auditados:
   - **#01** = 2kg: `Percarbonato de Sódio 100% Puro Tira-Manchas (2kg)`
   - **#15** = Kit 2 espátulas: `Kit 2 Espátulas de Silicone com Cabo Inox`
   - **#21** = Kit 3 formas: `Kit 3 Formas de Silicone Reutilizáveis para Air Fryer`
   - **#37** = Kit 6 pincéis: `Kit 6 Pincéis de Maquiagem Profissionais Macios`
   - **#49** = 1200ml: `Garrafa Térmica Esportiva Motivacional (1200ml)`
4. Integração com a API do Google Gemini (`google-genai`):
   - Gera prompts fotorrealistas para os ângulos 2 a 5:
     - `XX-1.jpg`: Foto principal limpa extraída do DOCX.
     - `XX-2.jpg`: Cena de uso real/demonstração em ambiente moderno e iluminado.
     - `XX-3.jpg`: Close-up macro destacando textura, acabamento e especificações técnicas.
     - `XX-4.jpg`: Demonstração de resultado/benefício prático de alta eficácia.
     - `XX-5.jpg`: Flat lay comercial organizado sobre bancada de estúdio.
   - Possui controle de taxa (*rate-limit* / *sleep*) e retomada automática (*resume* pulando fotos já geradas).
   - Conta com motor de visão computacional e tratamento fotográfico de estúdio (*PIL High-Fidelity Studio*) para geração instantânea e fallback seguro caso a API Key não esteja definida no ambiente.
5. Salva o banco de dados completo e estruturado em `data/produtos.json`.

### Como rodar o script novamente:

```bash
python gerar_catalogo.py
```

---

## 🎨 Fase 2: Front-End TrendShop

### 1. Identidade Visual
- **Paleta de Cores:**
  - Header & Footer: Roxo Noturno (`#14092A`)
  - Luzes Neon / Acentos: Azul Ciano (`#00E5FF`) e Magenta (`#FF2A85`)
  - Fundo da Vitrine: Lavanda Suave (`#F5F3FF`)
  - Cards: Branco Puro (`#FFFFFF`)
- **Logo SVG:** Circular Neon com iniciais **TS** e silhueta de sacola/carrinho com efeitos luminosos.
- **Tipografia:** `Plus Jakarta Sans` e `Inter` (Google Fonts).

### 2. Recursos da Vitrine (`index.html`)
- **Header fixo:** Barra de confiança, busca em tempo real por título/departamento e botão "Achados até R$ 50".
- **Hero Banner:** Cronômetro regressivo diário sincronizado até as 23:59:59.
- **Abas de Departamentos com contadores dinâmicos:**
  - Todos (60)
  - Casa & Limpeza (12)
  - Cozinha (10)
  - Tech & Gadgets (10)
  - Beleza & Skincare (10)
  - Moda & Fitness (10)
  - Automotivo (8)
- **Grid Responsivo:** 4 colunas no Desktop e 2 colunas no Mobile.
- **Destaque nos Vídeos Curtos (`?destaque=XX`):**
  - Exemplo: `index.html?destaque=23` coloca o item no topo com borda neon pulsante e rola suavemente até ele.

### 3. Página Interna do Produto (`produto.html?id=XX`)
- **Galeria de 5 Imagens:** Visualizador grande com zoom, setas de navegação, miniaturas clicáveis e legenda dinâmica do ângulo (`1/5 Foto Principal`, `2/5 Produto em Uso`, `3/5 Detalhes e Acabamento`, `4/5 Resultado Prático`, `5/5 Kit e Medidas`).
- **Coluna de Conversão:** Título completo, nota 4.9★, faixa de Oferta Relâmpago com cronômetro, seletor de quantidade, botão vibrante *"Comprar Agora na Shopee"* (com link oficial em nova aba) e botão de Favoritos persistente no navegador.
- **Bloco de Confiança:** Selo de Curadoria Verificada e 99% de aprovação.
- **Tabela de Especificações Técnicas:** Categoria, Estoque, Marca, Garantia e Medidas.
- **Benefícios Comprovados:** 3 tópicos persuasivos com ícones neon.
- **Avaliações com Filtros:** Depoimentos de compradores reais verificados.
- **Recomendados:** 4 produtos do mesmo departamento.

### 4. Painel Administrativo (`admin.html`)
- **Proteção por Senha:** Senha padrão `trendshop2026`.
- **Gerenciador Completo:** Edição de títulos, preços promocionais e links de afiliados.
- **Exportação 1-Clique:** Botão *"Baixar produtos.json"* para download imediato do JSON atualizado.

---

## ⚡ Como Testar Localmente

Basta iniciar qualquer servidor estático ou abrir diretamente no navegador:

```bash
# Com Python:
python -m http.server 8000

# Acesse no seu navegador:
http://localhost:8000
http://localhost:8000/produto.html?id=01
http://localhost:8000/admin.html
```

---

## ☁️ Deploy na Vercel (100% Estático)

Como o portal foi construído em arquitetura estática pura sem dependências de servidor node:
1. Conecte seu repositório no GitHub à Vercel.
2. Como não requer build, selecione a pasta raiz (`/`).
3. O deploy estará ativo instantaneamente em alta velocidade com CDN global!
