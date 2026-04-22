// LOGIN - só funciona se existir o formulário de login
const formLogin = document.getElementById("form-login");

if (formLogin) {
  formLogin.addEventListener("submit", function (e) {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const senha = document.getElementById("senha").value.trim();

    if (email === "" || senha === "") {
      alert("Preencha e-mail e senha.");
      return;
    }

    if (email === "admin@clinica.com" && senha === "123456") {
      localStorage.setItem("usuarioLogado", "true");
      window.location.href = "./dashboard.html";
    } else {
      alert("E-mail ou senha inválidos.");
    }
  });
}

// Detecta caminho correto do login
function getLoginPath() {
  if (window.location.pathname.includes("/modules/")) {
    return "../../login.html";
  }
  return "./login.html";
}

// Proteção de páginas
function protegerPagina() {
  const usuarioLogado = localStorage.getItem("usuarioLogado");

  if (usuarioLogado !== "true") {
    window.location.href = getLoginPath();
  }
}

// Logout
function logout() {
  localStorage.removeItem("usuarioLogado");
  window.location.href = getLoginPath();
}
