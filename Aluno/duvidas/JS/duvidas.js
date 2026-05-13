// Configuração
const API_URL = 'http://localhost:8080';
const ID_ALUNO_LOGADO = 1;

// Estado global
let todasDuvidas = [];
let dadosAluno = null;

// Inicialização
document.addEventListener('DOMContentLoaded', async () => {
    await carregarDadosAluno();
    await carregarDisciplinas();
    await carregarMinhasDuvidas();
});

// Carregar dados do aluno logado
async function carregarDadosAluno() {
    try {
        const response = await fetch(`${API_URL}/alunos/${ID_ALUNO_LOGADO}`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        dadosAluno = await response.json();

        const serieElement = document.getElementById('serieAluno');
        if (serieElement) {
            const nomeSerie = dadosAluno.serie?.nomeSerie || dadosAluno.serie || 'Não definida';
            serieElement.textContent = nomeSerie;
        }
    } catch (error) {
        console.error('Erro ao carregar aluno:', error);
    }
}

// Carregar disciplinas no select do formulário
async function carregarDisciplinas() {
    const select = document.getElementById("disciplina");
    if (!select) return;

    try {
        const response = await fetch(`${API_URL}/disciplinas`);
        const disciplinas = await response.json();

        select.innerHTML = '<option value="">Selecione uma disciplina</option>';
        disciplinas.forEach(d => {
            const option = document.createElement("option");
            option.value = d.id;
            option.textContent = d.nome;
            select.appendChild(option);
        });
    } catch (erro) {
        console.error("Erro ao carregar disciplinas:", erro);
        select.innerHTML = '<option value="">Erro ao carregar disciplinas</option>';
    }
}

// Carregar apenas as dúvidas do aluno logado
async function carregarMinhasDuvidas() {
    const container = document.getElementById('duvidasList');
    if (container) {
        container.innerHTML = `
            <div class="loading-state">
                <i class="fas fa-spinner fa-pulse"></i>
                <p>Carregando suas dúvidas...</p>
            </div>
        `;
    }

    try {
        const response = await fetch(`${API_URL}/duvidas`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const todas = await response.json();

        todasDuvidas = todas.filter(duvida => duvida.utilizador?.id == ID_ALUNO_LOGADO);

        popularFiltroDisciplinas();

        const totalElement = document.getElementById('totalMinhasDuvidas');
        if (totalElement) totalElement.textContent = todasDuvidas.length;

        renderizarDuvidas(todasDuvidas);

    } catch (error) {
        console.error('Erro ao carregar dúvidas:', error);
        if (container) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Erro ao carregar dúvidas</p>
                </div>
            `;
        }
    }
}

// Popular o filtro de disciplinas com base nas dúvidas do aluno
function popularFiltroDisciplinas() {
    const select = document.getElementById('disciplinaFilter');
    if (!select) return;

    const disciplinasUnicas = [];
    const idsVistos = new Set();

    todasDuvidas.forEach(duvida => {
        const disc = duvida.disciplina;
        if (disc && !idsVistos.has(disc.id)) {
            idsVistos.add(disc.id);
            disciplinasUnicas.push(disc);
        }
    });

    select.innerHTML = '<option value="">Todas as disciplinas</option>';
    disciplinasUnicas.forEach(disc => {
        const option = document.createElement('option');
        option.value = disc.id;
        option.textContent = disc.nome;
        select.appendChild(option);
    });
}

// Renderizar lista de dúvidas
function renderizarDuvidas(duvidas) {
    const container = document.getElementById('duvidasList');
    if (!container) return;

    if (duvidas.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-inbox"></i>
                <p>Você ainda não tem nenhuma dúvida.</p>
                <button class="btn-primary" onclick="openModal()" style="margin-top: 15px;">
                    <i class="fas fa-plus"></i> Criar minha primeira dúvida
                </button>
            </div>
        `;
        return;
    }

    container.innerHTML = duvidas.map(duvida => {
        const titulo = duvida.titulo || 'Sem título';
        const descricao = duvida.descricao || 'Sem descrição';
        const momento = duvida.momento;
        const status = duvida.statusDuvida || 'Aberta';
        const disciplina = duvida.disciplina?.nome || 'Sem disciplina';

        return `
            <div class="duvida-card">
                <h3><i class="fas fa-question-circle" style="color: var(--primary-color); margin-right: 8px;"></i>${escapeHtml(titulo)}</h3>
                <div class="descricao">${escapeHtml(descricao)}</div>
                <div class="meta">
                    <span><i class="far fa-calendar-alt"></i> ${formatarData(momento)}</span>
                    <span><i class="fas fa-book"></i> ${escapeHtml(disciplina)}</span>
                    <span class="status-badge ${status}">${status}</span>
                </div>
            </div>
        `;
    }).join('');
}

// Filtrar dúvidas
function filterDuvidas() {
    const searchTerm = document.getElementById('searchDuvida')?.value.toLowerCase() || '';
    const statusFilter = document.getElementById('statusFilter')?.value || '';
    const disciplinaFilter = document.getElementById('disciplinaFilter')?.value || '';

    let filtradas = [...todasDuvidas];

    if (searchTerm) {
        filtradas = filtradas.filter(d =>
            (d.titulo && d.titulo.toLowerCase().includes(searchTerm)) ||
            (d.descricao && d.descricao.toLowerCase().includes(searchTerm))
        );
    }

    if (statusFilter) {
        filtradas = filtradas.filter(d => (d.statusDuvida || 'Aberta') === statusFilter);
    }

    if (disciplinaFilter) {
        filtradas = filtradas.filter(d => String(d.disciplina?.id) === disciplinaFilter);
    }

    renderizarDuvidas(filtradas);
}

// Enviar nova dúvida
async function submitDuvida(event) {
    event.preventDefault();

    const titulo = document.getElementById('titulo').value.trim();
    const descricao = document.getElementById('descricao').value.trim();
    const idDisciplinaSelecionada = document.getElementById("disciplina").value;

    if (!titulo || !descricao) {
        showAlert('Preencha todos os campos!', 'error');
        return;
    }

    if (!idDisciplinaSelecionada) {
        showAlert('Selecione uma disciplina!', 'error');
        return;
    }

    const submitBtn = document.querySelector('.btn-submit');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-pulse"></i> Enviando...';
    submitBtn.disabled = true;

    const novaDuvida = {
        titulo: titulo,
        descricao: descricao,
        momento: new Date().toISOString(),
        statusDuvida: "Aberta",
        utilizador: { id: ID_ALUNO_LOGADO },
        disciplina: { id: parseInt(idDisciplinaSelecionada) }
    };

    try {
        const response = await fetch(`${API_URL}/duvidas`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(novaDuvida)
        });

        const responseText = await response.text();

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        document.getElementById('duvidaForm').reset();
        closeModal();
        showAlert('✅ Dúvida enviada com sucesso!', 'success');
        await carregarMinhasDuvidas();

    } catch (error) {
        console.error('Erro:', error);
        showAlert('❌ Erro ao enviar dúvida: ' + error.message, 'error');
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

// Formatar data
function formatarData(dataString) {
    if (!dataString) return 'Data não disponível';
    try {
        const data = new Date(dataString);
        if (isNaN(data.getTime())) return dataString;
        return data.toLocaleDateString('pt-BR') + ' ' + data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } catch {
        return dataString;
    }
}

// Escape HTML
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Mostrar alerta
function showAlert(message, type) {
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i> ${message}`;
    document.body.appendChild(alert);

    setTimeout(() => {
        alert.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => alert.remove(), 300);
    }, 4000);
}

// Modal
function openModal() {
    const modal = document.getElementById('modal');
    if (modal) {
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }
}

function closeModal() {
    const modal = document.getElementById('modal');
    if (modal) {
        modal.style.display = 'none';
        document.getElementById('duvidaForm').reset();
        document.body.style.overflow = 'auto';
    }
}

window.onclick = function (event) {
    const modal = document.getElementById('modal');
    if (event.target === modal) closeModal();
}

const menuToggle = document.getElementById('menu-toggle');
if (menuToggle) {
    menuToggle.addEventListener('click', function () {
        const sidebar = document.querySelector('.sidebar');
        if (sidebar) sidebar.classList.toggle('active');
    });
}

const style = document.createElement('style');
style.textContent = `
    @keyframes fadeOut {
        from { opacity: 1; transform: translateX(0); }
        to { opacity: 0; transform: translateX(100%); }
    }
`;
document.head.appendChild(style);