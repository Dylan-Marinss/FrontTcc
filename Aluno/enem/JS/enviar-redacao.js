// enviar-redacao.js - Página de Envio de Redação com API

// ========== CONFIGURAÇÕES ==========
const MICRO_API_URL = 'http://localhost:3001/api/redacao';
const API_URL = 'http://localhost:8080';
const ID_ALUNO_LOGADO = 1; // ID do aluno logado

// Variáveis globais
let temaAtual = null;

// ========== INICIALIZAÇÃO ==========
document.addEventListener('DOMContentLoaded', async () => {
    await carregarTemaSemana();
    await carregarHistoricoRedacoes();
    inicializarEventos();
    inicializarNotificacoes();
});

// ========== CARREGAR TEMA DA SEMANA (IA) ==========
async function carregarTemaSemana() {
    const temaContainer = document.getElementById('temaSemana');
    
    temaContainer.innerHTML = `
        <div class="tema-titulo">
            <i class="fas fa-spinner fa-pulse"></i> Gerando tema com IA...
        </div>
        <div class="tema-conteudo" style="text-align: center;">
            Aguarde, estamos criando um tema exclusivo para você!
        </div>
    `;
    
    try {
        const response = await fetch(`${MICRO_API_URL}/tema-surpresa`);
        
        if (response.ok) {
            const data = await response.json();
            
            if (data.sucesso) {
                temaAtual = data.tema;
                temaContainer.innerHTML = `
                    <div class="tema-titulo">
                        <i class="fas fa-magic"></i> Tema da Redação (Gerado por IA)
                    </div>
                    <div class="tema-conteudo">
                        ${escapeHtml(data.tema)}
                    </div>
                    <div class="tema-actions" style="margin-top: 15px; display: flex; gap: 10px; flex-wrap: wrap;">
                        <button onclick="carregarTemaAleatorio()" class="btn-novo-tema">
                            <i class="fas fa-dice"></i> Novo tema
                        </button>
                        <button onclick="carregarTemaPorCategoria('tecnologia')" class="btn-categoria">
                            <i class="fas fa-microchip"></i> Tecnologia
                        </button>
                        <button onclick="carregarTemaPorCategoria('meioambiente')" class="btn-categoria">
                            <i class="fas fa-leaf"></i> Meio Ambiente
                        </button>
                        <button onclick="carregarTemaPorCategoria('educacao')" class="btn-categoria">
                            <i class="fas fa-graduation-cap"></i> Educação
                        </button>
                        <button onclick="carregarTemaPorCategoria('saude')" class="btn-categoria">
                            <i class="fas fa-heartbeat"></i> Saúde
                        </button>
                        <button onclick="carregarTemaPorCategoria('cultura')" class="btn-categoria">
                            <i class="fas fa-palette"></i> Cultura
                        </button>
                    </div>
                `;
                return;
            }
        }
        
        // Fallback
        temaAtual = "Os desafios da educação brasileira no século XXI";
        temaContainer.innerHTML = `
            <div class="tema-titulo">
                <i class="fas fa-star"></i> Tema da Redação
            </div>
            <div class="tema-conteudo">
                ${temaAtual}
            </div>
            <button onclick="carregarTemaAleatorio()" class="btn-novo-tema" style="margin-top: 15px;">
                <i class="fas fa-sync-alt"></i> Gerar tema com IA
            </button>
        `;
        
    } catch (error) {
        console.error('Erro ao carregar tema:', error);
        temaAtual = "Os desafios da educação brasileira no século XXI";
        temaContainer.innerHTML = `
            <div class="tema-titulo">
                <i class="fas fa-star"></i> Tema da Redação
            </div>
            <div class="tema-conteudo">
                ${temaAtual}
            </div>
            <button onclick="carregarTemaAleatorio()" class="btn-novo-tema" style="margin-top: 15px;">
                <i class="fas fa-sync-alt"></i> Tentar gerar com IA
            </button>
        `;
    }
}

// Gerar tema aleatório via IA
async function carregarTemaAleatorio() {
    const temaContainer = document.getElementById('temaSemana');
    
    temaContainer.innerHTML = `
        <div class="tema-titulo">
            <i class="fas fa-spinner fa-pulse"></i> Gerando novo tema...
        </div>
        <div class="tema-conteudo" style="text-align: center;">
            A IA está pensando em um tema exclusivo para você!
        </div>
    `;
    
    try {
        const response = await fetch(`${MICRO_API_URL}/tema-surpresa`);
        const data = await response.json();
        
        if (data.sucesso) {
            temaAtual = data.tema;
            temaContainer.innerHTML = `
                <div class="tema-titulo">
                    <i class="fas fa-magic"></i> Tema da Redação (Gerado por IA)
                </div>
                <div class="tema-conteudo">
                    ${escapeHtml(data.tema)}
                </div>
                <div class="tema-actions" style="margin-top: 15px; display: flex; gap: 10px; flex-wrap: wrap;">
                    <button onclick="carregarTemaAleatorio()" class="btn-novo-tema">
                        <i class="fas fa-dice"></i> Novo tema
                    </button>
                    <button onclick="carregarTemaPorCategoria('tecnologia')" class="btn-categoria">
                        <i class="fas fa-microchip"></i> Tecnologia
                    </button>
                    <button onclick="carregarTemaPorCategoria('meioambiente')" class="btn-categoria">
                        <i class="fas fa-leaf"></i> Meio Ambiente
                    </button>
                    <button onclick="carregarTemaPorCategoria('educacao')" class="btn-categoria">
                        <i class="fas fa-graduation-cap"></i> Educação
                    </button>
                    <button onclick="carregarTemaPorCategoria('saude')" class="btn-categoria">
                        <i class="fas fa-heartbeat"></i> Saúde
                    </button>
                    <button onclick="carregarTemaPorCategoria('cultura')" class="btn-categoria">
                        <i class="fas fa-palette"></i> Cultura
                    </button>
                </div>
            `;
            mostrarNotificacao('🎲 Novo tema gerado com sucesso!', 'success');
        }
    } catch (error) {
        console.error('Erro:', error);
        temaContainer.innerHTML = `
            <div class="tema-titulo">
                <i class="fas fa-exclamation-triangle"></i> Erro ao gerar tema
            </div>
            <div class="tema-conteudo">
                ${temaAtual}
            </div>
            <button onclick="carregarTemaAleatorio()" class="btn-novo-tema" style="margin-top: 15px;">
                <i class="fas fa-sync-alt"></i> Tentar novamente
            </button>
        `;
        mostrarNotificacao('❌ Erro ao conectar com o servidor de IA', 'error');
    }
}

// Gerar tema por categoria
async function carregarTemaPorCategoria(categoria) {
    const temaContainer = document.getElementById('temaSemana');
    
    const categoriasNomes = {
        tecnologia: 'Tecnologia',
        meioambiente: 'Meio Ambiente',
        educacao: 'Educação',
        saude: 'Saúde',
        cultura: 'Cultura'
    };
    
    temaContainer.innerHTML = `
        <div class="tema-titulo">
            <i class="fas fa-spinner fa-pulse"></i> Gerando tema sobre ${categoriasNomes[categoria]}...
        </div>
        <div class="tema-conteudo" style="text-align: center;">
            A IA está criando um tema especial para você!
        </div>
    `;
    
    try {
        const response = await fetch(`${MICRO_API_URL}/tema/${categoria}`);
        const data = await response.json();
        
        if (data.sucesso) {
            temaAtual = data.tema;
            temaContainer.innerHTML = `
                <div class="tema-titulo">
                    <i class="fas fa-tag"></i> Tema sobre ${categoriasNomes[categoria]}
                </div>
                <div class="tema-conteudo">
                    ${escapeHtml(data.tema)}
                </div>
                <div class="tema-actions" style="margin-top: 15px; display: flex; gap: 10px; flex-wrap: wrap;">
                    <button onclick="carregarTemaAleatorio()" class="btn-novo-tema">
                        <i class="fas fa-dice"></i> Novo tema aleatório
                    </button>
                    <button onclick="carregarTemaPorCategoria('${categoria}')" class="btn-categoria">
                        <i class="fas fa-sync-alt"></i> Outro tema de ${categoriasNomes[categoria]}
                    </button>
                </div>
            `;
            mostrarNotificacao(`📚 Tema sobre ${categoriasNomes[categoria]} gerado!`, 'success');
        }
    } catch (error) {
        console.error('Erro:', error);
        await carregarTemaAleatorio();
    }
}

// ========== CARREGAR HISTÓRICO DO ALUNO (API) ==========
async function carregarHistoricoRedacoes() {
    const container = document.getElementById('historicoList');
    
    try {
        const response = await fetch(`${API_URL}/redacoes/aluno/${ID_ALUNO_LOGADO}`);
        
        if (!response.ok) {
            throw new Error('Erro ao carregar histórico');
        }
        
        const redacoes = await response.json();
        
        if (redacoes.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-inbox"></i>
                    <p>Você ainda não enviou nenhuma redação.</p>
                    <p>Escreva sua primeira redação acima!</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = redacoes.map(redacao => {
            const dataEnvio = formatarData(redacao.dataEnvio);
            const isCorrigida = redacao.pontuacaoObtida !== null && redacao.pontuacaoObtida !== undefined;
            const nota = redacao.pontuacaoObtida || 0;
            
            return `
                <div class="redacao-item" onclick="verDetalhesRedacao(${redacao.idRedacao})">
                    <div class="redacao-titulo">
                        <span>${escapeHtml(redacao.titulo || 'Sem título')}</span>
                        <span class="redacao-data">${dataEnvio}</span>
                    </div>
                    <div class="redacao-tema-mini">
                        <i class="fas fa-tag"></i> ${escapeHtml((redacao.tema || '').substring(0, 60))}...
                    </div>
                    <div>
                        <span class="redacao-status ${isCorrigida ? 'status-corrigida' : 'status-pendente'}">
                            ${isCorrigida ? `✅ Corrigida - Nota: ${nota}/1000` : '⏳ Aguardando correção'}
                        </span>
                    </div>
                    ${redacao.comentarios && isCorrigida ? `
                        <div class="redacao-observacao">
                            <i class="fas fa-comment"></i> ${escapeHtml(redacao.comentarios.substring(0, 80))}...
                        </div>
                    ` : ''}
                </div>
            `;
        }).join('');
        
    } catch (error) {
        console.error('Erro ao carregar histórico:', error);
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Erro ao carregar histórico. Tente novamente.</p>
            </div>
        `;
    }
}

// ========== ENVIAR REDAÇÃO (SALVAR NA API) ==========
async function enviarRedacao(event) {
    event.preventDefault();
    
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
    
    if (!temaAtual) {
        mostrarNotificacao('Aguarde o tema ser carregado.', 'error');
        return;
    }
    
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-pulse"></i> Enviando...';
    submitBtn.disabled = true;
    
    try {
        // Criar objeto da redação conforme a entidade Redacao
        const redacaoData = {
            aluno: { idUtilizador: ID_ALUNO_LOGADO },
            tema: temaAtual,
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
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || 'Erro ao enviar redação');
        }
        
        mostrarNotificacao('✅ Redação enviada com sucesso! Aguarde a correção do professor.', 'success');
        
        // Limpar formulário
        document.getElementById('titulo').value = '';
        document.getElementById('conteudo').value = '';
        
        // Recarregar histórico
        await carregarHistoricoRedacoes();
        
        // Gerar novo tema automaticamente
        await carregarTemaAleatorio();
        
    } catch (error) {
        console.error('Erro ao enviar:', error);
        mostrarNotificacao('❌ Erro ao enviar redação. Tente novamente.', 'error');
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

// ========== VER DETALHES DA REDAÇÃO ==========
async function verDetalhesRedacao(idRedacao) {
    try {
        const response = await fetch(`${API_URL}/redacoes/${idRedacao}`);
        if (!response.ok) throw new Error('Erro ao carregar detalhes');
        
        const redacao = await response.json();
        const dataEnvio = formatarData(redacao.dataEnvio);
        const isCorrigida = redacao.pontuacaoObtida !== null && redacao.pontuacaoObtida !== undefined;
        
        let mensagem = `📝 ${redacao.titulo}\n\n`;
        mensagem += `📅 Enviado: ${dataEnvio}\n`;
        mensagem += `📌 Tema: ${redacao.tema}\n\n`;
        mensagem += `📄 Conteúdo:\n${redacao.textoRedacao}\n\n`;
        
        if (isCorrigida) {
            mensagem += `⭐ NOTA: ${redacao.pontuacaoObtida}/1000\n\n`;
            if (redacao.comentarios) {
                mensagem += `💬 COMENTÁRIOS DO PROFESSOR:\n${redacao.comentarios}`;
            }
        } else {
            mensagem += `⏳ Status: Aguardando correção do professor.`;
        }
        
        alert(mensagem);
        
    } catch (error) {
        console.error('Erro:', error);
        mostrarNotificacao('Erro ao carregar detalhes da redação', 'error');
    }
}

// ========== LIMPAR FORMULÁRIO ==========
function limparFormulario() {
    if (confirm('Tem certeza que deseja limpar o formulário? Todo o texto será perdido.')) {
        document.getElementById('titulo').value = '';
        document.getElementById('conteudo').value = '';
        mostrarNotificacao('Formulário limpo!', 'info');
    }
}

// ========== NOTIFICAÇÕES ==========
function inicializarNotificacoes() {
    const notificationIcon = document.getElementById('notificationsIcon');
    const modal = document.getElementById('notificationsModal');
    const closeModal = document.querySelector('.close-modal');
    
    if (notificationIcon && modal) {
        notificationIcon.addEventListener('click', () => {
            modal.style.display = 'block';
            const badge = document.querySelector('.notification-badge');
            if (badge) badge.style.display = 'none';
        });
    }
    
    if (closeModal && modal) {
        closeModal.addEventListener('click', () => {
            modal.style.display = 'none';
        });
    }
    
    window.addEventListener('click', (e) => {
        if (modal && e.target === modal) {
            modal.style.display = 'none';
        }
    });
}

function mostrarNotificacao(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification-toast notification-${type}`;
    notification.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
        <span>${message}</span>
    `;
    notification.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background-color: ${type === 'success' ? 'rgba(0, 230, 118, 0.2)' : type === 'error' ? 'rgba(255, 61, 0, 0.2)' : 'rgba(187, 134, 252, 0.2)'};
        border: 1px solid ${type === 'success' ? '#00E676' : type === 'error' ? '#FF3D00' : '#BB86FC'};
        color: ${type === 'success' ? '#00E676' : type === 'error' ? '#FF3D00' : '#BB86FC'};
        padding: 12px 20px;
        border-radius: 8px;
        z-index: 3000;
        animation: slideInRight 0.3s ease;
        display: flex;
        align-items: center;
        gap: 10px;
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 4000);
}

// ========== EVENTOS ==========
function inicializarEventos() {
    const form = document.getElementById('redacaoForm');
    if (form) {
        form.addEventListener('submit', enviarRedacao);
    }
    
    const clearBtn = document.getElementById('clearBtn');
    if (clearBtn) {
        clearBtn.addEventListener('click', limparFormulario);
    }
    
    const refreshBtn = document.getElementById('refreshHistorico');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            carregarHistoricoRedacoes();
            mostrarNotificacao('Histórico atualizado!', 'info');
        });
    }
    
    // Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            if (confirm('Deseja realmente sair?')) {
                localStorage.clear();
                window.location.href = '../../../Login/HTML/login.html';
            }
        });
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

// Adicionar estilos para animações
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from { opacity: 0; transform: translateX(100%); }
        to { opacity: 1; transform: translateX(0); }
    }
    @keyframes fadeOut {
        from { opacity: 1; transform: translateX(0); }
        to { opacity: 0; transform: translateX(100%); }
    }
    .redacao-tema-mini {
        font-size: 0.75rem;
        color: var(--text-muted);
        margin: 5px 0;
    }
    .redacao-tema-mini i {
        color: var(--primary-color);
        margin-right: 4px;
    }
`;
document.head.appendChild(style);

// Expor funções globalmente
window.carregarTemaAleatorio = carregarTemaAleatorio;
window.carregarTemaPorCategoria = carregarTemaPorCategoria;
window.verDetalhesRedacao = verDetalhesRedacao;