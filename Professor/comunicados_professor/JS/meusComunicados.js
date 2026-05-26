// ============================================================
//  CONFIGURACAO
// ============================================================
const API_URL = 'http://localhost:8080';
const ID_PROFESSOR_LOGADO = 6; 

// ============================================================
//  ESTADO
// ============================================================
let meusComunicados = [];
let turmasDisponiveis = [];

// ============================================================
//  INICIALIZACAO
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    carregarTurmas();
    carregarMeusComunicados();
    configurarEventos();
});

function configurarEventos() {
    document.getElementById('search-input').addEventListener('input', filtrarComunicados);
    document.getElementById('form-edit').addEventListener('submit', salvarEdicao);
    
    const menuToggle = document.getElementById('menu-toggle');
    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            document.querySelector('.sidebar').classList.toggle('collapsed');
            document.querySelector('.dashboard-content').classList.toggle('collapsed');
        });
    }
}

async function carregarTurmas() {
    try {
        const res = await fetch(`${API_URL}/turmas?idProfessor=${ID_PROFESSOR_LOGADO}`);
        if (res.ok) {
            turmasDisponiveis = await res.json();
            if (turmasDisponiveis.content) turmasDisponiveis = turmasDisponiveis.content;
            
            const select = document.getElementById('edit-turma');
            select.innerHTML = turmasDisponiveis.map(t => `<option value="${t.id}">${t.nome}</option>`).join('');
        }
    } catch (e) {
        turmasDisponiveis = [{id: 1, nome: '3º Ano A'}, {id: 2, nome: '3º Ano B'}];
    }
}

async function carregarMeusComunicados() {
    try {
        const res = await fetch(`${API_URL}/comunicados?idProfessor=${ID_PROFESSOR_LOGADO}`);
        if (res.ok) {
            meusComunicados = await res.json();
            if (meusComunicados.content) meusComunicados = meusComunicados.content;
        } else {
            throw new Error();
        }
    } catch (e) {
        // Dados Mock
        meusComunicados = [
            { id: 1, titulo: 'Aviso de Prova', conteudo: 'Estudem para a prova de amanhã.', turmaId: 1, data: '25/05/2026' },
            { id: 2, titulo: 'Trabalho em Grupo', conteudo: 'Os grupos devem ter 4 pessoas.', turmaId: 2, data: '24/05/2026' }
        ];
    }
    renderizarLista();
}

function renderizarLista(lista = meusComunicados) {
    const container = document.getElementById('meus-comunicados-list');
    const empty = document.getElementById('empty-state');

    if (lista.length === 0) {
        container.innerHTML = '';
        empty.style.display = 'block';
        return;
    }

    empty.style.display = 'none';
    container.innerHTML = lista.map(com => {
        const turma = turmasDisponiveis.find(t => t.id == com.turmaId);
        return `
            <div class="comunicado-card">
                <div class="card-header">
                    <h3 class="card-title">${com.titulo}</h3>
                    <span class="card-turma">${turma ? turma.nome : 'Turma ' + com.turmaId}</span>
                </div>
                <div class="card-body">${com.conteudo}</div>
                <div class="card-footer">
                    <span class="card-date"><i class="fas fa-calendar-alt"></i> ${com.data}</span>
                    <div class="card-actions">
                        <button class="btn-icon" onclick="abrirEdicao(${com.id})" title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-icon delete" onclick="deletarComunicado(${com.id})" title="Excluir">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function filtrarComunicados() {
    const term = document.getElementById('search-input').value.toLowerCase();
    const filtrados = meusComunicados.filter(c => 
        c.titulo.toLowerCase().includes(term) || 
        c.conteudo.toLowerCase().includes(term)
    );
    renderizarLista(filtrados);
}

function abrirEdicao(id) {
    const com = meusComunicados.find(c => c.id == id);
    if (!com) return;

    document.getElementById('edit-id').value = com.id;
    document.getElementById('edit-titulo').value = com.titulo;
    document.getElementById('edit-turma').value = com.turmaId;
    document.getElementById('edit-conteudo').value = com.conteudo;

    document.getElementById('modal-edit').classList.add('show');
}

function fecharModal() {
    document.getElementById('modal-edit').classList.remove('show');
}

async function salvarEdicao(e) {
    e.preventDefault();
    const id = document.getElementById('edit-id').value;
    const titulo = document.getElementById('edit-titulo').value;
    const turmaId = document.getElementById('edit-turma').value;
    const conteudo = document.getElementById('edit-conteudo').value;

    // Lógica de atualização na API aqui
    const index = meusComunicados.findIndex(c => c.id == id);
    if (index !== -1) {
        meusComunicados[index] = { ...meusComunicados[index], titulo, turmaId, conteudo };
        renderizarLista();
        fecharModal();
        alert('Comunicado atualizado com sucesso!');
    }
}

async function deletarComunicado(id) {
    if (confirm('Tem certeza que deseja excluir este comunicado?')) {
        meusComunicados = meusComunicados.filter(c => c.id != id);
        renderizarLista();
    }
}
