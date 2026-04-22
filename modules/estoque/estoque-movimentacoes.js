const dadosProduto = document.getElementById("dados-produto");
const listaMovimentacoes = document.getElementById("lista-movimentacoes");

const estoque = JSON.parse(localStorage.getItem("estoque")) || [];
const movimentacoes =
  JSON.parse(localStorage.getItem("movimentacoesEstoque")) || [];

const params = new URLSearchParams(window.location.search);
const produtoId = Number(params.get("id"));

function formatarUnidade(valor, unidade) {
  const numero = Number(valor);

  if (!unidade) return numero;

  const unidadeLimpa = unidade.trim().toLowerCase();

  if (numero === 1) {
    return `${numero} ${unidadeLimpa}`;
  }

  const plurais = {
    caixa: "caixas",
    unidade: "unidades",
    pacote: "pacotes",
    frasco: "frascos",
    ampola: "ampolas",
    seringa: "seringas",
    comprimido: "comprimidos",
    ml: "ml",
    g: "g",
    kg: "kg",
    litro: "litros"
  };

  const unidadeFormatada = plurais[unidadeLimpa] || `${unidadeLimpa}s`;

  return `${numero} ${unidadeFormatada}`;
}

function formatarData(data) {
  if (!data) return "-";
  const [ano, mes, dia] = data.split("-");
  return `${dia}/${mes}/${ano}`;
}

function formatarUnidade(valor, unidade) {
  const numero = Number(valor);

  if (!unidade) return numero;

  const unidadeLimpa = unidade.trim().toLowerCase();

  if (numero === 1) {
    return `${numero} ${unidadeLimpa}`;
  }

  const plurais = {
    caixa: "caixas",
    unidade: "unidades",
    frasco: "frascos",
    pacote: "pacotes",
    ampola: "ampolas",
    seringa: "seringas",
    comprimido: "comprimidos",
    ml: "ml",
    g: "g",
    kg: "kg",
    litro: "litros"
  };

  const unidadeFormatada = plurais[unidadeLimpa] || `${unidadeLimpa}s`;

  return `${numero} ${unidadeFormatada}`;
}

function renderizarProduto() {
  const produto = estoque.find((item) => Number(item.id) === Number(produtoId));

  if (!produto) {
    dadosProduto.innerHTML = `
      <div class="card-info">
        <h2>Produto não encontrado</h2>
        <p>Esse produto não existe ou foi removido.</p>
      </div>
    `;
    return;
  }

  
}

function renderizarMovimentacoes() {
  const historicoProduto = movimentacoes
    .filter((item) => Number(item.produtoId) === Number(produtoId))
    .sort((a, b) => {
      const dataA = `${a.data}T${a.hora}`;
      const dataB = `${b.data}T${b.hora}`;
      return dataB.localeCompare(dataA);
    });

  listaMovimentacoes.innerHTML = "";

  if (historicoProduto.length === 0) {
    listaMovimentacoes.innerHTML = `
      <tr>
        <td colspan="4">Nenhuma movimentação registrada para este produto.</td>
      </tr>
    `;
    return;
  }

  historicoProduto.forEach((mov) => {
    listaMovimentacoes.innerHTML += `
      <tr>
        <td>${formatarData(mov.data)}</td>
        <td>${mov.hora}</td>
        <td>
          <span class="status-badge ${mov.tipo}">
            ${mov.tipo === "entrada" ? "Entrada" : "Saída"}
          </span>
        </td>
        <td>${mov.quantidade}</td>
      </tr>
    `;
  });
}

renderizarProduto();
renderizarMovimentacoes();
