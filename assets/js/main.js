/**
 * TrendShop - JavaScript Principal da Vitrine (index.html)
 */

const FALLBACK_IMAGE = "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400' width='400' height='400'%3E%3Cdefs%3E%3ClinearGradient id='bgGrad' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%231a0b2e'/%3E%3Cstop offset='100%25' stop-color='%23261245'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23bgGrad)'/%3E%3Ccircle cx='200' cy='170' r='50' fill='%237928CA' fill-opacity='0.25'/%3E%3Cpath d='M182 160h36v32h-36z M191 160a9 9 0 0 1 18 0' fill='none' stroke='%2300E5FF' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3Ctext x='200' y='245' text-anchor='middle' font-family='sans-serif' font-size='15' font-weight='700' fill='%23FFFFFF'%3ETrend%3Ctspan fill='%2300E5FF'%3EShop%3C/tspan%3E%3C/text%3E%3Ctext x='200' y='270' text-anchor='middle' font-family='sans-serif' font-size='12' font-weight='500' fill='%23bba8d8'%3EImagem em Atualização%3C/text%3E%3C/svg%3E";

document.addEventListener('DOMContentLoaded', () => {
  let todosProdutos = [];
  let deptoAtivo = 'Todos';
  let apenasAte50 = false;
  let termoBusca = '';

  const gridContainer = document.getElementById('productsGrid');
  const searchInput = document.getElementById('searchInput');
  const btnFilterFast = document.getElementById('btnFilterFast');
  const countBadge = document.getElementById('catalogCountBadge');
  const deptTabsContainer = document.getElementById('deptTabs');

  // Inicializa o cronômetro do Hero
  iniciarCronometroHero();

  // Carrega produtos do JSON ou LocalStorage sincronizado
  carregarProdutos();

  async function carregarProdutos() {
    try {
      // Verifica se há dados sincronizados no localStorage do admin
      const localData = localStorage.getItem('trendshop_produtos_custom');
      if (localData) {
        todosProdutos = JSON.parse(localData);
      } else {
        const resp = await fetch('data/produtos.json');
        if (!resp.ok) throw new Error('Falha ao carregar produtos.json');
        todosProdutos = await resp.json();
      }

      atualizarContadoresAbas();
      configurarEventosFiltros();
      aplicarFiltrosERenderizar();
    } catch (err) {
      console.error('Erro ao carregar catálogo:', err);
      gridContainer.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #ff2a85;">
          <h3>Não foi possível carregar as ofertas.</h3>
          <p>Verifique o arquivo data/produtos.json.</p>
        </div>
      `;
    }
  }

  function atualizarContadoresAbas() {
    const deptos = {
      'Todos': todosProdutos.length,
      'Casa & Limpeza': 0,
      'Cozinha': 0,
      'Tech & Gadgets': 0,
      'Beleza & Skincare': 0,
      'Moda & Fitness': 0,
      'Automotivo': 0
    };

    todosProdutos.forEach(p => {
      if (deptos[p.departamento] !== undefined) {
        deptos[p.departamento]++;
      }
    });

    const abas = [
      { id: 'Todos', label: 'Todos', count: deptos['Todos'] },
      { id: 'Casa & Limpeza', label: 'Casa & Limpeza', count: deptos['Casa & Limpeza'] },
      { id: 'Cozinha', label: 'Cozinha', count: deptos['Cozinha'] },
      { id: 'Tech & Gadgets', label: 'Tech & Gadgets', count: deptos['Tech & Gadgets'] },
      { id: 'Beleza & Skincare', label: 'Beleza & Skincare', count: deptos['Beleza & Skincare'] },
      { id: 'Moda & Fitness', label: 'Moda & Fitness', count: deptos['Moda & Fitness'] },
      { id: 'Automotivo', label: 'Automotivo', count: deptos['Automotivo'] }
    ];

    deptTabsContainer.innerHTML = abas.map(aba => `
      <button class="dept-tab-btn ${aba.id === deptoAtivo ? 'active' : ''}" data-dept="${aba.id}">
        <span>${aba.label}</span>
        <span class="badge-count">${aba.count}</span>
      </button>
    `).join('');

    deptTabsContainer.querySelectorAll('.dept-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        deptTabsContainer.querySelectorAll('.dept-tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        deptoAtivo = btn.getAttribute('data-dept');
        aplicarFiltrosERenderizar();
      });
    });
  }

  function configurarEventosFiltros() {
    // Busca instantânea
    searchInput.addEventListener('input', (e) => {
      termoBusca = e.target.value.trim().toLowerCase();
      aplicarFiltrosERenderizar();
    });

    // Filtro rápido "Achados até R$ 50"
    btnFilterFast.addEventListener('click', () => {
      apenasAte50 = !apenasAte50;
      btnFilterFast.classList.toggle('active', apenasAte50);
      aplicarFiltrosERenderizar();
    });
  }

  function aplicarFiltrosERenderizar() {
    // Lê parâmetro de destaque na URL se existir (?destaque=XX ou ?id=XX)
    const urlParams = new URLSearchParams(window.location.search);
    const idDestaque = urlParams.get('destaque') || urlParams.get('id');

    let filtrados = todosProdutos.filter(item => {
      // Filtro de departamento
      if (deptoAtivo !== 'Todos' && item.departamento !== deptoAtivo) {
        return false;
      }

      // Filtro de preço até R$ 50
      if (apenasAte50 && item.preco_promocional > 50) {
        return false;
      }

      // Filtro de busca textual
      if (termoBusca) {
        const matchTitulo = item.titulo.toLowerCase().includes(termoBusca);
        const matchDepto = item.departamento.toLowerCase().includes(termoBusca);
        const matchNum = item.numero.includes(termoBusca);
        if (!matchTitulo && !matchDepto && !matchNum) {
          return false;
        }
      }

      return true;
    });

    // Ordenação especial caso haja ?destaque=XX: coloca o produto no topo
    let destaqueEncontrado = null;
    if (idDestaque) {
      const idxDestaque = filtrados.findIndex(p => p.numero === idDestaque || String(p.id) === idDestaque);
      if (idxDestaque !== -1) {
        destaqueEncontrado = filtrados.splice(idxDestaque, 1)[0];
        filtrados.unshift(destaqueEncontrado);
      }
    }

    countBadge.textContent = `${filtrados.length} ofertas`;

    if (filtrados.length === 0) {
      gridContainer.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; background: #ffffff; border-radius: 16px; border: 1px dashed #d8b4fe;">
          <h3 style="font-size: 1.25rem; font-weight: 700; color: #1F1535; margin-bottom: 8px;">Nenhum produto encontrado</h3>
          <p style="color: #645A7A; font-size: 0.9rem;">Tente ajustar sua busca ou remover o filtro de preço.</p>
          <button id="btnClearFilters" style="margin-top: 16px; background: #7928CA; color: #fff; padding: 8px 18px; border-radius: 9999px; font-size: 0.85rem; font-weight: 700;">Limpar Filtros</button>
        </div>
      `;
      document.getElementById('btnClearFilters')?.addEventListener('click', () => {
        searchInput.value = '';
        termoBusca = '';
        apenasAte50 = false;
        btnFilterFast.classList.remove('active');
        deptoAtivo = 'Todos';
        atualizarContadoresAbas();
        aplicarFiltrosERenderizar();
      });
      return;
    }

    gridContainer.innerHTML = filtrados.map(prod => {
      const isVip = idDestaque && (prod.numero === idDestaque || String(prod.id) === idDestaque);
      const imgPrincipal = prod.imagens && prod.imagens.length > 0 ? prod.imagens[0] : `assets/img/${prod.numero}-1.jpg`;
      const precoFmt = prod.preco_promocional.toFixed(2).replace('.', ',');
      const precoOrigFmt = prod.preco_original.toFixed(2).replace('.', ',');

      return `
        <a href="produto.html?id=${prod.numero}" class="product-card ${isVip ? 'is-featured-vip' : ''}" id="card-${prod.numero}">
          ${isVip ? `<div class="card-vip-tag">⭐ Achadinho VIP</div>` : ''}
          <div class="card-image-wrap">
            <img src="${imgPrincipal}" alt="${prod.titulo}" onerror="this.onerror=null; this.src='${FALLBACK_IMAGE}';">
            <div class="card-discount-badge">-${prod.desconto_percentual}%</div>
          </div>
          <div class="card-body">
            <div class="card-meta-row">
              <span class="card-rating">
                <svg width="12" height="12" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
                ${prod.avaliacao}
              </span>
              <span class="card-sales">${prod.vendidos} vendidos</span>
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
              <span>Ver Detalhes</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </div>
          </div>
        </a>
      `;
    }).join('');

    // Se houver destaque via URL, rola suavemente até ele
    if (destaqueEncontrado) {
      setTimeout(() => {
        const elementoDestaque = document.getElementById(`card-${destaqueEncontrado.numero}`);
        if (elementoDestaque) {
          elementoDestaque.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 300);
    }
  }

  // Cronômetro Regressivo Diário até 23:59:59
  function iniciarCronometroHero() {
    const elH = document.getElementById('timerHours');
    const elM = document.getElementById('timerMinutes');
    const elS = document.getElementById('timerSeconds');

    function tick() {
      const agora = new Date();
      const fimDoDia = new Date();
      fimDoDia.setHours(23, 59, 59, 999);

      const diff = fimDoDia - agora;
      if (diff <= 0) return;

      const horas = Math.floor(diff / (1000 * 60 * 60));
      const minutos = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const segundos = Math.floor((diff % (1000 * 60)) / 1000);

      if (elH) elH.textContent = String(horas).padStart(2, '0');
      if (elM) elM.textContent = String(minutos).padStart(2, '0');
      if (elS) elS.textContent = String(segundos).padStart(2, '0');
    }

    tick();
    setInterval(tick, 1000);
  }
});
