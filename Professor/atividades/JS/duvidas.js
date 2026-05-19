// ============================================================
//  CONFIGURACAO
// ============================================================
const API_URL = 'http://localhost:8080';
const ID_PROFESSOR_LOGADO = 6; // substituir pelo ID real apos login

// ============================================================
//  ESTADO
// ============================================================
let duvidasLista = [];
let duvidasFiltradas = [];
let duvidasAtual = null;

// ============================================================
//  INICIALIZACAO
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    carregarDuvidas();
    configurarEventos();
});

// ============================================================
//  CONFIGURAR EVENTOS
// ============================================================
function configurarEventos() {
    // Busca
    document.getElementById('search-input').addEventListener('input', () => filtrarDuvidas());

    // Filtros
    document.getElementById('filter-disciplina').addEventListener('change', () => filtrarDuvidas());
    document.getElementById('filter-turma').addEventListener('change', () => filtrarDuvidas());
    document.getElementById('filter-status').addEventListener('change', () => filtrarDuvidas());

    // Fechar modal ao clicar fora
    document.getElementById('modal-resposta').addEventListener('click', (e) => {
        if (e.target.id === 'modal-resposta') {
            fecharModal();
        }
    });
}

// ============================================================
//  CARREGAR DÚVIDAS
// ============================================================
async function carregarDuvidas() {
    try {
        const res = await fetch(`${API_URL}/duvidas?idProfessor=${ID_PROFESSOR_LOGADO}`);
        
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        
        duvidasLista = await res.json();
        
        if (duvidasLista.content) {
            duvidasLista = duvidasLista.content;
        }
        
        duvidasFiltradas = [...duvidasLista];
        renderizarDuvidas();
        atualizarEstatisticas();
        popularFiltros();

    } catch (err) {
        console.error('Erro ao carregar dúvidas:', err);
        showToast('Erro ao carregar dúvidas. Verifique o backend.', 'error');
        
        // Dados de exemplo para teste
        duvidasLista = [
            { id: 1, aluno: 'João Silva', disciplina: 'Matemática', turma: '3º Ano A', titulo: 'Dúvida sobre Derivadas', descricao: 'Não entendi como calcular a derivada de funções compostas. Pode me explicar o método da cadeia?', data: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR'), status: 'pendente', respondida: false },
            { id: 2, aluno: 'Maria Santos', disciplina: 'Português', turma: '2º Ano B', titulo: 'Análise de Figuras de Linguagem', descricao: 'Qual é a diferença entre metáfora e metonímia? Pode dar exemplos práticos?', data: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR'), status: 'pendente', respondida: false },
            { id: 3, aluno: 'Pedro Oliveira', disciplina: 'História', turma: '3º Ano A', titulo: 'Revolução Francesa', descricao: 'Qual foi o impacto da Revolução Francesa na política mundial?', data: new Date().toLocaleDateString('pt-BR'), status: 'respondida', respondida: true },
            { id: 4, aluno: 'Ana Costa', disciplina: 'Química', turma: '1º Ano C', titulo: 'Reações Químicas', descricao: 'Como balancear uma equação química? Qual é o método mais fácil?', data: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR'), status: 'respondida', respondida: true }
        ];
        
        duvidasFiltradas = [...duvidasLista];
        renderizarDuvidas();
        atualizarEstatisticas();
        popularFiltros();
    }
}

function popularFiltros() {
    const disciplinas = [...new Set(duvidasLista.map(d => d.disciplina))];
    const turmas = [...new Set(duvidasLista.map(d => d.turma))];

    const selectDisc = document.getElementById('filter-disciplina');
    const selectTurma = document.getElementById('filter-turma');

    // Limpar opções anteriores exceto a primeira
    selectDisc.innerHTML = '<option value="">Todas as Disciplinas</option>';
    selectTurma.innerHTML = '<option value="">Todas as Turmas</option>';

    disciplinas.forEach(d => {
        const opt = document.createElement('option');
        opt.value = d;
        opt.textContent = d;
        selectDisc.appendChild(opt);
    });

    turmas.forEach(t => {
        const opt = document.createElement('option');
        opt.value = t;
        opt.textContent = t;
        selectTurma.appendChild(opt);
    });
}

// ============================================================
//  FILTRAR DÚVIDAS
// ============================================================
function filtrarDuvidas() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    const statusFilter = document.getElementById('filter-status').value;
    const disciplinaFilter = document.getElementById('filter-disciplina').value;
    const turmaFilter = document.getElementById('filter-turma').value;

    duvidasFiltradas = duvidasLista.filter(duvida => {
        const matchSearch = 
            duvida.titulo.toLowerCase().includes(searchTerm) ||
            duvida.descricao.toLowerCase().includes(searchTerm) ||
            duvida.aluno.toLowerCase().includes(searchTerm);

        const matchStatus = !statusFilter || duvida.status === statusFilter;
        const matchDisc = !disciplinaFilter || duvida.disciplina === disciplinaFilter;
        const matchTurma = !turmaFilter || duvida.turma === turmaFilter;

        return matchSearch && matchStatus && matchDisc && matchTurma;
    });

    renderizarDuvidas();
}

// ============================================================
//  RENDERIZAR DÚVIDAS
// ============================================================
function renderizarDuvidas() {
    const grid = document.getElementById('duvidas-grid');
    const emptyState = document.getElementById('empty-state');

    if (duvidasFiltradas.length === 0) {
        grid.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }

    emptyState.style.display = 'none';
    grid.innerHTML = duvidasFiltradas.map(duvida => `
        <div class="duvida-card" onclick="abrirModal(${duvida.id})">
            <div class="duvida-header">
                <div class="duvida-aluno-info">
                    <span class="duvida-aluno-nome">${duvida.aluno}</span>
                    <span class="duvida-aluno-disciplina">${duvida.disciplina} | ${duvida.turma}</span>
                </div>
                <span class="duvida-status ${duvida.status}">
                    <i class="fas fa-${duvida.respondida ? 'check-circle' : 'clock'}"></i>
                    ${duvida.status === 'respondida' ? 'Respondida' : duvida.status === 'arquivada' ? 'Arquivada' : 'Pendente'}
                </span>
            </div>
            <h3 class="duvida-titulo">${duvida.titulo}</h3>
            <p class="duvida-descricao-preview">${duvida.descricao}</p>
            <div class="duvida-footer">
                <span class="duvida-data">
                    <i class="fas fa-calendar-alt"></i> ${duvida.data}
                </span>
                <div class="duvida-actions">
                    <button class="btn-icon" title="Responder" onclick="event.stopPropagation(); abrirModal(${duvida.id})">
                        <i class="fas fa-reply"></i>
                    </button>
                    <button class="btn-icon" title="Arquivar" onclick="event.stopPropagation(); arquivarDuvida(${duvida.id})">
                        <i class="fas fa-archive"></i>
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// ============================================================
//  ABRIR MODAL
// ============================================================
function abrirModal(id) {
    duvidasAtual = duvidasLista.find(d => d.id === id);

    if (!duvidasAtual) return;

    // Preencher informações da dúvida
    document.getElementById('modal-aluno').textContent = duvidasAtual.aluno;
    document.getElementById('modal-disciplina').textContent = `${duvidasAtual.disciplina} (${duvidasAtual.turma})`;
    document.getElementById('modal-data').textContent = duvidasAtual.data;
    document.getElementById('modal-descricao').textContent = duvidasAtual.descricao;
    document.getElementById('modal-resposta-text').value = '';

    // Mostrar modal
    const modal = document.getElementById('modal-resposta');
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
}

// ============================================================
//  FECHAR MODAL
// ============================================================
function fecharModal() {
    const modal = document.getElementById('modal-resposta');
    modal.classList.remove('show');
    document.body.style.overflow = 'auto';
    duvidasAtual = null;
}

// ============================================================
//  ENVIAR RESPOSTA
// ============================================================
async function enviarResposta() {
    if (!duvidasAtual) return;

    const resposta = document.getElementById('modal-resposta-text').value.trim();

    if (!resposta) {
        showToast('Digite uma resposta antes de enviar.', 'error');
        return;
    }

    if (resposta.length > 2000) {
        showToast('A resposta não pode exceder 2000 caracteres.', 'error');
        return;
    }

    const btn = document.querySelector('.modal-footer .btn-primary');
    setLoading(btn, true, 'Enviando...');

    try {
        const res = await fetch(`${API_URL}/duvidas/${duvidasAtual.id}/resposta`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                resposta,
                idProfessor: ID_PROFESSOR_LOGADO,
                dataResposta: new Date().toISOString()
            })
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const duvidasIndex = duvidasLista.findIndex(d => d.id === duvidasAtual.id);
        if (duvidasIndex !== -1) {
            duvidasLista[duvidasIndex].status = 'respondida';
            duvidasLista[duvidasIndex].respondida = true;
        }

        showToast('Resposta enviada com sucesso!', 'success');
        fecharModal();
        renderizarDuvidas();
        atualizarEstatisticas();

    } catch (err) {
        console.error('Erro ao enviar resposta:', err);
        showToast('Erro ao enviar resposta. Tente novamente.', 'error');
    } finally {
        setLoading(btn, false, '<i class="fas fa-paper-plane"></i> Enviar Resposta');
    }
}

// ============================================================
//  ARQUIVAR DÚVIDA
// ============================================================
async function arquivarDuvida(id) {
    if (!confirm('Tem certeza que deseja arquivar esta dúvida?')) return;

    try {
        const res = await fetch(`${API_URL}/duvidas/${id}/arquivar`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' }
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const duvidasIndex = duvidasLista.findIndex(d => d.id === id);
        if (duvidasIndex !== -1) {
            duvidasLista[duvidasIndex].status = 'arquivada';
        }

        showToast('Dúvida arquivada com sucesso!', 'success');
        filtrarDuvidas();
        atualizarEstatisticas();

    } catch (err) {
        console.error('Erro ao arquivar dúvida:', err);
        showToast('Erro ao arquivar dúvida.', 'error');
    }
}

// ============================================================
//  ATUALIZAR ESTATÍSTICAS
// ============================================================
function atualizarEstatisticas() {
    const pendentes = duvidasLista.filter(d => d.status === 'pendente').length;
    const respondidas = duvidasLista.filter(d => d.status === 'respondida').length;
    const total = duvidasLista.length;

    document.getElementById('stat-pendentes').textContent = pendentes;
    document.getElementById('stat-respondidas').textContent = respondidas;
    document.getElementById('stat-total').textContent = total;
}

// ============================================================
//  UTILITÁRIOS
// ============================================================
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

// ============================================================
//  MENU SIDEBAR
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    const menuToggle = document.getElementById('menu-toggle');
    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            document.querySelector('.sidebar').classList.toggle('collapsed');
            document.querySelector('.dashboard-content').classList.toggle('collapsed');
        });
    }
});
