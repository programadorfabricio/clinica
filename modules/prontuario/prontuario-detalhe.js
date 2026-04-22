const dadosPaciente = document.getElementById("dados-paciente");
const formProntuario = document.getElementById("form-prontuario");
const listaProntuarios = document.getElementById("lista-prontuarios");
const inputData = document.getElementById("data");
const inputProfissional = document.getElementById("profissional");
const inputQueixa = document.getElementById("queixa");
const inputProcedimento = document.getElementById("procedimento");
const inputObservacoes = document.getElementById("observacoes");
const inputPrescricao = document.getElementById("prescricao");
const detalhesProntuario = document.getElementById("detalhes-prontuario");

const pacientes = JSON.parse(localStorage.getItem("pacientes")) || [];
let prontuarioEmEdicao = null;

// Pega o ID do paciente pela URL
const params = new URLSearchParams(window.location.search);
const pacienteId = Number(params.get("id"));

const paciente = pacientes.find((p) => Number(p.id) === pacienteId);

// =========================
// INICIALIZAÇÃO
// =========================

if (!pacienteId || !paciente) {
  dadosPaciente.innerHTML = `
    <div class="card-info">
      <h2>Paciente não encontrado</h2>
      <p>Esse paciente não existe ou foi removido.</p>
    </div>
  `;

  if (formProntuario) formProntuario.style.display = "none";
} else {
  renderizarPaciente();
  renderizarProntuarios();
  definirDataAtual();

  formProntuario.addEventListener("submit", salvarProntuario);
}

// =========================
// FUNÇÕES
// =========================

function definirDataAtual() {
  const dataAtual = new Date();
  const ano = dataAtual.getFullYear();
  const mes = String(dataAtual.getMonth() + 1).padStart(2, "0");
  const dia = String(dataAtual.getDate()).padStart(2, "0");

  inputData.value = `${ano}-${mes}-${dia}`;
}

function formatarDataProntuario(data) {
  if (!data) return "-";

  const [ano, mes, dia] = data.split("-");
  return `${dia}/${mes}/${ano}`;
}

function renderizarPaciente() {
  dadosPaciente.innerHTML = `
    <div class="card-info">
      <h2>${paciente.nome}</h2>
      <p><strong>CPF:</strong> ${paciente.cpf || "-"}</p>
      <p><strong>Telefone:</strong> ${paciente.telefone || "-"}</p>
      <p><strong>Convênio:</strong> ${paciente.convenio || "-"}</p>
      <p><strong>Status:</strong> ${paciente.status || "-"}</p>
      <p><strong>Observações:</strong> ${paciente.observacoes || "-"}</p>
    </div>
  `;
}

function renderizarProntuarios() {
  if (!listaProntuarios) return;

  listaProntuarios.innerHTML = "";

  const prontuariosSalvos =
    JSON.parse(localStorage.getItem("prontuarios")) || [];

  const prontuariosPaciente = prontuariosSalvos
    .filter((registro) => Number(registro.pacienteId) === Number(pacienteId))
    .sort((a, b) => b.data.localeCompare(a.data));

  if (prontuariosPaciente.length === 0) {
    listaProntuarios.innerHTML = `
      <tr>
        <td colspan="5">Nenhum registro clínico encontrado para este paciente.</td>
      </tr>
    `;
    return;
  }

  prontuariosPaciente.forEach((registro) => {
    listaProntuarios.innerHTML += `
      <tr>
        <td>${formatarDataProntuario(registro.data)}</td>
        <td>${registro.profissional}</td>
        <td>${registro.queixa}</td>
        <td>${registro.procedimento}</td>
        <td class="acoes-prontuario">
          <div class="actions-group">
            <button class="btn-sm btn-green" onclick="verDetalhesProntuario(${registro.id})">Ver</button>
            <button class="btn-sm btn-blue" onclick="editarProntuario(${registro.id})">Editar</button>
            <button class="btn-sm btn-red" onclick="excluirProntuario(${registro.id})">Excluir</button>
          </div>
        </td>
      </tr>
    `;
  });
}

function salvarProntuario(e) {
  e.preventDefault();

  let prontuariosAtualizados =
    JSON.parse(localStorage.getItem("prontuarios")) || [];

  const data = inputData.value.trim();
  const profissional = inputProfissional.value.trim();
  const queixa = inputQueixa.value.trim();
  const procedimento = inputProcedimento.value.trim();
  const observacoes = inputObservacoes.value.trim();
  const prescricao = inputPrescricao.value.trim();

  if (!data || !profissional || !queixa || !procedimento) {
    alert("Preencha os campos obrigatórios do prontuário.");
    return;
  }

  if (prontuarioEmEdicao) {
    const index = prontuariosAtualizados.findIndex(
      (item) => Number(item.id) === Number(prontuarioEmEdicao)
    );

    if (index !== -1) {
      prontuariosAtualizados[index] = {
        ...prontuariosAtualizados[index],
        data,
        profissional,
        queixa,
        procedimento,
        observacoes,
        prescricao,
      };

      alert("Registro clínico atualizado com sucesso!");
    }

    prontuarioEmEdicao = null;
    formProntuario.querySelector("button[type='submit']").textContent =
      "Salvar Registro";
  } else {
    const novoProntuario = {
      id: Date.now(),
      pacienteId: pacienteId,
      data,
      profissional,
      queixa,
      procedimento,
      observacoes,
      prescricao,
    };

    prontuariosAtualizados.push(novoProntuario);
    alert("Registro clínico salvo com sucesso!");
  }

  localStorage.setItem("prontuarios", JSON.stringify(prontuariosAtualizados));

  formProntuario.reset();
  definirDataAtual();
  prontuarioEmEdicao = null;

  detalhesProntuario.style.display = "none";
  detalhesProntuario.innerHTML = "";

  renderizarProntuarios();
}

function verDetalhesProntuario(id) {
  const prontuarios = JSON.parse(localStorage.getItem("prontuarios")) || [];
  const registro = prontuarios.find((item) => Number(item.id) === Number(id));

  if (!registro) {
    alert("Registro não encontrado.");
    return;
  }

  detalhesProntuario.style.display = "block";

  detalhesProntuario.innerHTML = `
    <div class="detalhes-card">
      <h2>Detalhes do Registro Clínico</h2>

      <div class="detalhes-grid">
        <p><strong>Data:</strong> ${formatarDataProntuario(registro.data)}</p>
        <p><strong>Profissional:</strong> ${registro.profissional}</p>
      </div>

      <div class="detalhe-bloco">
        <h3>Queixa Principal</h3>
        <p>${registro.queixa}</p>
      </div>

      <div class="detalhe-bloco">
        <h3>Procedimento</h3>
        <p>${registro.procedimento}</p>
      </div>

      <div class="detalhe-bloco">
        <h3>Observações Clínicas</h3>
        <p>${registro.observacoes || "-"}</p>
      </div>

      <div class="detalhe-bloco">
        <h3>Prescrição / Recomendações</h3>
        <p>${registro.prescricao || "-"}</p>
      </div>
    </div>
  `;

  detalhesProntuario.scrollIntoView({ behavior: "smooth" });
}

function editarProntuario(id) {
  const prontuariosSalvos = JSON.parse(localStorage.getItem("prontuarios")) || [];

  const registro = prontuariosSalvos.find(
    (item) => Number(item.id) === Number(id)
  );

  if (!registro) {
    alert("Registro não encontrado.");
    return;
  }

  inputData.value = registro.data || "";
  inputProfissional.value = registro.profissional || "";
  inputQueixa.value = registro.queixa || "";
  inputProcedimento.value = registro.procedimento || "";
  inputObservacoes.value = registro.observacoes || "";
  inputPrescricao.value = registro.prescricao || "";

  prontuarioEmEdicao = Number(registro.id);

  formProntuario.querySelector("button[type='submit']").textContent =
    "Atualizar Registro";

  detalhesProntuario.style.display = "none";
  detalhesProntuario.innerHTML = "";

  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
}

function excluirProntuario(id) {
  const confirmar = confirm("Deseja realmente excluir este registro clínico?");
  if (!confirmar) return;

  let prontuarios = JSON.parse(localStorage.getItem("prontuarios")) || [];

  prontuarios = prontuarios.filter((item) => Number(item.id) !== Number(id));

  localStorage.setItem("prontuarios", JSON.stringify(prontuarios));

  if (Number(prontuarioEmEdicao) === Number(id)) {
    prontuarioEmEdicao = null;
    formProntuario.reset();
    definirDataAtual();

    formProntuario.querySelector("button[type='submit']").textContent =
      "Salvar Registro";
  }

  detalhesProntuario.style.display = "none";
  detalhesProntuario.innerHTML = "";

  renderizarProntuarios();
  alert("Registro clínico excluído com sucesso!");
}

// =========================
// FUNÇÕES GLOBAIS
// =========================

window.verDetalhesProntuario = verDetalhesProntuario;
window.editarProntuario = editarProntuario;
window.excluirProntuario = excluirProntuario;