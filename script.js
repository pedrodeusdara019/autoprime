const CHAVES = {
  veiculos: 'autoprime_v2_veiculos',
  clientes: 'autoprime_v2_clientes',
  vendas: 'autoprime_v2_vendas'
};

function carregar(chave) {
  try { return JSON.parse(localStorage.getItem(chave)) || []; }
  catch { return []; }
}

const dados = {
  veiculos: carregar(CHAVES.veiculos),
  clientes: carregar(CHAVES.clientes),
  vendas: carregar(CHAVES.vendas)
};

const app = document.querySelector('#app');
let pagina = 'inicio';
let edicao = null;
let busca = '';

const escapar = valor => String(valor ?? '').replace(/[&<>"']/g, letra => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[letra]));
const moeda = valor => Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const idNovo = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`);
const dataHoje = () => {
  const agora = new Date();
  return `${agora.getFullYear()}-${String(agora.getMonth()+1).padStart(2,'0')}-${String(agora.getDate()).padStart(2,'0')}`;
};

function salvar() {
  Object.entries(CHAVES).forEach(([tipo, chave]) => localStorage.setItem(chave, JSON.stringify(dados[tipo])));
}

function abrirPagina(nome) {
  pagina = nome;
  edicao = null;
  busca = '';
  document.querySelectorAll('.aba').forEach(aba => aba.classList.toggle('ativa', aba.dataset.page === nome));
  renderizar();
}

function inicio() {
  return `
    <section class="introducao">
      <h1>Bem-vindo ao AutoPrime</h1>
      <p>Cadastre seus veículos e clientes e acompanhe suas vendas por aqui.</p>
    </section>
    <section class="resumos">
      <div class="resumo"><span>Veículos cadastrados</span><strong>${dados.veiculos.length}</strong></div>
      <div class="resumo"><span>Clientes cadastrados</span><strong>${dados.clientes.length}</strong></div>
      <div class="resumo"><span>Vendas realizadas</span><strong>${dados.vendas.length}</strong></div>
    </section>
    <section class="painel">
      <h2>Comece por aqui</h2>
      <p>Seu sistema está pronto. Os cadastros começam vazios: adicione apenas as informações da sua loja.</p>
      <div class="acoes-inicio">
        <button class="botao" data-ir="veiculos">Cadastrar veículo</button>
        <button class="botao secundario" data-ir="clientes">Cadastrar cliente</button>
        <button class="botao secundario" data-ir="vendas">Registrar venda</button>
      </div>
    </section>`;
}

function cabecalho(titulo, descricao, tipo) {
  return `<div class="cabecalho-pagina"><div><h1>${titulo}</h1><p>${descricao}</p></div><button class="botao" data-novo="${tipo}">+ Adicionar</button></div>`;
}

function tabela(linhas, colunas, vazio) {
  if (!linhas.length) return `<div class="vazio">${vazio}</div>`;
  return `<div class="tabela-wrap"><table><thead><tr>${colunas.map(coluna => `<th>${coluna}</th>`).join('')}</tr></thead><tbody>${linhas.join('')}</tbody></table></div>`;
}

function formularioVeiculo(item = {}) {
  return `<form class="formulario" data-form="veiculos">
    <h2>${item.id ? 'Editar veículo' : 'Novo veículo'}</h2>
    <div class="campos">
      <div class="campo"><label for="nome">Nome do veículo</label><input id="nome" name="nome" required maxlength="70" value="${escapar(item.nome)}" placeholder="Ex.: Fiat Argo"></div>
      <div class="campo"><label for="ano">Ano</label><input id="ano" name="ano" type="number" min="1900" max="2100" required value="${escapar(item.ano)}" placeholder="2024"></div>
      <div class="campo"><label for="preco">Preço (R$)</label><input id="preco" name="preco" type="number" min="0.01" step="0.01" required value="${escapar(item.preco)}" placeholder="55000"></div>
      <div class="campo"><label for="status">Situação</label><select id="status" name="status"><option ${item.status !== 'Reservado' && item.status !== 'Vendido' ? 'selected' : ''}>Disponível</option><option ${item.status === 'Reservado' ? 'selected' : ''}>Reservado</option><option ${item.status === 'Vendido' ? 'selected' : ''}>Vendido</option></select></div>
    </div>
    <div class="form-acoes"><button class="botao" type="submit">Salvar</button><button class="botao secundario" type="button" data-cancelar>Cancelar</button></div>
  </form>`;
}

function formularioCliente(item = {}) {
  return `<form class="formulario" data-form="clientes">
    <h2>${item.id ? 'Editar cliente' : 'Novo cliente'}</h2>
    <div class="campos">
      <div class="campo"><label for="nome">Nome</label><input id="nome" name="nome" required maxlength="80" value="${escapar(item.nome)}" placeholder="Nome completo"></div>
      <div class="campo"><label for="telefone">Telefone</label><input id="telefone" name="telefone" required maxlength="25" value="${escapar(item.telefone)}" placeholder="(00) 00000-0000"></div>
      <div class="campo"><label for="email">E-mail (opcional)</label><input id="email" name="email" type="email" maxlength="100" value="${escapar(item.email)}" placeholder="cliente@email.com"></div>
    </div>
    <div class="form-acoes"><button class="botao" type="submit">Salvar</button><button class="botao secundario" type="button" data-cancelar>Cancelar</button></div>
  </form>`;
}

function paginaVeiculos() {
  const lista = dados.veiculos.filter(v => `${v.nome} ${v.ano} ${v.status}`.toLowerCase().includes(busca.toLowerCase()));
  const linhas = lista.map(v => `<tr><td>${escapar(v.nome)}</td><td>${escapar(v.ano)}</td><td>${moeda(v.preco)}</td><td>${escapar(v.status)}</td><td><div class="acoes-linha"><button class="botao secundario pequeno" data-editar="veiculos" data-id="${escapar(v.id)}">Editar</button><button class="botao perigo pequeno" data-excluir="veiculos" data-id="${escapar(v.id)}">Excluir</button></div></td></tr>`);
  const item = dados.veiculos.find(v => v.id === edicao?.id);
  return `${cabecalho('Veículos', 'Cadastre e organize os veículos da loja.', 'veiculos')}${edicao ? formularioVeiculo(item) : ''}<div class="barra-ferramentas"><input class="pesquisa" data-busca placeholder="Pesquisar veículo..." value="${escapar(busca)}"></div>${tabela(linhas, ['Veículo','Ano','Preço','Situação','Ações'], 'Nenhum veículo cadastrado ainda.')}`;
}

function paginaClientes() {
  const lista = dados.clientes.filter(c => `${c.nome} ${c.telefone} ${c.email}`.toLowerCase().includes(busca.toLowerCase()));
  const linhas = lista.map(c => `<tr><td>${escapar(c.nome)}</td><td>${escapar(c.telefone)}</td><td>${escapar(c.email || '—')}</td><td><div class="acoes-linha"><button class="botao secundario pequeno" data-editar="clientes" data-id="${escapar(c.id)}">Editar</button><button class="botao perigo pequeno" data-excluir="clientes" data-id="${escapar(c.id)}">Excluir</button></div></td></tr>`);
  const item = dados.clientes.find(c => c.id === edicao?.id);
  return `${cabecalho('Clientes', 'Mantenha os contatos dos seus clientes.', 'clientes')}${edicao ? formularioCliente(item) : ''}<div class="barra-ferramentas"><input class="pesquisa" data-busca placeholder="Pesquisar cliente..." value="${escapar(busca)}"></div>${tabela(linhas, ['Nome','Telefone','E-mail','Ações'], 'Nenhum cliente cadastrado ainda.')}`;
}

function formularioVenda() {
  const clientes = dados.clientes;
  const veiculos = dados.veiculos.filter(v => v.status === 'Disponível');
  if (!clientes.length || !veiculos.length) return `<div class="formulario"><p>Para registrar uma venda, cadastre pelo menos um cliente e um veículo disponível.</p><button class="botao secundario" data-cancelar>Fechar</button></div>`;
  return `<form class="formulario" data-form="vendas"><h2>Nova venda</h2><div class="campos">
    <div class="campo"><label for="clienteId">Cliente</label><select id="clienteId" name="clienteId" required>${clientes.map(c => `<option value="${escapar(c.id)}">${escapar(c.nome)}</option>`).join('')}</select></div>
    <div class="campo"><label for="veiculoId">Veículo</label><select id="veiculoId" name="veiculoId" required>${veiculos.map(v => `<option value="${escapar(v.id)}">${escapar(v.nome)} — ${moeda(v.preco)}</option>`).join('')}</select></div>
    <div class="campo"><label for="valor">Valor da venda (R$)</label><input id="valor" name="valor" type="number" min="0.01" step="0.01" required placeholder="Valor negociado"></div>
    <div class="campo"><label for="data">Data</label><input id="data" name="data" type="date" required value="${dataHoje()}"></div>
  </div><div class="form-acoes"><button class="botao" type="submit">Registrar venda</button><button class="botao secundario" type="button" data-cancelar>Cancelar</button></div></form>`;
}

function paginaVendas() {
  const lista = dados.vendas.filter(v => {
    const cliente = dados.clientes.find(c => c.id === v.clienteId)?.nome || '';
    const veiculo = v.veiculoNome || dados.veiculos.find(item => item.id === v.veiculoId)?.nome || '';
    return `${cliente} ${veiculo} ${v.data}`.toLowerCase().includes(busca.toLowerCase());
  });
  const linhas = lista.map(v => {
    const cliente = dados.clientes.find(c => c.id === v.clienteId)?.nome || v.clienteNome || 'Cliente removido';
    const veiculo = dados.veiculos.find(item => item.id === v.veiculoId)?.nome || v.veiculoNome || 'Veículo removido';
    return `<tr><td>${escapar(cliente)}</td><td>${escapar(veiculo)}</td><td>${moeda(v.valor)}</td><td>${escapar(v.data)}</td><td><button class="botao perigo pequeno" data-excluir="vendas" data-id="${escapar(v.id)}">Excluir</button></td></tr>`;
  });
  const total = dados.vendas.reduce((soma, v) => soma + Number(v.valor || 0), 0);
  return `${cabecalho('Vendas', 'Registre as vendas realizadas pela loja.', 'vendas')}${edicao ? formularioVenda() : ''}<div class="resumos"><div class="resumo"><span>Vendas registradas</span><strong>${dados.vendas.length}</strong></div><div class="resumo"><span>Total vendido</span><strong>${moeda(total)}</strong></div></div><div class="barra-ferramentas"><input class="pesquisa" data-busca placeholder="Pesquisar venda..." value="${escapar(busca)}"></div>${tabela(linhas, ['Cliente','Veículo','Valor','Data','Ações'], 'Nenhuma venda registrada ainda.')}`;
}

function renderizar() {
  app.innerHTML = pagina === 'inicio' ? inicio() : pagina === 'veiculos' ? paginaVeiculos() : pagina === 'clientes' ? paginaClientes() : paginaVendas();
}

document.querySelector('.menu').addEventListener('click', evento => {
  const aba = evento.target.closest('[data-page]');
  if (aba) abrirPagina(aba.dataset.page);
});

app.addEventListener('click', evento => {
  const ir = evento.target.closest('[data-ir]');
  if (ir) return abrirPagina(ir.dataset.ir);
  const novo = evento.target.closest('[data-novo]');
  if (novo) { edicao = { tipo: novo.dataset.novo, id: null }; return renderizar(); }
  if (evento.target.closest('[data-cancelar]')) { edicao = null; return renderizar(); }
  const editar = evento.target.closest('[data-editar]');
  if (editar) { edicao = { tipo: editar.dataset.editar, id: editar.dataset.id }; return renderizar(); }
  const excluir = evento.target.closest('[data-excluir]');
  if (excluir) excluirRegistro(excluir.dataset.excluir, excluir.dataset.id);
});

app.addEventListener('input', evento => {
  if (!evento.target.matches('[data-busca]')) return;
  const campo = evento.target;
  const posicao = campo.selectionStart;
  busca = campo.value;
  renderizar();
  const novoCampo = app.querySelector('[data-busca]');
  novoCampo?.focus();
  novoCampo?.setSelectionRange(posicao, posicao);
});

app.addEventListener('submit', evento => {
  const formulario = evento.target.closest('[data-form]');
  if (!formulario) return;
  evento.preventDefault();
  const tipo = formulario.dataset.form;
  const form = new FormData(formulario);

  if (tipo === 'veiculos') {
    const registro = { id: edicao?.id || idNovo(), nome: String(form.get('nome')).trim(), ano: Number(form.get('ano')), preco: Number(form.get('preco')), status: form.get('status') };
    if (!registro.nome || registro.ano < 1900 || registro.ano > 2100 || registro.preco <= 0) return alert('Confira os dados do veículo.');
    atualizar('veiculos', registro);
  }

  if (tipo === 'clientes') {
    const registro = { id: edicao?.id || idNovo(), nome: String(form.get('nome')).trim(), telefone: String(form.get('telefone')).trim(), email: String(form.get('email')).trim() };
    if (!registro.nome || !registro.telefone) return alert('Informe o nome e o telefone do cliente.');
    atualizar('clientes', registro);
  }

  if (tipo === 'vendas') {
    const cliente = dados.clientes.find(c => c.id === form.get('clienteId'));
    const veiculo = dados.veiculos.find(v => v.id === form.get('veiculoId'));
    const valor = Number(form.get('valor'));
    if (!cliente || !veiculo || veiculo.status !== 'Disponível' || valor <= 0) return alert('Confira os dados da venda e tente novamente.');
    dados.vendas.push({ id: idNovo(), clienteId: cliente.id, veiculoId: veiculo.id, clienteNome: cliente.nome, veiculoNome: veiculo.nome, valor, data: form.get('data') });
    veiculo.status = 'Vendido';
  }

  edicao = null;
  salvar();
  renderizar();
});

function atualizar(tipo, registro) {
  const indice = dados[tipo].findIndex(item => item.id === registro.id);
  if (indice >= 0) dados[tipo][indice] = registro;
  else dados[tipo].push(registro);
}

function excluirRegistro(tipo, id) {
  const nome = tipo === 'veiculos' ? 'este veículo' : tipo === 'clientes' ? 'este cliente' : 'esta venda';
  if (!confirm(`Deseja excluir ${nome}?`)) return;
  if (tipo === 'veiculos' && dados.vendas.some(v => v.veiculoId === id)) return alert('Este veículo possui uma venda registrada. Exclua a venda primeiro.');
  if (tipo === 'clientes' && dados.vendas.some(v => v.clienteId === id)) return alert('Este cliente possui uma venda registrada. Exclua a venda primeiro.');
  const indice = dados[tipo].findIndex(item => item.id === id);
  if (indice < 0) return;
  if (tipo === 'vendas') {
    const venda = dados.vendas[indice];
    const veiculo = dados.veiculos.find(item => item.id === venda.veiculoId);
    if (veiculo && veiculo.status === 'Vendido') veiculo.status = 'Disponível';
  }
  dados[tipo].splice(indice, 1);
  salvar();
  renderizar();
}

salvar();
renderizar();
