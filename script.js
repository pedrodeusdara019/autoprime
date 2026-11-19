
// ==================================
// DADOS DO SISTEMA
// ==================================

let veiculos = JSON.parse(localStorage.getItem("veiculos")) || [
    { nome: "Toyota Corolla", ano: 2023, preco: 145000, status: "Disponível" },
    { nome: "Honda Civic", ano: 2022, preco: 130000, status: "Disponível" },
    { nome: "Hyundai HB20", ano: 2024, preco: 85000, status: "Reservado" },
    { nome: "Jeep Renegade", ano: 2023, preco: 120000, status: "Vendido" }
];

let clientes = JSON.parse(localStorage.getItem("clientes")) || [
    {
        nome: "Carlos Silva",
        cpf: "123.456.789-00",
        email: "carlos@email.com",
        telefone: "(86) 99999-1111"
    },
    {
        nome: "Maria Oliveira",
        cpf: "987.654.321-00",
        email: "maria@email.com",
        telefone: "(86) 98888-2222"
    }
];

let vendas = JSON.parse(localStorage.getItem("vendas")) || [];

let paginaAtual = "inicio";
let pesquisaAtual = "";

// ==================================
// SALVAR DADOS
// ==================================

function salvar() {
    localStorage.setItem("veiculos", JSON.stringify(veiculos));
    localStorage.setItem("clientes", JSON.stringify(clientes));
    localStorage.setItem("vendas", JSON.stringify(vendas));
}

function dinheiro(valor) {
    return Number(valor).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}

// ==================================
// NAVEGAÇÃO
// ==================================

function mostrarPagina(pagina) {
    paginaAtual = pagina;
    pesquisaAtual = "";

    if (pagina === "inicio") mostrarInicio();
    if (pagina === "veiculos") mostrarVeiculos();
    if (pagina === "clientes") mostrarClientes();
    if (pagina === "vendas") mostrarVendas();
}

// ==================================
// INÍCIO
// ==================================

function mostrarInicio() {
    document.getElementById("conteudo").innerHTML = `
        <h2>Painel principal</h2>

        <div class="cards">
            <div class="card">
                <h3>Total de veículos</h3>
                <p>${veiculos.length}</p>
            </div>

            <div class="card">
                <h3>Em estoque</h3>
                <p>${veiculos.filter(v => v.status !== "Vendido").length}</p>
            </div>

            <div class="card">
                <h3>Clientes</h3>
                <p>${clientes.length}</p>
            </div>

            <div class="card">
                <h3>Vendas</h3>
                <p>${vendas.length}</p>
            </div>
        </div>

        <h2>Veículos registrados</h2>
        ${tabelaVeiculos(veiculos, false)}

        <h2>Clientes registrados</h2>
        ${tabelaClientes(clientes, false)}

        <h2>Vendas registradas</h2>
        ${tabelaVendas(vendas, false)}
    `;
}

// ==================================
// VEÍCULOS
// ==================================

function tabelaVeiculos(lista, acoes = true) {
    if (lista.length === 0) return "<p>Nenhum veículo cadastrado.</p>";

    return `
        <div class="tabela-container">
            <table>
                <tr>
                    <th>Veículo</th>
                    <th>Ano</th>
                    <th>Preço</th>
                    <th>Situação</th>
                    ${acoes ? "<th>Ações</th>" : ""}
                </tr>

                ${lista.map(v => {
                    let i = veiculos.indexOf(v);

                    return `
                        <tr>
                            <td>${v.nome}</td>
                            <td>${v.ano}</td>
                            <td>${dinheiro(v.preco)}</td>
                            <td class="status ${v.status === "Disponível" ? "disponivel" : v.status === "Vendido" ? "vendido" : "reservado"}">
                                ${v.status}
                            </td>

                            ${acoes ? `
                                <td>
                                    <button class="editar" onclick="formVeiculo(${i})">Editar</button>
                                    <button class="excluir" onclick="excluirVeiculo(${i})">Excluir</button>
                                </td>
                            ` : ""}
                        </tr>
                    `;
                }).join("")}
            </table>
        </div>
    `;
}

function mostrarVeiculos() {
    let filtrados = veiculos.filter(v =>
        `${v.nome} ${v.ano} ${v.preco} ${v.status}`
            .toLowerCase()
            .includes(pesquisaAtual.toLowerCase())
    );

    document.getElementById("conteudo").innerHTML = `
        <h2>Gerenciamento de veículos</h2>

        <button class="acao" onclick="formVeiculo()">+ Cadastrar veículo</button>

        <input class="pesquisa"
            placeholder="Pesquisar veículo, ano, preço ou situação..."
            value="${pesquisaAtual}"
            oninput="pesquisarVeiculo(this.value)">

        <div id="formArea"></div>

        <div id="tabelaVeiculos">
            ${tabelaVeiculos(filtrados)}
        </div>
    `;
}

function pesquisarVeiculo(valor) {
    pesquisaAtual = valor;

    let filtrados = veiculos.filter(v =>
        `${v.nome} ${v.ano} ${v.preco} ${v.status}`
            .toLowerCase()
            .includes(valor.toLowerCase())
    );

    document.getElementById("tabelaVeiculos").innerHTML =
        tabelaVeiculos(filtrados);
}

function formVeiculo(indice = -1) {
    let v = indice >= 0 ? veiculos[indice] : {
        nome: "",
        ano: "",
        preco: "",
        status: "Disponível"
    };

    document.getElementById("formArea").innerHTML = `
        <div class="formulario">
            <h3>${indice >= 0 ? "Editar veículo" : "Cadastrar veículo"}</h3>

            <label>Nome do veículo</label>
            <input id="nomeVeiculo" value="${v.nome}">

            <label>Ano</label>
            <input id="anoVeiculo" type="number" value="${v.ano}">

            <label>Preço</label>
            <input id="precoVeiculo" type="number" value="${v.preco}">

            <label>Situação</label>
            <select id="statusVeiculo">
                <option ${v.status === "Disponível" ? "selected" : ""}>Disponível</option>
                <option ${v.status === "Reservado" ? "selected" : ""}>Reservado</option>
                <option ${v.status === "Vendido" ? "selected" : ""}>Vendido</option>
            </select>

            <button class="acao" onclick="salvarVeiculo(${indice})">Salvar</button>
            <button class="excluir" onclick="mostrarPagina('veiculos')">Cancelar</button>
        </div>
    `;
}

function salvarVeiculo(indice) {
    let nome = document.getElementById("nomeVeiculo").value.trim();
    let ano = Number(document.getElementById("anoVeiculo").value);
    let preco = Number(document.getElementById("precoVeiculo").value);
    let status = document.getElementById("statusVeiculo").value;

    if (!nome || !ano || ano < 1900 || !preco || preco <= 0) {
        alert("Preencha corretamente todos os campos!");
        return;
    }

    let veiculo = { nome, ano, preco, status };

    if (indice >= 0) {
        veiculos[indice] = veiculo;
    } else {
        veiculos.push(veiculo);
    }

    salvar();
    mostrarPagina("veiculos");
}

function excluirVeiculo(indice) {
    if (confirm("Deseja excluir este veículo?")) {
        if (vendas.some(v => v.veiculoId === indice)) {
            alert("Este veículo possui uma venda registrada. Exclua a venda primeiro.");
            return;
        }

        veiculos.splice(indice, 1);
        salvar();
        mostrarPagina("veiculos");
    }
}

// ==================================
// CLIENTES
// ==================================

function tabelaClientes(lista, acoes = true) {
    if (lista.length === 0) return "<p>Nenhum cliente cadastrado.</p>";

    return `
        <div class="tabela-container">
            <table>
                <tr>
                    <th>Nome</th>
                    <th>CPF</th>
                    <th>E-mail</th>
                    <th>Telefone</th>
                    ${acoes ? "<th>Ações</th>" : ""}
                </tr>

                ${lista.map(c => {
                    let i = clientes.indexOf(c);

                    return `
                        <tr>
                            <td>${c.nome}</td>
                            <td>${c.cpf || "Não informado"}</td>
                            <td>${c.email || "Não informado"}</td>
                            <td>${c.telefone}</td>

                            ${acoes ? `
                                <td>
                                    <button class="editar" onclick="formCliente(${i})">Editar</button>
                                    <button class="excluir" onclick="excluirCliente(${i})">Excluir</button>
                                </td>
                            ` : ""}
                        </tr>
                    `;
                }).join("")}
            </table>
        </div>
    `;
}

function mostrarClientes() {
    let filtrados = clientes.filter(c =>
        `${c.nome} ${c.cpf || ""} ${c.email || ""} ${c.telefone}`
            .toLowerCase()
            .includes(pesquisaAtual.toLowerCase())
    );

    document.getElementById("conteudo").innerHTML = `
        <h2>Gerenciamento de clientes</h2>

        <button class="acao" onclick="formCliente()">+ Cadastrar cliente</button>

        <input class="pesquisa"
            placeholder="Pesquisar por nome, CPF, e-mail ou telefone..."
            value="${pesquisaAtual}"
            oninput="pesquisarCliente(this.value)">

        <div id="formArea"></div>

        <div id="tabelaClientes">
            ${tabelaClientes(filtrados)}
        </div>
    `;
}

function pesquisarCliente(valor) {
    pesquisaAtual = valor;

    let filtrados = clientes.filter(c =>
        `${c.nome} ${c.cpf || ""} ${c.email || ""} ${c.telefone}`
            .toLowerCase()
            .includes(valor.toLowerCase())
    );

    document.getElementById("tabelaClientes").innerHTML =
        tabelaClientes(filtrados);
}

function formCliente(indice = -1) {
    let c = indice >= 0 ? clientes[indice] : {
        nome: "",
        cpf: "",
        email: "",
        telefone: ""
    };

    document.getElementById("formArea").innerHTML = `
        <div class="formulario">
            <h3>${indice >= 0 ? "Editar cliente" : "Cadastrar cliente"}</h3>

            <label>Nome completo</label>
            <input id="nomeCliente" value="${c.nome}" placeholder="Nome do cliente">

            <label>CPF</label>
            <input id="cpfCliente" value="${c.cpf || ""}" placeholder="000.000.000-00">

            <label>E-mail</label>
            <input id="emailCliente" type="email" value="${c.email || ""}" placeholder="exemplo@email.com">

            <label>Telefone</label>
            <input id="telefoneCliente" value="${c.telefone}" placeholder="Telefone">

            <button class="acao" onclick="salvarCliente(${indice})">Salvar</button>
            <button class="excluir" onclick="mostrarPagina('clientes')">Cancelar</button>
        </div>
    `;
}

function salvarCliente(indice) {
    let nome = document.getElementById("nomeCliente").value.trim();
    let cpf = document.getElementById("cpfCliente").value.trim();
    let email = document.getElementById("emailCliente").value.trim();
    let telefone = document.getElementById("telefoneCliente").value.trim();

    if (!nome || !cpf || !email || !telefone) {
        alert("Preencha todos os campos do cliente!");
        return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        alert("Digite um e-mail válido!");
        return;
    }

    let cpfNumeros = cpf.replace(/\D/g, "");

    if (cpfNumeros.length !== 11) {
        alert("Digite um CPF com 11 números!");
        return;
    }

    let cpfJaExiste = clientes.some((c, i) =>
        c.cpf && c.cpf.replace(/\D/g, "") === cpfNumeros && i !== indice
    );

    if (cpfJaExiste) {
        alert("Este CPF já está cadastrado!");
        return;
    }

    let cliente = { nome, cpf, email, telefone };

    if (indice >= 0) {
        clientes[indice] = cliente;
    } else {
        clientes.push(cliente);
    }

    salvar();
    mostrarPagina("clientes");
}

function excluirCliente(indice) {
    if (confirm("Deseja excluir este cliente?")) {
        if (vendas.some(v => v.clienteId === indice)) {
            alert("Este cliente possui vendas registradas. Exclua as vendas primeiro.");
            return;
        }

        clientes.splice(indice, 1);
        salvar();
        mostrarPagina("clientes");
    }
}

// ==================================
// VENDAS
// ==================================

function tabelaVendas(lista, acoes = true) {
    if (lista.length === 0) {
        return "<p>Nenhuma venda registrada.</p>";
    }

    return `
        <div class="tabela-container">
            <table>
                <tr>
                    <th>Cliente</th>
                    <th>CPF</th>
                    <th>Veículo</th>
                    <th>Valor</th>
                    <th>Data</th>
                    ${acoes ? "<th>Ações</th>" : ""}
                </tr>

                ${lista.map(v => {
                    let i = vendas.indexOf(v);
                    let cliente = clientes[v.clienteId];

                    return `
                        <tr>
                            <td>${v.cliente || (cliente ? cliente.nome : "Não informado")}</td>
                            <td>${v.cpf || (cliente ? cliente.cpf : "Não informado") || "Não informado"}</td>
                            <td>${v.veiculo || "Não informado"}</td>
                            <td>${dinheiro(v.valor)}</td>
                            <td>${v.data || "Não informada"}</td>

                            ${acoes ? `
                                <td>
                                    <button class="editar" onclick="formVenda(${i})">Editar</button>
                                    <button class="excluir" onclick="excluirVenda(${i})">Excluir</button>
                                </td>
                            ` : ""}
                        </tr>
                    `;
                }).join("")}
            </table>
        </div>
    `;
}

function mostrarVendas() {
    let filtradas = vendas.filter(v =>
        `${v.cliente || ""} ${v.cpf || ""} ${v.veiculo || ""} ${v.valor} ${v.data || ""}`
            .toLowerCase()
            .includes(pesquisaAtual.toLowerCase())
    );

    document.getElementById("conteudo").innerHTML = `
        <h2>Gerenciamento de vendas</h2>

        <button class="acao" onclick="formVenda()">+ Registrar venda</button>

        <input class="pesquisa"
            placeholder="Pesquisar venda, cliente ou veículo..."
            value="${pesquisaAtual}"
            oninput="pesquisarVenda(this.value)">

        <div id="formArea"></div>

        <div class="cards">
            <div class="card">
                <h3>Total de vendas</h3>
                <p>${vendas.length}</p>
            </div>

            <div class="card">
                <h3>Valor total vendido</h3>
                <p>${dinheiro(vendas.reduce((total, v) => total + Number(v.valor), 0))}</p>
            </div>
        </div>

        <h3>Histórico de vendas registradas</h3>

        <div id="tabelaVendas">
            ${tabelaVendas(filtradas)}
        </div>
    `;
}

function pesquisarVenda(valor) {
    pesquisaAtual = valor;

    let filtradas = vendas.filter(v =>
        `${v.cliente || ""} ${v.cpf || ""} ${v.veiculo || ""} ${v.valor} ${v.data || ""}`
            .toLowerCase()
            .includes(valor.toLowerCase())
    );

    document.getElementById("tabelaVendas").innerHTML =
        tabelaVendas(filtradas);
}

// ==================================
// FORMULÁRIO DE VENDA
// ==================================

function formVenda(indice = -1) {
    if (clientes.length === 0) {
        alert("Cadastre pelo menos um cliente antes de registrar uma venda.");
        return;
    }

    let venda = indice >= 0 ? vendas[indice] : null;

    let veiculosDisponiveis = veiculos
        .map((v, i) => ({ ...v, indice: i }))
        .filter(v => v.status === "Disponível" || (venda && v.indice === venda.veiculoId));

    if (veiculosDisponiveis.length === 0 && indice < 0) {
        alert("Não há veículos disponíveis em estoque!");
        return;
    }

    document.getElementById("formArea").innerHTML = `
        <div class="formulario">
            <h3>${indice >= 0 ? "Editar venda" : "Registrar venda"}</h3>

            <label>Cliente</label>
            <select id="clienteVenda">
                ${clientes.map((c, i) => `
                    <option value="${i}" ${venda && venda.clienteId === i ? "selected" : ""}>
                        ${c.nome} - ${c.cpf || "Sem CPF"}
                    </option>
                `).join("")}
            </select>

            <label>Veículo</label>
            <select id="veiculoVenda" ${indice >= 0 ? "disabled" : ""}>
                ${veiculosDisponiveis.map(v => `
                    <option value="${v.indice}" ${venda && venda.veiculoId === v.indice ? "selected" : ""}>
                        ${v.nome} - ${dinheiro(v.preco)}
                    </option>
                `).join("")}
            </select>

            <label>Valor da venda</label>
            <input id="valorVenda" type="number" min="1"
                value="${venda ? venda.valor : veiculosDisponiveis[0].preco}">

            <label>Data da venda</label>
            <input id="dataVenda" type="date"
                value="${venda ? venda.data : new Date().toISOString().slice(0, 10)}">

            <button class="acao" onclick="salvarVenda(${indice})">Salvar venda</button>
            <button class="excluir" onclick="mostrarPagina('vendas')">Cancelar</button>
        </div>
    `;
}

function salvarVenda(indice) {
    let clienteId = Number(document.getElementById("clienteVenda").value);
    let veiculoId = indice >= 0
        ? vendas[indice].veiculoId
        : Number(document.getElementById("veiculoVenda").value);

    let valor = Number(document.getElementById("valorVenda").value);
    let data = document.getElementById("dataVenda").value;

    let cliente = clientes[clienteId];
    let veiculo = veiculos[veiculoId];

    if (!cliente || !veiculo || !valor || valor <= 0 || !data) {
        alert("Preencha corretamente os dados da venda!");
        return;
    }

    if (indice < 0 && veiculo.status !== "Disponível") {
        alert("Este veículo não está mais disponível!");
        return;
    }

    let registro = {
        clienteId,
        veiculoId,
        cliente: cliente.nome,
        cpf: cliente.cpf,
        veiculo: veiculo.nome,
        valor,
        data
    };

    if (indice >= 0) {
        vendas[indice] = registro;
    } else {
        vendas.push(registro);
        veiculo.status = "Vendido";
    }

    salvar();
    mostrarPagina("vendas");
}

// ==================================
// EDITAR E EXCLUIR VENDAS
// ==================================

function excluirVenda(indice) {
    if (confirm("Deseja realmente excluir esta venda?")) {
        let venda = vendas[indice];

        // Devolve o veículo ao estoque
        if (venda.veiculoId !== undefined && veiculos[venda.veiculoId]) {
            veiculos[venda.veiculoId].status = "Disponível";
        }

        vendas.splice(indice, 1);

        salvar();
        mostrarPagina("vendas");
    }
}

// ==================================
// INICIAR SISTEMA
// ==================================

salvar();
mostrarPagina("inicio");
