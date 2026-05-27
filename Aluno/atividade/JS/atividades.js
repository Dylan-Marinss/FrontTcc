// Configuração
const API_URL = 'http://localhost:8080';
const ID_ALUNO_LOGADO = 1;

// Estado global
let todasAtividades = [];
let atividadesRespondidas = [];
let dadosAluno = null;
let atividadeAtual = null;
let perguntasAtuais = [];
let respostasTextuais = {};

// Inicialização
document.addEventListener('DOMContentLoaded', async () => {
    await carregarDadosAluno();
    await carregarAtividades();
    await popularFiltros();
    await carregarAtividadesRespondidas();
    renderizarAtividades();
});

// Carregar dados do aluno
async function carregarDadosAluno() {
    try {
        const response = await fetch(`${API_URL}/alunos/${ID_ALUNO_LOGADO}`);
        if (!response.ok) throw new Error('Erro ao carregar aluno');

        dadosAluno = await response.json();

    } catch (error) {
        console.error('Erro ao carregar aluno:', error);
    }
}

// Carregar todas as atividades
async function carregarAtividades() {
    const container = document.getElementById('atividadesList');
    container.innerHTML = '<div class="loading-state"><i class="fas fa-spinner fa-pulse"></i><p>Carregando atividades...</p></div>';

    try {
        const response = await fetch(`${API_URL}/atividades`);
        if (!response.ok) throw new Error('Erro ao carregar atividades');

        todasAtividades = await response.json();
        document.getElementById('totalAtividades').textContent = todasAtividades.length;


    } catch (error) {
        console.error('Erro:', error);
        container.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><p>Erro ao carregar atividades</p></div>';
    }
}

// Carregar atividades já respondidas pelo aluno
async function carregarAtividadesRespondidas() {
    try {
        const response = await fetch(`${API_URL}/atividadesrespostas`);
        if (response.ok) {
            atividadesRespondidas = await response.json();

            // Filtra apenas as do aluno logado
            const minhasRespostas = atividadesRespondidas.filter(r =>
                r.aluno?.id === ID_ALUNO_LOGADO
            );

            document.getElementById('atividadesConcluidas').textContent = minhasRespostas.length;

            if (minhasRespostas.length > 0) {
                const soma = minhasRespostas.reduce((acc, r) => acc + (r.pontuacao || 0), 0);
                const media = (soma / minhasRespostas.length).toFixed(1);
                // só atualiza se o elemento existir
                const el = document.getElementById('mediaGeral');
                if (el) el.textContent = media;
            }
        }
    } catch (error) {
        console.error('Erro ao carregar respostas:', error);
    }
}

// Renderizar lista de atividades
const ITENS_POR_PAGINA = 12;
let paginaAtual = 1;

function renderizarAtividades() {
    const container = document.getElementById('atividadesList');
    const filtroStatus = document.getElementById('statusFilter')?.value || '';
    const busca = document.getElementById('searchAtividade')?.value.toLowerCase() || '';
    const filtroDificuldade = document.getElementById('dificuldadeFilter')?.value || '';
    const filtroDisciplina = document.getElementById('disciplinaFilter')?.value || '';

    let atividadesFiltradas = [...todasAtividades];

    if (filtroStatus === 'pendente') {
        atividadesFiltradas = atividadesFiltradas.filter(a => !isAtividadeConcluida(a.idAtividade));
    } else if (filtroStatus === 'concluida') {
        atividadesFiltradas = atividadesFiltradas.filter(a => isAtividadeConcluida(a.idAtividade));
    }

    if (busca) {
        atividadesFiltradas = atividadesFiltradas.filter(a =>
            a.titulo?.toLowerCase().includes(busca)
        );
    }

    if (filtroDificuldade) {
        atividadesFiltradas = atividadesFiltradas.filter(a =>
            a.nivelDificuldade?.nome === filtroDificuldade
        );
    }

    if (filtroDisciplina) {
        atividadesFiltradas = atividadesFiltradas.filter(a =>
            a.disciplina?.nome === filtroDisciplina
        );
    }

    if (atividadesFiltradas.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-inbox"></i>
                <p>Nenhuma atividade encontrada.</p>
            </div>
        `;
        return;
    }

    // Paginação
    const totalPaginas = Math.ceil(atividadesFiltradas.length / ITENS_POR_PAGINA);
    if (paginaAtual > totalPaginas) paginaAtual = 1;

    const inicio = (paginaAtual - 1) * ITENS_POR_PAGINA;
    const atividadesPagina = atividadesFiltradas.slice(inicio, inicio + ITENS_POR_PAGINA);

    container.innerHTML = atividadesPagina.map(atividade => {
        const concluida = isAtividadeConcluida(atividade.idAtividade);
        const resposta = atividadesRespondidas.find(
            r => r.atividade?.idAtividade === atividade.idAtividade && r.aluno?.id === ID_ALUNO_LOGADO
        );
        const nota = resposta?.pontuacao ?? '—';

        return `
            <div class="atividade-card" onclick="abrirAtividade(${atividade.idAtividade})">
                <h3><i class="fas fa-file-alt" style="color: var(--primary-color); margin-right: 8px;"></i>${escapeHtml(atividade.titulo || 'Sem título')}</h3>
                <div class="info">
                    <span><i class="fas fa-calendar-alt"></i> ${formatarData(atividade.dataCriacao)}</span>
                    <span class="pontuacao"><i class="fas fa-star"></i> Max: ${atividade.pontuacaoMaxima || 0} pts</span>
                </div>
                <div class="info">
                    <span><i class="fas fa-chart-line"></i> Nível: ${atividade.nivelDificuldade?.nome || 'Não definido'}</span>
                </div>
                <div class="info">
                    <span><i class="fas fa-book"></i> Disciplina: ${atividade.disciplina?.nome || 'Não definida'}</span>
                    <span class="status ${concluida ? 'concluida' : 'pendente'}">
                        ${concluida ? 'Respondida' : 'Pendente'}
                    </span>
                </div>
                ${concluida ? `
                    <div class="nota-aluno">
                        <span class="nota-label-card">Sua nota</span>
                        <span class="nota-valor">${nota} / ${atividade.pontuacaoMaxima || 0}</span>
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');

    // Paginação HTML
    if (totalPaginas > 1) {
        container.insertAdjacentHTML('afterend', '');
        let paginacaoEl = document.getElementById('paginacao');
        if (!paginacaoEl) {
            paginacaoEl = document.createElement('div');
            paginacaoEl.id = 'paginacao';
            container.insertAdjacentElement('afterend', paginacaoEl);
        }

        paginacaoEl.innerHTML = `
            <div style="
                display: flex;
                justify-content: center;
                align-items: center;
                gap: 15px;
                margin-top: 30px;
                font-family: var(--font-main);
            ">
                <button onclick="mudarPagina(${paginaAtual - 1})" 
                    ${paginaAtual === 1 ? 'disabled' : ''}
                    style="
                        background: ${paginaAtual === 1 ? 'rgba(187,134,252,0.1)' : 'linear-gradient(135deg, #BB86FC, #a21fa2)'};
                        color: ${paginaAtual === 1 ? 'var(--text-muted)' : '#000'};
                        border: none; padding: 10px 20px; border-radius: 30px;
                        cursor: ${paginaAtual === 1 ? 'not-allowed' : 'pointer'};
                        font-weight: 700; transition: all 0.3s;
                    ">
                    <i class="fas fa-chevron-left"></i> Anterior
                </button>

                <span style="color: var(--text-muted); font-size: 0.9rem;">
                    Página <strong style="color: var(--primary-color);">${paginaAtual}</strong> de <strong style="color: var(--primary-color);">${totalPaginas}</strong>
                </span>

                <button onclick="mudarPagina(${paginaAtual + 1})"
                    ${paginaAtual === totalPaginas ? 'disabled' : ''}
                    style="
                        background: ${paginaAtual === totalPaginas ? 'rgba(187,134,252,0.1)' : 'linear-gradient(135deg, #BB86FC, #a21fa2)'};
                        color: ${paginaAtual === totalPaginas ? 'var(--text-muted)' : '#000'};
                        border: none; padding: 10px 20px; border-radius: 30px;
                        cursor: ${paginaAtual === totalPaginas ? 'not-allowed' : 'pointer'};
                        font-weight: 700; transition: all 0.3s;
                    ">
                    Próxima <i class="fas fa-chevron-right"></i>
                </button>
            </div>
        `;
    } else {
        const paginacaoEl = document.getElementById('paginacao');
        if (paginacaoEl) paginacaoEl.innerHTML = '';
    }
}

function mudarPagina(novaPagina) {
    paginaAtual = novaPagina;
    renderizarAtividades();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Verificar se atividade foi concluída
function isAtividadeConcluida(idAtividade) {
    return atividadesRespondidas.some(
        r => r.atividade?.idAtividade === idAtividade && r.aluno?.id === ID_ALUNO_LOGADO
    );
}

// Filtrar atividades
function filterAtividades() {
    paginaAtual = 1;
    renderizarAtividades();
}

// Abrir atividade para responder
async function abrirAtividade(idAtividade) {
    atividadeAtual = todasAtividades.find(a => a.idAtividade === idAtividade);
    if (!atividadeAtual) return;

    if (isAtividadeConcluida(idAtividade)) {
        showAlert('⚠️ Você já realizou esta atividade!', 'error');
        return;
    }

    window.location.href = `responderAtividade.html?id=${idAtividade}`;
}

// Carregar perguntas da atividade
async function carregarPerguntas(idAtividade) {
    try {
        const response = await fetch(`${API_URL}/atividadesPergunta`);
        if (!response.ok) throw new Error('Erro ao carregar perguntas');

        const todasPerguntas = await response.json();
        perguntasAtuais = todasPerguntas.filter(p => p.atividade?.idAtividade === idAtividade);

        if (perguntasAtuais.length === 0) {
            showAlert('Esta atividade não possui perguntas!', 'error');
            return;
        }

        respostasTextuais = {};

        document.getElementById('modalTitulo').textContent = atividadeAtual.titulo;

        document.getElementById('modalInfoAtividade').innerHTML = `
    <div class="atividade-info-box">
        <div class="atividade-info-item">
            <i class="fas fa-book"></i>
            <div>
                <span>Disciplina</span>
                <strong>${atividadeAtual.disciplina?.nome || 'Não definida'}</strong>
            </div>
        </div>

        <div class="atividade-info-item">
            <i class="fas fa-layer-group"></i>
            <div>
                <span>Dificuldade</span>
                <strong>${atividadeAtual.nivelDificuldade?.nome || 'Não definida'}</strong>
            </div>
        </div>

        <div class="atividade-info-item">
            <i class="fas fa-star"></i>
            <div>
                <span>Pontuação</span>
                <strong>${atividadeAtual.pontuacaoMaxima || 0} pts</strong>
            </div>
        </div>

        <div class="atividade-info-item">
            <i class="fas fa-calendar"></i>
            <div>
                <span>Criada em</span>
                <strong>${formatarData(atividadeAtual.dataCriacao)}</strong>
            </div>
        </div>
    </div>
`;

        document.getElementById('perguntasContainer').innerHTML = renderizarPerguntas();

        document.getElementById('modalAtividade').style.display = 'block';
        document.body.style.overflow = 'hidden';



    } catch (error) {
        console.error('Erro ao carregar perguntas:', error);
        showAlert('Erro ao carregar perguntas da atividade', 'error');
    }
}

// Renderizar perguntas no modal
function renderizarPerguntas() {
    if (perguntasAtuais.length === 0) {
        return '<div class="empty-state">Nenhuma pergunta encontrada</div>';
    }

    return perguntasAtuais.map((pergunta, idx) => `
        <div class="pergunta-item">
            <div class="pergunta-texto">
                <strong>${idx + 1}.</strong> ${escapeHtml(pergunta.enunciado)}
            </div>
            <textarea 
                class="resposta-textarea" 
                id="resposta_${pergunta.id}" 
                rows="4" 
                placeholder="Digite sua resposta aqui..."
                oninput="salvarResposta(${pergunta.id}, this.value)"
            >${respostasTextuais[pergunta.id] || ''}</textarea>
        </div>
    `).join('');
}

// Salvar resposta textual
function salvarResposta(idPergunta, valor) {
    respostasTextuais[idPergunta] = valor;
}

// Enviar respostas
async function enviarRespostas() {
    // Verificar se todas as perguntas foram respondidas
    const totalPerguntas = perguntasAtuais.length;
    const respondidas = Object.keys(respostasTextuais).filter(key => respostasTextuais[key]?.trim()).length;

    if (respondidas < totalPerguntas) {
        showAlert(`⚠️ Responda todas as perguntas! (${respondidas}/${totalPerguntas})`, 'error');
        return;
    }

    const submitBtn = document.querySelector('#modalAtividade .btn-submit');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-pulse"></i> Enviando...';
    submitBtn.disabled = true;

    try {
        // Montar objeto da resposta (como o professor vai corrigir, a pontuação começa como null)
        const respostaData = {
            idAluno: ID_ALUNO_LOGADO,
            idAtividade: atividadeAtual.idAtividade,
            momentoInicio: new Date().toISOString(),
            momentoFim: new Date().toISOString(),
            pontuacao: null, // Aguardando correção do professor
            respostas: respostasTextuais
        };

        const response = await fetch(`${API_URL}/atividadesrespostas`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(respostaData)
        });

        if (!response.ok) throw new Error('Erro ao salvar respostas');

        showAlert(`✅ Atividade enviada! Aguarde a correção do professor.`, 'success');

        closeModalAtividade();
        await carregarAtividadesRespondidas();
        renderizarAtividades();

    } catch (error) {
        console.error('Erro:', error);
        showAlert('❌ Erro ao enviar respostas', 'error');
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

// Fechar modal
function closeModalAtividade() {
    document.getElementById('modalAtividade').style.display = 'none';
    document.body.style.overflow = 'auto';
    perguntasAtuais = [];
    respostasTextuais = {};
}

// Formatar data
function formatarData(dataString) {
    if (!dataString) return 'Data não disponível';
    try {
        const data = new Date(dataString);
        if (isNaN(data.getTime())) return dataString;
        return data.toLocaleDateString('pt-BR');
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

// Menu toggle
const menuToggle = document.getElementById('menu-toggle');
if (menuToggle) {
    menuToggle.addEventListener('click', function () {
        const sidebar = document.querySelector('.sidebar');
        if (sidebar) sidebar.classList.toggle('active');
    });
}

// Animações
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeOut {
        from { opacity: 1; transform: translateX(0); }
        to { opacity: 0; transform: translateX(100%); }
    }
`;
document.head.appendChild(style);

function popularFiltros() {
    const dificuldades = [...new Set(
        todasAtividades
            .map(a => a.nivelDificuldade?.nome)
            .filter(Boolean)
    )];

    const disciplinas = [...new Set(
        todasAtividades
            .map(a => a.disciplina?.nome)
            .filter(Boolean)
    )];

    const difSelect = document.getElementById('dificuldadeFilter');
    dificuldades.forEach(d => {
        const opt = document.createElement('option');
        opt.value = d;
        opt.textContent = d;
        difSelect.appendChild(opt);
    });

    const discSelect = document.getElementById('disciplinaFilter');
    disciplinas.forEach(d => {
        const opt = document.createElement('option');
        opt.value = d;
        opt.textContent = d;
        discSelect.appendChild(opt);
    });
}