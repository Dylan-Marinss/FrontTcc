
const API_URL = 'http://localhost:8080';
const ID_PROFESSOR_LOGADO = 6; // substituir pelo ID real após login

// ============================================================
//  ESTADO
// ============================================================
let idAtividadeCriada = null;
let questoes          = [];
let questaoAtual      = 0;
let opcaoCorretaIndex = null; // índice da alternativa marcada como correta

// ============================================================
//  INICIALIZAÇÃO
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    carregarDificuldades();
    adicionarOpcao();
    atualizarProgresso();
    initSidebar();
});

// ============================================================
//  SIDEBAR
// ============================================================
function initSidebar() {
    const menuToggle = document.getElementById('menu-toggle');
    const sidebar    = document.getElementById('sidebar');
    if (!menuToggle || !sidebar) return;

    menuToggle.addEventListener('click', () => {
        if (window.innerWidth <= 768) {
            sidebar.classList.toggle('active');
        } else {
            sidebar.classList.toggle('collapsed');
        }
    });
}

// ============================================================
//  LETRAS DAS ALTERNATIVAS
// ============================================================
const LETRAS = ['A', 'B', 'C', 'D', 'E'];

// ============================================================
//  ADICIONAR ALTERNATIVA
// ============================================================
function adicionarOpcao() {
    const container = document.getElementById('opcoes-container');
    const total = container.children.length;

    if (total >= 5) {
        showToast('Máximo de 5 alternativas por questão.', 'error');
        return;
    }

    const idx = total;
    const row = document.createElement('div');
    row.className = 'opcao-row';
    row.dataset.idx = idx;

    row.innerHTML = `
        <div class="opcao-letra" id="letra-${idx}" title="Clique para marcar como correta">${LETRAS[idx]}</div>
        <input
            type="radio"
            name="correta"
            class="opcao-radio"
            id="radio-${idx}"
            value="${idx}"
            title="Marcar alternativa ${LETRAS[idx]} como correta"
        >
        <input
            type="text"
            class="opcao-input"
            id="opcao-input-${idx}"
            placeholder="Alternativa ${LETRAS[idx]}..."
            autocomplete="off"
        >
        <button class="btn-remove" onclick="removerOpcao(this)" title="Remover alternativa">
            <i class="fas fa-xmark"></i>
        </button>
    `;

    container.appendChild(row);

    // ── Evento: clique no RADIO ──────────────────────────────
    const radio = row.querySelector('.opcao-radio');
    radio.addEventListener('change', () => {
        if (radio.checked) marcarCorreta(idx);
    });

    // ── Evento: clique na LETRA (alternativa ao radio) ───────
    const letra = row.querySelector('.opcao-letra');
    letra.addEventListener('click', () => {
        radio.checked = true;
        marcarCorreta(idx);
    });

    atualizarContador();
    document.getElementById(`opcao-input-${idx}`)?.focus();
}

// ============================================================
//  REMOVER ALTERNATIVA
// ============================================================
function removerOpcao(btn) {
    const container = document.getElementById('opcoes-container');
    if (container.children.length <= 1) {
        showToast('É necessário ao menos uma alternativa.', 'error');
        return;
    }

    const row = btn.closest('.opcao-row');

    // Se a alternativa removida era a correta, reseta o estado
    const idx = parseInt(row.dataset.idx);
    if (idx === opcaoCorretaIndex) {
        opcaoCorretaIndex = null;
        atualizarIndicadorCorreta();
    }

    row.remove();
    renumerarOpcoes();
    atualizarContador();
}

// ============================================================
//  RENUMERAR OPÇÕES (após remoção)
// ============================================================
function renumerarOpcoes() {
    opcaoCorretaIndex = null;

    document.querySelectorAll('.opcao-row').forEach((row, i) => {
        row.dataset.idx = i;
        row.classList.remove('marcada-correta');

        const letra = row.querySelector('.opcao-letra');
        letra.id = `letra-${i}`;
        letra.textContent = LETRAS[i];
        letra.classList.remove('correta');
        // Recria o evento para o novo índice
        letra.onclick = null;
        letra.addEventListener('click', () => {
            const radio = row.querySelector('.opcao-radio');
            radio.checked = true;
            marcarCorreta(i);
        });

        const radio = row.querySelector('.opcao-radio');
        radio.id    = `radio-${i}`;
        radio.value = i;
        radio.checked = false;
        radio.onchange = null;
        radio.addEventListener('change', () => {
            if (radio.checked) marcarCorreta(i);
        });

        const input = row.querySelector('.opcao-input');
        input.id = `opcao-input-${i}`;
        input.placeholder = `Alternativa ${LETRAS[i]}...`;
    });

    atualizarIndicadorCorreta();
}

// ============================================================
//  MARCAR CORRETA — função central
//  Chamada tanto pelo radio quanto pelo clique na letra
// ============================================================
function marcarCorreta(idx) {
    opcaoCorretaIndex = idx;

    // Remove destaques de todas as linhas
    document.querySelectorAll('.opcao-row').forEach((row, i) => {
        const letra = row.querySelector('.opcao-letra');
        const radio = row.querySelector('.opcao-radio');

        if (i === idx) {
            letra.classList.add('correta');
            row.classList.add('marcada-correta');
            radio.checked = true;
        } else {
            letra.classList.remove('correta');
            row.classList.remove('marcada-correta');
            radio.checked = false;
        }
    });

    atualizarIndicadorCorreta();
}

// ============================================================
//  ATUALIZAR INDICADOR VISUAL DE CORRETA
// ============================================================
function atualizarIndicadorCorreta() {
    const hint   = document.getElementById('correta-hint');
    const status = document.getElementById('correta-status');
    const texto  = document.getElementById('correta-status-texto');

    if (opcaoCorretaIndex !== null) {
        // Esconde a dica, mostra o status de sucesso
        if (hint)   hint.style.display   = 'none';
        if (status) status.style.display = 'flex';
        if (texto)  texto.textContent    =
            `Alternativa ${LETRAS[opcaoCorretaIndex]} marcada como correta`;
    } else {
        // Mostra a dica, esconde o status
        if (hint)   hint.style.display   = 'flex';
        if (status) status.style.display = 'none';
    }
}

// ============================================================
//  ATUALIZAR CONTADOR DE ALTERNATIVAS
// ============================================================
function atualizarContador() {
    const total = document.getElementById('opcoes-container').children.length;

    const countLabel = document.getElementById('count-label');
    if (countLabel) countLabel.textContent = `${total} / 5`;

    const btnAdd = document.getElementById('btn-add-opcao');
    if (btnAdd) btnAdd.style.display = total >= 5 ? 'none' : 'flex';
}

// ============================================================
//  PROGRESSO
// ============================================================
function atualizarProgresso() {
    const num = questaoAtual + 1;

    const numEl = document.getElementById('questao-numero');
    if (numEl) numEl.textContent = `Questão ${num}`;

    const pct = Math.max((questaoAtual / Math.max(questoes.length + 1, 1)) * 100, 5);
    const fill = document.getElementById('questao-progress');
    if (fill) fill.style.width = `${Math.min(pct, 95)}%`;

    const btnAnt = document.getElementById('btn-anterior');
    if (btnAnt) btnAnt.disabled = questaoAtual === 0;
}

// ============================================================
//  CRIAR ATIVIDADE (somente na primeira questão)
// ============================================================
async function criarAtividadeSeNecessario() {
    if (idAtividadeCriada) return true;

    const titulo      = document.getElementById('titulo')?.value.trim();
    const dificuldade = document.getElementById('dificuldade')?.value;

    if (!titulo) {
        showToast('Digite o título da atividade.', 'error');
        document.getElementById('titulo')?.focus();
        return false;
    }

    if (!dificuldade || dificuldade === '' || dificuldade === 'null') {
        showToast('Selecione o nível de dificuldade.', 'error');
        document.getElementById('dificuldade')?.focus();
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
                dataCriacao: new Date().toISOString(),
                nivelDificuldade: { idNivelDificuldade: parseInt(dificuldade) }
            })
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const atividade = await res.json();
        idAtividadeCriada = atividade.idAtividade;

        // Bloqueia campos após criação
        ['titulo', 'dificuldade'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.disabled = true;
        });

        return true;

    } catch (err) {
        console.error('[EstudeX] Erro ao criar atividade:', err);
        showToast('Erro ao criar a atividade. Verifique o backend.', 'error');
        return false;
    }
}

// ============================================================
//  SALVAR QUESTÃO ATUAL
//  REGRA: NÃO deixa salvar sem alternativa correta marcada
// ============================================================
async function salvarQuestaoAtual() {
    const enunciado = document.getElementById('enunciado')?.value.trim();

    if (!enunciado) {
        showToast('Digite o enunciado da questão.', 'error');
        document.getElementById('enunciado')?.focus();
        return null;
    }

    const inputs = document.querySelectorAll('.opcao-input');
    const opcoes = Array.from(inputs).map(i => i.value.trim());

    if (opcoes.length < 2) {
        showToast('Adicione ao menos 2 alternativas.', 'error');
        return null;
    }

    if (opcoes.some(o => !o)) {
        showToast('Preencha todas as alternativas antes de continuar.', 'error');
        return null;
    }

    // ─── VALIDAÇÃO CRÍTICA: correta obrigatória ───────────────
    if (opcaoCorretaIndex === null) {
        showToast(
            'Marque a alternativa correta antes de salvar a questão.',
            'error'
        );
        // Rola até a área de alternativas e agita o hint
        const hint = document.getElementById('correta-hint');
        if (hint) {
            hint.style.display = 'flex';
            hint.scrollIntoView({ behavior: 'smooth', block: 'center' });
            hint.style.borderColor = 'var(--accent-color)';
            hint.style.background  = 'rgba(255,61,0,0.08)';
            setTimeout(() => {
                hint.style.borderColor = '';
                hint.style.background  = '';
            }, 2500);
        }
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
        const pergunta   = await resPergunta.json();
        const idPergunta = pergunta.id ?? pergunta.idPergunta;

        // 2. Salva as opções
        for (let i = 0; i < opcoes.length; i++) {
            const resOpcao = await fetch(`${API_URL}/perguntasopcoes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    descricao: opcoes[i],
                    correta: i === opcaoCorretaIndex,
                    atividadePergunta: { idPergunta }
                })
            });
            if (!resOpcao.ok) throw new Error(`Opção HTTP ${resOpcao.status}`);
        }

        questoes[questaoAtual] = { idPergunta, enunciado, opcoes, correta: opcaoCorretaIndex };
        return idPergunta;

    } catch (err) {
        console.error('[EstudeX] Erro ao salvar questão:', err);
        showToast('Erro ao salvar a questão. Verifique o backend.', 'error');
        return null;
    }
}

// ============================================================
//  PRÓXIMA QUESTÃO
// ============================================================
async function proximaQuestao() {
    const btn   = document.getElementById('btn-proxima');
    const label = '<i class="fas fa-save"></i> Próxima Questão';
    setLoading(btn, true, 'Salvando...');

    const criou = await criarAtividadeSeNecessario();
    if (!criou) { setLoading(btn, false, label); return; }

    const salvo = await salvarQuestaoAtual();
    if (!salvo) { setLoading(btn, false, label); return; }

    showToast(`Questão ${questaoAtual + 1} salva!`);
    questaoAtual++;
    limparFormulario();
    atualizarProgresso();
    setLoading(btn, false, label);
}

// ============================================================
//  QUESTÃO ANTERIOR
// ============================================================
function questaoAnterior() {
    if (questaoAtual === 0) return;
    questaoAtual--;
    carregarQuestao(questaoAtual);
    atualizarProgresso();
}

// ============================================================
//  CARREGAR QUESTÃO NO FORM
// ============================================================
function carregarQuestao(index) {
    const q = questoes[index];
    if (!q) return;

    const enunciadoEl = document.getElementById('enunciado');
    const container   = document.getElementById('opcoes-container');

    if (enunciadoEl) enunciadoEl.value = q.enunciado;
    container.innerHTML = '';
    opcaoCorretaIndex = null;

    q.opcoes.forEach((texto, i) => {
        adicionarOpcao();
        const inputEl = document.getElementById(`opcao-input-${i}`);
        if (inputEl) inputEl.value = texto;
    });

    // Marca a correta após renderizar todas as opções
    if (q.correta !== null && q.correta !== undefined) {
        const radio = document.getElementById(`radio-${q.correta}`);
        if (radio) radio.checked = true;
        marcarCorreta(q.correta);
    }

    atualizarContador();
    showToast(`Editando questão ${index + 1}.`);
}

// ============================================================
//  PUBLICAR ATIVIDADE
// ============================================================
async function publicarAtividade() {
    const btn   = document.querySelector('.main-actions .btn-primary');
    const label = '<i class="fas fa-paper-plane"></i> Publicar Atividade';
    setLoading(btn, true, 'Publicando...');

    const criou = await criarAtividadeSeNecessario();
    if (!criou) { setLoading(btn, false, label); return; }

    const salvo = await salvarQuestaoAtual();
    if (!salvo) { setLoading(btn, false, label); return; }

    const total = questoes.filter(Boolean).length;

    // Atualiza pontuação
    try {
        const resUpdate = await fetch(
            `${API_URL}/atividades/${idAtividadeCriada}/pontuacao?pontuacaoMaxima=${total}`,
            { method: 'PATCH' }
        );
        if (!resUpdate.ok) throw new Error(`PATCH HTTP ${resUpdate.status}`);
    } catch (err) {
        console.error('[EstudeX] Erro ao atualizar pontuação:', err);
        showToast('Erro ao atualizar pontuação. Verifique o backend.', 'error');
        setLoading(btn, false, label);
        return;
    }

    showToast('Atividade publicada com sucesso!');
    setLoading(btn, false, label);
    setTimeout(() => {
        window.location.href = '../../../Professor/dashboard/HTML/professorDashboard.html';
    }, 2000);
}

// ============================================================
//  SALVAR RASCUNHO
// ============================================================
async function salvarRascunho() {
    const btn   = document.querySelector('.main-actions .btn-outline');
    const label = '<i class="fas fa-save"></i> Salvar Rascunho';
    setLoading(btn, true, 'Salvando Rascunho...');

    const criou = await criarAtividadeSeNecessario();
    if (!criou) { setLoading(btn, false, label); return; }

    const salvo = await salvarQuestaoAtual();
    if (!salvo) { setLoading(btn, false, label); return; }

    showToast('Rascunho salvo com sucesso!');
    setLoading(btn, false, label);
}

// ============================================================
//  CANCELAR
// ============================================================
function cancelar() {
    const temConteudo =
        questoes.length > 0 ||
        document.getElementById('enunciado')?.value.trim() ||
        document.getElementById('titulo')?.value.trim();

    if (temConteudo) {
        if (!confirm('Tem certeza que deseja cancelar? As alterações não salvas serão perdidas.')) return;
    }
    window.location.href = '../../../Professor/dashboard/HTML/professorDashboard.html';
}

// ============================================================
//  CARREGAR DIFICULDADES
// ============================================================
async function carregarDificuldades() {
    try {
        const res = await fetch(`${API_URL}/niveldificuldade`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const lista  = await res.json();
        const select = document.getElementById('dificuldade');
        if (!select) return;

        select.innerHTML = '<option value="">Selecione a dificuldade</option>';
        lista.forEach(d => {
            const opt     = document.createElement('option');
            opt.value     = d.idNivelDificuldade;
            opt.textContent = d.nome;
            select.appendChild(opt);
        });

        // Pre-seleciona se vier do localStorage
        const dif = localStorage.getItem('idDificuldade');
        if (dif) select.value = dif;

    } catch (err) {
        console.error('[EstudeX] Erro ao carregar dificuldades:', err);
        showToast('Erro ao carregar dificuldades.', 'error');
    }
}

// ============================================================
//  UTILITÁRIOS
// ============================================================
function limparFormulario() {
    const enunciadoEl = document.getElementById('enunciado');
    const container   = document.getElementById('opcoes-container');
    if (enunciadoEl) enunciadoEl.value = '';
    if (container)   container.innerHTML = '';
    opcaoCorretaIndex = null;
    atualizarIndicadorCorreta(); // reseta o indicador
    adicionarOpcao();
    atualizarContador();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function setLoading(btn, loading, htmlLabel) {
    if (!btn) return;
    btn.disabled  = loading;
    btn.innerHTML = loading
        ? `<i class="fas fa-spinner fa-spin"></i> ${htmlLabel}`
        : htmlLabel;
}

function showToast(msg, tipo = 'success') {
    const toast = document.getElementById('toast');
    const icon  = document.getElementById('toast-icon');
    const msgEl = document.getElementById('toast-msg');
    if (!toast || !icon || !msgEl) return;

    msgEl.textContent = msg;
    toast.className   = 'toast';

    if (tipo === 'error') {
        toast.classList.add('error');
        icon.className = 'fas fa-circle-xmark';
    } else {
        icon.className = 'fas fa-circle-check';
    }

    toast.classList.add('show');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => toast.classList.remove('show'), 3500);
}