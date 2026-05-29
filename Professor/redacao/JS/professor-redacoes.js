// professor-redacoes.js - Redações dos Alunos com API

// ========== CONFIGURAÇÕES ==========
const API_URL = 'http://localhost:8080';
const ID_PROFESSOR_LOGADO = 1; // ID do professor logado

// Variáveis globais
let todasRedacoes = [];
let listaAlunos = [];
let listaSeries = [];
let redacaoAtual = null;

// ========== INICIALIZAÇÃO ==========
document.addEventListener('DOMContentLoaded', async () => {
    await carregarDadosIniciais();
    inicializarEventos();
});

// ========== CARREGAR DADOS DA API ==========
async function carregarDadosIniciais() {
    try {
        await Promise.all([
            carregarRedacoes(),
            carregarAlunos(),
            carregarSeries()
        ]);
        
        carregarFiltrosTurmas();
        renderizarRedacoes();
        
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
        mostrarErro('Erro ao carregar redações. Tente novamente.');
    }
}

// Buscar todas as redações
async function carregarRedacoes() {
    try {
        const response = await fetch(`${API_URL}/redacoes`);
        if (!response.ok) throw new Error('Erro ao carregar redações');
        todasRedacoes = await response.json();
        console.log('Redações carregadas:', todasRedacoes.length);
    } catch (error) {
        console.error('Erro:', error);
        todasRedacoes = [];
    }
}

// Buscar todos os alunos
async function carregarAlunos() {
    try {
        const response = await fetch(`${API_URL}/alunos`);
        if (!response.ok) throw new Error('Erro ao carregar alunos');
        listaAlunos = await response.json();
        console.log('Alunos carregados:', listaAlunos.length);
    } catch (error) {
        console.error('Erro:', error);
        listaAlunos = [];
    }
}

// Buscar todas as séries
async function carregarSeries() {
    try {
        const response = await fetch(`${API_URL}/series`);
        if (!response.ok) throw new Error('Erro ao carregar séries');
        listaSeries = await response.json();
        console.log('Séries carregadas:', listaSeries.length);
    } catch (error) {
        console.error('Erro:', error);
        listaSeries = [];
    }
}

// Buscar redações por aluno
async function carregarRedacoesPorAluno(idAluno) {
    try {
        const response = await fetch(`${API_URL}/redacoes/aluno/${idAluno}`);
        if (!response.ok) throw new Error('Erro ao carregar redações do aluno');
        return await response.json();
    } catch (error) {
        console.error('Erro:', error);
        return [];
    }
}

// Buscar alunos por série
async function carregarAlunosPorSerie(idSerie) {
    try {
        const response = await fetch(`${API_URL}/alunos/serie/${idSerie}`);
        if (!response.ok) throw new Error('Erro ao carregar alunos da série');
        return await response.json();
    } catch (error) {
        console.error('Erro:', error);
        return [];
    }
}

// ========== FILTROS ==========
function carregarFiltrosTurmas() {
    const turmaFilter = document.getElementById('turmaFilter');
    if (!turmaFilter) return;
    
    // Limpar opções existentes (manter apenas "Todas")
    while (turmaFilter.options.length > 1) {
        turmaFilter.remove(1);
    }
    
    // Adicionar séries como opções
    listaSeries.forEach(serie => {
        const option = document.createElement('option');
        option.value = serie.idSerie;
        option.textContent = `${serie.nome} - ${serie.ano}`;
        turmaFilter.appendChild(option);
    });
}

function filtrarRedacoes() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const statusFilter = document.getElementById('statusFilter').value;
    const turmaFilter = document.getElementById('turmaFilter').value;
    
    let filtradas = [...todasRedacoes];
    
    // Filtrar por status (pendente/corrigida)
    if (statusFilter !== 'todos') {
        filtradas = filtradas.filter(r => {
            const isCorrigida = r.pontuacaoObtida !== null && r.pontuacaoObtida !== undefined;
            if (statusFilter === 'pendente') return !isCorrigida;
            if (statusFilter === 'corrigida') return isCorrigida;
            return true;
        });
    }
    
    // Filtrar por turma (série)
    if (turmaFilter !== 'todas') {
        const idSerie = parseInt(turmaFilter);
        filtradas = filtradas.filter(r => r.aluno?.serie?.idSerie === idSerie);
    }
    
    // Filtrar por busca (nome do aluno ou título)
    if (searchTerm) {
        filtradas = filtradas.filter(r => {
            const nomeAluno = r.aluno?.utilizador?.nome?.toLowerCase() || '';
            const tema = (r.tema || '').toLowerCase();
            return nomeAluno.includes(searchTerm) || tema.includes(searchTerm);
        });
    }
    
    renderizarRedacoes(filtradas);
}

// ========== RENDERIZAR REDAÇÕES ==========
function renderizarRedacoes(redacoes = null) {
    const container = document.getElementById('redacoesContainer');
    const redacoesParaExibir = redacoes || todasRedacoes;
    
    if (!container) return;
    
    if (redacoesParaExibir.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-inbox"></i>
                <p>Nenhuma redação encontrada.</p>
                <p>As redações enviadas pelos alunos aparecerão aqui.</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = redacoesParaExibir.map(redacao => {
        const nomeAluno = redacao.aluno?.utilizador?.nome || 'Aluno não identificado';
        const serieNome = redacao.aluno?.serie?.nome || '';
        const serieAno = redacao.aluno?.serie?.ano || '';
        const turma = serieNome ? `${serieNome} - ${serieAno}` : 'Série não definida';
        const isCorrigida = redacao.pontuacaoObtida !== null && redacao.pontuacaoObtida !== undefined;
        const nota = redacao.pontuacaoObtida || 0;
        
        return `
            <div class="redacao-card" onclick="abrirModalCorrecao(${redacao.idRedacao})">
                <div class="card-header-redacao">
                    <div class="aluno-info">
                        <div class="aluno-avatar">${nomeAluno.charAt(0).toUpperCase()}</div>
                        <div class="aluno-nome">${escapeHtml(nomeAluno)}</div>
                    </div>
                    <div class="status-badge ${isCorrigida ? 'status-corrigida' : 'status-pendente'}">
                        ${isCorrigida ? '✅ Corrigida' : '⏳ Pendente'}
                    </div>
                </div>
                <div class="redacao-tema">
                    <i class="fas fa-tag"></i> ${escapeHtml(redacao.tema || 'Tema não definido')}
                </div>
                <div class="redacao-titulo">
                    <i class="fas fa-heading"></i> ${escapeHtml(redacao.titulo || 'Sem título')}
                </div>
                <div class="redacao-preview">
                    ${escapeHtml((redacao.textoRedacao || '').substring(0, 100))}...
                </div>
                <div class="card-footer-redacao">
                    <span><i class="fas fa-calendar"></i> ${formatarData(redacao.dataEnvio)}</span>
                    ${isCorrigida ? `<span class="redacao-nota"><i class="fas fa-star"></i> ${nota}/1000</span>` : ''}
                </div>
            </div>
        `;
    }).join('');
}

// ========== MODAL DE CORREÇÃO ==========
async function abrirModalCorrecao(idRedacao) {
    try {
        // Buscar dados completos da redação
        const response = await fetch(`${API_URL}/redacoes/${idRedacao}`);
        if (!response.ok) throw new Error('Erro ao carregar redação');
        redacaoAtual = await response.json();
        
        // Preencher modal
        const nomeAluno = redacaoAtual.aluno?.utilizador?.nome || 'Aluno não identificado';
        const serieNome = redacaoAtual.aluno?.serie?.nome || '';
        const serieAno = redacaoAtual.aluno?.serie?.ano || '';
        const turma = serieNome ? `${serieNome} - ${serieAno}` : 'Série não definida';
        
        document.getElementById('modalAluno').textContent = nomeAluno;
        document.getElementById('modalTurma').textContent = turma;
        document.getElementById('modalTema').textContent = redacaoAtual.tema || 'Tema não definido';
        document.getElementById('modalTitulo').textContent = redacaoAtual.titulo || 'Sem título';
        document.getElementById('modalData').textContent = formatarData(redacaoAtual.dataEnvio);
        document.getElementById('modalTexto').textContent = redacaoAtual.textoRedacao || 'Texto não disponível';
        
        // Preencher nota se já existir
        const nota = redacaoAtual.pontuacaoObtida || '';
        const notaInput = document.getElementById('notaInput');
        const notaSlider = document.getElementById('notaSlider');
        if (notaInput) notaInput.value = nota;
        if (notaSlider) notaSlider.value = nota || 500;
        
        document.getElementById('comentarioInput').value = redacaoAtual.comentarios || '';
        
        // Abrir modal
        document.getElementById('correcaoModal').style.display = 'block';
        document.body.style.overflow = 'hidden';
        
        // Sincronizar slider com input
        if (notaSlider && notaInput) {
            notaSlider.oninput = function() { notaInput.value = this.value; };
            notaInput.oninput = function() { notaSlider.value = this.value; };
        }
        
    } catch (error) {
        console.error('Erro ao carregar redação:', error);
        mostrarErro('Erro ao carregar redação para correção');
    }
}

// ========== SALVAR CORREÇÃO ==========
async function salvarCorrecao() {
    if (!redacaoAtual) return;
    
    const nota = parseFloat(document.getElementById('notaInput').value) || 0;
    const comentario = document.getElementById('comentarioInput').value;
    
    // Validar nota
    if (nota < 0 || nota > 1000) {
        mostrarErro('A nota deve estar entre 0 e 1000');
        return;
    }
    
    // Calcular nota das competências
    const competenciasNotas = [];
    document.querySelectorAll('.nota-competencia').forEach(select => {
        const valor = parseInt(select.value);
        if (!isNaN(valor) && valor > 0) {
            competenciasNotas.push(valor);
        }
    });
    
    const somaComp = competenciasNotas.reduce((a, b) => a + b, 0);
    if (competenciasNotas.length === 5 && somaComp > 0) {
        const notaPorComp = somaComp;
        if (confirm(`Nota calculada pelas competências: ${notaPorComp}/1000.\nDeseja usar esta nota?`)) {
            document.getElementById('notaInput').value = notaPorComp;
            document.getElementById('notaSlider').value = notaPorComp;
        }
    }
    
    const notaFinal = parseFloat(document.getElementById('notaInput').value) || 0;
    
    try {
        // 1. Atualizar nota da redação
        const notaResponse = await fetch(`${API_URL}/redacoes/${redacaoAtual.idRedacao}/pontuacao?pontuacaoObtida=${notaFinal}`, {
            method: 'PATCH'
        });
        
        if (!notaResponse.ok) throw new Error('Erro ao salvar nota');
        
        // 2. Atualizar comentários da redação
        const comentarioResponse = await fetch(`${API_URL}/redacoes/${redacaoAtual.idRedacao}/comentarios?comentarios=${encodeURIComponent(comentario)}`, {
            method: 'PATCH'
        });
        
        if (!comentarioResponse.ok) throw new Error('Erro ao salvar comentários');
        
        // 3. Registrar correção
        const correcao = {
            redacao: { idRedacao: redacaoAtual.idRedacao },
            utilizador: { idUtilizador: ID_PROFESSOR_LOGADO },
            pontuacaoObtida: notaFinal,
            dataResposta: new Date().toISOString()
        };
        
        const correcaoResponse = await fetch(`${API_URL}/correcoes-redacao`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(correcao)
        });
        
        if (!correcaoResponse.ok) throw new Error('Erro ao registrar correção');
        
        // Atualizar dados locais
        redacaoAtual.pontuacaoObtida = notaFinal;
        redacaoAtual.comentarios = comentario;
        
        // Recarregar lista
        await carregarRedacoes();
        renderizarRedacoes();
        
        fecharModal();
        mostrarSucesso(`✅ Redação corrigida!\nNota: ${notaFinal}/1000`);
        
    } catch (error) {
        console.error('Erro ao salvar correção:', error);
        mostrarErro('Erro ao salvar correção. Tente novamente.');
    }
}

// ========== FILTRAR POR SÉRIE ==========
async function filtrarPorSerie(idSerie) {
    try {
        const alunosDaSerie = await carregarAlunosPorSerie(idSerie);
        const idsAlunos = alunosDaSerie.map(a => a.idUtilizador);
        
        const todasRedacoesFiltradas = [];
        for (const idAluno of idsAlunos) {
            const redacoes = await carregarRedacoesPorAluno(idAluno);
            todasRedacoesFiltradas.push(...redacoes);
        }
        
        renderizarRedacoes(todasRedacoesFiltradas);
        
    } catch (error) {
        console.error('Erro ao filtrar por série:', error);
        mostrarErro('Erro ao filtrar redações por série');
    }
}

// ========== FILTRAR POR ALUNO ==========
async function filtrarPorAluno(idAluno) {
    try {
        const redacoes = await carregarRedacoesPorAluno(idAluno);
        renderizarRedacoes(redacoes);
    } catch (error) {
        console.error('Erro ao filtrar por aluno:', error);
        mostrarErro('Erro ao filtrar redações por aluno');
    }
}

// ========== FUNÇÕES UTILITÁRIAS ==========
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

function mostrarErro(mensagem) {
    const notification = document.createElement('div');
    notification.className = 'notification-toast error';
    notification.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${mensagem}`;
    notification.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background-color: rgba(255, 61, 0, 0.2);
        border: 1px solid #FF3D00;
        color: #FF3D00;
        padding: 12px 20px;
        border-radius: 8px;
        z-index: 3000;
        animation: slideInRight 0.3s ease;
    `;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 4000);
}

function mostrarSucesso(mensagem) {
    const notification = document.createElement('div');
    notification.className = 'notification-toast success';
    notification.innerHTML = `<i class="fas fa-check-circle"></i> ${mensagem}`;
    notification.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background-color: rgba(0, 230, 118, 0.2);
        border: 1px solid #00E676;
        color: #00E676;
        padding: 12px 20px;
        border-radius: 8px;
        z-index: 3000;
        animation: slideInRight 0.3s ease;
    `;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 4000);
}

function fecharModal() {
    document.getElementById('correcaoModal').style.display = 'none';
    document.body.style.overflow = 'auto';
    redacaoAtual = null;
}

// ========== INICIALIZAR EVENTOS ==========
function inicializarEventos() {
    // Fechar modal
    const closeBtn = document.getElementById('closeModalBtn');
    const cancelarBtn = document.getElementById('cancelarBtn');
    
    if (closeBtn) closeBtn.onclick = fecharModal;
    if (cancelarBtn) cancelarBtn.onclick = fecharModal;
    
    // Salvar correção
    const salvarBtn = document.getElementById('salvarCorrecaoBtn');
    if (salvarBtn) salvarBtn.onclick = salvarCorrecao;
    
    // Fechar modal ao clicar fora
    window.onclick = function(event) {
        const modal = document.getElementById('correcaoModal');
        if (event.target === modal) {
            fecharModal();
        }
    };
    
    // Filtros
    const searchInput = document.getElementById('searchInput');
    const statusFilter = document.getElementById('statusFilter');
    const turmaFilter = document.getElementById('turmaFilter');
    
    if (searchInput) searchInput.onkeyup = filtrarRedacoes;
    if (statusFilter) statusFilter.onchange = filtrarRedacoes;
    if (turmaFilter) turmaFilter.onchange = filtrarRedacoes;
    
    // Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.onclick = function(e) {
            e.preventDefault();
            if (confirm('Deseja realmente sair?')) {
                localStorage.clear();
                window.location.href = '../../../Login/HTML/login.html';
            }
        };
    }
}

// Expor funções globalmente
window.abrirModalCorrecao = abrirModalCorrecao;
window.filtrarRedacoes = filtrarRedacoes;
window.filtrarPorSerie = filtrarPorSerie;
window.filtrarPorAluno = filtrarPorAluno;