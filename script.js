const CONFIG = window.AUTOPRIME_CONFIG || {};

const configurado = Boolean(
  CONFIG.supabaseUrl &&
  CONFIG.supabaseAnonKey &&
  !CONFIG.supabaseUrl.includes("COLE_AQUI") &&
  !CONFIG.supabaseAnonKey.includes("COLE_AQUI")
);

const app = document.querySelector("#app");
const autenticacao = document.querySelector("#autenticacao");
const menu = document.querySelector(".menu");
const botaoSair = document.querySelector("#sair");
const rodape = document.querySelector("#rodape");

const dados = {
  veiculos: [],
  clientes: [],
  vendas: []
};

let banco = null;
let usuario = null;
let pagina = "inicio";
let edicao = null;
let busca = "";
let modoAutenticacao = "entrar";

const tabelasBanco = {
  veiculos: "vehicles",
  clientes: "clients",
  vendas: "sales"
};

function escapar(valor) {
  return String(valor ?? "").replace(/[&<>"']/g, caractere => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[caractere]);
}

function moeda(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function dataHoje() {
  const agora = new Date();
  const ano = agora.getFullYear();
  const mes = String(agora.getMonth() + 1).padStart(2, "0");
  const dia = String(agora.getDate()).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
}

function mostrarConfiguracao() {
  autenticacao.hidden = false;
  menu.hidden = true;
  app.hidden = true;
  botaoSair.hidden = true;

  autenticacao.innerHTML = `
    <section class="painel-autenticacao">
      <h1>Conecte o banco de dados</h1>

      <p>
        Antes de usar o AutoPrime, preencha a URL e a chave pública
        do seu projeto Supabase no arquivo <strong>config.js</strong>.
      </p>

      <ol>
        <li>Crie um projeto no Supabase.</li>
        <li>Execute o arquivo <strong>database.sql</strong> no SQL Editor.</li>
        <li>Copie a URL e a chave pública para o arquivo <strong>config.js</strong>.</li>
      </ol>

      <p class="aviso">
        Consulte o README do projeto para ver o passo a passo completo.
      </p>
    </section>
  `;
}

function renderizarAutenticacao(mensagem = "") {
  autenticacao.hidden = false;
  menu.hidden = true;
  app.hidden = true;
  botaoSair.hidden = true;

  const criandoConta = modoAutenticacao === "criar";

  const titulo = criandoConta
    ? "Criar sua conta"
    : "Entrar no AutoPrime";

  const textoBotao = criandoConta
    ? "Criar conta"
    : "Entrar";

  const textoAlternativa = criandoConta
    ? "Já tem uma conta?"
    : "Ainda não tem uma conta?";

  const acaoAlternativa = criandoConta
    ? "Fazer login"
    : "Criar conta";

  const novoModo = criandoConta
    ? "entrar"
    : "criar";

  autenticacao.innerHTML = `
    <section class="painel-autenticacao">
      <h1>${titulo}</h1>

      <p>
        Entre para acessar os veículos, clientes e vendas da sua loja.
      </p>

      ${
        mensagem
          ? `<div class="mensagem-autenticacao">${escapar(mensagem)}</div>`
          : ""
      }

      <form id="form-autenticacao" class="formulario-autenticacao">

        <div class="campo">
          <label for="email-conta">E-mail</label>

          <input
            id="email-conta"
            name="email"
            type="email"
            required
            autocomplete="email"
            placeholder="seuemail@exemplo.com"
          >
        </div>

        <div class="campo">
          <label for="senha-conta">Senha</label>

          <input
            id="senha-conta"
            name="senha"
            type="password"
            required
            minlength="6"
            autocomplete="${criandoConta ? "new-password" : "current-password"}"
            placeholder="Pelo menos 6 caracteres"
          >
        </div>

        <button class="botao" type="submit">
          ${textoBotao}
        </button>

      </form>

      <p class="alternativa-conta">
        ${textoAlternativa}

        <button
          class="link-conta"
          type="button"
          data-modo-auth="${novoModo}"
        >
          ${acaoAlternativa}
        </button>
      </p>
    </section>
  `;
}

function mensagemErro(erro) {
  const texto = erro?.message || "Ocorreu um erro inesperado.";

  if (texto.toLowerCase().includes("invalid login credentials")) {
    return "E-mail ou senha incorretos.";
  }

  if (texto.toLowerCase().includes("user already registered")) {
    return "Este e-mail já possui uma conta. Faça login.";
  }

  if (texto.toLowerCase().includes("email not confirmed")) {
    return "Confirme seu e-mail antes de entrar.";
  }

  if (texto.toLowerCase().includes("duplicate key")) {
    return "Este veículo já possui uma venda registrada.";
  }

  return texto;
}

async function carregarDados() {
  const [
    respostaVeiculos,
    respostaClientes,
    respostaVendas
  ] = await Promise.all([
    banco
      .from("vehicles")
      .select("*")
      .order("created_at", { ascending: false }),

    banco
      .from("clients")
      .select("*")
      .order("created_at", { ascending: false }),

    banco
      .from("sales")
      .select("*")
      .order("sold_at", { ascending: false })
  ]);

  if (respostaVeiculos.error) throw respostaVeiculos.error;
  if (respostaClientes.error) throw respostaClientes.error;
  if (respostaVendas.error) throw respostaVendas.error;

  dados.veiculos = respostaVeiculos.data.map(item => ({
    id: item.id,
    nome: item.name,
    ano: item.year,
    preco: Number(item.price),
    status: item.status
  }));

  dados.clientes = respostaClientes.data.map(item => ({
    id: item.id,
    nome: item.name,
    telefone: item.phone,
    email: item.email || ""
  }));

  dados.vendas = respostaVendas.data.map(item => ({
    id: item.id,
    clienteId: item.client_id,
    veiculoId: item.vehicle_id,
    clienteNome: item.client_name,
    veiculoNome: item.vehicle_name,
    valor: Number(item.amount),
    data: item.sold_at
  }));
}

async function entrar(conta) {
  if (usuario?.id === conta.id && !app.hidden) return;

  usuario = conta;

  autenticacao.hidden = true;
  menu.hidden = false;
  app.hidden = false;
  botaoSair.hidden = false;

  rodape.textContent = "AutoPrime · Dados salvos na nuvem na sua conta.";

  try {
    await carregarDados();
    renderizar();
  } catch (erro) {
    app.innerHTML = `
      <div class="vazio">
        Não foi possível carregar seus dados:
        ${escapar(mensagemErro(erro))}
      </div>
    `;
  }
}

function sairDaTela() {
  usuario = null;

  dados.veiculos = [];
  dados.clientes = [];
  dados.vendas = [];

  pagina = "inicio";
  edicao = null;
  busca = "";

  app.hidden = true;
  menu.hidden = true;
  botaoSair.hidden = true;

  rodape.textContent = "AutoPrime · Faça login para acessar seus dados.";

  modoAutenticacao = "entrar";

  renderizarAutenticacao();
}

async function iniciarAplicacao() {
  if (!configurado || !window.supabase?.createClient) {
    mostrarConfiguracao();
    return;
  }

  banco = window.supabase.createClient(
    CONFIG.supabaseUrl,
    CONFIG.supabaseAnonKey
  );

  banco.auth.onAuthStateChange((_evento, sessao) => {
    if (sessao?.user) {
      window.setTimeout(() => void entrar(sessao.user), 0);
    } else {
      sairDaTela();
    }
  });

  const { data, error } = await banco.auth.getSession();

  if (error) {
    renderizarAutenticacao(mensagemErro(error));
    return;
  }

  if (data.session?.user) {
    await entrar(data.session.user);
  } else {
    renderizarAutenticacao();
  }
}

function abrirPagina(nome) {
  pagina = nome;
  edicao = null;
  busca = "";

  document.querySelectorAll(".aba").forEach(aba => {
    aba.classList.toggle("ativa", aba.dataset.page === nome);
  });

  renderizar();
}

function inicio() {
  return `
    <section class="introducao">
      <h1>Bem-vindo ao AutoPrime</h1>

      <p>
        Cadastre seus veículos e clientes e acompanhe suas vendas por aqui.
      </p>
    </section>

    <section class="resumos">

      <div class="resumo">
        <span>Veículos cadastrados</span>
        <strong>${dados.veiculos.length}</strong>
      </div>

      <div class="resumo">
        <span>Clientes cadastrados</span>
        <strong>${dados.clientes.length}</strong>
      </div>

      <div class="resumo">
        <span>Vendas realizadas</span>
        <strong>${dados.vendas.length}</strong>
      </div>

    </section>

    <section class="painel">
      <h2>Comece por aqui</h2>

      <p>
        Adicione as informações da sua loja para começar a usar o sistema.
      </p>

      <div class="acoes-inicio">

        <button class="botao" data-ir="veiculos" type="button">
          Cadastrar veículo
        </button>

        <button class="botao secundario" data-ir="clientes" type="button">
          Cadastrar cliente
        </button>

        <button class="botao secundario" data-ir="vendas" type="button">
          Registrar venda
        </button>

      </div>
    </section>
  `;
}

function cabecalho(titulo, descricao, tipo) {
  return `
    <div class="cabecalho-pagina">

      <div>
        <h1>${titulo}</h1>
        <p>${descricao}</p>
      </div>

      <button class="botao" data-novo="${tipo}" type="button">
        + Adicionar
      </button>

    </div>
  `;
}

function tabela(linhas, colunas, vazio) {
  if (!linhas.length) {
    return `<div class="vazio">${vazio}</div>`;
  }

  return `
    <div class="tabela-wrap">

      <table>

        <thead>
          <tr>
            ${colunas.map(coluna => `<th>${coluna}</th>`).join("")}
          </tr>
        </thead>

        <tbody>
          ${linhas.join("")}
        </tbody>

      </table>

    </div>
  `;
}

function formularioVeiculo(item = {}) {
  return `
    <form class="formulario" data-form="veiculos">

      <h2>
        ${item.id ? "Editar veículo" : "Novo veículo"}
      </h2>

      <div class="campos">

        <div class="campo">
          <label for="nome-veiculo">Nome do veículo</label>

          <input
            id="nome-veiculo"
            name="nome"
            required
            maxlength="70"
            value="${escapar(item.nome)}"
            placeholder="Ex.: Fiat Argo"
          >
        </div>

        <div class="campo">
          <label for="ano-veiculo">Ano</label>

          <input
            id="ano-veiculo"
            name="ano"
            type="number"
            min="1900"
            max="2100"
            required
            value="${escapar(item.ano)}"
            placeholder="2024"
          >
        </div>

        <div class="campo">
          <label for="preco-veiculo">Preço (R$)</label>

          <input
            id="preco-veiculo"
            name="preco"
            type="number"
            min="0.01"
            step="0.01"
            required
            value="${escapar(item.preco)}"
            placeholder="55000"
          >
        </div>

        <div class="campo">
          <label for="status-veiculo">Situação</label>

          <select id="status-veiculo" name="status">

            <option ${
              item.status !== "Reservado" && item.status !== "Vendido"
                ? "selected"
                : ""
            }>
              Disponível
            </option>

            <option ${item.status === "Reservado" ? "selected" : ""}>
              Reservado
            </option>

            <option ${item.status === "Vendido" ? "selected" : ""}>
              Vendido
            </option>

          </select>
        </div>

      </div>

      <div class="form-acoes">

        <button class="botao" type="submit">
          Salvar
        </button>

        <button class="botao secundario" type="button" data-cancelar>
          Cancelar
        </button>

      </div>

    </form>
  `;
}

function formularioCliente(item = {}) {
  return `
    <form class="formulario" data-form="clientes">

      <h2>
        ${item.id ? "Editar cliente" : "Novo cliente"}
      </h2>

      <div class="campos">

        <div class="campo">
          <label for="nome-cliente">Nome</label>

          <input
            id="nome-cliente"
            name="nome"
            required
            maxlength="80"
            value="${escapar(item.nome)}"
            placeholder="Nome completo"
          >
        </div>

        <div class="campo">
          <label for="telefone-cliente">Telefone</label>

          <input
            id="telefone-cliente"
            name="telefone"
            required
            maxlength="25"
            value="${escapar(item.telefone)}"
            placeholder="(00) 00000-0000"
          >
        </div>

        <div class="campo">
          <label for="email-cliente">E-mail (opcional)</label>

          <input
            id="email-cliente"
            name="email"
            type="email"
            maxlength="100"
            value="${escapar(item.email)}"
            placeholder="cliente@email.com"
          >
        </div>

      </div>

      <div class="form-acoes">

        <button class="botao" type="submit">
          Salvar
        </button>

        <button class="botao secundario" type="button" data-cancelar>
          Cancelar
        </button>

      </div>

    </form>
  `;
}

function paginaVeiculos() {
  const termo = busca.toLowerCase();

  const lista = dados.veiculos.filter(veiculo => {
    const texto = `${veiculo.nome} ${veiculo.ano} ${veiculo.status}`;

    return texto.toLowerCase().includes(termo);
  });

  const linhas = lista.map(veiculo => `
    <tr>

      <td>${escapar(veiculo.nome)}</td>
      <td>${escapar(veiculo.ano)}</td>
      <td>${moeda(veiculo.preco)}</td>
      <td>${escapar(veiculo.status)}</td>

      <td>
        <div class="acoes-linha">

          <button
            class="botao secundario pequeno"
            data-editar="veiculos"
            data-id="${escapar(veiculo.id)}"
            type="button"
          >
            Editar
          </button>

          <button
            class="botao perigo pequeno"
            data-excluir="veiculos"
            data-id="${escapar(veiculo.id)}"
            type="button"
          >
            Excluir
          </button>

        </div>
      </td>

    </tr>
  `);

  const item = dados.veiculos.find(
    veiculo => veiculo.id === edicao?.id
  );

  return `
    ${cabecalho(
      "Veículos",
      "Cadastre e organize os veículos da loja.",
      "veiculos"
    )}

    ${edicao ? formularioVeiculo(item) : ""}

    <div class="barra-ferramentas">
      <input
        class="pesquisa"
        data-busca
        placeholder="Pesquisar veículo..."
        value="${escapar(busca)}"
      >
    </div>

    ${tabela(
      linhas,
      ["Veículo", "Ano", "Preço", "Situação", "Ações"],
      "Nenhum veículo cadastrado ainda."
    )}
  `;
}

function paginaClientes() {
  const termo = busca.toLowerCase();

  const lista = dados.clientes.filter(cliente => {
    const texto = `${cliente.nome} ${cliente.telefone} ${cliente.email}`;

    return texto.toLowerCase().includes(termo);
  });

  const linhas = lista.map(cliente => `
    <tr>

      <td>${escapar(cliente.nome)}</td>
      <td>${escapar(cliente.telefone)}</td>
      <td>${escapar(cliente.email || "—")}</td>

      <td>
        <div class="acoes-linha">

          <button
            class="botao secundario pequeno"
            data-editar="clientes"
            data-id="${escapar(cliente.id)}"
            type="button"
          >
            Editar
          </button>

          <button
            class="botao perigo pequeno"
            data-excluir="clientes"
            data-id="${escapar(cliente.id)}"
            type="button"
          >
            Excluir
          </button>

        </div>
      </td>

    </tr>
  `);

  const item = dados.clientes.find(
    cliente => cliente.id === edicao?.id
  );

  return `
    ${cabecalho(
      "Clientes",
      "Mantenha os contatos dos seus clientes.",
      "clientes"
    )}

    ${edicao ? formularioCliente(item) : ""}

    <div class="barra-ferramentas">
      <input
        class="pesquisa"
        data-busca
        placeholder="Pesquisar cliente..."
        value="${escapar(busca)}"
      >
    </div>

    ${tabela(
      linhas,
      ["Nome", "Telefone", "E-mail", "Ações"],
      "Nenhum cliente cadastrado ainda."
    )}
  `;
}

function formularioVenda() {
  const clientes = dados.clientes;

  const veiculos = dados.veiculos.filter(
    veiculo => veiculo.status === "Disponível"
  );

  if (!clientes.length || !veiculos.length) {
    return `
      <div class="formulario">

        <p>
          Para registrar uma venda, cadastre pelo menos
          um cliente e um veículo disponível.
        </p>

        <button class="botao secundario" data-cancelar type="button">
          Fechar
        </button>

      </div>
    `;
  }

  return `
    <form class="formulario" data-form="vendas">

      <h2>Nova venda</h2>

      <div class="campos">

        <div class="campo">
          <label for="cliente-venda">Cliente</label>

          <select id="cliente-venda" name="clienteId" required>
            ${clientes.map(cliente => `
              <option value="${escapar(cliente.id)}">
                ${escapar(cliente.nome)}
              </option>
            `).join("")}
          </select>
        </div>

        <div class="campo">
          <label for="veiculo-venda">Veículo</label>

          <select id="veiculo-venda" name="veiculoId" required>
            ${veiculos.map(veiculo => `
              <option value="${escapar(veiculo.id)}">
                ${escapar(veiculo.nome)} — ${moeda(veiculo.preco)}
              </option>
            `).join("")}
          </select>
        </div>

        <div class="campo">
          <label for="valor-venda">Valor da venda (R$)</label>

          <input
            id="valor-venda"
            name="valor"
            type="number"
            min="0.01"
            step="0.01"
            required
            placeholder="Valor negociado"
          >
        </div>

        <div class="campo">
          <label for="data-venda">Data</label>

          <input
            id="data-venda"
            name="data"
            type="date"
            required
            value="${dataHoje()}"
          >
        </div>

      </div>

      <div class="form-acoes">

        <button class="botao" type="submit">
          Registrar venda
        </button>

        <button class="botao secundario" type="button" data-cancelar>
          Cancelar
        </button>

      </div>

    </form>
  `;
}

function paginaVendas() {
  const termo = busca.toLowerCase();

  const lista = dados.vendas.filter(venda => {
    const texto = `
      ${venda.clienteNome}
      ${venda.veiculoNome}
      ${venda.data}
    `;

    return texto.toLowerCase().includes(termo);
  });

  const linhas = lista.map(venda => `
    <tr>

      <td>${escapar(venda.clienteNome || "Cliente removido")}</td>
      <td>${escapar(venda.veiculoNome || "Veículo removido")}</td>
      <td>${moeda(venda.valor)}</td>
      <td>${escapar(venda.data)}</td>

      <td>
        <button
          class="botao perigo pequeno"
          data-excluir="vendas"
          data-id="${escapar(venda.id)}"
          type="button"
        >
          Excluir
        </button>
      </td>

    </tr>
  `);

  const total = dados.vendas.reduce(
    (soma, venda) => soma + Number(venda.valor || 0),
    0
  );

  return `
    ${cabecalho(
      "Vendas",
      "Registre as vendas realizadas pela loja.",
      "vendas"
    )}

    ${edicao ? formularioVenda() : ""}

    <section class="resumos">

      <div class="resumo">
        <span>Vendas registradas</span>
        <strong>${dados.vendas.length}</strong>
      </div>

      <div class="resumo">
        <span>Total vendido</span>
        <strong>${moeda(total)}</strong>
      </div>

    </section>

    <div class="barra-ferramentas">
      <input
        class="pesquisa"
        data-busca
        placeholder="Pesquisar venda..."
        value="${escapar(busca)}"
      >
    </div>

    ${tabela(
      linhas,
      ["Cliente", "Veículo", "Valor", "Data", "Ações"],
      "Nenhuma venda registrada ainda."
    )}
  `;
}

function renderizar() {
  const paginas = {
    inicio,
    veiculos: paginaVeiculos,
    clientes: paginaClientes,
    vendas: paginaVendas
  };

  app.innerHTML = (paginas[pagina] || inicio)();
}

async function salvarRegistro(tabela, registro, id) {
  let consulta = banco.from(tabela);

  if (id) {
    consulta = consulta.update(registro).eq("id", id);
  } else {
    consulta = consulta.insert(registro);
  }

  const { error } = await consulta;

  if (error) throw error;
}

async function excluirRegistro(tipo, id) {
  const nomes = {
    veiculos: "este veículo",
    clientes: "este cliente",
    vendas: "esta venda"
  };

  if (!confirm(`Deseja excluir ${nomes[tipo]}?`)) return;

  if (
    tipo === "veiculos" &&
    dados.vendas.some(venda => venda.veiculoId === id)
  ) {
    alert("Este veículo possui uma venda registrada. Exclua a venda primeiro.");
    return;
  }

  if (
    tipo === "clientes" &&
    dados.vendas.some(venda => venda.clienteId === id)
  ) {
    alert("Este cliente possui uma venda registrada. Exclua a venda primeiro.");
    return;
  }

  try {
    const { error } = await banco
      .from(tabelasBanco[tipo])
      .delete()
      .eq("id", id);

    if (error) throw error;

    await carregarDados();
    renderizar();
  } catch (erro) {
    alert(
      `Não foi possível excluir o registro. ${mensagemErro(erro)}`
    );
  }
}

menu.addEventListener("click", evento => {
  const aba = evento.target.closest("[data-page]");

  if (aba) {
    abrirPagina(aba.dataset.page);
  }
});

autenticacao.addEventListener("click", evento => {
  const botao = evento.target.closest("[data-modo-auth]");

  if (!botao) return;

  modoAutenticacao = botao.dataset.modoAuth;

  renderizarAutenticacao();
});

autenticacao.addEventListener("submit", async evento => {
  const formulario = evento.target.closest("#form-autenticacao");

  if (!formulario) return;

  evento.preventDefault();

  const botao = formulario.querySelector('button[type="submit"]');
  const form = new FormData(formulario);

  const email = String(form.get("email")).trim();
  const senha = String(form.get("senha"));

  botao.disabled = true;
  botao.textContent = "Aguarde...";

  try {
    if (modoAutenticacao === "criar") {
      const { data, error } = await banco.auth.signUp({
        email,
        password: senha,
        options: {
          emailRedirectTo: window.location.origin
        }
      });

      if (error) throw error;

      if (!data.session) {
        modoAutenticacao = "entrar";

        renderizarAutenticacao(
          "Conta criada. Confira seu e-mail para confirmar o cadastro e depois faça login."
        );

        return;
      }

      await entrar(data.user);

      return;
    }

    const { data, error } = await banco.auth.signInWithPassword({
      email,
      password: senha
    });

    if (error) throw error;

    await entrar(data.user);

  } catch (erro) {
    modoAutenticacao = "entrar";

    renderizarAutenticacao(mensagemErro(erro));
  }
});

botaoSair.addEventListener("click", async () => {
  const { error } = await banco.auth.signOut();

  if (error) {
    alert(`Não foi possível sair da conta. ${mensagemErro(error)}`);
  }
});

app.addEventListener("click", evento => {
  const ir = evento.target.closest("[data-ir]");

  if (ir) {
    abrirPagina(ir.dataset.ir);
    return;
  }

  const novo = evento.target.closest("[data-novo]");

  if (novo) {
    edicao = {
      tipo: novo.dataset.novo,
      id: null
    };

    renderizar();
    return;
  }

  if (evento.target.closest("[data-cancelar]")) {
    edicao = null;
    renderizar();
    return;
  }

  const editar = evento.target.closest("[data-editar]");

  if (editar) {
    edicao = {
      tipo: editar.dataset.editar,
      id: editar.dataset.id
    };

    renderizar();
    return;
  }

  const excluir = evento.target.closest("[data-excluir]");

  if (excluir) {
    void excluirRegistro(
      excluir.dataset.excluir,
      excluir.dataset.id
    );
  }
});

app.addEventListener("input", evento => {
  if (!evento.target.matches("[data-busca]")) return;

  const campo = evento.target;
  const posicao = campo.selectionStart;

  busca = campo.value;

  renderizar();

  const novoCampo = app.querySelector("[data-busca]");

  novoCampo?.focus();
  novoCampo?.setSelectionRange(posicao, posicao);
});

app.addEventListener("submit", async evento => {
  const formulario = evento.target.closest("[data-form]");

  if (!formulario) return;

  evento.preventDefault();

  const tipo = formulario.dataset.form;
  const form = new FormData(formulario);

  const botao = formulario.querySelector('button[type="submit"]');

  botao.disabled = true;
  botao.textContent = "Salvando...";

  try {
    if (tipo === "veiculos") {
      const registro = {
        name: String(form.get("nome")).trim(),
        year: Number(form.get("ano")),
        price: Number(form.get("preco")),
        status: String(form.get("status"))
      };

      if (
        !registro.name ||
        registro.year < 1900 ||
        registro.year > 2100 ||
        registro.price <= 0
      ) {
        throw new Error("Confira os dados do veículo.");
      }

      await salvarRegistro(
        "vehicles",
        registro,
        edicao?.tipo === "veiculos" ? edicao.id : null
      );
    }

    if (tipo === "clientes") {
      const registro = {
        name: String(form.get("nome")).trim(),
        phone: String(form.get("telefone")).trim(),
        email: String(form.get("email")).trim() || null
      };

      if (!registro.name || !registro.phone) {
        throw new Error("Informe o nome e o telefone do cliente.");
      }

      await salvarRegistro(
        "clients",
        registro,
        edicao?.tipo === "clientes" ? edicao.id : null
      );
    }

    if (tipo === "vendas") {
      const cliente = dados.clientes.find(
        item => item.id === form.get("clienteId")
      );

      const veiculo = dados.veiculos.find(
        item => item.id === form.get("veiculoId")
      );

      const valor = Number(form.get("valor"));

      if (
        !cliente ||
        !veiculo ||
        veiculo.status !== "Disponível" ||
        valor <= 0
      ) {
        throw new Error("Confira os dados da venda e tente novamente.");
      }

      const venda = {
        client_id: cliente.id,
        vehicle_id: veiculo.id,
        client_name: cliente.nome,
        vehicle_name: veiculo.nome,
        amount: valor,
        sold_at: String(form.get("data"))
      };

      const { error } = await banco
        .from("sales")
        .insert(venda);

      if (error) throw error;
    }

    edicao = null;

    await carregarDados();

    renderizar();

  } catch (erro) {
    alert(`Não foi possível salvar. ${mensagemErro(erro)}`);

    botao.disabled = false;

    botao.textContent = tipo === "vendas"
      ? "Registrar venda"
      : "Salvar";
  }
});

void iniciarAplicacao();
