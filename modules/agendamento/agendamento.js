const form = document.getElementById("form-agendamento");
const listaConsultas = document.getElementById("lista-consultas");
const btnSalvar = document.getElementById("btn-salvar");
const selectPaciente = document.getElementById("paciente");

let pacientes = JSON.parse(localStorage.getItem("pacientes")) || [];
let consultas = JSON.parse(localStorage.getItem("consultas")) || [];
let editandoId = null;

// =========================
// SALVAR OU EDITAR CONSULTA
// =========================
if (form) {
  form.addEventListener("submit", function (e) {
    e.preventDefault();

    const pacienteId = Number(document.getElementById("paciente").value);

    const pacienteSelecionado = pacientes.find(
      (p) => Number(p.id) === Number(pacienteId)
    );

    const paciente = pacienteSelecionado ? pacienteSelecionado.nome : "";
    const profissional = document.getElementById("profissional").value.trim();
    const data = document.getElementById("data").value;
    const horario = document.getElementById("horario").value;
    const tipo = document.getElementById("tipo").value.trim();
    const status = document.getElementById("status").value;

    if (!pacienteSelecionado) {
      alert("Selecione um paciente.");
      return;
    }

    if (!profissional) {
      alert("Informe o nome do profissional.");
      return;
    }

    if (!data || !horario || !tipo) {
      alert("Preencha todos os campos.");
      return;
    }

    const agora = new Date();
    const dataConsulta = new Date(`${data}T${horario}`);

    if (dataConsulta < agora) {
      alert("Não é permitido agendar consulta em data/horário passado.");
      return;
    }

    const conflito = consultas.some((consulta) => {
      return (
        Number(consulta.id) !== Number(editandoId) &&
        consulta.profissional.toLowerCase() === profissional.toLowerCase() &&
        consulta.data === data &&
        consulta.horario === horario
      );
    });

    if (conflito) {
      alert("Já existe uma consulta para esse profissional nesse mesmo horário.");
      return;
    }

    if (editandoId) {
      const consultaOriginal = consultas.find(
        (c) => Number(c.id) === Number(editandoId)
      );

      if (
        consultaOriginal.status === "cancelada" ||
        consultaOriginal.status === "realizada" ||
        consultaOriginal.status === "faltou"
      ) {
        alert("Não é permitido editar uma consulta encerrada.");
        return;
      }

      consultas = consultas.map((consulta) => {
        if (Number(consulta.id) === Number(editandoId)) {
          return {
            ...consulta,
            pacienteId: pacienteSelecionado.id,
            paciente: pacienteSelecionado.nome,
            pacienteNome: pacienteSelecionado.nome,
            profissional,
            data,
            horario,
            tipo,
            status,
          };
        }
        return consulta;
      });

      alert("Consulta atualizada com sucesso!");
      editandoId = null;
      btnSalvar.textContent = "Salvar Consulta";
    } else {
      const novaConsulta = {
        id: Date.now(),
        pacienteId: pacienteSelecionado.id,
        paciente: pacienteSelecionado.nome,
        pacienteNome: pacienteSelecionado.nome,
        profissional,
        data,
        horario,
        tipo,
        status: "agendada",
      };

      consultas.push(novaConsulta);
      alert("Consulta salva com sucesso!");
    }

    localStorage.setItem("consultas", JSON.stringify(consultas));
    form.reset();
    renderizarConsultas();
  });
}

// =========================
// CARREGAR PACIENTES NO SELECT
// =========================
function carregarPacientesNoSelect() {
  if (!selectPaciente) return;

  pacientes = JSON.parse(localStorage.getItem("pacientes")) || [];

  selectPaciente.innerHTML = `<option value="">Selecione um paciente</option>`;

  const pacientesAtivos = pacientes.filter(
    (paciente) => paciente.status === "ativo"
  );

  if (pacientesAtivos.length === 0) {
    selectPaciente.innerHTML = `<option value="">Nenhum paciente ativo cadastrado</option>`;
    return;
  }

  pacientesAtivos.forEach((paciente) => {
    selectPaciente.innerHTML += `
      <option value="${paciente.id}">${paciente.nome}</option>
    `;
  });
}

// =========================
// RENDERIZAR CONSULTAS
// =========================
function renderizarConsultas() {
  if (!listaConsultas) return;

  consultas = JSON.parse(localStorage.getItem("consultas")) || [];
  listaConsultas.innerHTML = "";

  if (consultas.length === 0) {
    listaConsultas.innerHTML = `
      <tr>
        <td colspan="7">Nenhuma consulta cadastrada.</td>
      </tr>
    `;
    return;
  }

  consultas.forEach((consulta) => {
    listaConsultas.innerHTML += `
      <tr>
        <td>${consulta.paciente || consulta.pacienteNome || "-"}</td>
        <td>${consulta.profissional}</td>
        <td>${formatarData(consulta.data)}</td>
        <td>${consulta.horario}</td>
        <td>${consulta.tipo}</td>
        <td><span class="status-badge ${consulta.status}">${consulta.status}</span></td>
        <td class="acoes-consulta">
          <button class="btn-editar-consulta" onclick="editarConsulta(${consulta.id})">Editar</button>

          ${
            consulta.status === "realizada"
              ? `<button class="btn-pagamento" onclick="gerarPagamento(${consulta.id})">Pagamento</button>`
              : ""
          }

          ${renderizarAcoes(consulta)}
        </td>
      </tr>
    `;
  });
}

// =========================
// AÇÕES POR STATUS
// =========================
function renderizarAcoes(consulta) {
  if (consulta.status === "agendada") {
    return `
      <button class="btn-status confirmar" onclick="alterarStatus(${consulta.id}, 'confirmada')">Confirmar</button>
      <button class="btn-status realizada" onclick="alterarStatus(${consulta.id}, 'realizada')">realizada</button>
      <button class="btn-status falta" onclick="alterarStatus(${consulta.id}, 'faltou')">Falta</button>
      <button class="btn-status cancelar" onclick="alterarStatus(${consulta.id}, 'cancelada')">Cancelar</button>
    `;
  }

  if (consulta.status === "confirmada") {
    return `
      <button class="btn-status realizar" onclick="alterarStatus(${consulta.id}, 'realizada')">Realizada</button>
      <button class="btn-status falta" onclick="alterarStatus(${consulta.id}, 'faltou')">Falta</button>
      <button class="btn-status cancelar" onclick="alterarStatus(${consulta.id}, 'cancelada')">Cancelar</button>
    `;
  }

  return `<button class="btn-status encerrada">Encerrada</button>`;
}

// =========================
// EDITAR CONSULTA
// =========================
function editarConsulta(id) {
  const consulta = consultas.find((item) => Number(item.id) === Number(id));

  if (!consulta) return;

  if (
    consulta.status === "cancelada" ||
    consulta.status === "realizada" ||
    consulta.status === "faltou"
  ) {
    alert("Não é permitido editar uma consulta encerrada.");
    return;
  }

  document.getElementById("paciente").value = consulta.pacienteId;
  document.getElementById("profissional").value = consulta.profissional;
  document.getElementById("data").value = consulta.data;
  document.getElementById("horario").value = consulta.horario;
  document.getElementById("tipo").value = consulta.tipo;
  document.getElementById("status").value = consulta.status;

  editandoId = id;
  btnSalvar.textContent = "Atualizar Consulta";

  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
}

// =========================
// ALTERAR STATUS
// =========================
function alterarStatus(id, novoStatus) {
  const consulta = consultas.find((item) => Number(item.id) === Number(id));

  if (!consulta) return;

  const statusAtual = consulta.status;

  if (["realizada", "cancelada", "faltou"].includes(statusAtual)) {
    alert("Essa consulta já está encerrada.");
    return;
  }

  const transicoesPermitidas = {
    agendada: ["confirmada", "realizada", "faltou", "cancelada"],
    confirmada: ["realizada", "faltou", "cancelada"],
  };

  if (!transicoesPermitidas[statusAtual]?.includes(novoStatus)) {
    alert("Mudança de status não permitida.");
    return;
  }

  const confirmar = confirm(`Deseja alterar o status para "${novoStatus}"?`);
  if (!confirmar) return;

  consultas = consultas.map((item) => {
    if (Number(item.id) === Number(id)) {
      return {
        ...item,
        status: novoStatus,
      };
    }
    return item;
  });

  localStorage.setItem("consultas", JSON.stringify(consultas));

  if (
    Number(editandoId) === Number(id) &&
    ["realizada", "cancelada", "faltou"].includes(novoStatus)
  ) {
    form.reset();
    editandoId = null;
    btnSalvar.textContent = "Salvar Consulta";
  }

  renderizarConsultas();
  alert(`Status alterado para "${novoStatus}" com sucesso.`);
}

// =========================
// FILTROS
// =========================
function aplicarFiltros() {
  const status = document.getElementById("filtro-status").value;
  const profissional = document
    .getElementById("filtro-profissional")
    .value.trim()
    .toLowerCase();
  const data = document.getElementById("filtro-data").value;

  let filtradas = consultas;

  if (status) filtradas = filtradas.filter((c) => c.status === status);
  if (profissional)
    filtradas = filtradas.filter((c) =>
      c.profissional.toLowerCase().includes(profissional)
    );
  if (data) filtradas = filtradas.filter((c) => c.data === data);

  listaConsultas.innerHTML = "";

  if (filtradas.length === 0) {
    listaConsultas.innerHTML = `<tr><td colspan="7">Nenhuma consulta encontrada.</td></tr>`;
    return;
  }

  filtradas.forEach((consulta) => {
    listaConsultas.innerHTML += `
      <tr>
        <td>${consulta.paciente || consulta.pacienteNome || "-"}</td>
        <td>${consulta.profissional}</td>
        <td>${formatarData(consulta.data)}</td>
        <td>${consulta.horario}</td>
        <td>${consulta.tipo}</td>
        <td><span class="status-badge ${consulta.status}">${consulta.status}</span></td>
        <td class="acoes-consulta">
          <button class="btn-editar-consulta" onclick="editarConsulta(${consulta.id})">Editar</button>
          ${
            consulta.status === "realizada"
              ? `<button class="btn-pagamento" onclick="gerarPagamento(${consulta.id})">Pagamento</button>`
              : ""
          }
          ${renderizarAcoes(consulta)}
        </td>
      </tr>
    `;
  });
}

// =========================
// EVENTO FILTRO
// =========================
document.getElementById("btn-filtrar").addEventListener("click", aplicarFiltros);

// =========================
// FORMATAR DATA
// =========================
function formatarData(data) {
  const [ano, mes, dia] = data.split("-");
  return `${dia}/${mes}/${ano}`;
}

// =========================
// GERAR PAGAMENTO
// =========================
function gerarPagamento(id) {
  const consultas = JSON.parse(localStorage.getItem("consultas")) || [];
  const financeiro = JSON.parse(localStorage.getItem("financeiro")) || [];

  const consulta = consultas.find((item) => Number(item.id) === Number(id));

  if (!consulta) {
    alert("Consulta não encontrada.");
    return;
  }

  if (consulta.status !== "realizada") {
    alert("Só é possível gerar pagamento para consultas realizada.");
    return;
  }

  const nomePaciente =
    consulta.paciente || consulta.pacienteNome || "Paciente não informado";

  const descricaoPagamento = `Consulta - ${consulta.tipo || "Atendimento"}`;

  const jaExiste = financeiro.some(
    (item) =>
      Number(item.consultaId) === Number(consulta.id)
  );

  if (jaExiste) {
    alert("Esse pagamento já foi gerado.");
    return;
  }

  const novoPagamento = {
    id: Date.now(),
    pacienteId: consulta.pacienteId,
    pacienteNome: nomePaciente,
    data: consulta.data,
    descricao: descricaoPagamento,
    valor: 0,
    forma: "",
    status: "Pendente",
    origem: "consulta",
    consultaId: consulta.id,
    profissional: consulta.profissional || "",
    tipoConsulta: consulta.tipo || ""
  };

  financeiro.push(novoPagamento);
  localStorage.setItem("financeiro", JSON.stringify(financeiro));

  alert("Pagamento gerado com sucesso! Vá ao módulo Financeiro para completar.");
}

// =========================
// INICIAR
// =========================
carregarPacientesNoSelect();
renderizarConsultas();

window.gerarPagamento = gerarPagamento;
window.editarConsulta = editarConsulta;
window.alterarStatus = alterarStatus;