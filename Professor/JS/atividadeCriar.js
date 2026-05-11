let atividadeId = null; // guarda o ID da atividade criada
// array com letras das alternativas
const LETRAS = ["A","B","C","D","E"];

// contador de opções criadas
let contador = 0;

// controla qual questão está sendo criada
let questaoAtual = 1;

// total de questões da atividade
const totalQuestoes = 10;


// ───────── UI ─────────

// atualiza o contador de opções (ex: 2 / 5)
function atualizarCount() {
  document.getElementById("count-label").textContent = `${contador} / 5`; // mostra quantidade
  document.querySelector(".btn-add").style.display = contador >= 5 ? "none" : "flex"; // esconde botão se já tiver 5
}

// atualiza o texto "Questão X de Y" e barra de progresso
function atualizarQuestaoHeader() {
  document.getElementById("questao-numero").textContent = `Questão ${questaoAtual} de ${totalQuestoes}`; // texto
  document.getElementById("questao-progress").style.width = `${(questaoAtual / totalQuestoes) * 100}%`; // barra
}


// ───────── OPÇÕES ─────────

// adiciona uma nova alternativa
function adicionarOpcao() {

  if (contador >= 5) return; // limita a 5 opções

  const letra = LETRAS[contador]; // pega letra correspondente (A, B, C...)
  contador++; // aumenta contador

  const container = document.getElementById("opcoes-container"); // pega div das opções

  const row = document.createElement("div"); // cria nova div
  row.classList.add("opcao-row"); // adiciona classe

  // HTML da opção
  row.innerHTML = `
    <input type="radio" name="resposta" class="opcao-radio" /> <!-- radio para marcar correta -->
    <div class="opcao-letra">${letra}</div> <!-- letra da opção -->
    <input type="text" class="opcao-input" placeholder="Digite a alternativa ${letra}..." /> <!-- input -->
    <button class="btn-remove" onclick="removerOpcao(this)">X</button> <!-- botão remover -->
  `;

  container.appendChild(row); // adiciona no HTML
  atualizarCount(); // atualiza contador
}


// remove uma opção
function removerOpcao(btn) {
  btn.closest(".opcao-row").remove(); // remove a div da opção
  reordenarOpcoes(); // reorganiza letras
}


// reorganiza as letras após remover
function reordenarOpcoes() {

  const rows = document.querySelectorAll(".opcao-row"); // pega todas opções
  contador = rows.length; // atualiza contador

  rows.forEach((row, i) => {
    row.querySelector(".opcao-letra").textContent = LETRAS[i]; // atualiza letra
    row.querySelector(".opcao-input").placeholder = `Digite a alternativa ${LETRAS[i]}...`; // atualiza placeholder
  });

  atualizarCount(); // atualiza contador
}


// ───────── FORM ─────────

// limpa formulário após salvar
function limparFormulario() {
  document.getElementById("enunciado").value = ""; // limpa enunciado
  document.getElementById("opcoes-container").innerHTML = ""; // remove opções
  contador = 0; // zera contador

  adicionarOpcao(); // cria primeira opção automaticamente
  atualizarCount(); // atualiza contador
}


// mostra mensagem na tela (toast)
function mostrarToast(msg, cor) {
  const t = document.getElementById("toast"); // pega toast
  document.getElementById("toast-msg").textContent = msg; // define mensagem
  t.style.borderColor = cor || "var(--accent)"; // define cor
  t.classList.add("show"); // mostra toast

  setTimeout(() => t.classList.remove("show"), 3000); // esconde após 3s
}

function finalizarAtividade() {

  // verifica se já criou a atividade
  if (!atividadeId) {
    mostrarToast("Crie pelo menos uma questão antes!", "#ff4466"); // erro
    return;
  }

  // aqui você pode depois mandar tudo pro banco (se quiser)
  console.log("Atividade finalizada com ID:", atividadeId); // debug

  const dataCriacao = new Date(); // pega data e hora atual do sistema

  mostrarToast("✓ Atividade finalizada com sucesso!"); // sucesso

  // opcional: resetar tudo
  atividadeId = null; // limpa ID
  questaoAtual = 1; // volta pra questão 1
  atualizarQuestaoHeader(); // atualiza header
  limparFormulario(); // limpa inputs
}


// ───────── SALVAR ─────────

// função chamada ao clicar no botão salvar
function salvarQuestao() { // função principal chamada ao clicar no botão salvar

  const titulo = document.getElementById("titulo").value; // pega o valor digitado no input de título
  const enunciado = document.getElementById("enunciado").value.trim(); // pega o enunciado e remove espaços extras

  const opcoes = [...document.querySelectorAll(".opcao-input")].map(i => i.value.trim()); // pega todas as alternativas digitadas
  const corretaEl = document.querySelector(".opcao-radio:checked"); // pega a opção marcada como correta

  // ─── VALIDAÇÕES ───

  if (!titulo) { // verifica se o título está vazio
    mostrarToast("Digite o título!", "#ff4466"); // mostra mensagem de erro
    return; // interrompe execução
  }

  if (!enunciado) { // verifica se o enunciado está vazio
    mostrarToast("Digite o enunciado!", "#ff4466"); // mostra erro
    return; // para função
  }

  if (opcoes.length < 2) { // verifica se tem menos de 2 alternativas
    mostrarToast("Adicione pelo menos 2 opções!", "#ff4466"); // erro
    return;
  }

  if (!corretaEl) { // verifica se nenhuma alternativa foi marcada como correta
    mostrarToast("Selecione a correta!", "#ff4466"); // erro
    return;
  }

  // ─── CRIA ATIVIDADE (SÓ NA PRIMEIRA VEZ) ───

  if (!atividadeId) { // se ainda não existe atividade criada

    const dataCriacao = new Date().toISOString(); // pega data atual no formato certo

    fetch("http://localhost:8080/atividades", { // chama API do backend
      method: "POST", // método POST = criar registro
      headers: {
        "Content-Type": "application/json" // informa que estamos enviando JSON
      },
      body: JSON.stringify({ // converte objeto JS para JSON
        titulo: titulo, // envia o título digitado
        pontuacaoMaxima: 10, // valor fixo por enquanto
        idOrientador: 6, // 👈 usa um ID que já existe no banco
        dataCriacao: dataCriacao // 👈 AGORA VAI PRO BANCO
      })
    })

    .then(res => res.json()) // transforma resposta do servidor em JSON

    .then(atividade => { // recebe a atividade criada

      atividadeId = atividade.idAtividade; // salva o ID da atividade numa variável global

      criarPergunta(enunciado); // chama função que salva a pergunta

    })

    .catch(err => { // se der erro ao criar atividade
      console.error("Erro ao criar atividade:", err); // mostra erro no console
    });

  } else { // se a atividade já existe

    criarPergunta(enunciado); // só cria a pergunta (não recria atividade)

  }
}

function criarPergunta(enunciado) {

  fetch("http://localhost:8080/atividadesPergunta", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      enunciado: enunciado,
      atividade: {
        idAtividade: atividadeId
      }
    })
  })
  .then(res => res.json())
  .then(data => {
    console.log("Pergunta salva:", data);

    mostrarToast(`Questão ${questaoAtual} salva!`);

    if (questaoAtual < totalQuestoes) {
      questaoAtual++;
      atualizarQuestaoHeader();
      limparFormulario();
    } else {
      mostrarToast("Atividade finalizada!");
    }
  })
  .catch(err => {
    console.error("Erro pergunta:", err);
    mostrarToast("Erro ao salvar pergunta!", "#ff4466");
  });
}


// ───────── INIT ─────────

// cria primeira opção ao abrir a página
adicionarOpcao();

// inicializa header da questão
atualizarQuestaoHeader();