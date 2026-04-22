const listaProntuarios = document.getElementById("lista-prontuarios");

const pacientes = JSON.parse(localStorage.getItem("pacientes")) || [];

function renderizarProntuarios() {
  if (!listaProntuarios) return;

  listaProntuarios.innerHTML = "";

  const pacientesAtivos = pacientes.filter(
    (paciente) => paciente.status !== "inativo"
  );

  if (pacientesAtivos.length === 0) {
    listaProntuarios.innerHTML = `
      <tr>
        <td colspan="5">Nenhum paciente disponível para prontuário.</td>
      </tr>
    `;
    return;
  }

  pacientesAtivos.forEach((paciente) => {
    listaProntuarios.innerHTML += `
      <tr>
        <td>${paciente.nome}</td>
        <td>${paciente.telefone || "-"}</td>
        <td>${paciente.convenio || "-"}</td>
        <td>
          <span class="status-badge ${paciente.status}">
            ${paciente.status}
          </span>
        </td>
        <td>
          <button class="btn btn-primary" onclick="abrirProntuarioPaciente(${paciente.id})">
            Abrir Prontuário
          </button>
        </td>
      </tr>
    `;
  });
}

function abrirProntuarioPaciente(id) {
  window.location.href = `./prontuario-detalhe.html?id=${id}`;
}

window.abrirProntuarioPaciente = abrirProntuarioPaciente;

renderizarProntuarios();