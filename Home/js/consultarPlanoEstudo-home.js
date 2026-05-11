// plano-estudo.js - Página de Plano de Estudo

// ========== CONFIGURAÇÕES ==========
const API_URL = 'http://localhost:8080';
const ID_ALUNO_LOGADO = 1;

// Variáveis globais
let dadosAluno = null;
let dadosSerie = null;
let todasAtividades = [];
let niveisDificuldade = [];
let atividadesRespondidas = [];

// ========== INICIALIZAÇÃO ==========
document.addEventListener('DOMContentLoaded', async () => {
    await carregarDados();
    await gerarPlanoEstudo();
    inicializarEventos();
});

// ========== CARREGAR DADOS DA API ==========
async function carregarDados() {
    try {
        await Promise.all([
            carregarAluno(),
            carregarTodasAtividades(),
            carregarNiveisDificuldade(),
            carregarAtividadesRespondidas()
        ]);
        
        atualizarInfoAluno();
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
        mostrarErro('Erro ao carregar dados do plano de estudo');
    }
}

async function carregarAluno() {
    const response = await fetch(`${API_URL}/alunos/${ID_ALUNO_LOGADO}`);
    if (!response.ok) throw new Error('Erro ao carregar aluno');
    dadosAluno = await response.json();
    
    if (dadosAluno.serie?.idSerie) {
        await carregarSerie(dadosAluno.serie.idSerie);
    }
}

async function carregarSerie(idSerie) {
    const response = await fetch(`${API_URL}/series`);
    if (!response.ok) throw new Error('Erro ao carregar série');
    const series = await response.json();
    dadosSerie = series.find(s => s.idSerie === idSerie);
}

async function carregarTodasAtividades() {
    const response = await fetch(`${API_URL}/atividades`);
    if (!response.ok) throw new Error('Erro ao carregar atividades');
    todasAtividades = await response.json();
}

async function carregarNiveisDificuldade() {
    try {
        const response = await fetch(`${API_URL}/niveisdificuldade`);
        if (response.ok) {
            niveisDificuldade = await response.json();
        }
    } catch (error) {
        // Se não tiver endpoint, usar dados padrão
        niveisDificuldade = [
            { id: 1, nome: 'Fácil' },
            { id: 2, nome: 'Médio' },
            { id: 3, nome: 'Difícil' }
        ];
    }
}

async function carregarAtividadesRespondidas() {
    try {
        const response = await fetch(`${API_URL}/atividadesrespostas`);
        if (response.ok) {
            const todasRespostas = await response.json();
            atividadesRespondidas = todasRespostas.filter(r => 
                r.idAluno === ID_ALUNO_LOGADO && r.pontuacao !== null
            );
        }
    } catch (error) {
        atividadesRespondidas = [];
    }
}

// ========== ATUALIZAR INFORMAÇÕES DO ALUNO ==========
function atualizarInfoAluno() {
    if (!dadosAluno) return;
    
    document.getElementById('nomeAluno').textContent = dadosAluno.utilizador?.nome || 'Usuário';
    
    const serieTexto = dadosSerie ? `${dadosSerie.nome} - ${dadosSerie.ano}` : 'Não definida';
    document.getElementById('serieAluno').textContent = serieTexto;
    
    const xp = dadosAluno.xp || 0;
    document.getElementById('xpAluno').textContent = xp;
    
    const nivel = calcularNivel(xp);
    document.getElementById('nivelAluno').textContent = nivel;
}

function calcularNivel(xp) {
    if (xp < 100) return 'Iniciante';
    if (xp < 300) return 'Aprendiz';
    if (xp < 600) return 'Estudante';
    if (xp < 1000) return 'Dedicado';
    if (xp < 1500) return 'Experiente';
    if (xp < 2100) return 'Avançado';
    if (xp < 2800) return 'Expert';
    return 'Mestre';
}

// ========== GERAR PLANO DE ESTUDO ==========
async function gerarPlanoEstudo() {
    // Filtrar atividades não concluídas
    const idsConcluidas = atividadesRespondidas.map(r => r.idAtividade);
    const atividadesPendentes = todasAtividades.filter(a => !idsConcluidas.includes(a.idAtividade));
    
    // Ordenar por dificuldade (recomendar primeiro as mais adequadas ao nível)
    const atividadesOrdenadas = ordenarPorDificuldade(atividadesPendentes);
    
    // Atividades recomendadas (top 5)
    const recomendadas = atividadesOrdenadas.slice(0, 5);
    renderizarAtividadesRecomendadas(recomendadas);
    
    // Gerar agenda semanal baseada nas atividades
    gerarAgendaSemanal(recomendadas);
    
    // Gerar recomendações personalizadas
    gerarRecomendacoes(atividadesPendentes);
    
    // Atualizar estatísticas
    atualizarEstatisticas(atividadesPendentes);
}

function ordenarPorDificuldade(atividades) {
    // Priorizar atividades de dificuldade média (mais adequadas para aprendizado)
    const ordemDificuldade = { 'Médio': 1, 'Fácil': 2, 'Difícil': 3 };
    
    return [...atividades].sort((a, b) => {
        const dificuldadeA = a.nivelDificuldade?.nome || 'Médio';
        const dificuldadeB = b.nivelDificuldade?.nome || 'Médio';
        return (ordemDificuldade[dificuldadeA] || 2) - (ordemDificuldade[dificuldadeB] || 2);
    });
}

function getDificuldadeClass(dificuldade) {
    const nomes = { 'Fácil': 'Fácil', 'Médio': 'Médio', 'Difícil': 'Difícil' };
    return nomes[dificuldade] || 'Médio';
}

function renderizarAtividadesRecomendadas(atividades) {
    const container = document.getElementById('atividadesRecomendadas');
    
    if (!atividades.length) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-check-circle"></i>
                <p>Parabéns! Você concluiu todas as atividades!</p>
                <p>Novas atividades serão adicionadas em breve.</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = atividades.map(atividade => {
        const dificuldade = atividade.nivelDificuldade?.nome || 'Médio';
        const dificuldadeClass = getDificuldadeClass(dificuldade);
        
        return `
            <div class="atividade-item" onclick="window.location.href='../../../Aluno/atividade/HTML/atividades-Estudex.html'">
                <div class="atividade-info">
                    <div class="atividade-titulo">${escapeHtml(atividade.titulo || 'Atividade')}</div>
                    <div class="atividade-meta">
                        <span><i class="fas fa-star"></i> ${atividade.pontuacaoMaxima || 0} pts</span>
                        <span><i class="fas fa-calendar"></i> ${formatarData(atividade.dataCriacao)}</span>
                    </div>
                </div>
                <div class="atividade-dificuldade dificuldade-${dificuldadeClass}">${dificuldade}</div>
            </div>
        `;
    }).join('');
}

function gerarAgendaSemanal(atividades) {
    const container = document.getElementById('agendaContainer');
    const diasSemana = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'];
    const horarios = ['08:00 - 10:00', '10:30 - 12:00', '14:00 - 16:00', '16:30 - 18:00'];
    
    const agenda = diasSemana.map((dia, index) => {
        const atividadesDia = atividades.filter((_, i) => i % 5 === index).slice(0, 2);
        
        return `
            <div class="agenda-dia">
                <div class="dia-nome">
                    <i class="fas fa-calendar-day"></i>
                    ${dia}
                </div>
                <div class="agenda-atividades">
                    ${atividadesDia.length ? atividadesDia.map((atv, idx) => `
                        <div class="agenda-atividade">
                            <i class="fas fa-tasks"></i>
                            <span>${escapeHtml(atv.titulo || 'Atividade')}</span>
                            <span class="agenda-horario">${horarios[idx % horarios.length]}</span>
                        </div>
                    `).join('') : `
                        <div class="agenda-atividade">
                            <i class="fas fa-check-circle"></i>
                            <span>Dia livre para revisão</span>
                            <span class="agenda-horario">${horarios[0]}</span>
                        </div>
                    `}
                </div>
            </div>
        `;
    }).join('');
    
    container.innerHTML = `<div class="agenda-dias">${agenda}</div>`;
}

function gerarRecomendacoes(atividadesPendentes) {
    const container = document.getElementById('recomendacoes');
    const xp = dadosAluno?.xp || 0;
    const totalConcluidas = atividadesRespondidas.length;
    const totalAtividades = todasAtividades.length;
    const recomendacoes = [];
    
    // Recomendação baseada em XP
    if (xp < 100) {
        recomendacoes.push({
            icone: 'fa-rocket',
            titulo: 'Comece pelas atividades fáceis!',
            descricao: 'Você está começando agora. Recomendamos iniciar com atividades de nível Fácil para ganhar XP rapidamente.'
        });
    } else if (xp < 500) {
        recomendacoes.push({
            icone: 'fa-chart-line',
            titulo: 'Mantenha o ritmo!',
            descricao: 'Você já tem um bom progresso. Continue completando as atividades diárias para subir de nível.'
        });
    } else {
        recomendacoes.push({
            icone: 'fa-trophy',
            titulo: 'Você está arrasando!',
            descricao: 'Que tal encarar desafios mais difíceis? As atividades de nível Difícil dão mais XP!'
        });
    }
    
    // Recomendação sobre atividades pendentes
    if (atividadesPendentes.length > 3) {
        recomendacoes.push({
            icone: 'fa-clock',
            titulo: `${atividadesPendentes.length} atividades pendentes`,
            descricao: 'Você tem atividades para completar. Que tal começar hoje mesmo?'
        });
    } else if (atividadesPendentes.length === 0 && totalAtividades > 0) {
        recomendacoes.push({
            icone: 'fa-check-circle',
            titulo: 'Parabéns! Missão cumprida!',
            descricao: 'Você concluiu todas as atividades disponíveis! Novas atividades serão adicionadas em breve.'
        });
    }
    
    // Recomendação sobre taxa de conclusão
    if (totalAtividades > 0) {
        const taxaConclusao = (totalConcluidas / totalAtividades) * 100;
        if (taxaConclusao < 30) {
            recomendacoes.push({
                icone: 'fa-heart',
                titulo: 'Dê o primeiro passo!',
                descricao: 'Comece com uma atividade hoje mesmo. Cada passo conta na sua jornada!'
            });
        } else if (taxaConclusao > 70) {
            recomendacoes.push({
                icone: 'fa-star',
                titulo: 'Excelente desempenho!',
                descricao: 'Você está quase lá! Continue focado para completar todas as atividades.'
            });
        }
    }
    
    container.innerHTML = recomendacoes.map(rec => `
        <div class="recommendation-item">
            <i class="fas ${rec.icone}"></i>
            <div class="recommendation-text">
                <strong>${rec.titulo}</strong>
                <p>${rec.descricao}</p>
            </div>
        </div>
    `).join('');
}

function atualizarEstatisticas(atividadesPendentes) {
    const totalAtividadesRecomendadas = Math.min(atividadesPendentes.length, 10);
    document.getElementById('totalAtividades').textContent = totalAtividadesRecomendadas;
    
    // Calcular conclusão da semana (simulado)
    const totalAtividadesSemana = 7;
    const concluidasSemana = atividadesRespondidas.filter(a => {
        const data = new Date(a.momentoFim);
        const diasAtras = (Date.now() - data) / (1000 * 60 * 60 * 24);
        return diasAtras <= 7;
    }).length;
    
    const percentualConclusao = Math.min(100, Math.round((concluidasSemana / totalAtividadesSemana) * 100));
    document.getElementById('conclusaoSemana').textContent = `${percentualConclusao}%`;
    document.getElementById('metasDiarias').textContent = `${Math.min(concluidasSemana, 5)}/${totalAtividadesSemana}`;
}

// ========== UTILITÁRIOS ==========
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

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function inicializarEventos() {
    const notificationIcon = document.getElementById('notificationsIcon');
    if (notificationIcon) {
        notificationIcon.addEventListener('click', () => {
            alert('📢 Novas atividades foram adicionadas! Confira suas recomendações.');
        });
    }
}

function mostrarErro(mensagem) {
    const alert = document.createElement('div');
    alert.className = 'alert-error';
    alert.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${mensagem}`;
    alert.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background-color: rgba(255, 61, 0, 0.2);
        border: 1px solid #FF3D00;
        color: #FF3D00;
        padding: 15px 25px;
        border-radius: 12px;
        z-index: 3000;
        animation: slideIn 0.3s ease;
    `;
    document.body.appendChild(alert);
    
    setTimeout(() => {
        alert.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => alert.remove(), 300);
    }, 4000);
}

// Estilos para animações
const alertStyles = document.createElement('style');
alertStyles.textContent = `
    @keyframes slideIn {
        from { opacity: 0; transform: translateX(100%); }
        to { opacity: 1; transform: translateX(0); }
    }
    @keyframes fadeOut {
        from { opacity: 1; transform: translateX(0); }
        to { opacity: 0; transform: translateX(100%); }
    }
    .empty-state {
        text-align: center;
        padding: 40px;
        color: var(--text-muted);
    }
    .empty-state i {
        font-size: 3rem;
        margin-bottom: 15px;
        color: var(--primary-color);
    }
`;
document.head.appendChild(alertStyles);