const pacientes  = JSON.parse(localStorage.getItem("pacientes"))  || [];
const consultas  = JSON.parse(localStorage.getItem("consultas"))  || [];
const financeiro = JSON.parse(localStorage.getItem("financeiro")) || [];

// ELEMENTOS
const consultasHojeEl    = document.getElementById("consultas-hoje");
const pacientesTotalEl   = document.getElementById("pacientes-total");
const confirmadasHojeEl  = document.getElementById("confirmadas-hoje");
const canceladasHojeEl   = document.getElementById("canceladas-hoje");
const totalRecebidoEl    = document.getElementById("total-recebido");
const totalPendenteEl    = document.getElementById("total-pendente");

const listaConsultasHoje     = document.getElementById("lista-consultas-hoje");
const listaProximasConsultas = document.getElementById("lista-proximas-consultas");
const listaUltimosPacientes  = document.getElementById("lista-ultimos-pacientes");
const listaUltimosPagamentos = document.getElementById("lista-ultimos-pagamentos");

// DATA DE HOJE
const hoje         = new Date();
const hojeFormatado = hoje.toISOString().split("T")[0];

// INICIALIZAÇÃO
atualizarCards();
renderizarConsultasHoje();
renderizarProximasConsultas();
renderizarUltimosPacientes();
renderizarUltimosPagamentos();

// =========================
// CARDS
// =========================
function atualizarCards() {
  const consultasHoje    = consultas.filter((c) => c.data === hojeFormatado);
  const confirmadasHoje  = consultasHoje.filter((c) => c.status === "confirmada");
  const canceladasHoje   = consultasHoje.filter((c) => c.status === "cancelada");

  let recebido = 0;
  let pendente = 0;
  financeiro.forEach((item) => {
    if (item.status === "Pago")     recebido += Number(item.valor);
    if (item.status === "Pendente") pendente += Number(item.valor);
  });

  consultasHojeEl.textContent   = consultasHoje.length;
  pacientesTotalEl.textContent  = pacientes.length;
  confirmadasHojeEl.textContent = confirmadasHoje.length;
  canceladasHojeEl.textContent  = canceladasHoje.length;
  totalRecebidoEl.textContent   = formatarMoeda(recebido);
  totalPendenteEl.textContent   = formatarMoeda(pendente);
}

// =========================
// CONSULTAS DE HOJE
// =========================
function renderizarConsultasHoje() {
  listaConsultasHoje.innerHTML = "";

  const consultasHoje = consultas
    .filter((c) => c.data === hojeFormatado)
    .sort((a, b) => a.horario.localeCompare(b.horario));

  if (consultasHoje.length === 0) {
    listaConsultasHoje.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:2rem;color:#5a7299">Nenhuma consulta agendada para hoje.</td></tr>`;
    return;
  }

  consultasHoje.forEach((c) => {
    listaConsultasHoje.innerHTML += `
      <tr>
        <td>${c.horario}</td>
        <td>${c.paciente || "-"}</td>
        <td>${c.profissional}</td>
        <td>${c.tipo}</td>
        <td><span class="status-badge ${c.status}">${formatarStatus(c.status)}</span></td>
      </tr>
    `;
  });
}

// =========================
// PRÓXIMAS CONSULTAS
// =========================
function renderizarProximasConsultas() {
  listaProximasConsultas.innerHTML = "";

  const agora   = new Date();
  const proximas = consultas
    .filter((c) => new Date(`${c.data}T${c.horario}`) >= agora)
    .sort((a, b) => new Date(`${a.data}T${a.horario}`) - new Date(`${b.data}T${b.horario}`))
    .slice(0, 5);

  if (proximas.length === 0) {
    listaProximasConsultas.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:2rem;color:#5a7299">Nenhuma próxima consulta encontrada.</td></tr>`;
    return;
  }

  proximas.forEach((c) => {
    listaProximasConsultas.innerHTML += `
      <tr>
        <td>${formatarData(c.data)}</td>
        <td>${c.horario}</td>
        <td>${c.paciente || "-"}</td>
        <td>${c.profissional}</td>
        <td><span class="status-badge ${c.status}">${formatarStatus(c.status)}</span></td>
      </tr>
    `;
  });
}

// =========================
// ÚLTIMOS PACIENTES
// =========================
function renderizarUltimosPacientes() {
  listaUltimosPacientes.innerHTML = "";

  const ultimos = [...pacientes].sort((a, b) => b.id - a.id).slice(0, 5);

  if (ultimos.length === 0) {
    listaUltimosPacientes.innerHTML = `<tr><td colspan="4" style="text-align:center;padding:2rem;color:#5a7299">Nenhum paciente cadastrado.</td></tr>`;
    return;
  }

  ultimos.forEach((p) => {
    listaUltimosPacientes.innerHTML += `
      <tr>
        <td>${p.nome}</td>
        <td>${p.telefone}</td>
        <td>${p.convenio || "-"}</td>
        <td><span class="status-badge ${p.status}">${formatarStatus(p.status)}</span></td>
      </tr>
    `;
  });
}

// =========================
// ÚLTIMOS PAGAMENTOS
// ✅ FIX: classes de badge específicas para pagamento
//         pago → badge-pago | pendente → badge-pendente | cancelado → badge-cancelado
// =========================
function renderizarUltimosPagamentos() {
  listaUltimosPagamentos.innerHTML = "";

  const ultimos = [...financeiro].sort((a, b) => b.id - a.id).slice(0, 5);

  if (ultimos.length === 0) {
    listaUltimosPagamentos.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:2rem;color:#5a7299">Nenhum pagamento cadastrado.</td></tr>`;
    return;
  }

  ultimos.forEach((pag) => {
    // Mapeia status do financeiro → classe CSS correta
    const classeMap = {
      "Pago":      "pago",
      "Pendente":  "pendente",
      "Cancelado": "cancelado",
    };
    const classe = classeMap[pag.status] || "pendente";

    listaUltimosPagamentos.innerHTML += `
      <tr>
        <td>${formatarData(pag.data)}</td>
        <td>${pag.pacienteNome || "-"}</td>
        <td>${pag.descricao}</td>
        <td><strong>${formatarMoeda(pag.valor)}</strong></td>
        <td><span class="status-badge ${classe}">${pag.status}</span></td>
      </tr>
    `;
  });
}

// =========================
// FUNÇÕES AUXILIARES
// =========================
function formatarData(data) {
  if (!data) return "-";
  const [ano, mes, dia] = data.split("-");
  return `${dia}/${mes}/${ano}`;
}

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatarStatus(status) {
  const nomes = {
    agendada:   "Agendada",
    confirmada: "Confirmada",
    realizada:  "Realizada",
    cancelada:  "Cancelada",
    faltou:     "Faltou",
    ativo:      "Ativo",
    inativo:    "Inativo",
  };
  return nomes[status] || status;
}