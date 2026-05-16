// ============================================================
//  CONFIGURAÇÃO
// ============================================================
const API_URL = 'http://localhost:8080';
const ID_ALUNO_LOGADO = 1;

// ========== INICIALIZAÇÃO ==========
document.addEventListener('DOMContentLoaded', function () {
    carregarDadosAluno();
    initNotifications();
    initActions();
    atualizarDadosHome();
    carregarAtividadesRecentes();

    const sidebar      = document.querySelector('.sidebar');
    const menuToggle   = document.getElementById('menu-toggle');
    const welcomeCard  = document.querySelector('.welcome-card');
    const actionItems  = document.querySelectorAll('.action-item');
    const shortcutBtns = document.querySelectorAll('.shortcut-btn');
    const pageTitle    = document.querySelector('.page-title');

    if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', () => {
            if (window.innerWidth <= 768) {
                sidebar.classList.toggle('active');
            } else {
                sidebar.classList.toggle('collapsed');
            }
        });
    }

    if (welcomeCard) {
        welcomeCard.style.animation = 'slideInDown 0.6s ease-out';
    }

    actionItems.forEach((item, index) => {
        item.style.animationDelay = `${index * 0.1}s`;
        item.addEventListener('mouseenter', () => { item.style.boxShadow = '0 4px 15px rgba(187, 134, 252, 0.2)'; });
        item.addEventListener('mouseleave', () => { item.style.boxShadow = 'none'; });
    });

    shortcutBtns.forEach(btn => {
        btn.addEventListener('mouseenter', () => { btn.style.boxShadow = '0 8px 25px rgba(187, 134, 252, 0.3)'; });
        btn.addEventListener('mouseleave', () => { btn.style.boxShadow = '0 4px 12px rgba(187, 134, 252, 0.1)'; });
    });

    if (pageTitle) {
        pageTitle.classList.add('glitch-text');
        setTimeout(() => pageTitle.classList.remove('glitch-text'), 5000);
    }

    const style = document.createElement('style');
    style.innerHTML = `
        @keyframes slideInDown {
            from { opacity: 0; transform: translateY(-20px); }
            to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(20px); }
            to   { opacity: 1; transform: translateY(0); }
        }
        .action-item { animation: fadeInUp 0.5s ease-out forwards; opacity: 0; }
        body::before {
            content: '';
            position: fixed; top: 0; left: 0;
            width: 100%; height: 100%;
            background: repeating-linear-gradient(
                0deg,
                rgba(0,0,0,0.05), rgba(0,0,0,0.05) 1px,
                transparent 1px, transparent 2px
            );
            pointer-events: none; z-index: -1; opacity: 0.5;
        }
    `;
    document.head.appendChild(style);
});

// ========== FUNÇÕES GLOBAIS ==========

async function carregarDadosAluno() {
    try {
        const response = await fetch(`${API_URL}/alunos/${ID_ALUNO_LOGADO}`);
        if (!response.ok) throw new Error('Erro ao buscar aluno');
        const aluno = await response.json();
        const el = document.getElementById('nomeAluno');
        if (el) el.textContent = aluno.nome || 'Estudante';
    } catch (err) {
        console.error('[EstudeX] Erro ao carregar nome:', err);
    }
}

function initNotifications() {
    const icon     = document.getElementById('notificationsIcon');
    const modal    = document.getElementById('notificationsModal');
    const closeBtn = document.querySelector('.close-modal');

    icon?.addEventListener('click', () => {
        modal.style.display = 'block';
        const badge = document.querySelector('.notification-badge');
        if (badge) badge.style.display = 'none';
    });

    closeBtn?.addEventListener('click', () => { modal.style.display = 'none'; });

    window.addEventListener('click', e => {
        if (modal && e.target === modal) modal.style.display = 'none';
    });
}

function initActions() {
    document.querySelectorAll('.action-item').forEach(action => {
        action.addEventListener('click', function () {
            handleAction(this.getAttribute('data-action'));
        });
    });

    document.getElementById('planoEstudoBtn')?.addEventListener('click', () => {
        window.location.href = 'consultarPlanoEstudo-home.html';
    });
}

function handleAction(actionType) {
    switch (actionType) {
        case 'plano':
            window.location.href = 'consultarPlanoEstudo-home.html';
            break;
        case 'mensagens':
            alert('💬 Mensagens - Você não possui novas mensagens no momento.');
            break;
        case 'desempenho':
            window.location.href = '../../../Aluno/desempenho/HTML/desempenho-Estudex.html';
            break;
        case 'cronograma':
            alert('📅 Cronograma - Em breve você poderá visualizar seu cronograma de estudos!');
            break;
    }
}

async function atualizarDadosHome() {
    try {
        const response = await fetch(`${API_URL}/atividadesrespostas`);
        if (!response.ok) throw new Error('Erro ao buscar respostas');
        const todas = await response.json();

        const minhas = todas.filter(r => r.aluno?.id === ID_ALUNO_LOGADO && r.pontuacao !== null);

        // Taxa de acerto
        let somaNotas = 0, somaMaximas = 0;
        minhas.forEach(r => {
            somaNotas   += r.pontuacao || 0;
            somaMaximas += r.atividade?.pontuacaoMaxima || 100;
        });
        const taxa = somaMaximas > 0 ? (somaNotas / somaMaximas) * 100 : 0;

        // Horas de estudo
        let totalMs = 0;
        minhas.forEach(r => {
            if (r.momentoInicio && r.momentoFim)
                totalMs += new Date(r.momentoFim) - new Date(r.momentoInicio);
        });
        const totalHoras = (totalMs / 1000 / 60 / 60).toFixed(1);

        // Progresso semanal
        const agora          = new Date();
        const inicioSemana   = new Date(agora - 7  * 24 * 60 * 60 * 1000);
        const inicioAnterior = new Date(agora - 14 * 24 * 60 * 60 * 1000);

        const semanaAtual    = minhas.filter(r => new Date(r.momentoFim) >= inicioSemana).length;
        const semanaAnterior = minhas.filter(r => {
            const fim = new Date(r.momentoFim);
            return fim >= inicioAnterior && fim < inicioSemana;
        }).length;

        let progressoTexto;
        if (semanaAnterior === 0 && semanaAtual === 0) {
            progressoTexto = '0%';
        } else if (semanaAnterior === 0) {
            progressoTexto = '+100%';
        } else {
            const variacao = ((semanaAtual - semanaAnterior) / semanaAnterior) * 100;
            progressoTexto = `${variacao >= 0 ? '+' : ''}${variacao.toFixed(0)}%`;
        }

        const progressoEl = document.getElementById('progressoSemanal');
        const horasEl     = document.getElementById('horasEstudo');
        const taxaEl      = document.getElementById('taxaAcerto');

        if (progressoEl) progressoEl.textContent = progressoTexto;
        if (horasEl)     horasEl.textContent     = `${totalHoras}h`;
        if (taxaEl)      taxaEl.textContent       = `${taxa.toFixed(1)}%`;

    } catch (err) {
        console.error('[EstudeX] Erro ao atualizar progresso:', err);
    }
}

async function carregarAtividadesRecentes() {
    try {
        const [resAtividades, resRespostas] = await Promise.all([
            fetch(`${API_URL}/atividades`),
            fetch(`${API_URL}/atividadesrespostas`)
        ]);

        if (!resAtividades.ok || !resRespostas.ok) throw new Error('Erro ao buscar atividades');

        const atividades = await resAtividades.json();
        const respostas  = await resRespostas.json();

        const respondidas = new Set(
            respostas
                .filter(r => r.aluno?.id === ID_ALUNO_LOGADO)
                .map(r => r.atividade?.idAtividade)
        );

        const recentes = [...atividades]
            .sort((a, b) => new Date(b.dataCriacao) - new Date(a.dataCriacao))
            .slice(0, 2);

        const container = document.getElementById('activitySummary');
        if (!container) return;

        container.innerHTML = recentes.map(ativ => {
            const respondida = respondidas.has(ativ.idAtividade);
            const data       = new Date(ativ.dataCriacao).toLocaleDateString('pt-BR');
            return `
                <div class="activity-item ${respondida ? 'completed' : 'pending'}">
                    <span class="activity-label">${respondida ? '✅ Respondida' : '⏳ Pendente'}</span>
                    <span class="activity-name">${ativ.titulo}</span>
                    <span class="activity-date">Postada em ${data}</span>
                </div>
            `;
        }).join('');

    } catch (err) {
        console.error('[EstudeX] Erro ao carregar atividades recentes:', err);
    }
}