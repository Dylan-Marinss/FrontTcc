// perfil.js - Página de Perfil do Aluno

// ========== CONFIGURAÇÕES ==========
const API_URL = 'http://localhost:8080';
const ID_ALUNO_LOGADO = 1;

// Variáveis globais
let dadosAluno = null;
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

// ALTERAÇÃO 1: adicionado carregarAtividadesRespondidas() no Promise.all
async function carregarDados() {
    try {
        await Promise.all([
            carregarAluno(),
            carregarListaAlunos(),
            carregarAtividadesRespondidas()
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
    console.log('[EstudeX] Aluno:', dadosAluno);
}

async function carregarListaAlunos() {
    const response = await fetch(`${API_URL}/alunos`);
    if (!response.ok) throw new Error('Erro ao carregar alunos');
    listaAlunos = await response.json();
}

// ALTERAÇÃO 2: filtro usa r.aluno.id (objeto) em vez de r.idAluno (número solto)
async function carregarAtividadesRespondidas() {
    const response = await fetch(`${API_URL}/atividadesrespostas`);
    if (!response.ok) throw new Error('Erro ao carregar respostas');
    const todas = await response.json();
    atividadesRespondidas = todas.filter(r =>
        r.aluno?.id === ID_ALUNO_LOGADO && r.pontuacao !== null
    );
    console.log('[EstudeX] Respostas do aluno:', atividadesRespondidas);
}

// ========== ATUALIZAR PERFIL ==========
function atualizarPerfil() {
    if (!dadosAluno) return;

    const nome = dadosAluno.nome || 'Usuário';
    document.getElementById('nomeAluno').textContent = nome;

    const serie = dadosAluno.serie;
    const serieTexto = serie
        ? `${serie.nomeSerie} (${serie.inicio?.split('-')[0] ?? ''})`
        : 'Não definida';
    document.getElementById('serieAluno').textContent = serieTexto;

    const xpTotal = dadosAluno.xp || 0;
    document.getElementById('xpTotal').textContent = xpTotal.toLocaleString('pt-BR');

    const nivel = calcularNivel(xpTotal);
    document.getElementById('nivelAtual').textContent = getNivelTexto(nivel);

    const xpBase     = calcularXPTotalAteNivel(nivel);
    const xpRange    = calcularXPProximoNivel(nivel);
    const xpAtual    = xpTotal - xpBase;
    const percentual = Math.min(100, Math.round((xpAtual / xpRange) * 100));
    document.getElementById('levelFill').style.width = `${percentual}%`;

    const iniciais = nome.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();
    document.getElementById('avatarImg').src =
        `https://ui-avatars.com/api/?background=BB86FC&color=121212&bold=true&size=120&name=${encodeURIComponent(iniciais)}`;

    if (bioAtual) {
        document.getElementById('bioTexto').textContent = bioAtual;
    }

    atualizarEstatisticas();
    atualizarConquistas(xpTotal);
}

// ========== CÁLCULO DE NÍVEL ==========
function calcularNivel(xp) {
    if (xp < 100)  return 1;
    if (xp < 300)  return 2;
    if (xp < 600)  return 3;
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

// ALTERAÇÃO 3: pontuacaoMaxima vem dentro de r.atividade (objeto), não de todasAtividades
function atualizarEstatisticas() {
    const total = atividadesRespondidas.length;
    document.getElementById('atividadesConcluidas').textContent = total;

    let somaNotas = 0, somaMaximas = 0;
    atividadesRespondidas.forEach(r => {
        somaNotas   += r.pontuacao || 0;
        somaMaximas += r.atividade?.pontuacaoMaxima || 100;
    });

    const taxa = somaMaximas > 0 ? (somaNotas / somaMaximas) * 100 : 0;
    document.getElementById('taxaAcerto').textContent  = `${taxa.toFixed(1)}%`;
    document.getElementById('melhorSequencia').textContent = Math.min(total, 5);
}


// ========== CONQUISTAS ==========
function atualizarConquistas(xp) {
    const conquistas = [
        { nome: 'Iniciante',  icone: 'fa-star',   xpNecessario: 0    },
        { nome: 'Dedicado',   icone: 'fa-trophy',  xpNecessario: 200  },
        { nome: 'Explorador', icone: 'fa-rocket',  xpNecessario: 500  },
        { nome: 'Mestre',     icone: 'fa-brain',   xpNecessario: 1000 },
        { nome: 'Em Chamas',  icone: 'fa-fire',    xpNecessario: 2000 },
        { nome: 'Lendário',   icone: 'fa-crown',   xpNecessario: 3500 },
    ];

    conquistas.forEach(c => { c.unlocked = xp >= c.xpNecessario; });

    const grid = document.getElementById('achievementsGrid');
    grid.innerHTML = conquistas.map(c => `
        <div class="achievement-item ${c.unlocked ? 'unlocked' : 'locked'}">
            <i class="fas ${c.icone}"></i>
            <span>${c.nome}</span>
            ${!c.unlocked ? `<small style="font-size:0.7rem">${c.xpNecessario} XP</small>` : ''}
        </div>
    `).join('');

    window.conquistasList = conquistas;
}

// ========== EVENTOS ==========
function inicializarEventos() {
    const editBioBtn   = document.getElementById('editBioBtn');
    const bioTexto     = document.getElementById('bioTexto');
    const bioEditArea  = document.getElementById('bioEditArea');
    const bioTextarea  = document.getElementById('bioTextarea');
    const saveBioBtn   = document.getElementById('saveBioBtn');
    const cancelBioBtn = document.getElementById('cancelBioBtn');

    editBioBtn?.addEventListener('click', () => {
        bioTextarea.value         = bioAtual;
        bioTexto.style.display    = 'none';
        bioEditArea.style.display = 'block';
        editBioBtn.style.display  = 'none';
    });

    saveBioBtn?.addEventListener('click', () => {
        bioAtual = bioTextarea.value;
        localStorage.setItem('userBio', bioAtual);
        bioTexto.textContent      = bioAtual || 'Clique em editar para adicionar uma bio!';
        bioTexto.style.display    = 'block';
        bioEditArea.style.display = 'none';
        editBioBtn.style.display  = 'flex';
    });

    cancelBioBtn?.addEventListener('click', () => {
        bioTexto.style.display    = 'block';
        bioEditArea.style.display = 'none';
        editBioBtn.style.display  = 'flex';
    });

    const viewAchievementsBtn = document.getElementById('viewAchievementsBtn');
    const achievementsModal   = document.getElementById('achievementsModal');
    const closeModal          = document.querySelector('.close-modal');

    viewAchievementsBtn?.addEventListener('click', () => {
        if (window.conquistasList) {
            document.getElementById('achievementsFullGrid').innerHTML =
                window.conquistasList.map(c => `
                    <div class="achievement-item ${c.unlocked ? 'unlocked' : 'locked'}">
                        <i class="fas ${c.icone}"></i>
                        <span>${c.nome}</span>
                        <small>${c.xpNecessario} XP</small>
                    </div>
                `).join('');
            achievementsModal.style.display = 'block';
        }
    });

    closeModal?.addEventListener('click', () => {
        achievementsModal.style.display = 'none';
    });

    window.addEventListener('click', e => {
        if (e.target === achievementsModal) achievementsModal.style.display = 'none';
    });

    document.getElementById('editAvatarBtn')?.addEventListener('click', () => {
        alert('Upload de avatar será implementado em breve!');
    });
}

// ========== UTILITÁRIOS ==========
function mostrarErro(mensagem) {
    const div = document.createElement('div');
    div.className = 'alert-error';
    div.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${mensagem}`;
    div.style.cssText = `
        position: fixed; top: 20px; right: 20px;
        background: rgba(255,61,0,0.2); border: 1px solid #FF3D00;
        color: #FF3D00; padding: 15px 25px; border-radius: 12px;
        z-index: 3000; animation: slideIn 0.3s ease;
    `;
    document.body.appendChild(div);
    setTimeout(() => {
        div.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => div.remove(), 300);
    }, 4000);
}

const alertStyles = document.createElement('style');
alertStyles.textContent = `
    @keyframes slideIn { from { opacity:0; transform:translateX(100%) } to { opacity:1; transform:translateX(0) } }
    @keyframes fadeOut { from { opacity:1; transform:translateX(0) } to { opacity:0; transform:translateX(100%) } }
`;
document.head.appendChild(alertStyles);