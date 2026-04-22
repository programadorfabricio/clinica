// ============================================================
//  relatorios.js — Clínica System
// ============================================================

// ── Helpers ─────────────────────────────────────────────────

function formatarData(data) {
  if (!data) return "-";
  const [ano, mes, dia] = data.split("-");
  return `${dia}/${mes}/${ano}`;
}

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function badge(classe, texto) {
  return `<span class="badge-status badge-${classe}">${texto}</span>`;
}

function chip(classe, texto) {
  return `<span class="chip chip-${classe}">${texto}</span>`;
}

function tdVazio(colunas, msg = "Nenhum registro encontrado.") {
  return `<tr><td colspan="${colunas}" class="td-vazio">${msg}</td></tr>`;
}

function dentroDoFiltro(dataItem, inicio, fim) {
  if (!inicio && !fim) return true;
  if (inicio && dataItem < inicio) return false;
  if (fim   && dataItem > fim)    return false;
  return true;
}

// ── Dados do localStorage ────────────────────────────────────

function getDados() {
  return {
    financeiro:  JSON.parse(localStorage.getItem("financeiro"))  || [],
    consultas:   JSON.parse(localStorage.getItem("consultas"))   || [],
    pacientes:   JSON.parse(localStorage.getItem("pacientes"))   || [],
    estoque:     JSON.parse(localStorage.getItem("estoque"))     || [],
  };
}

// ── Resumo geral (cards do topo) ─────────────────────────────

function renderizarResumoGeral() {
  const { financeiro, consultas, pacientes, estoque } = getDados();

  const totalRecebido  = financeiro.filter(f => f.status === "Pago").reduce((s, f) => s + Number(f.valor), 0);
  const totalPendente  = financeiro.filter(f => f.status === "Pendente").reduce((s, f) => s + Number(f.valor), 0);
  const totalConsultas = consultas.length;
  const consultasHoje  = (() => {
    const hoje = new Date();
    const h = `${hoje.getFullYear()}-${String(hoje.getMonth()+1).padStart(2,"0")}-${String(hoje.getDate()).padStart(2,"0")}`;
    return consultas.filter(c => c.data === h).length;
  })();
  const totalPacientes = pacientes.length;
  const estoqueAlerta  = estoque.filter(e => Number(e.quantidade) <= Number(e.minimo)).length;

  document.getElementById("resumo-geral").innerHTML = `
    <div class="resumo-card verde">
      <span class="rc-label">Total Recebido</span>
      <span class="rc-valor">${formatarMoeda(totalRecebido)}</span>
      <span class="rc-detalhe">pagamentos confirmados</span>
    </div>
    <div class="resumo-card amarelo">
      <span class="rc-label">A Receber</span>
      <span class="rc-valor">${formatarMoeda(totalPendente)}</span>
      <span class="rc-detalhe">pagamentos pendentes</span>
    </div>
    <div class="resumo-card azul">
      <span class="rc-label">Consultas</span>
      <span class="rc-valor">${totalConsultas}</span>
      <span class="rc-detalhe">${consultasHoje} hoje</span>
    </div>
    <div class="resumo-card azul">
      <span class="rc-label">Pacientes</span>
      <span class="rc-valor">${totalPacientes}</span>
      <span class="rc-detalhe">${pacientes.filter(p => p.status === "ativo").length} ativos</span>
    </div>
    <div class="resumo-card ${estoqueAlerta > 0 ? "vermelho" : "verde"}">
      <span class="rc-label">Estoque Crítico</span>
      <span class="rc-valor">${estoqueAlerta}</span>
      <span class="rc-detalhe">produto(s) em alerta</span>
    </div>
  `;
}

// ── Relatório Financeiro ─────────────────────────────────────

function renderizarFinanceiro(inicio, fim) {
  const { financeiro } = getDados();

  const filtrado = financeiro.filter(f => dentroDoFiltro(f.data, inicio, fim));
  filtrado.sort((a, b) => b.data.localeCompare(a.data));

  const recebido = filtrado.filter(f => f.status === "Pago").reduce((s, f) => s + Number(f.valor), 0);
  const pendente = filtrado.filter(f => f.status === "Pendente").reduce((s, f) => s + Number(f.valor), 0);

  document.getElementById("resumo-financeiro-rel").innerHTML = `
    ${chip("verde",   `Recebido: ${formatarMoeda(recebido)}`)}
    ${chip("amarelo", `Pendente: ${formatarMoeda(pendente)}`)}
    ${chip("azul",    `Total: ${filtrado.length} registro(s)`)}
  `;

  const tbody = document.getElementById("tabela-financeiro");

  if (filtrado.length === 0) {
    tbody.innerHTML = tdVazio(6);
    return;
  }

  tbody.innerHTML = filtrado.map(f => {
    const statusClasse = (f.status || "").toLowerCase();
    return `
      <tr>
        <td>${formatarData(f.data)}</td>
        <td>${f.pacienteNome || "-"}</td>
        <td>${f.descricao || "-"}</td>
        <td><strong>${formatarMoeda(f.valor)}</strong></td>
        <td>${f.forma || "-"}</td>
        <td>${badge(statusClasse, f.status)}</td>
      </tr>
    `;
  }).join("");
}

// ── Relatório de Agendamentos ────────────────────────────────

function renderizarAgendamentos(inicio, fim) {
  const { consultas } = getDados();

  const filtrado = consultas.filter(c => dentroDoFiltro(c.data, inicio, fim));
  filtrado.sort((a, b) => b.data.localeCompare(a.data));

  const contagem = {};
  filtrado.forEach(c => {
    contagem[c.status] = (contagem[c.status] || 0) + 1;
  });

  const chipMap = { agendada: "azul", confirmada: "verde", realizada: "verde", cancelada: "vermelho", faltou: "amarelo" };

  document.getElementById("resumo-agendamentos-rel").innerHTML = `
    ${chip("azul", `Total: ${filtrado.length}`)}
    ${Object.entries(contagem).map(([s, n]) => chip(chipMap[s] || "azul", `${s}: ${n}`)).join("")}
  `;

  const tbody = document.getElementById("tabela-agendamentos");

  if (filtrado.length === 0) {
    tbody.innerHTML = tdVazio(6);
    return;
  }

  tbody.innerHTML = filtrado.map(c => `
    <tr>
      <td>${formatarData(c.data)}</td>
      <td>${c.paciente || c.pacienteNome || "-"}</td>
      <td>${c.profissional || "-"}</td>
      <td>${c.tipo || "-"}</td>
      <td>${c.horario || "-"}</td>
      <td>${badge(c.status, c.status.charAt(0).toUpperCase() + c.status.slice(1))}</td>
    </tr>
  `).join("");
}

// ── Relatório de Pacientes ───────────────────────────────────

function renderizarPacientes() {
  const { pacientes } = getDados();
  const ativos   = pacientes.filter(p => p.status === "ativo").length;
  const inativos = pacientes.filter(p => p.status === "inativo").length;

  document.getElementById("resumo-pacientes-rel").innerHTML = `
    ${chip("verde",    `Ativos: ${ativos}`)}
    ${chip("vermelho", `Inativos: ${inativos}`)}
    ${chip("azul",     `Total: ${pacientes.length}`)}
  `;

  const tbody = document.getElementById("tabela-pacientes");

  if (pacientes.length === 0) {
    tbody.innerHTML = tdVazio(5);
    return;
  }

  tbody.innerHTML = pacientes.map(p => `
    <tr>
      <td><strong>${p.nome}</strong></td>
      <td>${p.cpf || "-"}</td>
      <td>${p.telefone || "-"}</td>
      <td>${p.convenio || "-"}</td>
      <td>${badge(p.status, p.status === "ativo" ? "Ativo" : "Inativo")}</td>
    </tr>
  `).join("");
}

// ── Relatório de Estoque ─────────────────────────────────────

function renderizarEstoque() {
  const { estoque } = getDados();

  const normal  = estoque.filter(e => Number(e.quantidade) > Number(e.minimo)).length;
  const baixo   = estoque.filter(e => Number(e.quantidade) > 0 && Number(e.quantidade) <= Number(e.minimo)).length;
  const zerado  = estoque.filter(e => Number(e.quantidade) <= 0).length;

  document.getElementById("resumo-estoque-rel").innerHTML = `
    ${chip("verde",    `Normal: ${normal}`)}
    ${chip("amarelo",  `Baixo: ${baixo}`)}
    ${chip("vermelho", `Zerado: ${zerado}`)}
    ${chip("azul",     `Total: ${estoque.length}`)}
  `;

  const tbody = document.getElementById("tabela-estoque");

  if (estoque.length === 0) {
    tbody.innerHTML = tdVazio(6);
    return;
  }

  // ordenar: zerados > baixos > normais
  const ordenado = [...estoque].sort((a, b) => {
    const prioridade = e => Number(e.quantidade) <= 0 ? 0 : Number(e.quantidade) <= Number(e.minimo) ? 1 : 2;
    return prioridade(a) - prioridade(b);
  });

  tbody.innerHTML = ordenado.map(e => {
    const qtd = Number(e.quantidade);
    const min = Number(e.minimo);
    let statusClasse = "normal";
    let statusLabel  = "Normal";
    if (qtd <= 0)   { statusClasse = "zerado"; statusLabel = "Zerado"; }
    else if (qtd <= min) { statusClasse = "baixo"; statusLabel = "Baixo"; }

    return `
      <tr>
        <td><strong>${e.nome}</strong></td>
        <td>${e.categoria || "-"}</td>
        <td>${e.quantidade} ${e.unidade || ""}</td>
        <td>${e.minimo} ${e.unidade || ""}</td>
        <td>${formatarData(e.validade)}</td>
        <td>${badge(statusClasse, statusLabel)}</td>
      </tr>
    `;
  }).join("");
}

// ── Visibilidade das seções ──────────────────────────────────

function controlarVisibilidade(tipo) {
  const secoes = {
    financeiro:    document.getElementById("secao-financeiro"),
    agendamentos:  document.getElementById("secao-agendamentos"),
    pacientes:     document.getElementById("secao-pacientes"),
    estoque:       document.getElementById("secao-estoque"),
  };

  Object.entries(secoes).forEach(([key, el]) => {
    el.style.display = (tipo === "todos" || tipo === key) ? "block" : "none";
  });
}

// ── Gerar relatório ──────────────────────────────────────────

function gerarRelatorio() {
  const inicio = document.getElementById("data-inicio").value;
  const fim    = document.getElementById("data-fim").value;
  const tipo   = document.getElementById("tipo-relatorio").value;

  controlarVisibilidade(tipo);

  if (tipo === "todos" || tipo === "financeiro")   renderizarFinanceiro(inicio, fim);
  if (tipo === "todos" || tipo === "agendamentos") renderizarAgendamentos(inicio, fim);
  if (tipo === "todos" || tipo === "pacientes")    renderizarPacientes();
  if (tipo === "todos" || tipo === "estoque")      renderizarEstoque();
}

// ── Limpar filtros ───────────────────────────────────────────

function limparFiltros() {
  document.getElementById("data-inicio").value = "";
  document.getElementById("data-fim").value    = "";
  document.getElementById("tipo-relatorio").value = "todos";
  gerarRelatorio();
}

// ── Exportar CSV ─────────────────────────────────────────────

function exportarCSV() {
  const inicio = document.getElementById("data-inicio").value;
  const fim    = document.getElementById("data-fim").value;
  const tipo   = document.getElementById("tipo-relatorio").value;

  const { financeiro, consultas, pacientes, estoque } = getDados();
  let csv = "";
  let nomeArquivo = "relatorio";

  if (tipo === "todos" || tipo === "financeiro") {
    const dados = financeiro.filter(f => dentroDoFiltro(f.data, inicio, fim));
    csv += "=== FINANCEIRO ===\n";
    csv += "Data,Paciente,Descrição,Valor,Forma,Status\n";
    csv += dados.map(f =>
      `${formatarData(f.data)},"${f.pacienteNome || ""}","${f.descricao || ""}",${f.valor},"${f.forma || ""}","${f.status}"`
    ).join("\n") + "\n\n";
    nomeArquivo = "relatorio-financeiro";
  }

  if (tipo === "todos" || tipo === "agendamentos") {
    const dados = consultas.filter(c => dentroDoFiltro(c.data, inicio, fim));
    csv += "=== AGENDAMENTOS ===\n";
    csv += "Data,Paciente,Profissional,Tipo,Horário,Status\n";
    csv += dados.map(c =>
      `${formatarData(c.data)},"${c.paciente || c.pacienteNome || ""}","${c.profissional || ""}","${c.tipo || ""}","${c.horario || ""}","${c.status}"`
    ).join("\n") + "\n\n";
    nomeArquivo = "relatorio-agendamentos";
  }

  if (tipo === "todos" || tipo === "pacientes") {
    csv += "=== PACIENTES ===\n";
    csv += "Nome,CPF,Telefone,Convênio,Status\n";
    csv += pacientes.map(p =>
      `"${p.nome}","${p.cpf || ""}","${p.telefone || ""}","${p.convenio || ""}","${p.status}"`
    ).join("\n") + "\n\n";
    nomeArquivo = "relatorio-pacientes";
  }

  if (tipo === "todos" || tipo === "estoque") {
    csv += "=== ESTOQUE ===\n";
    csv += "Produto,Categoria,Quantidade,Unidade,Mínimo,Validade\n";
    csv += estoque.map(e =>
      `"${e.nome}","${e.categoria || ""}",${e.quantidade},"${e.unidade || ""}",${e.minimo},"${formatarData(e.validade)}"`
    ).join("\n") + "\n\n";
    nomeArquivo = "relatorio-estoque";
  }

  if (tipo === "todos") nomeArquivo = "relatorio-geral";

  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href     = url;
  link.download = `${nomeArquivo}-${new Date().toISOString().slice(0,10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

// ── Inicializar ──────────────────────────────────────────────

renderizarResumoGeral();
gerarRelatorio();