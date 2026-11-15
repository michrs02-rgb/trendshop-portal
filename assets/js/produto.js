/**
 * TrendShop - JavaScript da Página Interna do Produto (produto.html)
 */

document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  let produtoId = urlParams.get('id') || '01';

  let todosProdutos = [];
  let produtoAtual = null;
  let indiceFotoAtual = 0;
  let quantidade = 1;

  // Legendas dos 5 ângulos de foto gerados
  const LEGENDAS_ANGULOS = [
    '1/5 Foto Principal',
    '2/5 Produto em Uso',
    '3/5 Detalhes e Acabamento',
    '4/5 Resultado Prático',
    '5/5 Kit e Medidas'
  ];

  carregarProduto();

  async function carregarProduto() {
    try {
      const localData = localStorage.getItem('trendshop_produtos_custom');
      if (localData) {
        todosProdutos = JSON.parse(localData);
      } else {
        const resp = await fetch('data/produtos.json');
        if (!resp.ok) throw new Error('Erro ao carregar produtos.json');
        todosProdutos = await resp.json();
      }

      // Encontra o produto pelo ID ou pelo número
      produtoAtual = todosProdutos.find(p => p.numero === produtoId || String(p.id) === produtoId);
      if (!produtoAtual) {
        produtoAtual = todosProdutos[0]; // Fallback para o primeiro
      }

      renderizarDetalhesProduto();
      iniciarGaleria();
      iniciarCronometroOferta();
      iniciarControlesQuantidade();
      iniciarFavoritos();
      renderizarProdutosRelacionados();
    } catch (err) {
      console.error('Erro ao renderizar produto:', err);
    }
  }

  function renderizarDetalhesProduto() {
    const p = produtoAtual;

    // Atualiza título da aba do navegador
    document.title = `${p.titulo} | TrendShop Curadoria`;

    // Breadcrumbs
    const elBreadDepto = document.getElementById('breadDepto');
    const elBreadTitle = document.getElementById('breadTitle');
    if (elBreadDepto) {
      elBreadDepto.textContent = p.departamento;
      elBreadDepto.href = `index.html?depto=${encodeURIComponent(p.departamento)}`;
    }
    if (elBreadTitle) elBreadTitle.textContent = p.titulo;

    // Título e Metas
    document.getElementById('productTitle').textContent = p.titulo;
    document.getElementById('ratingScore').textContent = p.avaliacao;
    document.getElementById('salesCount').textContent = `${p.vendidos} vendidos`;

    // Preços
    const precoFmt = p.preco_promocional.toFixed(2).replace('.', ',');
    const precoOrigFmt = p.preco_original.toFixed(2).replace('.', ',');
    document.getElementById('oldPrice').textContent = `R$ ${precoOrigFmt}`;
    document.getElementById('promoPrice').innerHTML = `<small>R$</small> ${precoFmt}`;
    document.getElementById('discountBadge').textContent = `-${p.desconto_percentual}% OFF`;

    // Botão de compra afiliado com o link real do DOCX
    const btnShopee = document.getElementById('btnShopeeBuy');
    if (btnShopee) {
      btnShopee.href = p.link_afiliado;
      btnShopee.target = '_blank';
      btnShopee.rel = 'noopener noreferrer';
    }

    // Tabela de Especificações Técnicas
    const specsTable = document.getElementById('specsTable');
    if (specsTable) {
      let specsHtml = `
        <tr><td class="spec-key">Departamento</td><td class="spec-val">${p.departamento}</td></tr>
        <tr><td class="spec-key">Código do Item</td><td class="spec-val">TS-${p.numero}</td></tr>
        <tr><td class="spec-key">Disponibilidade</td><td class="spec-val" style="color: #059669; font-weight: 700;">Em Estoque (Envio Imediato)</td></tr>
        <tr><td class="spec-key">Garantia</td><td class="spec-val">Garantia Oficial Shopee 90 dias</td></tr>
      `;
      if (p.especificacoes) {
        for (const [chave, valor] of Object.entries(p.especificacoes)) {
          specsHtml += `<tr><td class="spec-key">${chave}</td><td class="spec-val">${valor}</td></tr>`;
        }
      }
      specsTable.innerHTML = specsHtml;
    }

    // Lista de Benefícios Práticos
    const benefitsList = document.getElementById('benefitsList');
    if (benefitsList && p.beneficios) {
      benefitsList.innerHTML = p.beneficios.map(b => `
        <div class="benefit-bullet-item">
          <div class="benefit-bullet-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <div>${b}</div>
        </div>
      `).join('');
    }
  }

  // Galeria de 5 Imagens com Legendas e Navegação
  function iniciarGaleria() {
    const mainImg = document.getElementById('galleryMainImage');
    const angleText = document.getElementById('angleCaptionText');
    const thumbsStrip = document.getElementById('thumbnailsStrip');
    const btnPrev = document.getElementById('galleryPrev');
    const btnNext = document.getElementById('galleryNext');

    const imagens = produtoAtual.imagens || [
      `assets/img/${produtoAtual.numero}-1.jpg`,
      `assets/img/${produtoAtual.numero}-2.jpg`,
      `assets/img/${produtoAtual.numero}-3.jpg`,
      `assets/img/${produtoAtual.numero}-4.jpg`,
      `assets/img/${produtoAtual.numero}-5.jpg`
    ];

    function atualizarFoto(index) {
      indiceFotoAtual = (index + imagens.length) % imagens.length;
      mainImg.src = imagens[indiceFotoAtual];
      angleText.textContent = LEGENDAS_ANGULOS[indiceFotoAtual] || `Foto ${indiceFotoAtual + 1}`;

      // Atualiza estado ativo das miniaturas
      thumbsStrip.querySelectorAll('.thumb-item').forEach((thumb, idx) => {
        thumb.classList.toggle('active', idx === indiceFotoAtual);
      });
    }

    // Renderiza as 5 miniaturas
    thumbsStrip.innerHTML = imagens.map((imgSrc, idx) => `
      <div class="thumb-item ${idx === 0 ? 'active' : ''}" data-index="${idx}">
        <img src="${imgSrc}" alt="Ângulo ${idx + 1}" loading="lazy" onerror="this.src='assets/img/${produtoAtual.numero}-1.jpg'">
      </div>
    `).join('');

    // Eventos nas miniaturas (clique e hover)
    thumbsStrip.querySelectorAll('.thumb-item').forEach(thumb => {
      const idx = parseInt(thumb.getAttribute('data-index'), 10);
      thumb.addEventListener('click', () => atualizarFoto(idx));
      thumb.addEventListener('mouseenter', () => atualizarFoto(idx));
    });

    // Setas de navegação
    btnPrev?.addEventListener('click', () => atualizarFoto(indiceFotoAtual - 1));
    btnNext?.addEventListener('click', () => atualizarFoto(indiceFotoAtual + 1));

    // Carrega primeira foto
    atualizarFoto(0);
  }

  // Cronômetro da Oferta Relâmpago
  function iniciarCronometroOferta() {
    const elFlashDigits = document.getElementById('flashTimerDigits');
    if (!elFlashDigits) return;

    function atualizar() {
      const agora = new Date();
      const fimDoDia = new Date();
      fimDoDia.setHours(23, 59, 59, 999);

      const diff = fimDoDia - agora;
      if (diff <= 0) return;

      const h = String(Math.floor(diff / (1000 * 60 * 60))).padStart(2, '0');
      const m = String(Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))).padStart(2, '0');
      const s = String(Math.floor((diff % (1000 * 60)) / 1000)).padStart(2, '0');

      elFlashDigits.textContent = `${h}:${m}:${s}`;
    }

    atualizar();
    setInterval(atualizar, 1000);
  }

  // Seletor de Quantidade
  function iniciarControlesQuantidade() {
    const qtyVal = document.getElementById('qtyValue');
    const btnMinus = document.getElementById('qtyMinus');
    const btnPlus = document.getElementById('qtyPlus');

    btnMinus?.addEventListener('click', () => {
      if (quantidade > 1) {
        quantidade--;
        qtyVal.textContent = quantidade;
      }
    });

    btnPlus?.addEventListener('click', () => {
      if (quantidade < 99) {
        quantidade++;
        qtyVal.textContent = quantidade;
      }
    });
  }

  // Favoritos via LocalStorage
  function iniciarFavoritos() {
    const btnFav = document.getElementById('btnFavToggle');
    if (!btnFav) return;

    const favoritos = JSON.parse(localStorage.getItem('trendshop_favoritos') || '[]');
    const isFav = favoritos.includes(produtoAtual.numero);
    if (isFav) btnFav.classList.add('active');

    btnFav.addEventListener('click', () => {
      let favs = JSON.parse(localStorage.getItem('trendshop_favoritos') || '[]');
      const idx = favs.indexOf(produtoAtual.numero);
      if (idx !== -1) {
        favs.splice(idx, 1);
        btnFav.classList.remove('active');
      } else {
        favs.push(produtoAtual.numero);
        btnFav.classList.add('active');
      }
      localStorage.setItem('trendshop_favoritos', JSON.stringify(favs));
    });
  }

  // Produtos Relacionados (4 itens do mesmo departamento)
  function renderizarProdutosRelacionados() {
    const relGrid = document.getElementById('relatedProductsGrid');
    if (!relGrid) return;

    let relacionados = todosProdutos.filter(p => p.departamento === produtoAtual.departamento && p.numero !== produtoAtual.numero);
    if (relacionados.length < 4) {
      const outros = todosProdutos.filter(p => p.numero !== produtoAtual.numero);
      relacionados = [...relacionados, ...outros].slice(0, 4);
    } else {
      relacionados = relacionados.slice(0, 4);
    }

    relGrid.innerHTML = relacionados.map(prod => {
      const imgPrincipal = prod.imagens && prod.imagens.length > 0 ? prod.imagens[0] : `assets/img/${prod.numero}-1.jpg`;
      const precoFmt = prod.preco_promocional.toFixed(2).replace('.', ',');
      const precoOrigFmt = prod.preco_original.toFixed(2).replace('.', ',');

      return `
        <a href="produto.html?id=${prod.numero}" class="product-card">
          <div class="card-image-wrap">
            <img src="${imgPrincipal}" alt="${prod.titulo}" loading="lazy" onerror="this.src='assets/img/${prod.numero}-1.jpg'">
            <div class="card-discount-badge">-${prod.desconto_percentual}%</div>
          </div>
          <div class="card-body">
            <div class="card-meta-row">
              <span class="card-rating">
                <svg width="12" height="12" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
                ${prod.avaliacao}
              </span>
              <span class="card-sales">${prod.vendidos}</span>
            </div>
            <h3 class="card-title" title="${prod.titulo}">${prod.titulo}</h3>
            <div class="card-pricing">
              <span class="card-old-price">R$ ${precoOrigFmt}</span>
              <div class="card-current-price-row">
                <span class="card-current-price"><small>R$</small> ${precoFmt}</span>
                <span class="card-shipping-tag">Frete Grátis</span>
              </div>
            </div>
            <div class="card-cta-btn">
              <span>Ver Oferta</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </div>
          </div>
        </a>
      `;
    }).join('');
  }
});
