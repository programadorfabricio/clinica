const formEstoque = document.getElementById("form-estoque");
const listaEstoque = document.getElementById("lista-estoque");
const resumoEstoque = document.getElementById("resumo-estoque");

const inputNome = document.getElementById("nome");
const inputCategoria = document.getElementById("categoria");
const inputQuantidade = document.getElementById("quantidade");
const inputUnidade = document.getElementById("unidade");
const inputMinimo = document.getElementById("minimo");
const inputValidade = document.getElementById("validade");

let produtoEmEdicao = null;

// =========================
// FUNÇÕES AUXILIARES
// =========================

function formatarUnidade(valor, unidade) {
  const numero = Number(valor);
  if (!unidade) return numero;

  const unidadeLimpa = unidade.trim().toLowerCase();
  if (numero === 1) return `${numero} ${unidadeLimpa}`;

  const plurais = {
    caixa: "caixas", unidade: "unidades", pacote: "pacotes",
    frasco: "frascos", ampola: "ampolas", seringa: "seringas",
    comprimido: "comprimidos", ml: "ml", g: "g", kg: "kg", litro: "litros",
  };

  return `${numero} ${plurais[unidadeLimpa] || `${unidadeLimpa}s`}`;
}

function obterEstoque() {
  return JSON.parse(localStorage.getItem("estoque")) || [];
}

function salvarEstoque(lista) {
  localStorage.setItem("estoque", JSON.stringify(lista));
}

function obterMovimentacoes() {
  return JSON.parse(localStorage.getItem("movimentacoesEstoque")) || [];
}

function salvarMovimentacoes(lista) {
  localStorage.setItem("movimentacoesEstoque", JSON.stringify(lista));
}

function registrarMovimentacao(produtoId, tipo, quantidade) {
  const movimentacoes = obterMovimentacoes();
  const agora = new Date();
  const ano    = agora.getFullYear();
  const mes    = String(agora.getMonth() + 1).padStart(2, "0");
  const dia    = String(agora.getDate()).padStart(2, "0");
  const hora   = String(agora.getHours()).padStart(2, "0");
  const minuto = String(agora.getMinutes()).padStart(2, "0");

  movimentacoes.push({
    id: Date.now(),
    produtoId: Number(produtoId),
    tipo,
    quantidade: Number(quantidade),
    data: `${ano}-${mes}-${dia}`,
    hora: `${hora}:${minuto}`,
  });

  salvarMovimentacoes(movimentacoes);
}

function formatarData(data) {
  if (!data) return "-";
  const [ano, mes, dia] = data.split("-");
  return `${dia}/${mes}/${ano}`;
}

function calcularStatus(produto) {
  const quantidade = Number(produto.quantidade);
  const minimo     = Number(produto.minimo);
  if (quantidade <= 0)       return "zerado";
  if (quantidade <= minimo)  return "baixo";
  return "normal";
}

function criarBadgeStatus(status) {
  const labels = { normal: "Normal", baixo: "Baixo", zerado: "Zerado" };
  return `<span class="status-badge status-${status}">${labels[status]}</span>`;
}

// =========================
// RENDERIZAÇÃO
// =========================

function renderizarResumo() {
  const estoque = obterEstoque();
  const totalItens        = estoque.length;
  const estoqueBaixo      = estoque.filter((i) => calcularStatus(i) === "baixo").length;
  const zerados           = estoque.filter((i) => calcularStatus(i) === "zerado").length;
  const hoje              = new Date();
  const proximosVencimento = estoque.filter((item) => {
    if (!item.validade) return false;
    const dias = Math.ceil((new Date(item.validade) - hoje) / (1000 * 60 * 60 * 24));
    return dias >= 0 && dias <= 30;
  }).length;

  resumoEstoque.innerHTML = `
    <div class="resumo-card"><h3>Total de Produtos</h3><p>${totalItens}</p></div>
    <div class="resumo-card"><h3>Estoque Baixo</h3><p>${estoqueBaixo}</p></div>
    <div class="resumo-card"><h3>Produtos Zerados</h3><p>${zerados}</p></div>
    <div class="resumo-card"><h3>Próx. da Validade</h3><p>${proximosVencimento}</p></div>
  `;
}

function renderizarEstoque() {
  const estoque = obterEstoque();
  listaEstoque.innerHTML = "";

  if (estoque.length === 0) {
    listaEstoque.innerHTML = `
      <tr>
        <td colspan="7" style="text-align:center; padding:2rem; color:#5a7299;">
          Nenhum produto cadastrado no estoque.
        </td>
      </tr>
    `;
    return;
  }

  estoque.forEach((produto) => {
    const status = calcularStatus(produto);

    listaEstoque.innerHTML += `
      <tr>
        <td>${produto.nome}</td>
        <td>${produto.categoria}</td>
        <td>${formatarUnidade(produto.quantidade, produto.unidade)}</td>
        <td>${formatarData(produto.validade)}</td>
        <td>${criarBadgeStatus(status)}</td>
        <td>
          <div class="acoes-estoque">
            <button class="btn-editar-estoque"  onclick="editarProduto(${produto.id})">Editar</button>
            <button class="btn-entrada"          onclick="entradaEstoque(${produto.id})">Entrada</button>
            <button class="btn-saida"            onclick="saidaEstoque(${produto.id})">Saída</button>
            <button class="btn-historico"        onclick="verHistorico(${produto.id})">Histórico</button>
            <button class="btn-excluir-estoque"  onclick="excluirProduto(${produto.id})">Excluir</button>
          </div>
        </td>
      </tr>
    `;
  });
}

// =========================
// CRUD
// =========================

formEstoque.addEventListener("submit", function (e) {
  e.preventDefault();

  const nome       = inputNome.value.trim();
  const categoria  = inputCategoria.value.trim();
  const quantidade = inputQuantidade.value.trim();
  const unidade    = inputUnidade.value.trim();
  const minimo     = inputMinimo.value.trim();
  const validade   = inputValidade.value;

  if (!nome || !categoria || !quantidade || !unidade || !minimo) {
    alert("Preencha todos os campos obrigatórios.");
    return;
  }

  let estoque = obterEstoque();

  if (produtoEmEdicao) {
    const index = estoque.findIndex((i) => Number(i.id) === Number(produtoEmEdicao));
    if (index !== -1) {
      estoque[index] = { ...estoque[index], nome, categoria, quantidade: Number(quantidade), unidade, minimo: Number(minimo), validade };
      salvarEstoque(estoque);
      alert("Produto atualizado com sucesso!");
    }
    produtoEmEdicao = null;
    formEstoque.querySelector("button[type='submit']").textContent = "Salvar Produto";
  } else {
    estoque.push({ id: Date.now(), nome, categoria, quantidade: Number(quantidade), unidade, minimo: Number(minimo), validade });
    salvarEstoque(estoque);
    alert("Produto cadastrado com sucesso!");
  }

  formEstoque.reset();
  renderizarResumo();
  renderizarEstoque();
});

function editarProduto(id) {
  const produto = obterEstoque().find((i) => Number(i.id) === Number(id));
  if (!produto) { alert("Produto não encontrado."); return; }

  inputNome.value       = produto.nome       || "";
  inputCategoria.value  = produto.categoria  || "";
  inputQuantidade.value = produto.quantidade || "";
  inputUnidade.value    = produto.unidade    || "";
  inputMinimo.value     = produto.minimo     || "";
  inputValidade.value   = produto.validade   || "";

  produtoEmEdicao = produto.id;
  formEstoque.querySelector("button[type='submit']").textContent = "Atualizar Produto";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function excluirProduto(id) {
  if (!confirm("Deseja realmente excluir este produto?")) return;

  salvarEstoque(obterEstoque().filter((i) => Number(i.id) !== Number(id)));
  salvarMovimentacoes(obterMovimentacoes().filter((i) => Number(i.produtoId) !== Number(id)));

  if (Number(produtoEmEdicao) === Number(id)) {
    produtoEmEdicao = null;
    formEstoque.reset();
    formEstoque.querySelector("button[type='submit']").textContent = "Salvar Produto";
  }

  renderizarResumo();
  renderizarEstoque();
  alert("Produto excluído com sucesso!");
}

function entradaEstoque(id) {
  let estoque = obterEstoque();
  const produto = estoque.find((i) => Number(i.id) === Number(id));
  if (!produto) { alert("Produto não encontrado."); return; }

  const qtd = prompt(`Quantas unidades deseja adicionar em "${produto.nome}"?`);
  if (qtd === null) return;

  const valor = Number(qtd);
  if (!valor || valor <= 0) { alert("Informe uma quantidade válida para entrada."); return; }

  produto.quantidade = Number(produto.quantidade) + valor;
  salvarEstoque(estoque);
  registrarMovimentacao(id, "entrada", valor);
  renderizarResumo();
  renderizarEstoque();
  alert(`Entrada de ${valor} realizada com sucesso!`);
}

function saidaEstoque(id) {
  let estoque = obterEstoque();
  const produto = estoque.find((i) => Number(i.id) === Number(id));
  if (!produto) { alert("Produto não encontrado."); return; }

  const qtd = prompt(`Quantas unidades deseja retirar de "${produto.nome}"?`);
  if (qtd === null) return;

  const valor = Number(qtd);
  if (!valor || valor <= 0) { alert("Informe uma quantidade válida para saída."); return; }
  if (valor > Number(produto.quantidade)) { alert("Não é possível retirar mais do que há no estoque."); return; }

  produto.quantidade = Number(produto.quantidade) - valor;
  salvarEstoque(estoque);
  registrarMovimentacao(id, "saida", valor);
  renderizarResumo();
  renderizarEstoque();
  alert(`Saída de ${valor} realizada com sucesso!`);
}

function verHistorico(id) {
  window.location.href = `./estoque-movimentacoes.html?id=${id}`;
}

// =========================
// INICIALIZAÇÃO
// =========================
renderizarResumo();
renderizarEstoque();

window.editarProduto    = editarProduto;
window.excluirProduto   = excluirProduto;
window.entradaEstoque   = entradaEstoque;
window.saidaEstoque     = saidaEstoque;
window.verHistorico     = verHistorico;