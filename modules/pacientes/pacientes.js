const formPaciente = document.getElementById("form-paciente");
const listaPacientes = document.getElementById("lista-pacientes");
const btnSalvarPaciente = document.getElementById("btn-salvar-paciente");

let pacientes = JSON.parse(localStorage.getItem("pacientes")) || [];
let editandoPacienteId = null;

// Salvar ou editar paciente
if (formPaciente) {
  formPaciente.addEventListener("submit", function (e) {
    e.preventDefault();

    const nome = document.getElementById("nome").value.trim();
    const cpf = document.getElementById("cpf").value.trim();
    const telefone = document.getElementById("telefone").value.trim();
    const nascimento = document.getElementById("nascimento").value;
    const convenio = document.getElementById("convenio").value.trim();
    const status = document.getElementById("status").value;
    const observacoes = document.getElementById("observacoes").value.trim();

    if (!nome) { alert("Informe o nome do paciente."); return; }
    if (!cpf)  { alert("Informe o CPF do paciente.");  return; }
    if (!telefone) { alert("Informe o telefone do paciente."); return; }

    const cpfDuplicado = pacientes.some(
      (paciente) => paciente.cpf === cpf && paciente.id !== editandoPacienteId
    );
    if (cpfDuplicado) {
      alert("Já existe um paciente cadastrado com esse CPF.");
      return;
    }

    if (editandoPacienteId) {
      pacientes = pacientes.map((paciente) => {
        if (paciente.id === editandoPacienteId) {
          return { ...paciente, nome, cpf, telefone, nascimento, convenio, status, observacoes };
        }
        return paciente;
      });

      alert("Paciente atualizado com sucesso!");
      editandoPacienteId = null;
      btnSalvarPaciente.textContent = "Salvar Paciente";
    } else {
      const novoPaciente = {
        id: Date.now(),
        nome, cpf, telefone, nascimento, convenio, status, observacoes,
      };
      pacientes.push(novoPaciente);
      alert("Paciente cadastrado com sucesso!");
    }

    localStorage.setItem("pacientes", JSON.stringify(pacientes));
    formPaciente.reset();
    renderizarPacientes();
  });
}

// ── Renderizar pacientes ──────────────────────────────────
function renderizarPacientes() {
  if (!listaPacientes) return;

  listaPacientes.innerHTML = "";

  if (pacientes.length === 0) {
    listaPacientes.innerHTML = `
      <tr>
        <td colspan="6" style="text-align:center; padding:2rem; color:#5a7299;">
          Nenhum paciente cadastrado.
        </td>
      </tr>
    `;
    return;
  }

  pacientes.forEach((paciente) => {
    const isInativo = paciente.status === "inativo";

    listaPacientes.innerHTML += `
      <tr>
        <td>${paciente.nome}</td>
        <td>${paciente.cpf}</td>
        <td>${paciente.telefone}</td>
        <td>${paciente.convenio || "-"}</td>
        <td>
          <span class="badge-status badge-${paciente.status}">
            ${paciente.status === "ativo" ? "Ativo" : "Inativo"}
          </span>
        </td>
        <td>
          <div class="acoes-paciente">
            <button class="btn-editar"    onclick="editarPaciente(${paciente.id})">Editar</button>
            <button class="btn-historico" onclick="abrirHistorico(${paciente.id})">Histórico</button>
            <button class="btn-prontuario" onclick="abrirProntuario(${paciente.id})">Prontuário</button>
            ${
              isInativo
                ? `<button class="btn-inativo-disabled" disabled>Inativo</button>`
                : `<button class="btn-inativar" onclick="inativarPaciente(${paciente.id})">Inativar</button>`
            }
          </div>
        </td>
      </tr>
    `;
  });
}

// ── Editar paciente ───────────────────────────────────────
function editarPaciente(id) {
  const paciente = pacientes.find((item) => item.id === id);
  if (!paciente) return;

  document.getElementById("nome").value        = paciente.nome;
  document.getElementById("cpf").value         = paciente.cpf;
  document.getElementById("telefone").value    = paciente.telefone;
  document.getElementById("nascimento").value  = paciente.nascimento;
  document.getElementById("convenio").value    = paciente.convenio;
  document.getElementById("status").value      = paciente.status;
  document.getElementById("observacoes").value = paciente.observacoes;

  editandoPacienteId = id;
  btnSalvarPaciente.textContent = "Atualizar Paciente";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// ── Inativar paciente ─────────────────────────────────────
function inativarPaciente(id) {
  const paciente = pacientes.find((item) => item.id === id);
  if (!paciente) return;

  if (paciente.status === "inativo") {
    alert("Esse paciente já está inativo.");
    return;
  }

  const confirmar = confirm("Deseja realmente inativar este paciente?");
  if (!confirmar) return;

  pacientes = pacientes.map((item) =>
    item.id === id ? { ...item, status: "inativo" } : item
  );

  localStorage.setItem("pacientes", JSON.stringify(pacientes));

  if (editandoPacienteId === id) {
    document.getElementById("status").value = "inativo";
  }

  renderizarPacientes();
  alert("Paciente inativado com sucesso.");
}

// ── Navegação ─────────────────────────────────────────────
function abrirHistorico(id) {
  window.location.href = `historico.html?id=${id}`;
}
function abrirProntuario(id) {
  window.location.href = `../prontuario/prontuario.html?id=${id}`;
}

renderizarPacientes();