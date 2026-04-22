const dadosPaciente = document.getElementById("dados-paciente");
const resumoConsultas = document.getElementById("resumo-consultas");
const listaHistorico = document.getElementById("lista-historico");

const pacientes = JSON.parse(localStorage.getItem("pacientes")) || [];
const consultas = JSON.parse(localStorage.getItem("consultas")) || [];

// Pega o ID da URL
const params = new URLSearchParams(window.location.search);
const pacienteId = Number(params.get("id"));

if (!pacienteId) {
  dadosPaciente.innerHTML = `
    <div class="card-info">
      <h2>Nenhum paciente selecionado</h2>
      <p>Abra esta página pelo botão <strong>Histórico</strong> dentro do módulo de pacientes.</p>
    </div>
  `;
} else {
  const paciente = pacientes.find((p) => Number(p.id) === Number(pacienteId));

  if (!paciente) {
    dadosPaciente.innerHTML = `
      <div class="card-info">
        <h2>Paciente não encontrado</h2>
        <p>Esse paciente não existe ou foi removido.</p>
      </div>
    `;
  } else {
    const consultasPaciente = consultas.filter(
      (consulta) => Number(consulta.pacienteId) === Number(pacienteId),
    );

    const total = consultasPaciente.length;
    const realizadas = consultasPaciente.filter(
      (c) => c.status === "realizada",
    ).length;
    const canceladas = consultasPaciente.filter(
      (c) => c.status === "cancelada",
    ).length;
    const faltas = consultasPaciente.filter(
      (c) => c.status === "faltou",
    ).length;
    const confirmadas = consultasPaciente.filter(
      (c) => c.status === "confirmada",
    ).length;

    renderizarPaciente();
    renderizarResumo();
    renderizarHistorico();

    function renderizarPaciente() {
      dadosPaciente.innerHTML = `
        <div class="card-info">
          <h2>${paciente.nome}</h2>
          <p><strong>CPF:</strong> ${paciente.cpf}</p>
          <p><strong>Telefone:</strong> ${paciente.telefone}</p>
          <p><strong>Convênio:</strong> ${paciente.convenio || "-"}</p>
          <p><strong>Status:</strong> ${paciente.status}</p>
          <p><strong>Observações:</strong> ${paciente.observacoes || "-"}</p>
        </div>
      `;
    }

    function renderizarResumo() {
      resumoConsultas.innerHTML = `
        <div class="resumo-card">
          <h3>Total de Consultas</h3>
          <p>${total}</p>
        </div>
        <div class="resumo-card">
          <h3>Confirmadas</h3>
          <p>${confirmadas}</p>
        </div>
        <div class="resumo-card">
          <h3>Realizadas</h3>
          <p>${realizadas}</p>
        </div>
        <div class="resumo-card">
          <h3>Canceladas</h3>
          <p>${canceladas}</p>
        </div>
        <div class="resumo-card">
          <h3>Faltas</h3>
          <p>${faltas}</p>
        </div>
      `;
    }

    function renderizarHistorico() {
      listaHistorico.innerHTML = "";

      if (consultasPaciente.length === 0) {
        listaHistorico.innerHTML = `
          <tr>
            <td colspan="5">Esse paciente ainda não possui consultas cadastradas.</td>
          </tr>
        `;
        return;
      }

      consultasPaciente.sort((a, b) => {
        const dataHoraA = `${a.data} ${a.horario}`;
        const dataHoraB = `${b.data} ${b.horario}`;
        return dataHoraB.localeCompare(dataHoraA);
      });

      consultasPaciente.forEach((consulta) => {
        listaHistorico.innerHTML += `
          <tr>
            <td>${formatarData(consulta.data)}</td>
            <td>${consulta.horario}</td>
            <td>${consulta.profissional}</td>
            <td>${consulta.tipo}</td>
            <td>
  <span class="status-historico ${consulta.status}">
    ${formatarStatus(consulta.status)}
  </span>
</td>
          </tr>
        `;
      });
    }
  }
}

function formatarStatus(status) {
  const nomes = {
    agendada: "Agendada",
    confirmada: "Confirmada",
    realizada: "Realizada",
    cancelada: "Cancelada",
    faltou: "Faltou",
  };

  return nomes[status] || status;
}

function formatarData(data) {
  const [ano, mes, dia] = data.split("-");
  return `${dia}/${mes}/${ano}`;
}
