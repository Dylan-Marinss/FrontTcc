const API_URL = 'http://localhost:8080';
const ID_PROFESSOR_LOGADO = 6;

let todasAtividades = [];
let atividadeIdParaDeletar = null;

// ============================================================
//  PAGINAÇÃO
// ============================================================
const ITENS_POR_PAGINA = 12;
let paginaAtual = 1;

// ============================================================
//  INICIALIZAÇÃO
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    initCustomSelects();
    carregarAtividades();
    inicializarFechamentoModais();
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

    // Bind nas opções estáticas (dificuldade)
    document.querySelectorAll('.custom-select').forEach(sel => bindOptions(sel));
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

    paginaAtual = 1;
    filtrarAtividades();
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

    opcoes.forEach(({ value, label }) => {
        const opt = document.createElement('div');
        opt.className = 'custom-option';
        opt.dataset.value = value;
        opt.textContent = label;
        opt.addEventListener('click', () => selectOption(sel, opt));
        container.appendChild(opt);
    });
}

// ============================================================
//  CARREGAR ATIVIDADES
// ============================================================
async function carregarAtividades() {
    try {
        const res = await fetch(`${API_URL}/atividades`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const atividades = await res.json();
        todasAtividades = atividades.filter(a => a.idOrientador === ID_PROFESSOR_LOGADO);

        atualizarStats();
        popularFiltros();
        renderizarAtividades(todasAtividades);

    } catch (err) {
        console.error('Erro ao carregar atividades:', err);
        document.getElementById('atividadesList').innerHTML = `
            <div class="empty-state">
                <i class="fas fa-triangle-exclamation"></i>
                <p>Erro ao carregar atividades. Verifique o backend.</p>
            </div>
        `;
    }
}

// ============================================================
//  POPULAR FILTROS
// ============================================================
function popularFiltros() {
    // Série — vem do aluno via respostas, mas atividade não tem série direta.
    // Usamos a disciplina e dificuldade que a atividade já tem.
    const disciplinas = [...new Set(
        todasAtividades.map(a => a.disciplina?.nome).filter(Boolean)
    )].sort();
    popularCustomSelect('select-disciplina', disciplinas.map(d => ({ value: d, label: d })), 'Disciplina');

    // Dificuldade já tem opções estáticas no HTML, só rebinda
    const selDif = document.getElementById('select-dificuldade');
    if (selDif) bindOptions(selDif);

    // Eventos nos selects hidden
    ['filter-disciplina', 'filter-dificuldade'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('change', () => { paginaAtual = 1; filtrarAtividades(); });
    });
}

// ============================================================
//  STATS
// ============================================================
function atualizarStats() {
    document.getElementById('totalAtividades').textContent = todasAtividades.length;
}

// ============================================================
//  FILTRAR
// ============================================================
function filtrarAtividades() {
    const termo        = document.getElementById('searchAtividade').value.toLowerCase().trim();
    const filtroDif    = document.getElementById('filter-dificuldade').value;
    const filtroDisc   = document.getElementById('filter-disciplina').value;

    const filtradas = todasAtividades.filter(a => {
        const matchBusca = !termo ||
            (a.titulo || '').toLowerCase().includes(termo) ||
            (a.nivelDificuldade?.nome || '').toLowerCase().includes(termo);

        const matchDif  = !filtroDif  || (a.nivelDificuldade?.nome || '') === filtroDif;
        const matchDisc = !filtroDisc || (a.disciplina?.nome || '') === filtroDisc;

        return matchBusca && matchDif && matchDisc;
    });

    renderizarAtividades(filtradas);
}

// ============================================================
//  RENDERIZAR CARDS
// ============================================================
function renderizarAtividades(lista) {
    const container = document.getElementById('atividadesList');

    if (lista.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-clipboard-list"></i>
                <p>Nenhuma atividade encontrada.</p>
            </div>
        `;
        renderizarPaginacao(0);
        return;
    }

    const totalPaginas = Math.ceil(lista.length / ITENS_POR_PAGINA);
    if (paginaAtual > totalPaginas) paginaAtual = 1;

    const inicio   = (paginaAtual - 1) * ITENS_POR_PAGINA;
    const paginada = lista.slice(inicio, inicio + ITENS_POR_PAGINA);

    container.innerHTML = paginada.map(a => {
        const dificuldade = a.nivelDificuldade?.nome || '—';
        const badgeClass  = resolverBadgeClass(dificuldade);
        const pontos      = a.pontuacaoMaxima ?? 0;
        const data        = a.dataCriacao ? formatarData(a.dataCriacao) : '—';
        const disciplina  = a.disciplina?.nome || 'Sem disciplina';

        return `
            <div class="atividade-card" id="card-${a.idAtividade}"
                onclick="abrirModalRespostas(${a.idAtividade}, '${(a.titulo || '').replace(/'/g, "\\'")}')"
                style="cursor:pointer;">

                <div class="card-actions">
                    <button class="btn-card-action btn-deletar" title="Excluir atividade"
                        onclick="event.stopPropagation(); deletarAtividade(${a.idAtividade})">
                        <i class="fas fa-times"></i>
                    </button>
                </div>

                <div class="atividade-card-header">
                    <div>
                        <span class="atividade-titulo">
                            <i class="fas fa-file-alt" style="margin-right:8px; font-size:0.85rem;"></i>
                            ${a.titulo || 'Sem título'}
                        </span>
                        <div class="atividade-disciplina">
                            <i class="fas fa-book"></i>
                            ${disciplina}
                        </div>
                    </div>
                    <span class="dificuldade-badge ${badgeClass}">${dificuldade}</span>
                </div>

                <div class="atividade-meta">
                    <div class="meta-pontos">
                        <i class="fas fa-star" style="color: var(--status-average);"></i>
                        <strong>${pontos}</strong>
                        <span>${pontos === 1 ? 'ponto' : 'pontos'}</span>
                    </div>
                    <div class="meta-data">
                        <i class="far fa-calendar-alt"></i>
                        <span>${data}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');

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
        document.getElementById('atividadesList').insertAdjacentElement('afterend', paginacaoEl);
    }

    if (totalPaginas <= 1) { paginacaoEl.innerHTML = ''; return; }

    const btnStyle = (dis) => `
        background: ${dis ? 'rgba(187,134,252,0.1)' : 'linear-gradient(135deg, #BB86FC, #a21fa2)'};
        color: ${dis ? 'var(--text-muted)' : '#000'};
        border: none; padding: 10px 20px; border-radius: 30px;
        cursor: ${dis ? 'not-allowed' : 'pointer'};
        font-weight: 700; font-family: var(--font-futuristic); font-size: 0.75rem;
        transition: all 0.3s; display: inline-flex; align-items: center; gap: 8px;
    `;

    paginacaoEl.innerHTML = `
        <div style="display:flex; justify-content:center; align-items:center; gap:15px; margin-top:30px; font-family:var(--font-main);">
            <button onclick="mudarPagina(${paginaAtual - 1})" ${paginaAtual === 1 ? 'disabled' : ''} style="${btnStyle(paginaAtual === 1)}">
                <i class="fas fa-chevron-left"></i> Anterior
            </button>
            <span style="color:var(--text-muted); font-size:0.9rem;">
                Página <strong style="color:var(--primary-color);">${paginaAtual}</strong>
                de <strong style="color:var(--primary-color);">${totalPaginas}</strong>
            </span>
            <button onclick="mudarPagina(${paginaAtual + 1})" ${paginaAtual === totalPaginas ? 'disabled' : ''} style="${btnStyle(paginaAtual === totalPaginas)}">
                Próxima <i class="fas fa-chevron-right"></i>
            </button>
        </div>
    `;
}

function mudarPagina(novaPagina) {
    paginaAtual = novaPagina;
    filtrarAtividades();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ============================================================
//  DELETAR
// ============================================================
function deletarAtividade(id) {
    atividadeIdParaDeletar = id;
    const modal = document.getElementById('modalConfirmDelete');
    modal.style.display = 'flex';
    requestAnimationFrame(() => requestAnimationFrame(() => modal.classList.add('active')));
}

function fecharConfirmDelete() {
    atividadeIdParaDeletar = null;
    const modal = document.getElementById('modalConfirmDelete');
    modal.classList.remove('active');
    setTimeout(() => modal.style.display = 'none', 200);
}

async function confirmarDelete() {
    if (!atividadeIdParaDeletar) return;

    const btnConfirmar = document.getElementById('btnConfirmarDelete');
    btnConfirmar.disabled = true;
    btnConfirmar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Excluindo...';

    try {
        const response = await fetch(`${API_URL}/atividades/${atividadeIdParaDeletar}`, { method: 'DELETE' });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        todasAtividades = todasAtividades.filter(a => a.idAtividade !== atividadeIdParaDeletar);
        document.getElementById('totalAtividades').textContent = todasAtividades.length;

        fecharConfirmDelete();
        showAlert('✅ Atividade excluída com sucesso!', 'success');
        filtrarAtividades();

    } catch (error) {
        console.error('Erro ao excluir:', error);
        showAlert('❌ Erro ao excluir a atividade.', 'error');
    } finally {
        btnConfirmar.disabled = false;
        btnConfirmar.innerHTML = '<i class="fas fa-trash"></i> Sim, excluir';
    }
}

// ============================================================
//  UTILITÁRIOS
// ============================================================
function resolverBadgeClass(nomeDificuldade) {
    const n = (nomeDificuldade || '').toLowerCase();
    if (n.includes('fácil') || n.includes('facil') || n.includes('baixo')) return 'facil';
    if (n.includes('médio') || n.includes('medio') || n.includes('moderado')) return 'medio';
    if (n.includes('difícil') || n.includes('dificil') || n.includes('alto')) return 'dificil';
    return 'default';
}

function formatarData(dataStr) {
    try {
        const d = new Date(dataStr);
        return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch { return '—'; }
}

function inicializarFechamentoModais() {
    window.onclick = function (event) {
        if (event.target === document.getElementById('modalConfirmDelete')) fecharConfirmDelete();
        if (event.target === document.getElementById('modalRespostas')) fecharModalRespostas();
    };
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
//  MODAL RESPOSTAS
// ============================================================
let todasRespostas = [];

async function abrirModalRespostas(idAtividade, tituloAtividade) {
    const modal  = document.getElementById('modalRespostas');
    const body   = document.getElementById('modalRespostasBody');
    const titulo = document.getElementById('modalRespostasTitulo');

    titulo.textContent = tituloAtividade;
    body.innerHTML = `
        <div style="text-align:center; padding:30px; color:#9ca3af;">
            <i class="fas fa-spinner fa-spin" style="font-size:1.5rem;"></i>
            <p style="margin-top:10px;">Carregando respostas...</p>
        </div>
    `;

    modal.style.display = 'flex';
    requestAnimationFrame(() => requestAnimationFrame(() => modal.classList.add('active')));

    try {
        const res = await fetch(`${API_URL}/atividadesrespostas/atividade/${idAtividade}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        todasRespostas = await res.json();
        popularFiltroSerie(todasRespostas);
        renderizarRespostas(todasRespostas);
    } catch (err) {
        console.error('Erro ao carregar respostas:', err);
        body.innerHTML = `
            <div style="text-align:center; padding:30px; color:#9ca3af;">
                <i class="fas fa-triangle-exclamation" style="font-size:1.5rem; color:#f59e0b;"></i>
                <p style="margin-top:10px;">Erro ao carregar respostas.</p>
            </div>
        `;
    }
}

function popularFiltroSerie(respostas) {
    const select = document.getElementById('filtroSerie');
    if (!select) return;

    const series = [...new Map(
        respostas.filter(r => r.aluno?.serie).map(r => [r.aluno.serie.id, r.aluno.serie])
    ).values()];

    select.innerHTML = '<option value="">Todas as turmas</option>';
    series.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s.id;
        opt.textContent = s.nomeSerie;
        select.appendChild(opt);
    });
}

function aplicarFiltroSerie() {
    const idFiltro = document.getElementById('filtroSerie').value;
    const filtradas = idFiltro
        ? todasRespostas.filter(r => String(r.aluno?.serie?.id) === idFiltro)
        : todasRespostas;
    renderizarRespostas(filtradas);
}

function renderizarRespostas(respostas) {
    const body = document.getElementById('modalRespostasBody');

    if (respostas.length === 0) {
        body.innerHTML = `
            <div style="text-align:center; padding:30px; color:#9ca3af;">
                <i class="fas fa-inbox" style="font-size:2rem;"></i>
                <p style="margin-top:10px;">Nenhum aluno respondeu ainda.</p>
            </div>
        `;
        return;
    }

    const linhas = respostas.map(r => {
        const nome  = r.aluno?.nome || '—';
        const inicio = r.momentoInicio ? formatarDataHora(r.momentoInicio) : '—';
        const fim    = r.momentoFim   ? formatarDataHora(r.momentoFim)    : '—';
        const nota   = r.pontuacao != null ? r.pontuacao.toFixed(1) : '—';

        return `
            <tr>
                <td style="padding:12px 10px; border-bottom:1px solid #2a2a3a;">
                    <i class="fas fa-user-graduate" style="margin-right:8px; color:var(--primary-color);"></i>${nome}
                </td>
                <td style="padding:12px 10px; border-bottom:1px solid #2a2a3a; color:#9ca3af; font-size:0.85rem;">${inicio}</td>
                <td style="padding:12px 10px; border-bottom:1px solid #2a2a3a; color:#9ca3af; font-size:0.85rem;">${fim}</td>
                <td style="padding:12px 10px; border-bottom:1px solid #2a2a3a; text-align:center;">
                    <span style="background:rgba(187,134,252,0.15); color:var(--primary-color); padding:3px 10px; border-radius:999px; font-weight:600; font-size:0.85rem;">${nota}</span>
                </td>
            </tr>
        `;
    }).join('');

    body.innerHTML = `
        <table style="width:100%; border-collapse:collapse; font-size:0.88rem;">
            <thead>
                <tr style="color:#9ca3af; font-size:0.78rem; text-transform:uppercase; letter-spacing:0.05em;">
                    <th style="padding:8px 10px; text-align:left;   border-bottom:2px solid #2a2a3a;">Aluno</th>
                    <th style="padding:8px 10px; text-align:left;   border-bottom:2px solid #2a2a3a;">Início</th>
                    <th style="padding:8px 10px; text-align:left;   border-bottom:2px solid #2a2a3a;">Fim</th>
                    <th style="padding:8px 10px; text-align:center; border-bottom:2px solid #2a2a3a;">Nota</th>
                </tr>
            </thead>
            <tbody>${linhas}</tbody>
        </table>
        <p style="margin-top:16px; color:#9ca3af; font-size:0.8rem; text-align:right;">
            ${respostas.length} aluno${respostas.length !== 1 ? 's' : ''} respondeu${respostas.length !== 1 ? 'ram' : ''}
        </p>
    `;
}

function fecharModalRespostas() {
    const modal = document.getElementById('modalRespostas');
    modal.classList.remove('active');
    setTimeout(() => modal.style.display = 'none', 200);
    todasRespostas = [];
    const select = document.getElementById('filtroSerie');
    if (select) select.value = '';
}

function formatarDataHora(dataStr) {
    try {
        const d = new Date(dataStr);
        return d.toLocaleString('pt-BR', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' });
    } catch { return '—'; }
}