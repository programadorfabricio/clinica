// ============================================================
// whatsapp.js — Clínica System
// ============================================================

let mensagens = JSON.parse(localStorage.getItem("wpp-mensagens")) || [];
let pacientes = [];

const templates = {
  lembrete:
    "Olá, {nome}! 👋 Lembramos que você tem uma consulta agendada para *{data}* às *{horario}* com {profissional}. Em caso de dúvidas, entre em contato. — {clinica}",
  confirmacao:
    "Olá, {nome}! ✅ Sua consulta com {profissional} em *{data}* às *{horario}* foi *confirmada*. Te esperamos! — {clinica}",
  cobranca:
    "Olá, {nome}! 💳 Identificamos um valor de *R$ {valor}* em aberto referente ao seu atendimento. Por favor, regularize para que possamos continuar atendendo você. — {clinica}",
  "pos-consulta":
    "Olá, {nome}! 😊 Esperamos que seu atendimento com {profissional} tenha sido ótimo. Caso tenha alguma dúvida ou precise remarcar, estamos à disposição! — {clinica}",
  aniversario:
    "Parabéns, {nome}! 🎉🎂 Toda a equipe da {clinica} deseja um feliz aniversário e muita saúde! Você é especial para nós. 💙",
};

// =========================
// CARREGAR PACIENTES
// =========================
function carregarPacientes() {
  pacientes = JSON.parse(localStorage.getItem("pacientes")) || [];

  // DEBUG — abra F12 > Console para ver os resultados
  console.log(
    "[WhatsApp] pacientes no localStorage:",
    pacientes.length,
    pacientes,
  );

  const sel = document.getElementById("destinatario");
  if (!sel) {
    console.error("[WhatsApp] ERRO: #destinatario não encontrado no DOM!");
    return;
  }

  sel.innerHTML = '<option value="">Selecione um paciente</option>';

  const ativos = pacientes.filter((p) => p.status === "ativo");
  console.log("[WhatsApp] pacientes ativos:", ativos.length);

  if (ativos.length === 0) {
    sel.innerHTML +=
      '<option value="" disabled>Nenhum paciente ativo cadastrado</option>';
    return;
  }

  ativos.forEach((p) => {
    const opt = document.createElement("option");
    opt.value = p.id;
    opt.textContent = p.nome;
    opt.dataset.tel = p.telefone || "";
    sel.appendChild(opt);
  });

  sel.addEventListener("change", function () {
    const opt = this.options[this.selectedIndex];
    document.getElementById("telefone").value = opt?.dataset.tel || "";
  });
}

// =========================
// TABS
// =========================
function mudarTab(btn, tabId) {
  document.querySelectorAll(".tab").forEach((t) => t.classList.remove("ativo"));
  btn.classList.add("ativo");

  ["tab-nova", "tab-historico", "tab-templates"].forEach((id) => {
    document.getElementById(id).style.display = id === tabId ? "" : "none";
  });

  if (tabId === "tab-historico") renderizarHistorico(mensagens);
}

// =========================
// PREVIEW EM TEMPO REAL
// =========================
function atualizarPreview() {
  const texto = document.getElementById("mensagem").value.trim();
  const preview = document.getElementById("preview-texto");

  if (!texto) {
    preview.className = "preview-placeholder";
    preview.innerHTML = "Sua mensagem aparecerá aqui...";
    return;
  }

  preview.className = "";
  preview.innerHTML = texto
    .replace(/\n/g, "<br>")
    .replace(/\*(.*?)\*/g, "<strong>$1</strong>");
}

// =========================
// TEMPLATES
// =========================
function aplicarTemplate() {
  const tipo = document.getElementById("tipo-msg").value;
  if (tipo && templates[tipo]) {
    document.getElementById("mensagem").value = templates[tipo];
    atualizarPreview();
  }
}

function usarTemplate(tipo) {
  document.querySelectorAll(".tab")[0].click();
  document.getElementById("tipo-msg").value = tipo;
  document.getElementById("mensagem").value = templates[tipo];
  atualizarPreview();
}

function editarTemplate(tipo) {
  const novo = prompt("Edite o template:", templates[tipo]);
  if (novo !== null && novo.trim()) {
    templates[tipo] = novo.trim();
    document.getElementById("tpl-" + tipo).textContent = templates[tipo];
    alert("Template atualizado com sucesso!");
  }
}

function inserirVariavel(variavel) {
  const el = document.getElementById("mensagem");
  const start = el.selectionStart;
  const end = el.selectionEnd;
  el.value = el.value.slice(0, start) + variavel + el.value.slice(end);
  el.focus();
  el.setSelectionRange(start + variavel.length, start + variavel.length);
  atualizarPreview();
}

// =========================
// ENVIAR AGORA
// =========================
function enviarMensagem() {
  const pacienteId = document.getElementById("destinatario").value;
  const telefone = document.getElementById("telefone").value.trim();
  const tipo = document.getElementById("tipo-msg").value || "livre";
  const mensagem = document.getElementById("mensagem").value.trim();

  if (!pacienteId) {
    alert("Selecione um paciente.");
    return;
  }
  if (!telefone) {
    alert("Informe o telefone do paciente.");
    return;
  }
  if (!mensagem) {
    alert("Digite a mensagem antes de enviar.");
    return;
  }

  const paciente = pacientes.find((p) => Number(p.id) === Number(pacienteId));

  const nova = {
    id: Date.now(),
    pacienteId,
    paciente: paciente?.nome || "-",
    telefone,
    tipo,
    mensagem,
    envio: new Date().toISOString(),
    status: "enviada",
  };

  mensagens.push(nova);
  salvarMensagens();
  atualizarStats();
  limparForm();
  alert("✅ Mensagem enviada com sucesso!");
}

// =========================
// AGENDAR ENVIO
// =========================
function agendarMensagem() {
  const pacienteId = document.getElementById("destinatario").value;
  const telefone = document.getElementById("telefone").value.trim();
  const tipo = document.getElementById("tipo-msg").value || "livre";
  const mensagem = document.getElementById("mensagem").value.trim();
  const agendado = document.getElementById("agendar-envio").value;

  if (!pacienteId) {
    alert("Selecione um paciente.");
    return;
  }
  if (!telefone) {
    alert("Informe o telefone do paciente.");
    return;
  }
  if (!mensagem) {
    alert("Digite a mensagem antes de agendar.");
    return;
  }
  if (!agendado) {
    alert("Informe a data e hora do envio agendado.");
    return;
  }

  const dataAgend = new Date(agendado);
  if (dataAgend <= new Date()) {
    alert("Agende o envio para um momento futuro.");
    return;
  }

  const paciente = pacientes.find((p) => Number(p.id) === Number(pacienteId));

  const nova = {
    id: Date.now(),
    pacienteId,
    paciente: paciente?.nome || "-",
    telefone,
    tipo,
    mensagem,
    envio: dataAgend.toISOString(),
    status: "agendada",
  };

  mensagens.push(nova);
  salvarMensagens();
  atualizarStats();
  limparForm();
  alert(`📅 Mensagem agendada para ${dataAgend.toLocaleString("pt-BR")}!`);
}

// =========================
// LIMPAR FORMULÁRIO
// =========================
function limparForm() {
  document.getElementById("destinatario").value = "";
  document.getElementById("telefone").value = "";
  document.getElementById("tipo-msg").value = "";
  document.getElementById("mensagem").value = "";
  document.getElementById("agendar-envio").value = "";
  atualizarPreview();
}

// =========================
// HISTÓRICO — RENDERIZAR
// =========================
function renderizarHistorico(lista) {
  const tbody = document.getElementById("lista-mensagens");
  if (!tbody) return;

  if (!lista.length) {
    tbody.innerHTML = `<tr><td colspan="7" style="color:var(--texto-suave);font-style:italic;text-align:center;padding:2rem">Nenhuma mensagem registrada.</td></tr>`;
    return;
  }

  tbody.innerHTML = [...lista]
    .reverse()
    .map(
      (m) => `
      <tr>
        <td>${m.paciente}</td>
        <td>${m.telefone}</td>
        <td>${labelTipo(m.tipo)}</td>
        <td class="td-msg" title="${m.mensagem}">${m.mensagem}</td>
        <td>${new Date(m.envio).toLocaleString("pt-BR")}</td>
        <td><span class="badge ${m.status}">${m.status}</span></td>
        <td>
          <div class="acoes-msg">
            ${m.status === "falhou" ? `<button class="btn-acao reenviar" onclick="reenviar(${m.id})">Reenviar</button>` : ""}
            <button class="btn-acao excluir" onclick="excluirMensagem(${m.id})">Excluir</button>
          </div>
        </td>
      </tr>
    `,
    )
    .join("");
}

// =========================
// HISTÓRICO — FILTRAR
// =========================
function filtrarHistorico() {
  const status = document.getElementById("filtro-hist-status").value;
  const paciente = document
    .getElementById("filtro-hist-paciente")
    .value.trim()
    .toLowerCase();
  const data = document.getElementById("filtro-hist-data").value;

  let filtradas = mensagens;
  if (status) filtradas = filtradas.filter((m) => m.status === status);
  if (paciente)
    filtradas = filtradas.filter((m) =>
      m.paciente.toLowerCase().includes(paciente),
    );
  if (data) filtradas = filtradas.filter((m) => m.envio.startsWith(data));

  renderizarHistorico(filtradas);
}

// =========================
// REENVIAR
// =========================
function reenviar(id) {
  mensagens = mensagens.map((m) =>
    Number(m.id) === Number(id)
      ? { ...m, status: "enviada", envio: new Date().toISOString() }
      : m,
  );
  salvarMensagens();
  atualizarStats();
  renderizarHistorico(mensagens);
  alert("Mensagem reenviada com sucesso!");
}

// =========================
// EXCLUIR DO HISTÓRICO
// =========================
function excluirMensagem(id) {
  if (!confirm("Deseja excluir esta mensagem do histórico?")) return;
  mensagens = mensagens.filter((m) => Number(m.id) !== Number(id));
  salvarMensagens();
  atualizarStats();
  renderizarHistorico(mensagens);
}

// =========================
// LABEL TIPO
// =========================
function labelTipo(tipo) {
  const map = {
    lembrete: "Lembrete",
    confirmacao: "Confirmação",
    cobranca: "Cobrança",
    "pos-consulta": "Pós-consulta",
    aniversario: "Aniversário",
    livre: "Livre",
  };
  return map[tipo] || tipo;
}

// =========================
// STATS
// =========================
function atualizarStats() {
  const hoje = new Date().toISOString().slice(0, 10);
  document.getElementById("stat-enviadas").textContent = mensagens.filter(
    (m) => m.status === "enviada" && m.envio.startsWith(hoje),
  ).length;
  document.getElementById("stat-pendentes").textContent = mensagens.filter(
    (m) => m.status === "pendente",
  ).length;
  document.getElementById("stat-agendadas").textContent = mensagens.filter(
    (m) => m.status === "agendada",
  ).length;
  document.getElementById("stat-falharam").textContent = mensagens.filter(
    (m) => m.status === "falhou",
  ).length;
}

// =========================
// SALVAR NO localStorage
// =========================
function salvarMensagens() {
  localStorage.setItem("wpp-mensagens", JSON.stringify(mensagens));
}

// =========================
// EXPOR FUNÇÕES GLOBAIS
// =========================
window.mudarTab = mudarTab;
window.aplicarTemplate = aplicarTemplate;
window.usarTemplate = usarTemplate;
window.editarTemplate = editarTemplate;
window.inserirVariavel = inserirVariavel;
window.enviarMensagem = enviarMensagem;
window.agendarMensagem = agendarMensagem;
window.limparForm = limparForm;
window.filtrarHistorico = filtrarHistorico;
window.reenviar = reenviar;
window.excluirMensagem = excluirMensagem;

// =========================
// INICIALIZAÇÃO
// Funciona tanto se o script carregar antes quanto depois do DOM
// =========================
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", function () {
    carregarPacientes();
    atualizarStats();
  });
} else {
  carregarPacientes();
  atualizarStats();
}
