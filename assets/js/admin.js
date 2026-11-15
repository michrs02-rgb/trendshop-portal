/**
 * TrendShop - JavaScript do Painel Administrativo (admin.html)
 */

document.addEventListener('DOMContentLoaded', () => {
  const SENHA_MESTRE = 'trendshop2026';
  let produtosAdmin = [];
  let autenticado = false;

  const loginOverlay = document.getElementById('loginOverlay');
  const adminPasswordInput = document.getElementById('adminPassword');
  const btnLoginSubmit = document.getElementById('btnLoginSubmit');
  const loginErrorMsg = document.getElementById('loginError');

  const adminSearch = document.getElementById('adminSearch');
  const adminTableBody = document.getElementById('adminTableBody');
  const btnDownloadJson = document.getElementById('btnDownloadJson');
  const btnAddNewProduct = document.getElementById('btnAddNewProduct');
  const btnResetDefault = document.getElementById('btnResetDefault');

  // Modal de edição / criação
  const editModalOverlay = document.getElementById('editModalOverlay');
  const editModalTitle = document.getElementById('editModalTitle');
  const editForm = document.getElementById('editForm');
  const btnCloseModal = document.getElementById('btnCloseModal');

  // Verifica se já está logado na sessão
  if (sessionStorage.getItem('trendshop_admin_logged') === 'true') {
    desbloquearPainel();
  }

  // Evento de Login
  btnLoginSubmit.addEventListener('click', tentarLogin);
  adminPasswordInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') tentarLogin();
  });

  function tentarLogin() {
    const pass = adminPasswordInput.value.trim();
    if (pass === SENHA_MESTRE) {
      sessionStorage.setItem('trendshop_admin_logged', 'true');
      desbloquearPainel();
    } else {
      loginErrorMsg.textContent = 'Senha incorreta. Tente novamente.';
      loginErrorMsg.style.display = 'block';
    }
  }

  function desbloquearPainel() {
    autenticado = true;
    loginOverlay.style.display = 'none';
    carregarCatalogoAdmin();
  }

  async function carregarCatalogoAdmin() {
    try {
      const localData = localStorage.getItem('trendshop_produtos_custom');
      if (localData) {
        produtosAdmin = JSON.parse(localData);
      } else {
        const resp = await fetch('data/produtos.json');
        produtosAdmin = await resp.json();
      }
      renderizarTabela();
    } catch (err) {
      console.error('Erro ao carregar dados no admin:', err);
    }
  }

  function salvarLocalmente() {
    localStorage.setItem('trendshop_produtos_custom', JSON.stringify(produtosAdmin, null, 2));
    renderizarTabela();
  }

  function renderizarTabela() {
    const termo = adminSearch.value.trim().toLowerCase();
    const filtrados = produtosAdmin.filter(p => {
      if (!termo) return true;
      return p.titulo.toLowerCase().includes(termo) ||
             p.departamento.toLowerCase().includes(termo) ||
             p.numero.includes(termo);
    });

    adminTableBody.innerHTML = filtrados.map(p => `
      <tr>
        <td style="font-weight: 700; color: #7928CA;">#${p.numero}</td>
        <td>
          <img src="${p.imagens && p.imagens.length > 0 ? p.imagens[0] : 'assets/img/' + p.numero + '-1.jpg'}" class="admin-img-thumb" alt="Foto">
        </td>
        <td>
          <strong style="display: block; font-size: 0.9rem; color: #1F1535;">${p.titulo}</strong>
          <span style="font-size: 0.76rem; color: #958CA8;">${p.departamento}</span>
        </td>
        <td style="white-space: nowrap;">
          <div style="font-size: 0.82rem; color: #958CA8; text-decoration: line-through;">R$ ${p.preco_original.toFixed(2)}</div>
          <div style="font-weight: 800; color: #059669; font-size: 0.95rem;">R$ ${p.preco_promocional.toFixed(2)}</div>
        </td>
        <td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
          <a href="${p.link_afiliado}" target="_blank" style="color: #00E5FF; text-decoration: underline; font-size: 0.78rem;">${p.link_afiliado}</a>
        </td>
        <td style="white-space: nowrap;">
          <button class="btn-edit-item" data-id="${p.numero}" style="background: #ede9fe; color: #7928CA; padding: 6px 12px; border-radius: 6px; font-weight: 700; font-size: 0.78rem; margin-right: 6px;">Editar</button>
          <button class="btn-delete-item" data-id="${p.numero}" style="background: #fee2e2; color: #dc2626; padding: 6px 12px; border-radius: 6px; font-weight: 700; font-size: 0.78rem;">Excluir</button>
        </td>
      </tr>
    `).join('');

    // Eventos de clique nas linhas
    adminTableBody.querySelectorAll('.btn-edit-item').forEach(btn => {
      btn.addEventListener('click', () => abrirModalEdicao(btn.getAttribute('data-id')));
    });

    adminTableBody.querySelectorAll('.btn-delete-item').forEach(btn => {
      btn.addEventListener('click', () => excluirItem(btn.getAttribute('data-id')));
    });
  }

  adminSearch.addEventListener('input', renderizarTabela);

  // Baixar JSON atualizado
  btnDownloadJson.addEventListener('click', () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(produtosAdmin, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', 'produtos.json');
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  });

  // Resetar ao padrão
  btnResetDefault?.addEventListener('click', async () => {
    if (confirm('Tem certeza de que deseja restaurar o catálogo para o padrão original? Todas as alterações salvas no navegador serão desfeitas.')) {
      localStorage.removeItem('trendshop_produtos_custom');
      const resp = await fetch('data/produtos.json');
      produtosAdmin = await resp.json();
      renderizarTabela();
      alert('Catálogo restaurado com sucesso!');
    }
  });

  // Modal de edição / inserção
  function abrirModalEdicao(numId) {
    const prod = produtosAdmin.find(p => p.numero === numId);
    if (!prod) return;

    editModalTitle.textContent = `Editar Produto #${prod.numero}`;
    document.getElementById('editNumero').value = prod.numero;
    document.getElementById('editTitulo').value = prod.titulo;
    document.getElementById('editDepto').value = prod.departamento;
    document.getElementById('editPrecoOrig').value = prod.preco_original;
    document.getElementById('editPrecoPromo').value = prod.preco_promocional;
    document.getElementById('editLinkAfiliado').value = prod.link_afiliado;
    document.getElementById('editVendidos').value = prod.vendidos;

    editModalOverlay.style.display = 'flex';
  }

  btnAddNewProduct.addEventListener('click', () => {
    const proximoNum = String(produtosAdmin.length + 1).padStart(2, '0');
    editModalTitle.textContent = `Adicionar Novo Produto #${proximoNum}`;
    document.getElementById('editNumero').value = proximoNum;
    document.getElementById('editTitulo').value = '';
    document.getElementById('editDepto').value = 'Casa & Limpeza';
    document.getElementById('editPrecoOrig').value = '99.90';
    document.getElementById('editPrecoPromo').value = '49.90';
    document.getElementById('editLinkAfiliado').value = 'https://s.shopee.com.br/';
    document.getElementById('editVendidos').value = '1,2 mil';

    editModalOverlay.style.display = 'flex';
  });

  btnCloseModal.addEventListener('click', () => {
    editModalOverlay.style.display = 'none';
  });

  editForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const num = document.getElementById('editNumero').value.trim();
    const titulo = document.getElementById('editTitulo').value.trim();
    const depto = document.getElementById('editDepto').value;
    const pOrig = parseFloat(document.getElementById('editPrecoOrig').value) || 0;
    const pPromo = parseFloat(document.getElementById('editPrecoPromo').value) || 0;
    const link = document.getElementById('editLinkAfiliado').value.trim();
    const vendidos = document.getElementById('editVendidos').value.trim();
    const descPct = pOrig > 0 ? Math.round((1 - (pPromo / pOrig)) * 100) : 0;

    const idxExistente = produtosAdmin.findIndex(p => p.numero === num);
    if (idxExistente !== -1) {
      // Atualiza existente
      produtosAdmin[idxExistente] = {
        ...produtosAdmin[idxExistente],
        titulo,
        departamento: depto,
        preco_original: pOrig,
        preco_promocional: pPromo,
        desconto_percentual: descPct,
        link_afiliado: link,
        vendidos: vendidos
      };
    } else {
      // Cria novo
      produtosAdmin.push({
        id: parseInt(num, 10) || produtosAdmin.length + 1,
        numero: num,
        titulo,
        departamento: depto,
        preco_original: pOrig,
        preco_promocional: pPromo,
        desconto_percentual: descPct,
        avaliacao: "4.9",
        vendidos: vendidos,
        link_afiliado: link,
        beneficios: [
          "Produto com excelente aceitação e alta taxa de recompra",
          "Entrega rápida e segura garantida pela Shopee",
          "Melhor custo-benefício da categoria"
        ],
        especificacoes: {
          "Departamento": depto,
          "Garantia": "90 dias",
          "Envio": "Imediato"
        },
        imagens: [
          `assets/img/${num}-1.jpg`,
          `assets/img/${num}-2.jpg`,
          `assets/img/${num}-3.jpg`,
          `assets/img/${num}-4.jpg`,
          `assets/img/${num}-5.jpg`
        ]
      });
    }

    salvarLocalmente();
    editModalOverlay.style.display = 'none';
    alert('Produto salvo com sucesso! Baixe o produtos.json para persistir permanentemente.');
  });

  function excluirItem(numId) {
    if (confirm(`Tem certeza que deseja remover o produto #${numId}?`)) {
      produtosAdmin = produtosAdmin.filter(p => p.numero !== numId);
      salvarLocalmente();
    }
  }
});
