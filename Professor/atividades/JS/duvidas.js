// ============================================================
//  CONFIGURACAO
// ============================================================
const API_URL = 'http://localhost:8080';
const ID_PROFESSOR_LOGADO = 6;

// ============================================================
//  ESTADO
// ============================================================
let duvidasLista = [];
let duvidasFiltradas = [];
let duvidasAtual = null;

// ============================================================
//  PAGINAÇÃO
// ============================================================
const ITENS_POR_PAGINA = 12;
let paginaAtual = 1;

// ============================================================
//  INICIALIZACAO
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    initCustomSelects();
    carregarDuvidas();
    configurarEventos();
});

// ============================================================
//  CUSTOM SELECT
// ============================================================
function initCustomSelects() {
    document.querySelectorAll('.custom-select-trigger').forEach(trigger => {
        trigger.addEventListener('click', () => {
            const sel = trigger.closest('.custom-select');
            const isOpen = sel.classList.contains('open');
            closeAllSelects();
            if (!isOpen) {
                sel.classList.add('open');
                positionOptions(sel);
            }
        });
    });

    document.addEventListener('click', e => {
        if (!e.target.closest('.custom-select')) closeAllSelects();
    });

    document.querySelectorAll('.custom-select').forEach(sel => {
        bindOptions(sel);
    });
}

function closeAllSelects() {
    document.querySelectorAll('.custom-select.open').forEach(s => s.classList.remove('open'));
}

function positionOptions(sel) {
    const trigger = sel.querySelector('.custom-select-trigger');
    const options = sel.querySelector('.custom-select-options');
    const rect = trigger.getBoundingClientRect();
    options.style.top   = (rect.bottom + 6) + 'px';
    options.style.left  = rect.left + 'px';
    options.style.width = rect.width + 'px';
}

function bindOptions(sel) {
    sel.querySelectorAll('.custom-option').forEach(opt => {
        opt.addEventListener('click', () => selectOption(sel, opt));
    });
}

function selectOption(sel, opt) {
    sel.querySelectorAll('.custom-option').forEach(o => o.classList.remove('selected'));
    opt.classList.add('selected');
    sel.querySelector('.custom-select-label').textContent = opt.textContent;
    sel.classList.remove('open');

    const hidden = sel.querySelector('select');
    if (hidden) {
        hidden.value = opt.dataset.value;
        hidden.dispatchEvent(new Event('change'));
    }
}

function popularCustomSelect(customSelectId, opcoes, labelPadrao) {
    const sel = document.getElementById(customSelectId);
    if (!sel) return;

    const container = sel.querySelector('.custom-select-options');
    container.innerHTML = '';

    const defaultOpt = document.createElement('div');
    defaultOpt.className = 'custom-option selected';
    defaultOpt.dataset.value = '';
    defaultOpt.textContent = labelPadrao;
    defaultOpt.addEventListener('click', () => selectOption(sel, defaultOpt));
    container.appendChild(defaultOpt);

    sel.querySelector('.custom-select-label').textContent = labelPadrao;

    opcoes.forEach(texto => {
        const opt = document.createElement('div');
        opt.className = 'custom-option';
        opt.dataset.value = texto;
        opt.textContent = texto;
        opt.addEventListener('click', () => selectOption(sel, opt));
        container.appendChild(opt);
    });
}

// ============================================================
//  CONFIGURAR EVENTOS
// ============================================================
function configurarEventos() {
    document.getElementById('search-input').addEventListener('input', () => {
        paginaAtual = 1;
        filtrarDuvidas();
    });
    document.getElementById('filter-disciplina').addEventListener('change', () => {
        paginaAtual = 1;
        filtrarDuvidas();
    });
    document.getElementById('filter-turma').addEventListener('change', () => {
        paginaAtual = 1;
        filtrarDuvidas();
    });
    document.getElementById('filter-status').addEventListener('change', () => {
        paginaAtual = 1;
        filtrarDuvidas();
    });

    document.getElementById('modal-resposta').addEventListener('click', (e) => {
        if (e.target.id === 'modal-resposta') fecharModal();
    });
}

// ============================================================
//  CARREGAR DÚVIDAS
// ============================================================
async function carregarDuvidas() {
    try {
        const [resDuvidas, resRespostas] = await Promise.all([
            fetch(`${API_URL}/duvidas`),
            fetch(`${API_URL}/respostasDuvidas`)
        ]);

        if (!resDuvidas.ok) throw new Error(`HTTP ${resDuvidas.status}`);

        let todasDuvidas = await resDuvidas.json();
        if (todasDuvidas.content) todasDuvidas = todasDuvidas.content;

        let idsRespondidos = new Set();
        let respostasMap = new Map();
        if (resRespostas.ok) {
            const respostas = await resRespostas.json();
            respostas.forEach(r => {
                if (r.idDuvida) {
                    idsRespondidos.add(r.idDuvida);
                    respostasMap.set(r.idDuvida, r.conteudoResposta || '');
                }
            });
        }

        duvidasLista = todasDuvidas.map(d => ({
            id: d.idDuvida,
            aluno: d.utilizador?.nome || 'Aluno desconhecido',
            disciplina: d.disciplina?.nome || 'Sem disciplina',
            turma: d.utilizador?.serie?.nomeSerie || d.utilizador?.turma || 'Sem turma',
            titulo: d.titulo || 'Sem título',
            descricao: d.descricao || '',
            data: formatarData(d.momento),
            status: idsRespondidos.has(d.idDuvida) ? 'respondida' : 'pendente',
            respondida: idsRespondidos.has(d.idDuvida),
            conteudoResposta: respostasMap.get(d.idDuvida) || '',
            _raw: d
        }));

        duvidasFiltradas = [...duvidasLista];
        renderizarDuvidas();
        atualizarEstatisticas();
        popularFiltros();

    } catch (err) {
        console.error('Erro ao carregar dúvidas:', err);
        showToast('Erro ao carregar dúvidas. Verifique o backend.', 'error');
        duvidasFiltradas = [...duvidasLista];
        renderizarDuvidas();
        atualizarEstatisticas();
        popularFiltros();
    }
}

// ============================================================
//  POPULAR FILTROS
// ============================================================
function popularFiltros() {
    const disciplinas = [...new Set(duvidasLista.map(d => d.disciplina))];
    const turmas      = [...new Set(duvidasLista.map(d => d.turma))];

    const selectDisc  = document.getElementById('filter-disciplina');
    const selectTurma = document.getElementById('filter-turma');

    selectDisc.innerHTML  = '<option value="">Todas as Disciplinas</option>';
    selectTurma.innerHTML = '<option value="">Todas as Turmas</option>';

    disciplinas.forEach(d => {
        const opt = document.createElement('option');
        opt.value = opt.textContent = d;
        selectDisc.appendChild(opt);
    });

    turmas.forEach(t => {
        const opt = document.createElement('option');
        opt.value = opt.textContent = t;
        selectTurma.appendChild(opt);
    });

    popularCustomSelect('select-disciplina', disciplinas, 'Todas as Disciplinas');
    popularCustomSelect('select-turma', turmas, 'Todas as Turmas');
}

// ============================================================
//  FILTRAR DÚVIDAS
// ============================================================
function filtrarDuvidas() {
    const searchTerm       = document.getElementById('search-input').value.toLowerCase();
    const statusFilter     = document.getElementById('filter-status').value;
    const disciplinaFilter = document.getElementById('filter-disciplina').value;
    const turmaFilter      = document.getElementById('filter-turma').value;

    duvidasFiltradas = duvidasLista.filter(d =>
        (!searchTerm       || d.titulo.toLowerCase().includes(searchTerm) || d.descricao.toLowerCase().includes(searchTerm) || d.aluno.toLowerCase().includes(searchTerm)) &&
        (!statusFilter     || d.status === statusFilter) &&
        (!disciplinaFilter || d.disciplina === disciplinaFilter) &&
        (!turmaFilter      || d.turma === turmaFilter)
    );

    renderizarDuvidas();
}

// ============================================================
//  RENDERIZAR DÚVIDAS
// ============================================================
function renderizarDuvidas() {
    const grid       = document.getElementById('duvidas-grid');
    const emptyState = document.getElementById('empty-state');

    if (duvidasFiltradas.length === 0) {
        grid.innerHTML = '';
        emptyState.style.display = 'block';
        renderizarPaginacao(0);
        return;
    }

    emptyState.style.display = 'none';

    // Paginação
    const totalPaginas = Math.ceil(duvidasFiltradas.length / ITENS_POR_PAGINA);
    if (paginaAtual > totalPaginas) paginaAtual = 1;

    const inicio   = (paginaAtual - 1) * ITENS_POR_PAGINA;
    const paginada = duvidasFiltradas.slice(inicio, inicio + ITENS_POR_PAGINA);

    grid.innerHTML = paginada.map(duvida => `
        <div class="duvida-card" onclick="abrirModal(${duvida.id})">
            <div class="duvida-header">
                <div class="duvida-aluno-info">
                    <span class="duvida-aluno-nome">${duvida.aluno}</span>
                    <span class="duvida-aluno-disciplina">${duvida.disciplina} | ${duvida.turma}</span>
                </div>
                <span class="duvida-status ${duvida.status}">
                    <i class="fas fa-${duvida.respondida ? 'check-circle' : 'clock'}"></i>
                    ${duvida.status === 'respondida' ? 'Respondida' : 'Pendente'}
                </span>
            </div>
            <h3 class="duvida-titulo">${duvida.titulo}</h3>
            <p class="duvida-descricao-preview">${duvida.descricao}</p>
            <div class="duvida-footer">
                <span class="duvida-data">
                    <i class="fas fa-calendar-alt"></i> ${duvida.data}
                </span>
                <div class="duvida-actions">
                    <button class="btn-icon" title="${duvida.respondida ? 'Já respondida' : 'Responder'}"
                        ${duvida.respondida ? 'disabled' : `onclick="event.stopPropagation(); abrirModal(${duvida.id})"`}
                        style="${duvida.respondida ? 'opacity:0.4; cursor:not-allowed;' : ''}">
                        <i class="fas fa-reply"></i>
                    </button>
                </div>
            </div>
        </div>
    `).join('');

    renderizarPaginacao(totalPaginas);
}

// ============================================================
//  PAGINAÇÃO - RENDER
// ============================================================
function renderizarPaginacao(totalPaginas) {
    let paginacaoEl = document.getElementById('paginacao');
    if (!paginacaoEl) {
        paginacaoEl = document.createElement('div');
        paginacaoEl.id = 'paginacao';
        document.getElementById('duvidas-grid').insertAdjacentElement('afterend', paginacaoEl);
    }

    if (totalPaginas <= 1) {
        paginacaoEl.innerHTML = '';
        return;
    }

    const btnStyle = (desabilitado) => `
        background: ${desabilitado ? 'rgba(187,134,252,0.1)' : 'linear-gradient(135deg, #BB86FC, #a21fa2)'};
        color: ${desabilitado ? 'var(--text-muted)' : '#000'};
        border: none;
        padding: 10px 20px;
        border-radius: 30px;
        cursor: ${desabilitado ? 'not-allowed' : 'pointer'};
        font-weight: 700;
        font-family: var(--font-futuristic, Orbitron, sans-serif);
        font-size: 0.75rem;
        transition: all 0.3s;
        display: inline-flex;
        align-items: center;
        gap: 8px;
    `;

    paginacaoEl.innerHTML = `
        <div style="
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 15px;
            margin-top: 30px;
            font-family: var(--font-main, Poppins, sans-serif);
        ">
            <button onclick="mudarPagina(${paginaAtual - 1})"
                ${paginaAtual === 1 ? 'disabled' : ''}
                style="${btnStyle(paginaAtual === 1)}">
                <i class="fas fa-chevron-left"></i> Anterior
            </button>

            <span style="color: var(--text-muted); font-size: 0.9rem;">
                Página <strong style="color: var(--primary-color);">${paginaAtual}</strong>
                de <strong style="color: var(--primary-color);">${totalPaginas}</strong>
            </span>

            <button onclick="mudarPagina(${paginaAtual + 1})"
                ${paginaAtual === totalPaginas ? 'disabled' : ''}
                style="${btnStyle(paginaAtual === totalPaginas)}">
                Próxima <i class="fas fa-chevron-right"></i>
            </button>
        </div>
    `;
}

function mudarPagina(novaPagina) {
    paginaAtual = novaPagina;
    renderizarDuvidas();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ============================================================
//  ABRIR MODAL
// ============================================================
function abrirModal(id) {
    duvidasAtual = duvidasLista.find(d => d.id === id);
    if (!duvidasAtual) return;

    document.getElementById('modal-aluno').textContent      = duvidasAtual.aluno;
    document.getElementById('modal-disciplina').textContent = `${duvidasAtual.disciplina} (${duvidasAtual.turma})`;
    document.getElementById('modal-data').textContent       = duvidasAtual.data;
    document.getElementById('modal-descricao').textContent  = duvidasAtual.descricao;

    const textarea  = document.getElementById('modal-resposta-text');
    const btnEnviar = document.querySelector('.modal-footer .btn-primary');

    if (duvidasAtual.respondida) {
        textarea.value         = duvidasAtual.conteudoResposta || 'Resposta não disponível.';
        textarea.disabled      = true;
        btnEnviar.disabled     = true;
        btnEnviar.style.opacity = '0.5';
        btnEnviar.style.cursor  = 'not-allowed';

        document.getElementById('aviso-ja-respondida')?.remove();
        const aviso = document.createElement('p');
        aviso.id = 'aviso-ja-respondida';
        aviso.textContent = '⚠️ Esta dúvida já foi respondida e não pode ser alterada.';
        aviso.style.cssText = 'color:#e74c3c; font-size:0.82rem; margin-top:6px; font-weight:600;';
        textarea.insertAdjacentElement('afterend', aviso);
    } else {
        textarea.value         = '';
        textarea.disabled      = false;
        btnEnviar.disabled     = false;
        btnEnviar.style.opacity = '';
        btnEnviar.style.cursor  = '';
        document.getElementById('aviso-ja-respondida')?.remove();
    }

    document.getElementById('modal-resposta').classList.add('show');
    document.body.style.overflow = 'hidden';
}

// ============================================================
//  FECHAR MODAL
// ============================================================
function fecharModal() {
    document.getElementById('modal-resposta').classList.remove('show');
    document.body.style.overflow = 'auto';
    duvidasAtual = null;
}

// ============================================================
//  ENVIAR RESPOSTA
// ============================================================
async function enviarResposta() {
    if (!duvidasAtual) return;

    const conteudoResposta = document.getElementById('modal-resposta-text').value.trim();

    if (duvidasAtual.respondida) {
        showToast('Esta dúvida já foi respondida e não pode ser respondida novamente.', 'error');
        return;
    }

    if (!conteudoResposta) {
        showToast('Digite uma resposta antes de enviar.', 'error');
        return;
    }

    if (conteudoResposta.length > 2000) {
        showToast('A resposta não pode exceder 2000 caracteres.', 'error');
        return;
    }

    const btn = document.querySelector('.modal-footer .btn-primary');
    setLoading(btn, true, 'Enviando...');

    try {
        const res = await fetch(`${API_URL}/respostasDuvidas`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                idDuvida: duvidasAtual.id,
                conteudoResposta,
                momento: new Date().toISOString(),
                utilizador: { id: ID_PROFESSOR_LOGADO }
            })
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const idx = duvidasLista.findIndex(d => d.id === duvidasAtual.id);
        if (idx !== -1) {
            duvidasLista[idx].status           = 'respondida';
            duvidasLista[idx].respondida       = true;
            duvidasLista[idx].conteudoResposta = conteudoResposta;
        }

        showToast('Resposta enviada com sucesso!', 'success');
        fecharModal();
        filtrarDuvidas();
        atualizarEstatisticas();

    } catch (err) {
        console.error('Erro ao enviar resposta:', err);
        showToast('Erro ao enviar resposta. Tente novamente.', 'error');
    } finally {
        setLoading(btn, false, '<i class="fas fa-paper-plane"></i> Enviar Resposta');
    }
}

// ============================================================
//  ATUALIZAR ESTATÍSTICAS
// ============================================================
function atualizarEstatisticas() {
    document.getElementById('stat-pendentes').textContent   = duvidasLista.filter(d => d.status === 'pendente').length;
    document.getElementById('stat-respondidas').textContent = duvidasLista.filter(d => d.status === 'respondida').length;
    document.getElementById('stat-total').textContent       = duvidasLista.length;
}

// ============================================================
//  UTILITÁRIOS
// ============================================================
function formatarData(dataString) {
    if (!dataString) return 'Data não disponível';
    try {
        const data = new Date(dataString);
        if (isNaN(data.getTime())) return dataString;
        return data.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' }) + ' ' +
               data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' });
    } catch {
        return dataString;
    }
}

function setLoading(btn, loading, html) {
    btn.disabled  = loading;
    btn.innerHTML = loading ? `<i class="fas fa-spinner fa-spin"></i> ${html}` : html;
}

function showToast(msg, tipo = 'success') {
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