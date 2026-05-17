// ============================================================
//  CONFIGURACAO
// ============================================================
const API_URL = 'http://localhost:8080';
const ID_PROFESSOR_LOGADO = 6; // substituir pelo ID real apos login

// ============================================================
//  ESTADO
// ============================================================
let idAtividadeCriada = null;  // preenchido apos POST /atividades
let questoes = [];             // questoes ja salvas { idPergunta, enunciado, opcoes[], correta }
let questaoAtual = 0;          // indice da questao emedicao
let opcaoCorretaIndex = null;  // indice da alternativa marcada como correta

// ============================================================
//  INICIALIZACAO
// ============================================================
document.addEventListener('DOMContentLoaded', () => {

    adicionarOpcao();

    atualizarProgresso();

});

// ============================================================
//  ALTERNATIVAS
// ============================================================
const LETRAS = ['A', 'B', 'C', 'D', 'E'];

function adicionarOpcao() {
    const container = document.getElementById('opcoes-container');
    const total = container.children.length;

    if (total >= 5) {
        showToast('Maximo de 5 alternativas por questao.', 'error');
        return;
    }

    const idx = total;
    const row = document.createElement('div');
    row.className = 'opcao-row';
    row.dataset.idx = idx;

    row.innerHTML = `
        <div class="opcao-letra" id="letra-${idx}">${LETRAS[idx]}</div>
        <input type="radio" name="correta" class="opcao-radio" id="radio-${idx}"
               value="${idx}" onchange="marcarCorreta(${idx})">
        <input type="text" class="opcao-input" id="opcao-input-${idx}"
               placeholder="Alternativa ${LETRAS[idx]}...">
        <button class="btn-remove" onclick="removerOpcao(this)" title="Remover">
            <i class="fas fa-xmark"></i>
        </button>
    `;

    container.appendChild(row);
    atualizarContador();
    document.getElementById(`opcao-input-${idx}`).focus();
}

function removerOpcao(btn) {
    const container = document.getElementById('opcoes-container');
    if (container.children.length <= 1) {
        showToast('E necessario ao menos uma alternativa.', 'error');
        return;
    }
    btn.closest('.opcao-row').remove();
    renumerarOpcoes();
    atualizarContador();
}

function renumerarOpcoes() {
    opcaoCorretaIndex = null;
    document.querySelectorAll('.opcao-row').forEach((row, i) => {
        row.dataset.idx = i;

        const letra = row.querySelector('.opcao-letra');
        letra.id = `letra-${i}`;
        letra.textContent = LETRAS[i];
        letra.classList.remove('correta');

        const radio = row.querySelector('.opcao-radio');
        radio.id = `radio-${i}`;
        radio.value = i;
        radio.checked = false;
        radio.setAttribute('onchange', `marcarCorreta(${i})`);

        const input = row.querySelector('.opcao-input');
        input.id = `opcao-input-${i}`;
        input.placeholder = `Alternativa ${LETRAS[i]}...`;
    });
}

function marcarCorreta(idx) {
    opcaoCorretaIndex = idx;
    document.querySelectorAll('.opcao-letra').forEach((el, i) => {
        el.classList.toggle('correta', i === idx);
    });
}

function atualizarContador() {
    const total = document.getElementById('opcoes-container').children.length;
    document.getElementById('count-label').textContent = `${total} / 5`;
    const btnAdd = document.getElementById('btn-add-opcao');
    if (btnAdd) btnAdd.style.display = total >= 5 ? 'none' : 'flex';
}

// ============================================================
//  PROGRESSO
// ============================================================
function atualizarProgresso() {
    const num = questaoAtual + 1;
    document.getElementById('questao-numero').textContent = `Questao ${num}`;
    const pct = Math.max((questaoAtual / Math.max(questoes.length + 1, 1)) * 100, 5);
    document.getElementById('questao-progress').style.width = `${Math.min(pct, 95)}%`;
    document.getElementById('btn-anterior').disabled = questaoAtual === 0;
}

// ============================================================
//  CRIAR ATIVIDADE (so na primeira questao)
// ============================================================
async function criarAtividadeSeNecessario() {
    if (idAtividadeCriada) return true;

    const titulo = document.getElementById('titulo').value.trim();
    const dificuldade = localStorage.getItem('idDificuldade');

    console.log('idDificuldade do localStorage:', dificuldade); // ← confirme aqui

    if (!titulo) {
        showToast('Digite o título da atividade.', 'error');
        document.getElementById('titulo').focus();
        return false;
    }

    if (!dificuldade || dificuldade === 'null' || dificuldade === 'undefined') {
        showToast('Dificuldade não encontrada. Volte e selecione novamente.', 'error');
        return false;
    }

    try {
        const res = await fetch(`${API_URL}/atividades`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                titulo,
                idOrientador: ID_PROFESSOR_LOGADO,
                pontuacaoMaxima: 0,
                dataCriacao: new Date().toISOString(), // ← ADICIONE
                nivelDificuldade: {
                    idNivelDificuldade: parseInt(dificuldade)
                }
            })
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const atividade = await res.json();
        idAtividadeCriada = atividade.idAtividade;
        document.getElementById('titulo').disabled = true;
        return true;

    } catch (err) {
        console.error('Erro ao criar atividade:', err);
        showToast('Erro ao criar a atividade. Verifique o backend.', 'error');
        return false;
    }
}

// ============================================================
//  SALVAR QUESTAO -> POST /atividadesPergunta + /perguntasopcoes
// ============================================================
async function salvarQuestaoAtual() {
    const enunciado = document.getElementById('enunciado').value.trim();
    if (!enunciado) {
        showToast('Digite o enunciado da questao.', 'error');
        document.getElementById('enunciado').focus();
        return null;
    }

    const inputs = document.querySelectorAll('.opcao-input');
    const opcoes = Array.from(inputs).map(i => i.value.trim());

    if (opcoes.length < 2) {
        showToast('Adicione ao menos 2 alternativas.', 'error');
        return null;
    }
    if (opcoes.some(o => !o)) {
        showToast('Preencha todas as alternativas.', 'error');
        return null;
    }
    if (opcaoCorretaIndex === null) {
        showToast('Selecione a alternativa correta.', 'error');
        return null;
    }

    try {
        // 1. Salva a pergunta
        const resPergunta = await fetch(`${API_URL}/atividadesPergunta`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                enunciado,
                atividade: { idAtividade: idAtividadeCriada }
            })
        });
        if (!resPergunta.ok) throw new Error(`Pergunta HTTP ${resPergunta.status}`);
        const pergunta = await resPergunta.json();
        const idPergunta = pergunta.id ?? pergunta.idPergunta;

        // 2. Salva as opcoes
        for (let i = 0; i < opcoes.length; i++) {
            const resOpcao = await fetch(`${API_URL}/perguntasopcoes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    descricao: opcoes[i],
                    correta: i === opcaoCorretaIndex ? true : false,
                    atividadePergunta: { idPergunta: idPergunta }  // ← id correto da entidade
                })
            });
            if (!resOpcao.ok) throw new Error(`Opcao HTTP ${resOpcao.status}`);
        }

        questoes[questaoAtual] = { idPergunta, enunciado, opcoes, correta: opcaoCorretaIndex };
        return idPergunta;

    } catch (err) {
        console.error('Erro ao salvar questao:', err);
        showToast('Erro ao salvar a questao. Verifique o backend.', 'error');
        return null;
    }
}

// ============================================================
//  PROXIMA QUESTAO
// ============================================================
async function proximaQuestao() {
    const btn = document.getElementById('btn-proxima');
    setLoading(btn, true, 'Salvando...');

    const criou = await criarAtividadeSeNecessario();
    if (!criou) { setLoading(btn, false, '<i class="fas fa-save"></i> Proxima Questao'); return; }

    const salvo = await salvarQuestaoAtual();
    if (!salvo) { setLoading(btn, false, '<i class="fas fa-save"></i> Proxima Questao'); return; }

    showToast(`Questao ${questaoAtual + 1} salva!`);
    questaoAtual++;
    limparFormulario();
    atualizarProgresso();
    setLoading(btn, false, '<i class="fas fa-save"></i> Proxima Questao');
}

// ============================================================
//  QUESTAO ANTERIOR
// ============================================================
function questaoAnterior() {
    if (questaoAtual === 0) return;
    questaoAtual--;

    const q = questoes[questaoAtual];
    if (q) {
        document.getElementById('enunciado').value = q.enunciado;
        document.getElementById('opcoes-container').innerHTML = '';
        opcaoCorretaIndex = q.correta;

        q.opcoes.forEach((texto, i) => {
            adicionarOpcao();
            document.getElementById(`opcao-input-${i}`).value = texto;
            if (i === q.correta) {
                document.getElementById(`radio-${i}`).checked = true;
                document.getElementById(`letra-${i}`).classList.add('correta');
            }
        });
        atualizarContador();
    }

    atualizarProgresso();
    showToast(`Voltou para a Questao ${questaoAtual + 1}.`);
}

// ============================================================
//  FINALIZAR ATIVIDADE
//  Regras:
//    1. Minimo de 1 questao salva para finalizar
//    2. pontuacaoMaxima = total de questoes salvas (1 questao = 1 ponto)
// ============================================================
async function finalizarAtividade() {
    const btn = document.querySelector('.btn-outline');
    setLoading(btn, true, 'Finalizando...');

    const criou = await criarAtividadeSeNecessario();
    if (!criou) { setLoading(btn, false, '<i class="fas fa-flag-checkered"></i> Finalizar Atividade'); return; }

    // Tenta salvar a questao atual se o enunciado estiver preenchido
    const enunciado = document.getElementById('enunciado').value.trim();
    if (enunciado) {
        const salvo = await salvarQuestaoAtual();
        if (!salvo) { setLoading(btn, false, '<i class="fas fa-flag-checkered"></i> Finalizar Atividade'); return; }
    }

    const total = questoes.filter(Boolean).length;

    // Regra: minimo de 1 questao salva
    if (total < 1) {
        showToast('A atividade precisa ter ao menos 1 questao salva.', 'error');
        setLoading(btn, false, '<i class="fas fa-flag-checkered"></i> Finalizar Atividade');
        return;
    }

    // Atualiza pontuacaoMaxima = total de questoes via PUT
    // TODO: garantir que o endpoint PUT /atividades/{id} existe no backend
    try {
        const resUpdate = await fetch(
            `${API_URL}/atividades/${idAtividadeCriada}/pontuacao?pontuacaoMaxima=${total}`,
            { method: 'PATCH' }
        );

        if (!resUpdate.ok) throw new Error(`PATCH HTTP ${resUpdate.status}`);

    } catch (err) {
        console.error('Erro ao atualizar pontuação:', err);
        showToast('Erro ao atualizar pontuação. Verifique o backend.', 'error');
        setLoading(btn, false, '<i class="fas fa-flag-checkered"></i> Finalizar Atividade');
        return; // ← para o fluxo em vez de ignorar
    }

    showToast(`Atividade finalizada! ${total} questao(oes) — vale ${total} ponto(s).`);

    setTimeout(() => {
        // TODO: redirecionar para lista de atividades quando a pagina existir
        // window.location.href = '../HTML/atividades.html';
        alert(`Atividade criada com sucesso!\n${total} questao(oes) salvas — vale ${total} ponto(s).`);
    }, 1500);
}

// ============================================================
//  CANCELAR
// ============================================================
function cancelar() {
    if (questoes.length > 0 || document.getElementById('enunciado').value.trim()) {
        if (!confirm('Deseja cancelar? O progresso nao salvo sera perdido.')) return;
    }
    // TODO: redirecionar para lista de atividades
    window.history.back();
}

// ============================================================
//  UTILITARIOS
// ============================================================
function limparFormulario() {
    document.getElementById('enunciado').value = '';
    document.getElementById('opcoes-container').innerHTML = '';
    opcaoCorretaIndex = null;
    adicionarOpcao();
    atualizarContador();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function setLoading(btn, loading, html) {
    btn.disabled = loading;
    btn.innerHTML = loading ? '<i class="fas fa-spinner fa-spin"></i> ' + html : html;
}

function showToast(msg, tipo) {
    tipo = tipo || 'success';
    const toast = document.getElementById('toast');
    const icon = document.getElementById('toast-icon');
    document.getElementById('toast-msg').textContent = msg;

    toast.className = 'toast';
    if (tipo === 'error') {
        toast.classList.add('error');
        icon.className = 'fas fa-circle-xmark';
    } else {
        icon.className = 'fas fa-circle-check';
    }

    toast.classList.add('show');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(function () { toast.classList.remove('show'); }, 3500);
}

async function carregarDificuldades() {
    try {
        const res = await fetch(`${API_URL}/niveldificuldade`);

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const dificuldades = await res.json();

        const select = document.getElementById('dificuldade'); // ← era 'dificuldadeQuestao'

        select.innerHTML = '<option value="">Selecione a dificuldade</option>';

        dificuldades.forEach(dificuldade => {
            const option = document.createElement('option');
            option.value = dificuldade.idNivelDificuldade;
            option.textContent = dificuldade.nome;
            select.appendChild(option);
        });

    } catch (err) {
        console.error('Erro ao carregar dificuldades:', err);
        showToast('Erro ao carregar dificuldades.', 'error');
    }
}