// ============================================================
//  CONFIGURAÇÃO
// ============================================================
const API_URL = 'http://localhost:8080';
const ID_ALUNO_LOGADO = 1;

// ============================================================
//  ESTADO GLOBAL
// ============================================================
let todasDuvidas = [];
let dadosAluno = null;
let duvidaIdParaDeletar = null;
let duvidaIdParaEditar = null;
let todasRespostas = [];

// ============================================================
//  INICIALIZAÇÃO
// ============================================================
document.addEventListener('DOMContentLoaded', async () => {
    await carregarDadosAluno();
    await carregarDisciplinas();
    await carregarMinhasDuvidas();
    inicializarSidebar();
    inicializarFechamentoModais();
    injetarAnimacoes();
});

// ============================================================
//  DADOS
// ============================================================
async function carregarDadosAluno() {
    try {
        const response = await fetch(`${API_URL}/alunos/${ID_ALUNO_LOGADO}`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        dadosAluno = await response.json();

        const serieElement = document.getElementById('serieAluno');
        if (serieElement) {
            serieElement.textContent = dadosAluno.serie?.nomeSerie || dadosAluno.serie || 'Não definida';
        }
    } catch (error) {
        console.error('Erro ao carregar aluno:', error);
    }
}

async function carregarDisciplinas() {
    try {
        const response = await fetch(`${API_URL}/disciplinas`);
        const disciplinas = await response.json();

        // Só configura o trigger, não insere options ainda
        const trigger = document.querySelector('#customSelectDisciplina .custom-select-trigger');

        trigger.addEventListener('click', () => {
            const wrapper = document.getElementById('customSelectDisciplina');
            const options = document.getElementById('customSelectOptions');
            const rect = trigger.getBoundingClientRect();

            // Insere as options se ainda não foram inseridas
            if (options.children.length === 0) {
                disciplinas.forEach(d => {
                    const option = document.createElement('div');
                    option.className = 'custom-option';
                    option.dataset.value = d.id;
                    option.textContent = d.nome;

                    option.addEventListener('click', (e) => {
                        e.stopPropagation();
                        document.getElementById('disciplina').value = d.id;
                        document.getElementById('customSelectText').textContent = d.nome;

                        options.querySelectorAll('.custom-option').forEach(o => o.classList.remove('selected'));
                        option.classList.add('selected');

                        wrapper.classList.remove('open');
                    });

                    options.appendChild(option);
                });
            }

            options.style.top = (rect.bottom + 4) + 'px';
            options.style.left = rect.left + 'px';
            options.style.width = rect.width + 'px';

            wrapper.classList.toggle('open');
        });

        document.addEventListener('click', (e) => {
            if (!e.target.closest('#customSelectDisciplina')) {
                document.getElementById('customSelectDisciplina').classList.remove('open');
            }
        });

    } catch (erro) {
        console.error('Erro ao carregar disciplinas:', erro);
    }
}

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
        const [todasResponse, respostas] = await Promise.all([
            fetch(`${API_URL}/duvidas`),
            carregarRespostas()
        ]);

        if (!todasResponse.ok) throw new Error(`HTTP ${todasResponse.status}`);

        const todas = await todasResponse.json();
        todasDuvidas = todas.filter(d => d.utilizador?.id == ID_ALUNO_LOGADO);

        // Cria um Set com os idDuvida que já têm resposta
        const idsRespondidos = new Set(respostas.map(r => r.idDuvida));

        // Injeta o status real em cada dúvida
        todasDuvidas = todasDuvidas.map(d => ({
            ...d,
            statusDuvida: idsRespondidos.has(d.idDuvida) ? 'Respondida' : 'Aberta'
        }));

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

function popularFiltroDisciplinas() {
    const select = document.getElementById('disciplinaFilter');
    if (!select) return;

    const idsVistos = new Set();
    const disciplinasUnicas = [];

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

// ============================================================
//  RENDERIZAÇÃO
// ============================================================
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
        const status = duvida.statusDuvida || 'Aberta';
        const disciplina = duvida.disciplina?.nome || 'Sem disciplina';

        return `
        <div class="duvida-card ${status === 'Respondida' ? 'card-respondida' : ''}" 
        id="card-${duvida.idDuvida}"
        ${status === 'Respondida' ? `onclick="abrirModalResposta(${duvida.idDuvida})"` : ''}>
        <div class="card-actions">
        ${status !== 'Respondida' ? `
        <button class="btn-card-action btn-editar" title="Editar dúvida"
        onclick="event.stopPropagation(); abrirModalEditar(${duvida.idDuvida}, '${escapeHtml(titulo)}', '${duvida.disciplina?.id}', '${escapeHtml(descricao)}')">
        <i class="fas fa-pencil-alt"></i>
        </button>` : ''}
        <button class="btn-card-action btn-deletar" title="Excluir dúvida"
        onclick="event.stopPropagation(); deletarDuvida(${duvida.idDuvida})">
        <i class="fas fa-times"></i>
        </button>
        </div>
        <h3>
        <i class="fas fa-question-circle" style="color: var(--primary-color); margin-right: 8px;"></i>
        ${escapeHtml(titulo)}
        </h3>
        <div class="descricao">${escapeHtml(descricao)}</div>
        <div class="meta">
        <span><i class="far fa-calendar-alt"></i> ${formatarData(duvida.momento)}</span>
        <span><i class="fas fa-book"></i> ${escapeHtml(disciplina)}</span>
        <span class="status-badge ${status}">${status}</span>
        </div>
        </div>
        `;
    }).join('');
}

async function carregarRespostas() {
    try {
        const response = await fetch(`${API_URL}/respostasDuvidas`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        todasRespostas = await response.json();
        return todasRespostas;
    } catch (error) {
        console.error('Erro ao carregar respostas:', error);
        todasRespostas = [];
        return [];
    }
}

function abrirModalResposta(idDuvida) {
    const resposta = todasRespostas.find(r => r.idDuvida === idDuvida);
    if (!resposta) return showAlert('Resposta não encontrada.', 'error');

    const duvida = todasDuvidas.find(d => d.idDuvida === idDuvida);

    document.getElementById('modalRespostaTitulo').textContent = duvida?.titulo || 'Dúvida';
    document.getElementById('modalRespostaConteudo').textContent = resposta.conteudoResposta || 'Sem conteúdo.';
    document.getElementById('modalRespostaData').textContent = formatarData(resposta.momento);
    document.getElementById('modalRespostaProfessor').textContent = resposta.utilizador?.nome || 'Professor';

    const modal = document.getElementById('modalResposta');
    modal.style.display = 'flex';
    requestAnimationFrame(() => requestAnimationFrame(() => modal.classList.add('active')));
}

function fecharModalResposta() {
    const modal = document.getElementById('modalResposta');
    modal.classList.remove('active');
    setTimeout(() => modal.style.display = 'none', 200);
}

// ============================================================
//  FILTROS
// ============================================================
function filterDuvidas() {
    const searchTerm = document.getElementById('searchDuvida')?.value.toLowerCase() || '';
    const statusFilter = document.getElementById('statusFilter')?.value || '';
    const disciplinaFilter = document.getElementById('disciplinaFilter')?.value || '';

    let filtradas = [...todasDuvidas];

    if (searchTerm) {
        filtradas = filtradas.filter(d =>
            d.titulo?.toLowerCase().includes(searchTerm) ||
            d.descricao?.toLowerCase().includes(searchTerm)
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

// ============================================================
//  NOVA DÚVIDA
// ============================================================
async function submitDuvida(event) {
    event.preventDefault();

    const titulo = document.getElementById('titulo').value.trim();
    const descricao = document.getElementById('descricao').value.trim();
    const idDisciplinaSelecionada = document.getElementById('disciplina').value;

    if (!titulo || !descricao) return showAlert('Preencha todos os campos!', 'error');
    if (!idDisciplinaSelecionada) return showAlert('Selecione uma disciplina!', 'error');

    const submitBtn = document.querySelector('.btn-submit');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-pulse"></i> Enviando...';
    submitBtn.disabled = true;

    const novaDuvida = {
        titulo,
        descricao,
        momento: new Date().toISOString(),
        statusDuvida: 'Aberta',
        utilizador: { id: ID_ALUNO_LOGADO },
        disciplina: { id: parseInt(idDisciplinaSelecionada) }
    };

    try {
        const response = await fetch(`${API_URL}/duvidas`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(novaDuvida)
        });

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

// ============================================================
//  DELETAR
// ============================================================
function deletarDuvida(id) {
    duvidaIdParaDeletar = id;
    const modal = document.getElementById('modalConfirmDelete');
    modal.style.display = 'flex';
    requestAnimationFrame(() => requestAnimationFrame(() => modal.classList.add('active')));
}

function fecharConfirmDelete() {
    duvidaIdParaDeletar = null;
    const modal = document.getElementById('modalConfirmDelete');
    modal.classList.remove('active');
    setTimeout(() => modal.style.display = 'none', 200);
}

async function confirmarDelete() {
    if (!duvidaIdParaDeletar) return;

    const btnConfirmar = document.getElementById('btnConfirmarDelete');
    btnConfirmar.disabled = true;
    btnConfirmar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Excluindo...';

    try {
        const response = await fetch(`${API_URL}/duvidas/${duvidaIdParaDeletar}`, {
            method: 'DELETE'
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const card = document.getElementById(`card-${duvidaIdParaDeletar}`);
        if (card) {
            card.style.transition = 'opacity 0.3s, transform 0.3s';
            card.style.opacity = '0';
            card.style.transform = 'scale(0.9)';
            setTimeout(() => card.remove(), 300);
        }

        todasDuvidas = todasDuvidas.filter(d => d.idDuvida !== duvidaIdParaDeletar);
        document.getElementById('totalMinhasDuvidas').textContent = todasDuvidas.length;

        fecharConfirmDelete();
        showAlert('✅ Dúvida excluída com sucesso!', 'success');
    } catch (error) {
        console.error('Erro ao excluir:', error);
        showAlert('❌ Erro ao excluir a dúvida.', 'error');
    } finally {
        btnConfirmar.disabled = false;
        btnConfirmar.innerHTML = '<i class="fas fa-trash"></i> Sim, excluir';
    }
}

// ============================================================
//  EDITAR
// ============================================================
async function abrirModalEditar(id, titulo, disciplinaId, descricao) {
    duvidaIdParaEditar = id;

    document.getElementById('editTitulo').value = titulo;
    document.getElementById('editDescricao').value = descricao;
    document.getElementById('editDisciplina').value = disciplinaId;

    const optionsContainer = document.getElementById('customSelectEditOptions');

    if (optionsContainer.children.length === 0) {
        try {
            const response = await fetch(`${API_URL}/disciplinas`);
            const disciplinas = await response.json();

            disciplinas.forEach(d => {
                const option = document.createElement('div');
                option.className = 'custom-option';
                option.dataset.value = d.id;
                option.textContent = d.nome;

                option.addEventListener('click', (e) => {
                    e.stopPropagation();
                    document.getElementById('editDisciplina').value = d.id;
                    document.getElementById('customSelectEditText').textContent = d.nome;

                    optionsContainer.querySelectorAll('.custom-option').forEach(o => o.classList.remove('selected'));
                    option.classList.add('selected');

                    document.getElementById('customSelectEditDisciplina').classList.remove('open');
                });

                optionsContainer.appendChild(option);
            });
        } catch (e) {
            console.error('Erro ao carregar disciplinas no editar:', e);
        }
    }

    // Marca a disciplina atual
    optionsContainer.querySelectorAll('.custom-option').forEach(o => {
        o.classList.remove('selected');
        if (o.dataset.value == disciplinaId) {
            o.classList.add('selected');
            document.getElementById('customSelectEditText').textContent = o.textContent;
        }
    });

    // Trigger abrir/fechar
    const trigger = document.querySelector('#customSelectEditDisciplina .custom-select-trigger');
    trigger.onclick = () => {
        const wrapper = document.getElementById('customSelectEditDisciplina');
        const rect = trigger.getBoundingClientRect();

        optionsContainer.style.top = (rect.bottom + 4) + 'px';
        optionsContainer.style.left = rect.left + 'px';
        optionsContainer.style.width = rect.width + 'px';

        wrapper.classList.toggle('open');
    };

    const modal = document.getElementById('modalEditar');
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function fecharModalEditar() {
    duvidaIdParaEditar = null;
    document.getElementById('modalEditar').style.display = 'none';
    document.getElementById('editarForm').reset();
    document.body.style.overflow = 'auto';
}

async function salvarEdicao(event) {
    event.preventDefault();
    if (!duvidaIdParaEditar) return;

    const titulo = document.getElementById('editTitulo').value.trim();
    const descricao = document.getElementById('editDescricao').value.trim();
    const disciplinaId = document.getElementById('editDisciplina').value;

    const submitBtn = document.querySelector('#editarForm .btn-submit');
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-pulse"></i> Salvando...';
    submitBtn.disabled = true;

    const body = {
        idDuvida: duvidaIdParaEditar,
        titulo,
        descricao,
        momento: new Date().toISOString(),
        statusDuvida: 'Aberta',
        utilizador: { id: ID_ALUNO_LOGADO },
        disciplina: { id: parseInt(disciplinaId) }
    };

    try {
        const response = await fetch(`${API_URL}/duvidas/${duvidaIdParaEditar}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        fecharModalEditar();
        showAlert('✅ Dúvida atualizada com sucesso!', 'success');
        await carregarMinhasDuvidas();
    } catch (error) {
        console.error('Erro ao editar:', error);
        showAlert('❌ Erro ao salvar alterações.', 'error');
    } finally {
        submitBtn.innerHTML = '<i class="fas fa-save"></i> Salvar alterações';
        submitBtn.disabled = false;
    }
}

// ============================================================
//  MODAIS — abrir / fechar
// ============================================================
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

// ============================================================
//  UTILITÁRIOS
// ============================================================
function formatarData(dataString) {
    if (!dataString) return 'Data não disponível';
    try {
        const data = new Date(dataString);
        if (isNaN(data.getTime())) return dataString;
        return data.toLocaleDateString('pt-BR') + ' ' +
            data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } catch {
        return dataString;
    }
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

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

// ============================================================
//  INICIALIZAÇÕES AUXILIARES
// ============================================================
function inicializarSidebar() {
    const menuToggle = document.getElementById('menu-toggle');
    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            document.querySelector('.sidebar')?.classList.toggle('active');
        });
    }
}

function inicializarFechamentoModais() {
    window.onclick = function (event) {
        if (event.target === document.getElementById('modalConfirmDelete')) fecharConfirmDelete();
        if (event.target === document.getElementById('modalEditar')) fecharModalEditar();
        if (event.target === document.getElementById('modal')) closeModal();
        if (event.target === document.getElementById('modalResposta')) fecharModalResposta();
    };
}

function injetarAnimacoes() {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeOut {
            from { opacity: 1; transform: translateX(0); }
            to   { opacity: 0; transform: translateX(100%); }
        }
    `;
    document.head.appendChild(style);
}

