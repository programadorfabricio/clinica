const formFinanceiro = document.getElementById("form-financeiro");
const selectPaciente = document.getElementById("paciente");
const inputData = document.getElementById("data");
const inputDescricao = document.getElementById("descricao");
const inputValor = document.getElementById("valor");
const inputForma = document.getElementById("forma");
const inputStatus = document.getElementById("status");
const listaFinanceiro = document.getElementById("lista-financeiro");

const totalRecebido = document.getElementById("total-recebido");
const totalPendente = document.getElementById("total-pendente");
const totalGeral = document.getElementById("total-geral");

const pacientes = JSON.parse(localStorage.getItem("pacientes")) || [];
let financeiroEmEdicao = null;

// Data automática
const hoje = new Date();
const ano = hoje.getFullYear();
const mes = String(hoje.getMonth() + 1).padStart(2, "0");
const dia = String(hoje.getDate()).padStart(2, "0");
inputData.value = `${ano}-${mes}-${dia}`;

renderizarPacientesNoSelect();
renderizarFinanceiro();
atualizarResumoFinanceiro();

// ✅ FIX 1: Adicionar event listeners nos filtros
document.getElementById("pesquisa-financeiro").addEventListener("input", aplicarFiltrosFinanceiro);
document.getElementById("filtro-status-financeiro").addEventListener("change", aplicarFiltrosFinanceiro);
document.getElementById("filtro-forma-financeiro").addEventListener("change", aplicarFiltrosFinanceiro);

formFinanceiro.addEventListener("submit", function (e) {
  e.preventDefault();

  let financeiro = JSON.parse(localStorage.getItem("financeiro")) || [];

  const pacienteId = Number(selectPaciente.value);
  const pacienteSelecionado = pacientes.find(
    (p) => Number(p.id) === pacienteId,
  );
  const data = inputData.value.trim();
  const descricao = inputDescricao.value.trim();
  const valor = Number(inputValor.value);
  const forma = inputForma.value;
  const status = inputStatus.value;

  if (!pacienteId || !data || !descricao || !valor || !forma || !status) {
    alert("Preencha todos os campos do pagamento.");
    return;
  }

  if (valor <= 0) {
    alert("O valor do pagamento deve ser maior que zero.");
    return;
  }

  if (!pacienteSelecionado) {
    alert("Paciente inválido.");
    return;
  }

  if (financeiroEmEdicao) {
    const index = financeiro.findIndex(
      (item) => Number(item.id) === Number(financeiroEmEdicao),
    );

    if (index !== -1) {
      financeiro[index] = {
        ...financeiro[index],
        pacienteId,
        pacienteNome: pacienteSelecionado.nome,
        data,
        descricao,
        valor,
        forma,
        status,
      };

      localStorage.setItem("financeiro", JSON.stringify(financeiro));
      alert("Pagamento atualizado com sucesso!");
    }

    financeiroEmEdicao = null;
    formFinanceiro.querySelector("button[type='submit']").textContent =
      "Salvar Pagamento";
  } else {
    const novoPagamento = {
      id: Date.now(),
      pacienteId,
      pacienteNome: pacienteSelecionado.nome,
      data,
      descricao,
      valor,
      forma,
      status,
    };

    financeiro.push(novoPagamento);
    localStorage.setItem("financeiro", JSON.stringify(financeiro));
    alert("Pagamento cadastrado com sucesso!");
  }

  formFinanceiro.reset();
  inputData.value = `${ano}-${mes}-${dia}`;
  selectPaciente.value = "";
  inputForma.value = "";
  inputStatus.value = "Pendente";

  renderizarFinanceiro();
  atualizarResumoFinanceiro();
});

function renderizarPacientesNoSelect() {
  selectPaciente.innerHTML = `<option value="">Selecione um paciente</option>`;

  if (pacientes.length === 0) {
    selectPaciente.innerHTML += `<option value="">Nenhum paciente cadastrado</option>`;
    return;
  }

  pacientes.forEach((paciente) => {
    selectPaciente.innerHTML += `
      <option value="${paciente.id}">${paciente.nome}</option>
    `;
  });
}

// ✅ FIX 2: Ler do localStorage dentro da função (variável financeiro não existia aqui)
function aplicarFiltrosFinanceiro() {
  const financeiro = JSON.parse(localStorage.getItem("financeiro")) || [];

  const pesquisa = document
    .getElementById("pesquisa-financeiro")
    .value.trim()
    .toLowerCase();

  const statusFiltro = document
    .getElementById("filtro-status-financeiro")
    .value
    .trim()
    .toLowerCase();

  // ✅ FIX 3: Forma de pagamento salva com maiúscula (ex: "Pix"), filtrar corretamente
  const formaFiltro = document
    .getElementById("filtro-forma-financeiro")
    .value
    .trim()
    .toLowerCase();

  let filtrados = [...financeiro];

  if (pesquisa) {
    filtrados = filtrados.filter((item) => {
      const paciente = (item.pacienteNome || "").toLowerCase();
      const descricao = (item.descricao || "").toLowerCase();
      const data = (item.data || "").toLowerCase();
      const dataFormatada = formatarData(item.data).toLowerCase();

      return (
        paciente.includes(pesquisa) ||
        descricao.includes(pesquisa) ||
        data.includes(pesquisa) ||
        dataFormatada.includes(pesquisa)
      );
    });
  }

  if (statusFiltro) {
    filtrados = filtrados.filter(
      // ✅ Comparar em lowercase dos dois lados
      (item) => (item.status || "").toLowerCase() === statusFiltro
    );
  }

  if (formaFiltro) {
    filtrados = filtrados.filter(
      // ✅ Comparar em lowercase dos dois lados
      (item) => (item.forma || "").toLowerCase().includes(formaFiltro)
    );
  }

  renderizarFinanceiro(filtrados);
}

// ✅ FIX 4: Aceitar lista opcional (para filtros) ou ler tudo do localStorage
function renderizarFinanceiro(lista) {
  listaFinanceiro.innerHTML = "";

  const financeiro = lista ?? JSON.parse(localStorage.getItem("financeiro")) ?? [];

  if (financeiro.length === 0) {
    listaFinanceiro.innerHTML = `
      <tr>
        <td colspan="7" style="text-align:center; padding: 2rem; color: #5a7299;">
          Nenhum pagamento encontrado.
        </td>
      </tr>
    `;
    return;
  }

  const financeiroOrdenado = [...financeiro].sort((a, b) =>
    b.data.localeCompare(a.data),
  );

  financeiroOrdenado.forEach((item) => {
    listaFinanceiro.innerHTML += `
      <tr>
        <td>${formatarData(item.data)}</td>
        <td>${item.pacienteNome || "-"}</td>
        <td>${item.descricao || "-"}</td>
        <td>${formatarMoeda(item.valor)}</td>
        <td>${item.forma || "-"}</td>
        <td>
          <span class="badge-status badge-${(item.status || "").toLowerCase()}">${item.status}</span>
        </td>
        <td>
          <button class="btn btn-sm btn-editar" onclick="editarPagamento(${item.id})">Editar</button>
          <button class="btn btn-sm btn-excluir" onclick="excluirPagamento(${item.id})">Excluir</button>
        </td>
      </tr>
    `;
  });
}

function atualizarResumoFinanceiro() {
  const financeiro = JSON.parse(localStorage.getItem("financeiro")) || [];

  let recebido = 0;
  let pendente = 0;
  let geral = 0;

  financeiro.forEach((item) => {
    if (item.status !== "Cancelado") {
      geral += Number(item.valor);
    }

    if (item.status === "Pago") {
      recebido += Number(item.valor);
    }

    if (item.status === "Pendente") {
      pendente += Number(item.valor);
    }
  });

  totalRecebido.textContent = formatarMoeda(recebido);
  totalPendente.textContent = formatarMoeda(pendente);
  totalGeral.textContent = formatarMoeda(geral);
}

function editarPagamento(id) {
  const financeiro = JSON.parse(localStorage.getItem("financeiro")) || [];
  const pagamento = financeiro.find((item) => Number(item.id) === Number(id));

  if (!pagamento) {
    alert("Pagamento não encontrado.");
    return;
  }

  selectPaciente.value = pagamento.pacienteId;
  inputData.value = pagamento.data;
  inputDescricao.value = pagamento.descricao;
  inputValor.value = pagamento.valor;
  inputForma.value = pagamento.forma;
  inputStatus.value = pagamento.status;

  financeiroEmEdicao = pagamento.id;

  formFinanceiro.querySelector("button[type='submit']").textContent =
    "Atualizar Pagamento";

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function excluirPagamento(id) {
  const confirmar = confirm("Tem certeza que deseja excluir este pagamento?");

  if (!confirmar) return;

  let financeiro = JSON.parse(localStorage.getItem("financeiro")) || [];

  financeiro = financeiro.filter((item) => Number(item.id) !== Number(id));

  localStorage.setItem("financeiro", JSON.stringify(financeiro));

  if (Number(financeiroEmEdicao) === Number(id)) {
    financeiroEmEdicao = null;
    formFinanceiro.reset();
    inputData.value = `${ano}-${mes}-${dia}`;
    selectPaciente.value = "";
    inputForma.value = "";
    inputStatus.value = "Pendente";
    formFinanceiro.querySelector("button[type='submit']").textContent =
      "Salvar Pagamento";
  }

  renderizarFinanceiro();
  atualizarResumoFinanceiro();

  alert("Pagamento excluído com sucesso!");
}

function formatarData(data) {
  if (!data) return "-";
  const [ano, mes, dia] = data.split("-");
  if (!ano || !mes || !dia) return data;
  return `${dia}/${mes}/${ano}`;
}

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

window.editarPagamento = editarPagamento;
window.excluirPagamento = excluirPagamento;