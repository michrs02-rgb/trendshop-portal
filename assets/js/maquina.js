/**
 * TrendShop - JavaScript da Máquina de Vendas 24h (maquina.html)
 * Passo 1: Automação Operacional de Tráfego e Conteúdo Afiliado
 */

document.addEventListener('DOMContentLoaded', () => {
  // Estado Global da Aplicação
  let todosProdutos = [];
  let produtosFiltrados = [];
  let produtoSelecionado = null;
  let apresentadorManual = null; // null = automático, ou '@MarinaTrend' / '@LucasTrend'
  let deptoAtivo = 'todos';
  let termoBusca = '';

  // Elementos do DOM
  const elBusca = document.getElementById('maquinaBusca');
  const elFiltrosDepto = document.getElementById('departamentoFiltros');
  const elListaContainer = document.getElementById('produtosListaContainer');
  const elContadorBadge = document.getElementById('produtosContadorBadge');
  const elCardProdutoAtivo = document.getElementById('cardProdutoAtivo');
  const elLinksGrid = document.getElementById('linksRastreadosGrid');

  // Abas
  const tabBtnFacebook = document.getElementById('tabBtnFacebook');
  const tabBtnVideo = document.getElementById('tabBtnVideo');
  const tabBtnChecklist = document.getElementById('tabBtnChecklist');
  const tabContentFacebook = document.getElementById('tabContentFacebook');
  const tabContentVideo = document.getElementById('tabContentVideo');
  const tabContentChecklist = document.getElementById('tabContentChecklist');

  // Inicialização
  iniciarAbas();
  carregarCatalogo();

  // Configuração das Abas
  function iniciarAbas() {
    const tabs = [
      { btn: tabBtnFacebook, content: tabContentFacebook },
      { btn: tabBtnVideo, content: tabContentVideo },
      { btn: tabBtnChecklist, content: tabContentChecklist }
    ];

    tabs.forEach(({ btn, content }) => {
      btn?.addEventListener('click', () => {
        tabs.forEach(t => {
          t.btn.classList.remove('tab-active');
          t.btn.classList.add('text-slate-400');
          t.content.classList.add('hidden');
        });
        btn.classList.add('tab-active');
        btn.classList.remove('text-slate-400');
        content.classList.remove('hidden');
      });
    });
  }

  // Carrega produtos do JSON
  async function carregarCatalogo() {
    try {
      const resp = await fetch('data/produtos.json');
      if (!resp.ok) throw new Error('Falha ao carregar data/produtos.json');
      todosProdutos = await resp.json();

      // Normaliza dados
      todosProdutos.forEach(p => {
        p.idStr = String(p.id);
        p.numeroStr = p.numero || (p.id < 10 ? `0${p.id}` : `${p.id}`);
      });

      // Checa parâmetro ?id= na URL da máquina se houver
      const urlParams = new URLSearchParams(window.location.search);
      const paramId = urlParams.get('id');

      let prodInicial = todosProdutos[0];
      if (paramId) {
        const found = todosProdutos.find(p => p.numeroStr === paramId || p.idStr === paramId);
        if (found) prodInicial = found;
      }

      configurarEventosFiltros();
      selecionarProduto(prodInicial);
      renderizarListaProdutos();
    } catch (err) {
      console.error('Erro na máquina:', err);
      if (elListaContainer) {
        elListaContainer.innerHTML = `
          <div class="p-6 text-center text-red-400 text-sm">
            <i class="fa-solid fa-triangle-exclamation text-2xl mb-2"></i>
            <p>Erro ao carregar o catálogo de produtos. Verifique data/produtos.json.</p>
          </div>
        `;
      }
    }
  }

  // Configuração dos Eventos de Busca e Filtro
  function configurarEventosFiltros() {
    elBusca?.addEventListener('input', (e) => {
      termoBusca = e.target.value.toLowerCase().trim();
      filtrarERenderizar();
    });

    elFiltrosDepto?.addEventListener('click', (e) => {
      const btn = e.target.closest('.btn-depto-filtro');
      if (!btn) return;

      elFiltrosDepto.querySelectorAll('.btn-depto-filtro').forEach(b => {
        b.classList.remove('bg-brand-cyan', 'text-brand-bg');
        b.classList.add('bg-white/5', 'text-slate-300');
      });

      btn.classList.remove('bg-white/5', 'text-slate-300');
      btn.classList.add('bg-brand-cyan', 'text-brand-bg');

      deptoAtivo = btn.getAttribute('data-depto');
      filtrarERenderizar();
    });
  }

  function filtrarERenderizar() {
    produtosFiltrados = todosProdutos.filter(p => {
      const matchDepto = (deptoAtivo === 'todos') || (p.departamento === deptoAtivo);
      const matchBusca = !termoBusca || 
        p.titulo.toLowerCase().includes(termoBusca) ||
        p.departamento.toLowerCase().includes(termoBusca) ||
        p.numeroStr.includes(termoBusca) ||
        p.idStr.includes(termoBusca) ||
        (p.beneficios && p.beneficios.some(b => b.toLowerCase().includes(termoBusca)));

      return matchDepto && matchBusca;
    });

    renderizarListaProdutos();
  }

  // Regra Automática do Apresentador
  // Tech & Gadgets, Automotivo, e IDs 40, 45, 48, 51 -> @LucasTrend (Masculino)
  // Casa & Limpeza, Cozinha, Beleza & Skincare e demais Moda & Fitness -> @MarinaTrend (Feminino)
  function determinarApresentadorAutomatico(prod) {
    const idNum = parseInt(prod.id, 10);
    const idsEspeciaisLucas = [40, 45, 48, 51];

    if (idsEspeciaisLucas.includes(idNum)) {
      return '@LucasTrend';
    }

    const depto = prod.departamento || '';
    if (depto === 'Tech & Gadgets' || depto === 'Automotivo') {
      return '@LucasTrend';
    }

    return '@MarinaTrend';
  }

  function getApresentadorAtivo(prod) {
    if (apresentadorManual) return apresentadorManual;
    return determinarApresentadorAutomatico(prod);
  }

  // Renderiza a lista de 60 produtos na coluna esquerda
  function renderizarListaProdutos() {
    const lista = produtosFiltrados.length > 0 || (termoBusca || deptoAtivo !== 'todos')
      ? produtosFiltrados
      : todosProdutos;

    if (elContadorBadge) {
      elContadorBadge.textContent = `${lista.length} de ${todosProdutos.length} itens`;
    }

    if (lista.length === 0) {
      elListaContainer.innerHTML = `
        <div class="p-8 text-center text-slate-500 text-xs">
          <i class="fa-solid fa-box-open text-2xl mb-2 text-slate-600 block"></i>
          Nenhum produto encontrado para estes filtros.
        </div>
      `;
      return;
    }

    elListaContainer.innerHTML = lista.map(p => {
      const isSelected = produtoSelecionado && (produtoSelecionado.id === p.id);
      const apresentadorPadrao = determinarApresentadorAutomatico(p);
      const isLucas = apresentadorPadrao === '@LucasTrend';
      const fotoCapa = `assets/img/${p.numeroStr}-1.jpg`;
      const precoFmt = Number(p.preco_promocional).toFixed(2).replace('.', ',');

      return `
        <div
          data-id="${p.id}"
          class="produto-item-row group p-2.5 rounded-xl border cursor-pointer transition flex items-center gap-3 ${
            isSelected
              ? 'bg-brand-surface border-brand-cyan shadow-neon-cyan'
              : 'bg-brand-surface/40 border-white/5 hover:border-white/20 hover:bg-brand-surface/80'
          }"
        >
          <div class="relative w-12 h-12 rounded-lg overflow-hidden bg-black/40 flex-shrink-0 border border-white/10">
            <img src="${fotoCapa}" alt="${p.titulo}" class="w-full h-full object-cover group-hover:scale-105 transition" loading="lazy" onerror="this.src='assets/img/01-1.jpg'">
            <span class="absolute top-0.5 left-0.5 bg-black/80 text-[9px] px-1 rounded font-mono text-brand-cyan">#${p.numeroStr}</span>
          </div>

          <div class="flex-1 min-w-0">
            <h4 class="text-xs font-semibold text-slate-200 truncate group-hover:text-brand-cyan transition" title="${p.titulo}">
              ${p.titulo}
            </h4>
            <div class="flex items-center gap-2 mt-0.5">
              <span class="text-[10px] text-slate-400 font-mono">${p.departamento}</span>
              <span class="text-[11px] font-bold text-emerald-400">R$ ${precoFmt}</span>
            </div>
          </div>

          <div class="flex flex-col items-end gap-1 flex-shrink-0">
            <span class="text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${
              isLucas
                ? 'bg-cyan-500/10 text-brand-cyan border border-brand-cyan/20'
                : 'bg-pink-500/10 text-brand-pink border border-brand-pink/20'
            }">
              <i class="fa-solid ${isLucas ? 'fa-user-tie' : 'fa-user'} text-[9px] mr-0.5"></i>
              ${isLucas ? '@Lucas' : '@Marina'}
            </span>
            <span class="text-[9px] text-slate-500 font-mono">-${p.desconto_percentual}%</span>
          </div>
        </div>
      `;
    }).join('');

    // Adiciona evento de clique nas linhas
    elListaContainer.querySelectorAll('.produto-item-row').forEach(row => {
      row.addEventListener('click', () => {
        const id = parseInt(row.getAttribute('data-id'), 10);
        const prod = todosProdutos.find(p => p.id === id);
        if (prod) {
          apresentadorManual = null; // Reseta troca manual ao mudar de produto
          selecionarProduto(prod);
          renderizarListaProdutos(); // Atualiza destaque
        }
      });
    });
  }

  // Seleciona e carrega todos os kits do produto
  function selecionarProduto(prod) {
    produtoSelecionado = prod;
    renderizarCardResumo(prod);
    gerarLinksRastreados(prod);
    gerarKitFacebook(prod);
    gerarKitVideoCurto(prod);
    gerarChecklist(prod);
  }

  // Card de Resumo do Produto Ativo + Seletor de Apresentador
  function renderizarCardResumo(p) {
    const apresentador = getApresentadorAtivo(p);
    const isLucas = apresentador === '@LucasTrend';
    const precoFmt = Number(p.preco_promocional).toFixed(2).replace('.', ',');
    const precoOrigFmt = Number(p.preco_original).toFixed(2).replace('.', ',');

    elCardProdutoAtivo.innerHTML = `
      <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div class="flex items-center gap-3">
          <div class="relative w-16 h-16 rounded-xl overflow-hidden bg-black/40 border border-brand-cyan/40 flex-shrink-0 shadow-neon-cyan">
            <img src="assets/img/${p.numeroStr}-1.jpg" alt="${p.titulo}" class="w-full h-full object-cover">
            <span class="absolute top-1 left-1 bg-black/90 text-brand-cyan text-[10px] font-mono px-1 rounded font-bold">
              ID ${p.numeroStr}
            </span>
          </div>
          <div>
            <div class="flex items-center gap-2 mb-1 flex-wrap">
              <span class="text-xs px-2 py-0.5 rounded bg-brand-surface border border-white/10 text-slate-300 font-mono">
                ${p.departamento}
              </span>
              <span class="text-xs px-2 py-0.5 rounded bg-brand-pink/20 text-brand-pink font-bold font-mono">
                -${p.desconto_percentual}% OFF
              </span>
              <span class="text-xs text-amber-400 flex items-center gap-1 font-mono">
                <i class="fa-solid fa-star text-[10px]"></i> ${p.avaliacao} (${p.vendidos})
              </span>
            </div>
            <h2 class="text-base font-extrabold text-white leading-snug" title="${p.titulo}">
              ${p.titulo}
            </h2>
          </div>
        </div>

        <div class="flex flex-row md:flex-col items-center md:items-end justify-between w-full md:w-auto gap-2">
          <div class="text-right">
            <div class="text-[11px] text-slate-400 line-through">De R$ ${precoOrigFmt}</div>
            <div class="text-xl font-extrabold text-emerald-400 font-mono">
              <small class="text-xs font-normal text-slate-300">Por</small> R$ ${precoFmt}
            </div>
          </div>
          <a
            href="${p.link_afiliado}"
            target="_blank"
            rel="noopener noreferrer"
            class="px-3 py-1.5 rounded-lg bg-orange-600/20 hover:bg-orange-600/30 border border-orange-500/40 text-orange-400 text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap"
          >
            <i class="fa-solid fa-arrow-up-right-from-square text-[10px]"></i>
            <span>Ver na Shopee</span>
          </a>
        </div>
      </div>

      <!-- BARRA DE CONTROLE DO APRESENTADOR (AUTO + TROCA RÁPIDA) -->
      <div class="mt-4 pt-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-brand-surface/70 p-3 rounded-xl border border-white/5">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm ${
            isLucas
              ? 'bg-brand-cyan/20 text-brand-cyan border border-brand-cyan'
              : 'bg-brand-pink/20 text-brand-pink border border-brand-pink'
          }">
            <i class="fa-solid ${isLucas ? 'fa-user-tie' : 'fa-user'}"></i>
          </div>
          <div>
            <div class="flex items-center gap-2">
              <span class="text-xs text-slate-400 font-mono">Apresentador IA Escalado:</span>
              <span class="text-sm font-bold ${isLucas ? 'text-brand-cyan' : 'text-brand-pink'}">
                ${apresentador}
              </span>
              <span class="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-white/5 text-slate-400">
                ${isLucas ? 'Masculino' : 'Feminino'}
              </span>
            </div>
            <p class="text-[11px] text-slate-500">
              ${apresentadorManual ? 'Troca manual ativa pelo operador' : 'Escalado automaticamente pelas regras de departamento/ID'}
            </p>
          </div>
        </div>

        <!-- Botão de Troca Rápida de Apresentador -->
        <button
          id="btnTrocarApresentador"
          class="px-3.5 py-1.5 rounded-lg border text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
            isLucas
              ? 'border-brand-pink/50 text-brand-pink bg-brand-pink/10 hover:bg-brand-pink/20'
              : 'border-brand-cyan/50 text-brand-cyan bg-brand-cyan/10 hover:bg-brand-cyan/20'
          }"
          title="Alternar entre @MarinaTrend e @LucasTrend"
        >
          <i class="fa-solid fa-arrows-rotate"></i>
          <span>Alternar para ${isLucas ? '@MarinaTrend' : '@LucasTrend'}</span>
        </button>
      </div>
    `;

    // Evento de troca rápida de apresentador
    document.getElementById('btnTrocarApresentador')?.addEventListener('click', () => {
      apresentadorManual = isLucas ? '@MarinaTrend' : '@LucasTrend';
      selecionarProduto(p);
    });
  }

  // Bloco A: Os 4 Links Rastreados (?id=XX&src=rede)
  function gerarLinksRastreados(p) {
    const redes = [
      {
        nome: 'Facebook',
        src: 'facebook',
        icon: 'fa-brands fa-facebook',
        corIcon: 'text-blue-400',
        badgeCor: 'bg-blue-500/10 text-blue-400 border-blue-500/20'
      },
      {
        nome: 'Instagram',
        src: 'instagram',
        icon: 'fa-brands fa-instagram',
        corIcon: 'text-pink-400',
        badgeCor: 'bg-pink-500/10 text-pink-400 border-pink-500/20'
      },
      {
        nome: 'YouTube Shorts',
        src: 'youtube',
        icon: 'fa-brands fa-youtube',
        corIcon: 'text-red-400',
        badgeCor: 'bg-red-500/10 text-red-400 border-red-500/20'
      },
      {
        nome: 'TikTok',
        src: 'tiktok',
        icon: 'fa-brands fa-tiktok',
        corIcon: 'text-cyan-400',
        badgeCor: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
      }
    ];

    // Monta base de URL (respeitando ambiente web ou file)
    const baseHref = window.location.href.split('maquina.html')[0];
    
    elLinksGrid.innerHTML = redes.map(r => {
      const linkCompleto = `${baseHref}produto.html?id=${p.numeroStr}&src=${r.src}`;

      return `
        <div class="bg-brand-surface p-3 rounded-xl border border-white/5 hover:border-white/20 transition flex flex-col justify-between space-y-2">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold flex items-center gap-1.5 ${r.corIcon}">
              <i class="${r.icon}"></i>
              <span class="text-white">${r.nome}</span>
            </span>
            <span class="text-[10px] font-mono px-1.5 py-0.5 rounded border ${r.badgeCor}">
              src=${r.src}
            </span>
          </div>

          <div class="bg-black/30 px-2.5 py-1.5 rounded-lg border border-white/5 font-mono text-[11px] text-slate-300 truncate select-all">
            produto.html?id=${p.numeroStr}&src=${r.src}
          </div>

          <div class="flex items-center gap-2 pt-1">
            <button
              class="btn-copiar-link flex-1 py-1 px-2.5 rounded-lg bg-brand-cyan/10 hover:bg-brand-cyan/20 border border-brand-cyan/30 text-brand-cyan text-xs font-semibold transition flex items-center justify-center gap-1.5"
              data-link="${linkCompleto}"
            >
              <i class="fa-solid fa-copy text-[11px]"></i>
              <span>Copiar Link</span>
            </button>
            <a
              href="${linkCompleto}"
              target="_blank"
              class="p-1 px-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs transition border border-white/10"
              title="Abrir página rastreada"
            >
              <i class="fa-solid fa-arrow-up-right-from-square"></i>
            </a>
          </div>
        </div>
      `;
    }).join('');

    // Eventos de cópia
    elLinksGrid.querySelectorAll('.btn-copiar-link').forEach(btn => {
      btn.addEventListener('click', () => {
        const url = btn.getAttribute('data-link');
        copiarParaClipboard(url, 'Link rastreado copiado!');
      });
    });
  }

  // Bloco B: Kit Facebook (Carrossel 3 Slides + Legenda)
  function gerarKitFacebook(p) {
    const precoFmt = Number(p.preco_promocional).toFixed(2).replace('.', ',');
    const precoOrigFmt = Number(p.preco_original).toFixed(2).replace('.', ',');
    const baseHref = window.location.href.split('maquina.html')[0];
    const linkRastreado = `${baseHref}produto.html?id=${p.numeroStr}&src=facebook`;

    const b1 = p.beneficios && p.beneficios[0] ? p.beneficios[0] : 'Qualidade premium comprovada com acabamento profissional';
    const b2 = p.beneficios && p.beneficios[1] ? p.beneficios[1] : 'Praticidade real no dia a dia para economizar tempo e esforço';
    const b3 = p.beneficios && p.beneficios[2] ? p.beneficios[2] : 'Design inteligente, ergonômico e durabilidade superior';

    // Slide 1 (Capa / Gancho)
    const slide1 = `[SLIDE 1 - CAPA / GANCHO]\nTITULO: PARE DE SOFRER COM ISSO AGORA!\nSUB: Descobrimos o achado Shopee que resolve de vez: ${p.titulo}.\nINDICADOR: Arraste para o lado para ver o resultado >> (1/3)`;

    // Slide 2 (Benefícios)
    const slide2 = `[SLIDE 2 - BENEFÍCIOS REAIS]\nPOR QUE VIROU FEBRE?\n• ${b1}\n• ${b2}\n• ${b3}\nINDICADOR: Veja a oferta exclusiva no próximo slide >> (2/3)`;

    // Slide 3 (Oferta / Preço Real)
    const slide3 = `[SLIDE 3 - OFERTA OFICIAL]\nVALOR EXCLUSIVO HOJE:\nDe R$ ${precoOrigFmt} por APENAS R$ ${precoFmt} (-${p.desconto_percentual}% OFF)\n• Frete Grátis Shopee + Garantia 90 Dias\n• Avaliação: ${p.avaliacao} estrelas (${p.vendidos} vendas)\nCTA: TOQUE NO LINK DA LEGENDA OU DA BIO! (3/3)`;

    // Legenda Completa Facebook
    const legendaFb = `ACHADO CAMPEÃO SHOPEE REVELADO!\n\nSe você busca praticidade máxima, esse é o item que não pode faltar: ${p.titulo}.\n\nPor que você vai amar:\n✔ ${b1}\n✔ ${b2}\n✔ ${b3}\n\nOportunidade única: De R$ ${precoOrigFmt} por apenas R$ ${precoFmt} com -${p.desconto_percentual}% OFF e frete disponível!\n\nACESSE O LINK OFICIAL VERIFICADO:\n👉 ${linkRastreado}\n\n(Ou comente "EU QUERO" que enviamos o link direto no seu direct!)\n\n#TrendShop #AchadinhosShopee #ShopeeBrasil #Oferta #Achados`;

    // Injeta no DOM
    const elS1 = document.getElementById('fbSlide1Text');
    const elS2 = document.getElementById('fbSlide2Text');
    const elS3 = document.getElementById('fbSlide3Text');
    const elLegenda = document.getElementById('fbLegendaText');

    if (elS1) elS1.textContent = slide1;
    if (elS2) elS2.textContent = slide2;
    if (elS3) elS3.textContent = slide3;
    if (elLegenda) elLegenda.textContent = legendaFb;

    // Botão copiar kit completo
    document.getElementById('btnCopiarTudoFacebook')?.onclick = () => {
      const kitCompleto = `${slide1}\n\n====================\n\n${slide2}\n\n====================\n\n${slide3}\n\n====================\n\n[LEGENDA COMPLETA]:\n${legendaFb}`;
      copiarParaClipboard(kitCompleto, 'Kit Facebook completo copiado!');
    };
  }

  // Bloco C: Kit Vídeo Curto 40s (Reels, Shorts, TikTok)
  function gerarKitVideoCurto(p) {
    const apresentador = getApresentadorAtivo(p);
    const isLucas = apresentador === '@LucasTrend';
    const precoFmt = Number(p.preco_promocional).toFixed(2).replace('.', ',');
    const baseHref = window.location.href.split('maquina.html')[0];
    const linkYoutube = `${baseHref}produto.html?id=${p.numeroStr}&src=youtube`;

    const b1 = p.beneficios && p.beneficios[0] ? p.beneficios[0] : 'Eficiência máxima no uso diário';
    const b2 = p.beneficios && p.beneficios[1] ? p.beneficios[1] : 'Alta durabilidade e material de primeira';
    const b3 = p.beneficios && p.beneficios[2] ? p.beneficios[2] : 'Economia garantida no seu bolso';

    // Roteiro Cronometrado (4 blocos) com concordância de gênero
    const ganchoPalavras = `Você ainda perde tempo sem saber que isso existe?`; // 9 palavras
    const tensaoTexto = isLucas
      ? `Eu cansei de gastar dinheiro à toa com coisas que quebram na primeira semana. Olha a dor de cabeça que a gente passa tentando resolver isso do jeito antigo.`
      : `Eu cansei de perder horas e ficar exausta tentando resolver isso na mão. Dá uma olhada no trabalho que dava antes de descobrir esse segredo.`;

    const desenvTexto = isLucas
      ? `Até que eu testei esse item aqui: o ${p.titulo}. Ele entrega exatamente o que promete: primeiro, ${b1}. Segundo, ${b2}. E ainda por cima ${b3}. A diferença na prática é impressionante!`
      : `Até que eu comecei a usar o ${p.titulo}. Ele mudou totalmente a minha rotina: primeiro, ${b1}. Segundo, ${b2}. E o melhor de tudo: ${b3}. Funciona mesmo e não dá trabalho nenhum!`;

    const ctaTexto = `O link oficial com desconto de ${p.desconto_percentual}% e por apenas R$ ${precoFmt} tá salvo no primeiro comentário fixado e na bio. Corre antes que acabe o estoque!`;

    const blocos = [
      {
        titulo: 'Bloco 1: Gancho (0-3s)',
        meta: 'Máx. 10 palavras | Parar o scroll',
        cor: 'text-brand-pink',
        border: 'border-brand-pink/30',
        texto: `"${ganchoPalavras}"`
      },
      {
        titulo: 'Bloco 2: Tensão (3-10s)',
        meta: 'Problema real / Dor do dia a dia',
        cor: 'text-amber-400',
        border: 'border-amber-400/30',
        texto: `"${tensaoTexto}"`
      },
      {
        titulo: 'Bloco 3: Desenvolvimento (10-32s)',
        meta: 'Demonstração dos 3 Benefícios',
        cor: 'text-brand-cyan',
        border: 'border-brand-cyan/30',
        texto: `"${desenvTexto}"`
      },
      {
        titulo: 'Bloco 4: Chamada Única (32-40s)',
        meta: 'CTA Direto + Oferta Rápida',
        cor: 'text-emerald-400',
        border: 'border-emerald-400/30',
        texto: `"${ctaTexto}"`
      }
    ];

    const elBlocosGrid = document.getElementById('blocosRoteiroGrid');
    if (elBlocosGrid) {
      elBlocosGrid.innerHTML = blocos.map(b => `
        <div class="bg-brand-surface p-3 rounded-xl border ${b.border} space-y-1.5 flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between mb-1">
              <span class="font-bold ${b.cor} uppercase text-[11px]">${b.titulo}</span>
              <span class="text-[10px] text-slate-500 font-mono">${b.meta}</span>
            </div>
            <p class="text-xs text-slate-200 leading-relaxed font-sans">${b.texto}</p>
          </div>
          <button class="btn-copiar-bloco self-end text-[11px] text-slate-400 hover:text-white transition pt-1" data-bloco="${b.texto}">
            <i class="fa-solid fa-copy mr-1"></i>Copiar Bloco
          </button>
        </div>
      `).join('');

      elBlocosGrid.querySelectorAll('.btn-copiar-bloco').forEach(btn => {
        btn.addEventListener('click', () => {
          copiarParaClipboard(btn.getAttribute('data-bloco'), 'Bloco de roteiro copiado!');
        });
      });
    }

    // Armazena roteiro completo para cópia
    const roteiroCompleto = `[ROTEIRO VÍDEO CURTO 40S - ${apresentador.toUpperCase()}]\nPRODUTO: ${p.titulo} (ID ${p.numeroStr})\n\n[00:00 - 00:03] GANCHO:\n${ganchoPalavras}\n\n[00:03 - 00:10] TENSÃO:\n${tensaoTexto}\n\n[00:10 - 00:32] DESENVOLVIMENTO:\n${desenvTexto}\n\n[00:32 - 00:40] CHAMADA ÚNICA (CTA):\n${ctaTexto}`;
    const elRoteiroFull = document.getElementById('roteiroCompletoText');
    if (elRoteiroFull) elRoteiroFull.textContent = roteiroCompleto;

    // 5 Prompts de Cena em Português para Google Flow (9:16)
    const prompts = [
      {
        cena: 'Cena 1 (0-3s) - Gancho Magnético',
        imgElemento: `assets/img/${p.numeroStr}-1.jpg`,
        imgRotulo: 'Foto Principal do Produto',
        prompt: `Vídeo vertical 9:16, plano médio, iluminação suave e natural de estúdio moderno, sem texto na tela. Apresentador(a) ${apresentador} olhando diretamente para a câmera com expressão surpresa e curiosa, segurando o produto em destaque com firmeza. Movimento sutil de aproximação de câmera, estética ultra realista e nítida. Anexar Elemento: assets/img/${p.numeroStr}-1.jpg.`
      },
      {
        cena: 'Cena 2 (3-10s) - Tensão e Contexto',
        imgElemento: `assets/img/${p.numeroStr}-2.jpg`,
        imgRotulo: 'Produto em Uso / Contexto',
        prompt: `Vídeo vertical 9:16, plano médio, luz natural ambiente, sem texto na tela. Apresentador(a) ${apresentador} demonstrando a dor de cabeça e dificuldade comum de resolver esse problema sem a ferramenta certa, interagindo naturalmente no ambiente correspondente com expressão concentrada. Transição suave. Anexar Elemento: assets/img/${p.numeroStr}-2.jpg.`
      },
      {
        cena: 'Cena 3 (10-20s) - Detalhes e Acabamento',
        imgElemento: `assets/img/${p.numeroStr}-3.jpg`,
        imgRotulo: 'Detalhes e Acabamento Premium',
        prompt: `Vídeo vertical 9:16, plano médio fechado, iluminação natural valorizando texturas e materiais, sem texto na tela. Apresentador(a) ${apresentador} mostrando os detalhes de construção, encaixes e alta qualidade do produto, apontando para as características chave com sorriso confiante. Anexar Elemento: assets/img/${p.numeroStr}-3.jpg.`
      },
      {
        cena: 'Cena 4 (20-32s) - Resultado Prático e Transformação',
        imgElemento: `assets/img/${p.numeroStr}-4.jpg`,
        imgRotulo: 'Resultado Prático na Prática',
        prompt: `Vídeo vertical 9:16, plano médio, luz natural vibrante e clara, sem texto na tela. Apresentador(a) ${apresentador} apresentando o resultado final perfeito com entusiasmo e admiração, demonstrando como foi fácil e rápido alcançar o objetivo com o produto. Anexar Elemento: assets/img/${p.numeroStr}-4.jpg.`
      },
      {
        cena: 'Cena 5 (32-40s) - Chamada para Ação e Fechamento',
        imgElemento: `assets/img/${p.numeroStr}-5.jpg`,
        imgRotulo: 'Kit Completo e Embalagem',
        prompt: `Vídeo vertical 9:16, plano médio, luz natural de estúdio, sem texto na tela. Apresentador(a) ${apresentador} segurando o kit completo do produto com a embalagem, sorrindo e apontando amigavelmente para baixo indicando o link dos comentários e da bio com gesto convidativo de compra. Anexar Elemento: assets/img/${p.numeroStr}-5.jpg.`
      }
    ];

    const elPromptsContainer = document.getElementById('promptsGoogleFlowContainer');
    if (elPromptsContainer) {
      elPromptsContainer.innerHTML = prompts.map((pr, idx) => `
        <div class="bg-brand-surface p-3 rounded-xl border border-white/5 space-y-1.5">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="w-5 h-5 rounded-full bg-brand-cyan/20 text-brand-cyan text-[10px] font-mono font-bold flex items-center justify-center">
                ${idx + 1}
              </span>
              <span class="text-xs font-bold text-white">${pr.cena}</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-[10px] text-slate-400 font-mono bg-black/40 px-2 py-0.5 rounded border border-white/5">
                <i class="fa-solid fa-paperclip text-[9px] mr-1 text-brand-cyan"></i>${pr.imgElemento}
              </span>
              <button class="btn-copiar-prompt text-xs text-slate-400 hover:text-brand-cyan transition" data-prompt="${pr.prompt}" title="Copiar Prompt">
                <i class="fa-solid fa-copy"></i>
              </button>
            </div>
          </div>
          <p class="text-xs text-slate-300 font-mono leading-relaxed bg-black/20 p-2 rounded-lg">
            ${pr.prompt}
          </p>
        </div>
      `).join('');

      elPromptsContainer.querySelectorAll('.btn-copiar-prompt').forEach(btn => {
        btn.addEventListener('click', () => {
          copiarParaClipboard(btn.getAttribute('data-prompt'), 'Prompt Google Flow copiado!');
        });
      });
    }

    // Armazena todos os prompts para cópia única
    const todosPromptsTexto = prompts.map(pr => `[${pr.cena}]\nElemento: ${pr.imgElemento} (${pr.imgRotulo})\nPrompt: ${pr.prompt}`).join('\n\n');
    const elPromptsFull = document.getElementById('promptsGoogleFlowText');
    if (elPromptsFull) elPromptsFull.textContent = todosPromptsTexto;

    // Metadados de Publicação: Título SEO, Legenda, Comentário Fixado
    // Título SEO Shorts (até 60 caracteres)
    let tituloSeo = `${p.titulo.split('(')[0].trim()} Vale a Pena? #shorts`;
    if (tituloSeo.length > 60) {
      tituloSeo = `${p.titulo.substring(0, 48).trim()}... #shorts`;
    }
    const elTituloSeo = document.getElementById('videoTituloSeo');
    const elTituloSeoLen = document.getElementById('videoTituloSeoLen');
    if (elTituloSeo) elTituloSeo.textContent = tituloSeo;
    if (elTituloSeoLen) elTituloSeoLen.textContent = `${tituloSeo.length} / 60 caracteres`;

    // Legenda até 300 caracteres com 4 hashtags + aviso obrigatório
    const avisoObrigatorio = "Apresentador criado com IA. Curadoria oficial TrendShop.";
    const hashtags = "#TrendShop #Achadinhos #ShopeeBrasil #Ofertas";
    
    // Tenta montar legenda compacta com benefícios e aviso
    let textoBaseLegenda = `Achado Shopee: ${p.titulo.substring(0, 50).trim()}! De R$ ${Number(p.preco_original).toFixed(0)} por R$ ${precoFmt}. Link no comentário fixado!`;
    let legendaCompleta = `${textoBaseLegenda}\n\n${hashtags}\n${avisoObrigatorio}`;

    // Se passar de 300 caracteres, ajusta
    if (legendaCompleta.length > 300) {
      const limiteBase = 300 - (hashtags.length + avisoObrigatorio.length + 6);
      textoBaseLegenda = textoBaseLegenda.substring(0, limiteBase);
      legendaCompleta = `${textoBaseLegenda}\n\n${hashtags}\n${avisoObrigatorio}`;
    }

    const elLegendaShorts = document.getElementById('videoLegenda');
    const elLegendaShortsLen = document.getElementById('videoLegendaLen');
    if (elLegendaShorts) elLegendaShorts.textContent = legendaCompleta;
    if (elLegendaShortsLen) elLegendaShortsLen.textContent = `${legendaCompleta.length} / 300 caracteres`;

    // Comentário Fixado
    const comentarioFixado = `🔥 PEGUE O LINK OFICIAL COM DESCONTO AQUI:\n👉 ${linkYoutube}\n\n(Curadoria oficial TrendShop com garantia Shopee Brasil)`;
    const elComentario = document.getElementById('videoComentarioFixado');
    if (elComentario) elComentario.textContent = comentarioFixado;

    // Atualiza comando Python na aba de checklist
    const elCmdPython = document.getElementById('comandoPythonGerar');
    if (elCmdPython) elCmdPython.textContent = `python gerar_midias.py ${p.id}`;
  }

  // Bloco D: Checklist de Publicação por Rede salvo no LocalStorage
  function gerarChecklist(p) {
    const redesChecklist = [
      {
        id: 'fb',
        nome: 'Facebook',
        icon: 'fa-brands fa-facebook',
        cor: 'text-blue-400',
        itens: [
          'Carrossel 1080x1350 gerado',
          'Textos dos 3 Slides revisados',
          'Publicação realizada com ?src=facebook',
          'Comentário de reforço adicionado'
        ]
      },
      {
        id: 'ig',
        nome: 'Instagram Reels / Feed',
        icon: 'fa-brands fa-instagram',
        cor: 'text-pink-400',
        itens: [
          'Vídeo vertical 9:16 pronto',
          'Legenda com ?src=instagram na bio',
          'Postado no Reels com áudio em alta',
          'Story de chamada com sticker de link'
        ]
      },
      {
        id: 'yt',
        nome: 'YouTube Shorts',
        icon: 'fa-brands fa-youtube',
        cor: 'text-red-400',
        itens: [
          'Vídeo 9:16 exportado em 30fps',
          'Título SEO (até 60 car.) inserido',
          'Aviso IA e Legenda (<300 car.) colados',
          'Comentário fixado postado com link rastreado'
        ]
      },
      {
        id: 'tk',
        nome: 'TikTok',
        icon: 'fa-brands fa-tiktok',
        cor: 'text-cyan-400',
        itens: [
          'Vídeo curto com legenda queimada',
          'Gancho validado (primeiros 3 segundos)',
          'Publicação com hashtags estratégicas',
          'Link rastreado ?src=tiktok verificado'
        ]
      }
    ];

    // Recupera dados salvos no localStorage
    const storageKey = `trendshop_checklist_${p.id}`;
    let savedState = {};
    try {
      savedState = JSON.parse(localStorage.getItem(storageKey) || '{}');
    } catch (e) {
      savedState = {};
    }

    const container = document.getElementById('checklistRedesGrid');
    if (!container) return;

    let totalItens = 0;
    let totalMarcados = 0;

    container.innerHTML = redesChecklist.map(rede => {
      const itensHtml = rede.itens.map((item, idx) => {
        totalItens++;
        const itemKey = `${rede.id}_${idx}`;
        const isChecked = !!savedState[itemKey];
        if (isChecked) totalMarcados++;

        return `
          <label class="flex items-center gap-2 cursor-pointer text-xs text-slate-300 hover:text-white transition select-none">
            <input
              type="checkbox"
              data-item-key="${itemKey}"
              class="checklist-checkbox w-3.5 h-3.5 rounded bg-black/40 border-white/20 text-brand-cyan focus:ring-0 focus:ring-offset-0 cursor-pointer"
              ${isChecked ? 'checked' : ''}
            >
            <span class="${isChecked ? 'line-through text-slate-500' : ''}">${item}</span>
          </label>
        `;
      }).join('');

      return `
        <div class="bg-brand-surface p-3.5 rounded-xl border border-white/5 space-y-2.5">
          <div class="flex items-center gap-2 border-b border-white/5 pb-2">
            <i class="${rede.icon} ${rede.cor}"></i>
            <span class="text-xs font-bold text-white">${rede.nome}</span>
          </div>
          <div class="space-y-2">
            ${itensHtml}
          </div>
        </div>
      `;
    }).join('');

    // Atualiza barra de progresso
    atualizarBarraProgresso(totalMarcados, totalItens);

    // Eventos de alteração dos checkboxes
    container.querySelectorAll('.checklist-checkbox').forEach(cb => {
      cb.addEventListener('change', (e) => {
        const key = e.target.getAttribute('data-item-key');
        savedState[key] = e.target.checked;
        localStorage.setItem(storageKey, JSON.stringify(savedState));
        
        // Atualiza estilo do texto correspondente
        const span = e.target.nextElementSibling;
        if (span) {
          span.classList.toggle('line-through', e.target.checked);
          span.classList.toggle('text-slate-500', e.target.checked);
        }

        // Recalcula progresso
        const allChecked = container.querySelectorAll('.checklist-checkbox:checked').length;
        const allTotal = container.querySelectorAll('.checklist-checkbox').length;
        atualizarBarraProgresso(allChecked, allTotal);
      });
    });

    // Botão copiar comando python
    document.getElementById('btnCopiarComandoPython')?.addEventListener('click', () => {
      const cmd = `python gerar_midias.py ${p.id}`;
      copiarParaClipboard(cmd, 'Comando Python copiado!');
    });
  }

  function atualizarBarraProgresso(marcados, total) {
    const elBar = document.getElementById('checklistProgressBar');
    const elText = document.getElementById('checklistProgressoText');
    if (!total) return;

    const percent = Math.round((marcados / total) * 100);
    if (elBar) elBar.style.width = `${percent}%`;
    if (elText) elText.textContent = `${percent}% concluído (${marcados}/${total})`;
  }

  // Delegação de cliques para botões com classe .btn-copiar genéricos
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn-copiar');
    if (!btn) return;

    const targetId = btn.getAttribute('data-target');
    const elTarget = document.getElementById(targetId);
    if (elTarget) {
      copiarParaClipboard(elTarget.textContent.trim(), 'Copiado para a área de transferência!');
    }
  });

  // Função utilitária para copiar texto e exibir toast
  function copiarParaClipboard(texto, mensagemFeedback = 'Copiado!') {
    if (!texto) return;

    navigator.clipboard.writeText(texto).then(() => {
      mostrarToast(mensagemFeedback);
    }).catch(err => {
      // Fallback para textarea invisível
      const ta = document.createElement('textarea');
      ta.value = texto;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      mostrarToast(mensagemFeedback);
    });
  }

  function mostrarToast(msg) {
    const toast = document.getElementById('toastNotification');
    const toastMsg = document.getElementById('toastMessage');
    if (!toast) return;

    if (toastMsg) toastMsg.textContent = msg;
    toast.classList.remove('translate-y-20', 'opacity-0');
    toast.classList.add('translate-y-0', 'opacity-100');

    setTimeout(() => {
      toast.classList.remove('translate-y-0', 'opacity-100');
      toast.classList.add('translate-y-20', 'opacity-0');
    }, 2500);
  }
});
