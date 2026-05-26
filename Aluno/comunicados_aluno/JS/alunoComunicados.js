// ============================================================
//  CONFIGURACAO
// ============================================================
const API_URL = 'http://localhost:8080';
const ID_ALUNO_LOGADO = 1; 

// ============================================================
//  ESTADO
// ============================================================
let comunicadosLista = [];
let comunicadosFiltrados = [];

// ============================================================
//  INICIALIZACAO
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    carregarComunicados();
    configurarEventos();
});

// ============================================================
//  CONFIGURAR EVENTOS
// ============================================================
function configurarEventos() {
    document.getElementById('search-input').addEventListener('input', () => filtrarComunicados());
    document.getElementById('filter-materia').addEventListener('change', () => filtrarComunicados());
    document.getElementById('filter-professor').addEventListener('change', () => filtrarComunicados());

    document.getElementById('modal-comunicado').addEventListener('click', (e) => {
        if (e.target.id === 'modal-comunicado') fecharModal();
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
//  CARREGAR COMUNICADOS
// ============================================================
async function carregarComunicados() {
    try {
        const res = await fetch(`${API_URL}/comunicados/aluno/${ID_ALUNO_LOGADO}`);
        
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        
        comunicadosLista = await res.json();
        if (comunicadosLista.content) comunicadosLista = comunicadosLista.content;

        comunicadosFiltrados = [...comunicadosLista];
        popularFiltros();
        renderizarComunicados();

    } catch (err) {
        console.error('Erro ao carregar comunicados:', err);
        
        // Dados de exemplo atualizados (sem prioridade/lido)
        comunicadosLista = [
            {
                id: 1,
                titulo: 'Aviso sobre a Prova',
                conteudo: 'A prova será realizada no próximo dia 15. Estudem os capítulos 3 e 4 do livro.',
                professor: 'João Silva',
                materia: 'Matemática',
                dataCriacao: '15/05/2026'
            },
            {
                id: 2,
                titulo: 'Entrega de Trabalhos',
                conteudo: 'Lembrem-se que a entrega do trabalho final é até sexta-feira.',
                professor: 'Maria Santos',
                materia: 'Português',
                dataCriacao: '14/05/2026'
            },
            {
                id: 3,
                titulo: 'Aula de Laboratório',
                conteudo: 'Amanhã teremos aula prática no laboratório 2.',
                professor: 'Pedro Costa',
                materia: 'Ciências',
                dataCriacao: '13/05/2026'
            }
        ];

        comunicadosFiltrados = [...comunicadosLista];
        popularFiltros();
        renderizarComunicados();
    }
}

function popularFiltros() {
    const materias = [...new Set(comunicadosLista.map(c => c.materia))];
    const professores = [...new Set(comunicadosLista.map(c => c.professor))];

    const filterMateria = document.getElementById('filter-materia');
    const filterProfessor = document.getElementById('filter-professor');

    filterMateria.innerHTML = '<option value="">Todas as Matérias</option>' + 
        materias.map(m => `<option value="${m}">${m}</option>`).join('');

    filterProfessor.innerHTML = '<option value="">Todos os Professores</option>' + 
        professores.map(p => `<option value="${p}">${p}</option>`).join('');
}

function renderizarComunicados() {
    const list = document.getElementById('comunicados-list');
    const emptyState = document.getElementById('empty-state');

    if (comunicadosFiltrados.length === 0) {
        list.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }

    emptyState.style.display = 'none';
    list.innerHTML = comunicadosFiltrados.map(com => `
        <div class="comunicado-card" onclick="abrirModal(${com.id})">
            <div class="comunicado-header">
                <h3 class="comunicado-titulo">${com.titulo}</h3>
                <span class="materia-badge">${com.materia}</span>
            </div>
            <p class="comunicado-conteudo-preview">${com.conteudo}</p>
            <div class="comunicado-footer">
                <span><i class="fas fa-user"></i> ${com.professor}</span>
                <span><i class="fas fa-calendar-alt"></i> ${com.dataCriacao}</span>
            </div>
        </div>
    `).join('');
}

function filtrarComunicados() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    const materiaFilter = document.getElementById('filter-materia').value;
    const professorFilter = document.getElementById('filter-professor').value;

    comunicadosFiltrados = comunicadosLista.filter(com => {
        const matchSearch = com.titulo.toLowerCase().includes(searchTerm) || com.conteudo.toLowerCase().includes(searchTerm);
        const matchMateria = !materiaFilter || com.materia === materiaFilter;
        const matchProfessor = !professorFilter || com.professor === professorFilter;
        return matchSearch && matchMateria && matchProfessor;
    });

    renderizarComunicados();
}

function abrirModal(id) {
    const com = comunicadosLista.find(c => c.id === id);
    if (!com) return;

    document.getElementById('modal-titulo').textContent = com.titulo;
    document.getElementById('modal-professor').textContent = com.professor;
    document.getElementById('modal-materia').textContent = com.materia;
    document.getElementById('modal-data').textContent = com.dataCriacao;
    document.getElementById('modal-conteudo').textContent = com.conteudo;

    document.getElementById('modal-comunicado').classList.add('show');
    document.body.style.overflow = 'hidden';
}

function fecharModal() {
    document.getElementById('modal-comunicado').classList.remove('show');
    document.body.style.overflow = 'auto';
}
