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
    configurarEventos();
});

// ============================================================
//  CONFIGURAR EVENTOS
// ============================================================
function configurarEventos() {
    // Formulário
    document.getElementById('form-comunicado').addEventListener('submit', enviarComunicado);

    // Contadores de caracteres
    document.getElementById('titulo').addEventListener('input', (e) => {
        document.getElementById('titulo-count').textContent = e.target.value.length;
    });

    document.getElementById('conteudo').addEventListener('input', (e) => {
        document.getElementById('conteudo-count').textContent = e.target.value.length;
    });

    // Menu sidebar
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
        const res = await fetch(`${API_URL}/turmas?idProfessor=${ID_PROFESSOR_LOGADO}`);
        
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        
        turmasDisponiveis = await res.json();
        
        if (turmasDisponiveis.content) {
            turmasDisponiveis = turmasDisponiveis.content;
        }

        popularTurmas();

    } catch (err) {
        console.error('Erro ao carregar turmas:', err);
        
        // Dados de exemplo
        turmasDisponiveis = [
            { id: 1, nome: '3º Ano A' },
            { id: 2, nome: '3º Ano B' },
            { id: 3, nome: '2º Ano A' },
            { id: 4, nome: '1º Ano C' }
        ];

        popularTurmas();
    }
}

function popularTurmas() {
    const select = document.getElementById('turma-select');
    // Manter a primeira opção padrão e adicionar as turmas
    select.innerHTML = '<option value="" disabled selected>Selecione a turma...</option>' + 
        turmasDisponiveis.map(turma => `
            <option value="${turma.id}">${turma.nome}</option>
        `).join('');
}

// ============================================================
//  ENVIAR COMUNICADO
// ============================================================
async function enviarComunicado(e) {
    e.preventDefault();

    const titulo = document.getElementById('titulo').value.trim();
    const conteudo = document.getElementById('conteudo').value.trim();
    const turmaId = document.getElementById('turma-select').value;

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

    const btn = document.querySelector('.form-actions .btn-primary');
    setLoading(btn, true, 'Publicando...');

    try {
        const res = await fetch(`${API_URL}/comunicados`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                titulo,
                conteudo,
                turmas: [parseInt(turmaId)], // Envia como array de 1 item para manter compatibilidade
                idProfessor: ID_PROFESSOR_LOGADO,
                dataCriacao: new Date().toISOString()
            })
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        showToast('Comunicado publicado com sucesso!', 'success');
        limparFormulario();

    } catch (err) {
        console.error('Erro ao publicar comunicado:', err);
        showToast('Erro ao publicar comunicado. Tente novamente.', 'error');
    } finally {
        setLoading(btn, false, '<i class="fas fa-paper-plane"></i> Publicar Comunicado');
    }
}

function limparFormulario() {
    document.getElementById('form-comunicado').reset();
    document.getElementById('titulo-count').textContent = '0';
    document.getElementById('conteudo-count').textContent = '0';
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
    toast._timer = setTimeout(() => toast.classList.remove('show'), 3500);
}
