const totalConsultasHoje = document.getElementById("total-consultas-hoje");
const totalPacientes = document.getElementById("total-pacientes");
const totalConfirmadasHoje = document.getElementById("total-confirmadas-hoje");
const totalCanceladasHoje = document.getElementById("total-canceladas-hoje");
const listaConsultasHoje = document.getElementById("lista-consultas-hoje");
const listaUltimosPacientes = document.getElementById("lista-ultimos-pacientes");
const listaProximasConsultas = document.getElementById("lista-proximas-consultas");

const pacientes = JSON.parse(localStorage.getItem("pacientes")) || [];
const consultas = JSON.parse(localStorage.getItem("consultas")) || [];

// Data local de hoje no formato yyyy-mm-dd
const dataAtual = new Date();
const ano = dataAtual.getFullYear();
const mes = String(dataAtual.getMonth() + 1).padStart(2, "0");
const dia = String(dataAtual.getDate()).padStart(2, "0");
const hoje = `${ano}-${mes}-${dia}`;

// Filtra consultas do dia
const consultasHoje = consultas.filter((consulta) => consulta.data === hoje);

// Totais
const confirmadasHoje = consultasHoje.filter((consulta) => consulta.status === "confirmada").length;
const canceladasHoje = consultasHoje.filter((consulta) => consulta.status === "cancelada").length;

// Atualiza cards
totalPacientes.textContent = pacientes.length;
totalConsultasHoje.textContent = consultasHoje.length;
totalConfirmadasHoje.textContent = confirmadasHoje;
totalCanceladasHoje.textContent = canceladasHoje;

// Ordena consultas por horário
consultasHoje.sort((a, b) => a.horario.localeCompare(b.horario));

// Renderiza tabela
function renderizarConsultasHoje() {
  listaConsultasHoje.innerHTML = "";

  if (consultasHoje.length === 0) {
    listaConsultasHoje.innerHTML = `
      <tr>
        <td colspan="4">Nenhuma consulta agendada para hoje.</td>
      </tr>
    `;
    return;
  }

  consultasHoje.forEach((consulta) => {
    listaConsultasHoje.innerHTML += `
      <tr>
        <td>${consulta.horario}</td>
        <td>${consulta.paciente}</td>
        <td>${consulta.profissional}</td>
        <td><span class="status ${consulta.status}">${formatarStatus(consulta.status)}</span></td>
      </tr>
    `;
  });
}

function formatarStatus(status) {
  const nomes = {
    agendada: "Agendada",
    confirmada: "Confirmada",
    realizada: "Realizada",
    cancelada: "Cancelada",
    faltou: "Faltou"
  };

  return nomes[status] || status;
}
function renderizarUltimosPacientes() {
  listaUltimosPacientes.innerHTML = "";

  if (pacientes.length === 0) {
    listaUltimosPacientes.innerHTML = `
      <tr>
        <td colspan="4">Nenhum paciente cadastrado ainda.</td>
      </tr>
    `;
    return;
  }

  

  const ultimosPacientes = [...pacientes].slice(-5).reverse();

  ultimosPacientes.forEach((paciente) => {
    listaUltimosPacientes.innerHTML += `
      <tr>
        <td>${paciente.nome}</td>
        <td>${paciente.telefone}</td>
        <td>${paciente.convenio || "-"}</td>
        <td>${paciente.status}</td>
      </tr>
    `;
  });
}

function renderizarProximasConsultas() {
  listaProximasConsultas.innerHTML = "";

  if (consultas.length === 0) {
    listaProximasConsultas.innerHTML = `
      <tr>
        <td colspan="5">Nenhuma consulta cadastrada.</td>
      </tr>
    `;
    return;
  }

  const proximasConsultas = [...consultas]
    .filter((consulta) => consulta.status !== "cancelada")
    .filter((consulta) => {
      const dataHoraConsulta = new Date(`${consulta.data}T${consulta.horario}`);
      const agora = new Date();
      return dataHoraConsulta >= agora;
    })
    .sort((a, b) => {
      const dataHoraA = new Date(`${a.data}T${a.horario}`);
      const dataHoraB = new Date(`${b.data}T${b.horario}`);
      return dataHoraA - dataHoraB;
    })
    .slice(0, 5);

  if (proximasConsultas.length === 0) {
    listaProximasConsultas.innerHTML = `
      <tr>
        <td colspan="5">Nenhuma próxima consulta encontrada.</td>
      </tr>
    `;
    return;
  }

  proximasConsultas.forEach((consulta) => {
    listaProximasConsultas.innerHTML += `
      <tr>
        <td>${consulta.data}</td>
        <td>${consulta.horario}</td>
        <td>${consulta.paciente}</td>
        <td>${consulta.profissional}</td>
        <td><span class="status ${consulta.status}">${formatarStatus(consulta.status)}</span></td>
      </tr>
    `;
  });
}

renderizarConsultasHoje();
renderizarUltimosPacientes();
renderizarProximasConsultas();