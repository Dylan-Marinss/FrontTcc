// perfil.js - Página de Perfil do Aluno

// ========== CONFIGURAÇÕES ==========
const API_URL = 'http://localhost:8080';
const ID_ALUNO_LOGADO = 1;

// Variáveis globais
let dadosAluno = null;
let dadosSerie = null;
let listaAlunos = [];
let atividadesRespondidas = [];
let todasAtividades = [];

// Bio salva no localStorage
let bioAtual = localStorage.getItem('userBio') || '';

// ========== INICIALIZAÇÃO ==========
document.addEventListener('DOMContentLoaded', async () => {
    await carregarDados();
    inicializarEventos();
});

async function carregarDados() {
    try {
        await Promise.all([
            carregarAluno(),
            carregarTodasAtividades(),
            carregarAtividadesRespondidas(),
            carregarListaAlunos()
        ]);
        
        atualizarPerfil();
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
        mostrarErro('Erro ao carregar dados do perfil');
    }
}

// ========== REQUISIÇÕES API ==========
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

async function carregarAtividadesRespondidas() {
    const response = await fetch(`${API_URL}/atividadesrespostas`);
    if (!response.ok) throw new Error('Erro ao carregar respostas');
    const todasRespostas = await response.json();
    atividadesRespondidas = todasRespostas.filter(r => 
        r.idAluno === ID_ALUNO_LOGADO && r.pontuacao !== null
    );
}

async function carregarListaAlunos() {
    const response = await fetch(`${API_URL}/alunos`);
    if (!response.ok) throw new Error('Erro ao carregar alunos');
    listaAlunos = await response.json();
}

// ========== ATUALIZAR PERFIL ==========
function atualizarPerfil() {
    if (!dadosAluno) return;
    
    // Nome do aluno
    document.getElementById('nomeAluno').textContent = dadosAluno.utilizador?.nome || 'Usuário';
    
    // Série
    const serieTexto = dadosSerie ? `${dadosSerie.nome} - ${dadosSerie.ano}` : 'Não definida';
    document.getElementById('serieAluno').textContent = serieTexto;
    
    // XP Total
    const xpTotal = dadosAluno.xp || 0;
    document.getElementById('xpTotal').textContent = xpTotal;
    
    // Calcular nível baseado no XP
    const nivel = calcularNivel(xpTotal);
    const nivelTexto = getNivelTexto(nivel);
    document.getElementById('nivelAtual').textContent = nivelTexto;
    
    // Barra de nível
    const xpProximoNivel = calcularXPProximoNivel(nivel);
    const xpAtual = xpTotal - calcularXPTotalAteNivel(nivel);
    const percentualLevel = (xpAtual / xpProximoNivel) * 100;
    document.getElementById('levelFill').style.width = `${percentualLevel}%`;
    
    // Avatar (inicial do nome)
    const nomeInicial = dadosAluno.utilizador?.nome?.charAt(0) || 'U';
    document.getElementById('avatarImg').src = `https://ui-avatars.com/api/?background=BB86FC&color=121212&bold=true&size=120&name=${nomeInicial}`;
    
    // Bio
    if (bioAtual) {
        document.getElementById('bioTexto').textContent = bioAtual;
    }
    
    // Atualizar estatísticas
    atualizarEstatisticas();
    
    // Atualizar ranking
    atualizarRanking();
    
    // Atualizar conquistas baseado no XP
    atualizarConquistas(xpTotal);
}

// ========== CÁLCULO DE NÍVEL ==========
function calcularNivel(xp) {
    if (xp < 100) return 1;
    if (xp < 300) return 2;
    if (xp < 600) return 3;
    if (xp < 1000) return 4;
    if (xp < 1500) return 5;
    if (xp < 2100) return 6;
    if (xp < 2800) return 7;
    if (xp < 3600) return 8;
    if (xp < 4500) return 9;
    return 10;
}

function calcularXPTotalAteNivel(nivel) {
    const niveis = [0, 0, 100, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500];
    return niveis[nivel] || 4500;
}

function calcularXPProximoNivel(nivel) {
    const niveis = [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000];
    return niveis[nivel - 1] || 1000;
}

function getNivelTexto(nivel) {
    const textos = ['Iniciante', 'Aprendiz', 'Estudante', 'Dedicado', 'Experiente', 'Avançado', 'Expert', 'Mestre', 'Lendário', 'Mítico'];
    return textos[nivel - 1] || 'Mítico';
}

// ========== ESTATÍSTICAS ==========
function atualizarEstatisticas() {
    const totalAtividades = atividadesRespondidas.length;
    document.getElementById('atividadesConcluidas').textContent = totalAtividades;
    
    // Taxa de acerto
    let somaNotas = 0;
    let somaMaximas = 0;
    
    atividadesRespondidas.forEach(resposta => {
        const atividade = todasAtividades.find(a => a.idAtividade === resposta.idAtividade);
        const notaMaxima = atividade?.pontuacaoMaxima || 100;
        somaNotas += resposta.pontuacao || 0;
        somaMaximas += notaMaxima;
    });
    
    const taxaAcerto = somaMaximas > 0 ? (somaNotas / somaMaximas) * 100 : 0;
    document.getElementById('taxaAcerto').textContent = `${taxaAcerto.toFixed(1)}%`;
    
    // Total de pontos
    document.getElementById('totalPontos').textContent = somaNotas.toFixed(0);
    
    // Melhor sequência (simulado)
    const melhorSequencia = Math.min(totalAtividades, 5);
    document.getElementById('melhorSequencia').textContent = melhorSequencia;
}

// ========== RANKING ==========
function atualizarRanking() {
    if (!listaAlunos.length) return;
    
    // Ordenar alunos por XP
    const ranking = [...listaAlunos].sort((a, b) => (b.xp || 0) - (a.xp || 0));
    
    // Posição do aluno
    const posicao = ranking.findIndex(a => a.id === ID_ALUNO_LOGADO) + 1;
    document.getElementById('posicaoRanking').textContent = `#${posicao}`;
    document.getElementById('totalAlunos').textContent = ranking.length;
    
    // Percentil
    const percentil = ((ranking.length - posicao) / ranking.length) * 100;
    document.getElementById('percentilRanking').textContent = `${percentil.toFixed(1)}%`;
    
    // Barra de progresso do ranking
    const progressoRanking = (posicao / ranking.length) * 100;
    document.getElementById('progressFillRanking').style.width = `${progressoRanking}%`;
    
    // Próximo nível
    const xpTotal = dadosAluno?.xp || 0;
    const nivelAtual = calcularNivel(xpTotal);
    const xpProximo = calcularXPProximoNivel(nivelAtual + 1);
    const xpNecessario = xpProximo - (xpTotal - calcularXPTotalAteNivel(nivelAtual));
    document.getElementById('proximoNivelTexto').textContent = `Faltam ${xpNecessario} XP para o próximo nível`;
}

// ========== CONQUISTAS ==========
function atualizarConquistas(xp) {
    const conquistas = [
        { id: 1, nome: 'Iniciante', icone: 'fa-star', xpNecessario: 0, unlocked: xp >= 0 },
        { id: 2, nome: 'Dedicado', icone: 'fa-trophy', xpNecessario: 200, unlocked: xp >= 200 },
        { id: 3, nome: 'Explorador', icone: 'fa-rocket', xpNecessario: 500, unlocked: xp >= 500 },
        { id: 4, nome: 'Mestre', icone: 'fa-brain', xpNecessario: 1000, unlocked: xp >= 1000 },
        { id: 5, nome: 'Em Chamas', icone: 'fa-fire', xpNecessario: 2000, unlocked: xp >= 2000 },
        { id: 6, nome: 'Lendário', icone: 'fa-crown', xpNecessario: 3500, unlocked: xp >= 3500 }
    ];
    
    const grid = document.getElementById('achievementsGrid');
    grid.innerHTML = conquistas.map(conq => `
        <div class="achievement-item ${conq.unlocked ? 'unlocked' : 'locked'}">
            <i class="fas ${conq.icone}"></i>
            <span>${conq.nome}</span>
            ${!conq.unlocked ? `<small style="font-size: 0.7rem;">${conq.xpNecessario} XP</small>` : ''}
        </div>
    `).join('');
    
    // Salvar para o modal
    window.conquistasList = conquistas;
}

// ========== EVENTOS ==========
function inicializarEventos() {
    // Editar Bio
    const editBioBtn = document.getElementById('editBioBtn');
    const bioTexto = document.getElementById('bioTexto');
    const bioEditArea = document.getElementById('bioEditArea');
    const bioTextarea = document.getElementById('bioTextarea');
    const saveBioBtn = document.getElementById('saveBioBtn');
    const cancelBioBtn = document.getElementById('cancelBioBtn');
    
    if (editBioBtn) {
        editBioBtn.addEventListener('click', () => {
            bioTextarea.value = bioAtual;
            bioTexto.style.display = 'none';
            bioEditArea.style.display = 'block';
            editBioBtn.style.display = 'none';
        });
    }
    
    if (saveBioBtn) {
        saveBioBtn.addEventListener('click', () => {
            bioAtual = bioTextarea.value;
            localStorage.setItem('userBio', bioAtual);
            bioTexto.textContent = bioAtual || 'Clique em editar para adicionar uma bio sobre você!';
            bioTexto.style.display = 'block';
            bioEditArea.style.display = 'none';
            editBioBtn.style.display = 'flex';
        });
    }
    
    if (cancelBioBtn) {
        cancelBioBtn.addEventListener('click', () => {
            bioTexto.style.display = 'block';
            bioEditArea.style.display = 'none';
            editBioBtn.style.display = 'flex';
        });
    }
    
    // Modal de conquistas
    const viewAchievementsBtn = document.getElementById('viewAchievementsBtn');
    const achievementsModal = document.getElementById('achievementsModal');
    const closeModal = document.querySelector('.close-modal');
    
    if (viewAchievementsBtn) {
        viewAchievementsBtn.addEventListener('click', () => {
            if (window.conquistasList) {
                const fullGrid = document.getElementById('achievementsFullGrid');
                fullGrid.innerHTML = window.conquistasList.map(conq => `
                    <div class="achievement-item ${conq.unlocked ? 'unlocked' : 'locked'}">
                        <i class="fas ${conq.icone}"></i>
                        <span>${conq.nome}</span>
                        <small>${conq.xpNecessario} XP</small>
                    </div>
                `).join('');
                achievementsModal.style.display = 'block';
            }
        });
    }
    
    if (closeModal) {
        closeModal.addEventListener('click', () => {
            achievementsModal.style.display = 'none';
        });
    }
    
    // Fechar modal ao clicar fora
    window.addEventListener('click', (e) => {
        if (e.target === achievementsModal) {
            achievementsModal.style.display = 'none';
        }
    });
    
    // Ver ranking
    const viewRankingBtn = document.getElementById('viewRankingBtn');
    if (viewRankingBtn) {
        viewRankingBtn.addEventListener('click', () => {
            alert('Ranking completo será implementado em breve!');
        });
    }
    
    // Editar avatar
    const editAvatarBtn = document.getElementById('editAvatarBtn');
    if (editAvatarBtn) {
        editAvatarBtn.addEventListener('click', () => {
            alert('Funcionalidade de upload de avatar será implementada em breve!');
        });
    }
}

// ========== UTILITÁRIOS ==========
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

// Estilos para alertas
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
`;
document.head.appendChild(alertStyles);