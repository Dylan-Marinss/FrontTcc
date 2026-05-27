// ============================================================
//  CONFIGURACAO
// ============================================================
const API_URL = 'http://localhost:8080';
const ID_PROFESSOR_LOGADO = 6;

// ============================================================
//  ESTADO
// ============================================================
let turmasDisponiveis = [];

// ============================================================
//  INICIALIZACAO
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    carregarTurmas();
    carregarDisciplinas();
    configurarEventos();
});

// ============================================================
//  CONFIGURAR EVENTOS
// ============================================================
function configurarEventos() {
    document.getElementById('form-comunicado').addEventListener('submit', enviarComunicado);

    document.getElementById('titulo').addEventListener('input', (e) => {
        document.getElementById('titulo-count').textContent = e.target.value.length;
    });

    document.getElementById('conteudo').addEventListener('input', (e) => {
        document.getElementById('conteudo-count').textContent = e.target.value.length;
    });

    const menuToggle = document.getElementById('menu-toggle');
    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            document.querySelector('.sidebar').classList.toggle('collapsed');
            document.querySelector('.dashboard-content').classList.toggle('collapsed');
        });
    }
}

// ============================================================
//  CARREGAR TURMAS
// ============================================================
async function carregarTurmas() {
    try {
        const res = await fetch(`${API_URL}/series`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        turmasDisponiveis = await res.json();
        if (turmasDisponiveis.content) turmasDisponiveis = turmasDisponiveis.content;

        popularTurmas();
    } catch (err) {
        console.error('Erro ao carregar turmas:', err);
        showToast('Erro ao carregar turmas. Verifique a conexão.', 'error');
    }
}

function popularTurmas() {
    const select = document.getElementById('turma-select');

    if (!turmasDisponiveis || turmasDisponiveis.length === 0) {
        select.innerHTML = '<option value="" disabled selected>Nenhuma turma disponível</option>';
        return;
    }

    select.innerHTML = '<option value="" disabled selected>Selecione a turma...</option>' +
        turmasDisponiveis.map(turma => `
            <option value="${turma.id}">${turma.nomeSerie}</option>
        `).join('');
}

// ============================================================
//  CARREGAR DISCIPLINAS
// ============================================================
async function carregarDisciplinas() {
    const select = document.getElementById('disciplina-select');

    try {
        const res = await fetch(`${API_URL}/disciplinas`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const disciplinas = await res.json();
        const lista = disciplinas.content || disciplinas;

        // "Geral" como primeira opção (valor vazio = sem disciplina)
        select.innerHTML = '<option value="">Geral</option>' +
            lista.map(d => `<option value="${d.id}">${d.nome}</option>`).join('');

    } catch (err) {
        console.error('Erro ao carregar disciplinas:', err);
        // Mantém só o "Geral" em caso de falha
        select.innerHTML = '<option value="">Geral</option>';
    }
}

// ============================================================
//  ENVIAR COMUNICADO
// ============================================================
async function enviarComunicado(e) {
    e.preventDefault();

    const titulo       = document.getElementById('titulo').value.trim();
    const conteudo     = document.getElementById('conteudo').value.trim();
    const turmaId      = document.getElementById('turma-select').value;
    const disciplinaId = document.getElementById('disciplina-select').value; // pode ser vazio

    if (!titulo) {
        showToast('Digite um título para o comunicado.', 'error');
        return;
    }

    if (!turmaId) {
        showToast('Selecione uma turma.', 'error');
        return;
    }

    if (!conteudo) {
        showToast('Digite o conteúdo do comunicado.', 'error');
        return;
    }

    const btn = document.querySelector('.form-actions-row .btn-primary-neon');
    setLoading(btn, true, 'Publicando...');

    try {
        const agora = new Date();

        // Busca o nome do professor
        let nomeProfessor = 'Professor';
        try {
            const resProf = await fetch(`${API_URL}/utilizadores/${ID_PROFESSOR_LOGADO}`);
            if (resProf.ok) {
                const prof = await resProf.json();
                nomeProfessor = prof.nome || 'Professor';
            }
        } catch {
            console.warn('Não foi possível buscar o nome do professor.');
        }

        const body = {
            titulo,
            descricao: conteudo,
            serie: { id: parseInt(turmaId) },
            utilizadorResponsavel: nomeProfessor,
            // Se disciplinaId estiver vazio ("Geral"), não envia o campo → fica null no banco
            ...(disciplinaId ? { disciplina: { id: parseInt(disciplinaId) } } : {}),
            dataEnvio: agora.toISOString().split('T')[0],
            dataPublicacao: agora.toISOString()
        };

        const res = await fetch(`${API_URL}/comunicados`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        showToast('Comunicado publicado com sucesso!', 'success');
        limparFormulario();
        await carregarDisciplinas(); // reseta o select de disciplina

    } catch (err) {
        console.error('Erro ao publicar comunicado:', err);
        showToast('Erro ao publicar comunicado. Tente novamente.', 'error');
    } finally {
        setLoading(btn, false, '<i class="fas fa-paper-plane"></i> Criar Comunicado');
    }
}

// ============================================================
//  LIMPAR FORMULÁRIO
// ============================================================
function limparFormulario() {
    document.getElementById('form-comunicado').reset();
    document.getElementById('titulo-count').textContent = '0';
    document.getElementById('conteudo-count').textContent = '0';
}

// ============================================================
//  UTILITÁRIOS
// ============================================================
function setLoading(btn, loading, html) {
    if (!btn) return;
    btn.disabled = loading;
    btn.innerHTML = loading
        ? '<i class="fas fa-spinner fa-spin"></i> ' + html
        : html;
}

function showToast(msg, tipo) {
    tipo = tipo || 'success';
    const toast = document.getElementById('toast');
    const icon  = document.getElementById('toast-icon');
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
    toast._timer = setTimeout(() => toast.classList.remove('show'), 3500);
}