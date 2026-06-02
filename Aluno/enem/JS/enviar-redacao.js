// enviar-redacao.js - Com escolha entre Professor e IA

const MICRO_API_URL = 'http://localhost:3001/api/redacao';
const API_URL = 'http://localhost:8080';
const ID_ALUNO_LOGADO = 1;

let tipoSelecionado = null;
let temaAtual = null;
let temaProfessorAtual = null;

document.addEventListener('DOMContentLoaded', async () => {
    await carregarTemaProfessor();
    await carregarHistoricoRedacoes();
    inicializarEventos();
    inicializarNotificacoes();
});

// ========== SELECIONAR TIPO ==========
function selecionarTipo(tipo) {
    tipoSelecionado = tipo;
    
    const optionProfessor = document.getElementById('optionProfessor');
    const optionIA = document.getElementById('optionIA');
    const temaProfessorArea = document.getElementById('temaProfessorArea');
    const temaIArea = document.getElementById('temaIArea');
    
    if (tipo === 'professor') {
        optionProfessor.classList.add('selected');
        optionIA.classList.remove('selected');
        temaProfessorArea.style.display = 'block';
        temaIArea.style.display = 'none';
    } else {
        optionIA.classList.add('selected');
        optionProfessor.classList.remove('selected');
        temaProfessorArea.style.display = 'none';
        temaIArea.style.display = 'block';
        carregarTemaIA();
    }
}

// ========== CARREGAR TEMA DO PROFESSOR ==========
async function carregarTemaProfessor() {
    const temaContainer = document.getElementById('temaProfessorTexto');
    
    try {
        const response = await fetch(`${API_URL}/temas-redacao/ativo`);
        
        if (response.ok) {
            const data = await response.json();
            temaProfessorAtual = data.tema;
            temaContainer.innerHTML = escapeHtml(data.tema);
        } else {
            temaProfessorAtual = "Aguardando tema do professor. Volte em breve!";
            temaContainer.innerHTML = temaProfessorAtual;
        }
    } catch (error) {
        temaProfessorAtual = "Tema indisponível no momento. Tente novamente mais tarde.";
        temaContainer.innerHTML = temaProfessorAtual;
    }
}

// ========== CARREGAR TEMA IA ==========
async function carregarTemaIA() {
    const temaContainer = document.getElementById('temaSemana');
    
    temaContainer.innerHTML = `
        <div class="tema-titulo"><i class="fas fa-spinner fa-pulse"></i> Gerando tema com IA...</div>
        <div class="tema-conteudo" style="text-align: center;">Aguarde...</div>
    `;
    
    try {
        const response = await fetch(`${MICRO_API_URL}/tema-surpresa`);
        
        if (response.ok) {
            const data = await response.json();
            if (data.sucesso) {
                temaAtual = data.tema;
                temaContainer.innerHTML = `
                    <div class="tema-titulo"><i class="fas fa-magic"></i> Tema da Redação (Gerado por IA)</div>
                    <div class="tema-conteudo">${escapeHtml(data.tema)}</div>
                    <div class="tema-actions" style="margin-top: 15px;">
                        <button onclick="carregarTemaIA()" class="btn-novo-tema">
                            <i class="fas fa-dice"></i> Gerar novo tema
                        </button>
                    </div>
                `;
                return;
            }
        }
        
        temaAtual = "Os desafios da educação brasileira no século XXI";
        temaContainer.innerHTML = `
            <div class="tema-titulo"><i class="fas fa-star"></i> Tema da Redação</div>
            <div class="tema-conteudo">${temaAtual}</div>
            <button onclick="carregarTemaIA()" class="btn-novo-tema" style="margin-top: 15px;">
                <i class="fas fa-sync-alt"></i> Gerar tema com IA
            </button>
        `;
    } catch (error) {
        temaAtual = "Os desafios da educação brasileira no século XXI";
        temaContainer.innerHTML = `
            <div class="tema-titulo"><i class="fas fa-exclamation-triangle"></i> Erro de conexão</div>
            <div class="tema-conteudo">${temaAtual}</div>
            <button onclick="carregarTemaIA()" class="btn-novo-tema" style="margin-top: 15px;">
                <i class="fas fa-sync-alt"></i> Tentar novamente
            </button>
        `;
    }
}

// ========== CARREGAR HISTÓRICO ==========
async function carregarHistoricoRedacoes() {
    const container = document.getElementById('historicoList');
    
    try {
        const response = await fetch(`${API_URL}/redacoes/aluno/${ID_ALUNO_LOGADO}`);
        if (!response.ok) throw new Error('Erro ao carregar histórico');
        
        const redacoes = await response.json();
        
        if (redacoes.length === 0) {
            container.innerHTML = `<div class="empty-state"><i class="fas fa-inbox"></i><p>Você ainda não enviou nenhuma redação.</p></div>`;
            return;
        }
        
        container.innerHTML = redacoes.map(redacao => {
            const dataEnvio = formatarData(redacao.dataEnvio);
            const isCorrigida = redacao.pontuacaoObtida !== null;
            return `
                <div class="redacao-item" onclick="verDetalhesRedacao(${redacao.idRedacao})">
                    <div class="redacao-titulo">
                        <span>${escapeHtml(redacao.titulo || 'Sem título')}</span>
                        <span class="redacao-data">${dataEnvio}</span>
                    </div>
                    <div class="redacao-tema-mini"><i class="fas fa-tag"></i> ${escapeHtml((redacao.tema || '').substring(0, 60))}...</div>
                    <div><span class="redacao-status ${isCorrigida ? 'status-corrigida' : 'status-pendente'}">
                        ${isCorrigida ? `✅ Corrigida - Nota: ${redacao.pontuacaoObtida}/1000` : '⏳ Aguardando correção'}
                    </span></div>
                </div>
            `;
        }).join('');
    } catch (error) {
        container.innerHTML = `<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><p>Erro ao carregar histórico.</p></div>`;
    }
}

// ========== ENVIAR REDAÇÃO ==========
async function enviarRedacao(event) {
    event.preventDefault();
    
    if (!tipoSelecionado) {
        mostrarNotificacao('Por favor, selecione o tipo de redação (Professor ou IA).', 'error');
        return;
    }
    
    const titulo = document.getElementById('titulo').value.trim();
    const conteudo = document.getElementById('conteudo').value.trim();
    const submitBtn = document.getElementById('submitBtn');
    const originalText = submitBtn.innerHTML;
    
    if (!titulo) {
        mostrarNotificacao('Por favor, insira um título para sua redação.', 'error');
        return;
    }
    
    if (conteudo.length < 100) {
        mostrarNotificacao('Sua redação deve ter no mínimo 100 caracteres.', 'error');
        return;
    }
    
    let temaEscolhido;
    if (tipoSelecionado === 'professor') {
        temaEscolhido = temaProfessorAtual;
        if (!temaEscolhido || temaEscolhido.includes('Aguardando')) {
            mostrarNotificacao('Aguarde o professor definir um tema.', 'error');
            return;
        }
    } else {
        temaEscolhido = temaAtual;
        if (!temaEscolhido) {
            mostrarNotificacao('Aguarde o tema ser gerado.', 'error');
            return;
        }
    }
    
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-pulse"></i> Enviando...';
    submitBtn.disabled = true;
    
    try {
        const redacaoData = {
            aluno: { idUtilizador: ID_ALUNO_LOGADO },
            tema: temaEscolhido,
            titulo: titulo,
            textoRedacao: conteudo,
            dataEnvio: new Date().toISOString(),
            pontuacaoObtida: null,
            comentarios: null
        };
        
        const response = await fetch(`${API_URL}/redacoes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(redacaoData)
        });
        
        if (!response.ok) throw new Error('Erro ao enviar');
        
        mostrarNotificacao('✅ Redação enviada com sucesso! Aguarde a correção.', 'success');
        document.getElementById('titulo').value = '';
        document.getElementById('conteudo').value = '';
        await carregarHistoricoRedacoes();
        
        if (tipoSelecionado === 'ia') await carregarTemaIA();
        
    } catch (error) {
        mostrarNotificacao('❌ Erro ao enviar redação. Tente novamente.', 'error');
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

// ========== VER DETALHES ==========
async function verDetalhesRedacao(idRedacao) {
    try {
        const response = await fetch(`${API_URL}/redacoes/${idRedacao}`);
        if (!response.ok) throw new Error('Erro');
        const red = await response.json();
        alert(`📝 ${red.titulo}\n\n📅 Enviado: ${formatarData(red.dataEnvio)}\n📌 Tema: ${red.tema}\n\n📄 ${red.textoRedacao.substring(0, 500)}...\n\n${red.pontuacaoObtida ? `⭐ Nota: ${red.pontuacaoObtida}/1000\n💬 ${red.comentarios}` : '⏳ Aguardando correção'}`);
    } catch (error) {
        mostrarNotificacao('Erro ao carregar detalhes', 'error');
    }
}

function limparFormulario() {
    if (confirm('Limpar formulário?')) {
        document.getElementById('titulo').value = '';
        document.getElementById('conteudo').value = '';
        mostrarNotificacao('Formulário limpo!', 'info');
    }
}

function inicializarNotificacoes() {
    const icon = document.getElementById('notificationsIcon');
    const modal = document.getElementById('notificationsModal');
    const close = document.querySelector('.close-modal');
    if (icon && modal) icon.onclick = () => modal.style.display = 'block';
    if (close && modal) close.onclick = () => modal.style.display = 'none';
    window.onclick = (e) => { if (modal && e.target === modal) modal.style.display = 'none'; };
}

function mostrarNotificacao(msg, type) {
    const n = document.createElement('div');
    n.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i> ${msg}`;
    n.style.cssText = `position:fixed; bottom:20px; right:20px; background:${type === 'success' ? 'rgba(0,230,118,0.2)' : 'rgba(255,61,0,0.2)'}; border:1px solid ${type === 'success' ? '#00E676' : '#FF3D00'}; color:${type === 'success' ? '#00E676' : '#FF3D00'}; padding:12px 20px; border-radius:8px; z-index:3000; animation:slideInRight 0.3s ease;`;
    document.body.appendChild(n);
    setTimeout(() => n.remove(), 3000);
}

function inicializarEventos() {
    document.getElementById('redacaoForm')?.addEventListener('submit', enviarRedacao);
    document.getElementById('clearBtn')?.addEventListener('click', limparFormulario);
    document.getElementById('refreshHistorico')?.addEventListener('click', () => carregarHistoricoRedacoes());
    const logout = document.getElementById('logoutBtn');
    if (logout) logout.onclick = (e) => { e.preventDefault(); if (confirm('Sair?')) window.location.href = '../../../Login/HTML/login.html'; };
}

function formatarData(str) { if (!str) return '-'; try { return new Date(str).toLocaleDateString('pt-BR'); } catch { return '-'; } }
function escapeHtml(t) { if (!t) return ''; return t.replace(/[&<>]/g, function(m) { if (m === '&') return '&amp;'; if (m === '<') return '&lt;'; if (m === '>') return '&gt;'; return m; }); }

const style = document.createElement('style');
style.textContent = `@keyframes slideInRight { from { opacity:0; transform:translateX(100%); } to { opacity:1; transform:translateX(0); } }`;
document.head.appendChild(style);

window.carregarTemaIA = carregarTemaIA;
window.selecionarTipo = selecionarTipo;
window.verDetalhesRedacao = verDetalhesRedacao;