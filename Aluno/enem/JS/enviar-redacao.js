// enviar-redacao.js - APENAS funções da página de redação (SEM código da sidebar)

// ========== CONFIGURAÇÕES ==========
const MICRO_API_URL = 'http://localhost:3001/api/redacao';

// ========== INICIALIZAÇÃO ==========
document.addEventListener('DOMContentLoaded', async () => {
    await carregarTemaSemana();
    await carregarHistoricoMockado();
    inicializarEventos();
    inicializarNotificacoes();
});

// ========== CARREGAR TEMA DA SEMANA (SÓ NODE.JS) ==========
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
                temaContainer.innerHTML = `
                    <div class="tema-titulo">
                        <i class="fas fa-magic"></i> Tema Aleatório (Gerado por IA)
                    </div>
                    <div class="tema-conteudo">
                        ${escapeHtml(data.tema)}
                    </div>
                    <div class="tema-actions" style="margin-top: 15px; display: flex; gap: 10px; flex-wrap: wrap;">
                        <button onclick="carregarTemaAleatorio()" class="btn-novo-tema">
                            <i class="fas fa-dice"></i> Novo tema aleatório
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
        
        // Fallback caso o servidor Node não esteja rodando
        temaContainer.innerHTML = `
            <div class="tema-titulo">
                <i class="fas fa-exclamation-triangle"></i> Servidor IA offline
            </div>
            <div class="tema-conteudo">
                Os desafios da educação brasileira no século XXI
            </div>
            <button onclick="carregarTemaAleatorio()" class="btn-novo-tema" style="margin-top: 15px;">
                <i class="fas fa-sync-alt"></i> Tentar conectar com IA
            </button>
            <div class="tema-titulo" style="margin-top: 10px; color: #FFC107;">
                <i class="fas fa-info-circle"></i> Execute "npm start" na pasta microservicoEnem
            </div>
        `;
        
    } catch (error) {
        console.error('Erro ao carregar tema:', error);
        temaContainer.innerHTML = `
            <div class="tema-titulo">
                <i class="fas fa-exclamation-triangle"></i> Erro de conexão
            </div>
            <div class="tema-conteudo">
                Não foi possível conectar ao servidor de IA.
            </div>
            <button onclick="carregarTemaAleatorio()" class="btn-novo-tema" style="margin-top: 15px;">
                <i class="fas fa-sync-alt"></i> Tentar novamente
            </button>
        `;
    }
}

// Gerar tema aleatório
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
            temaContainer.innerHTML = `
                <div class="tema-titulo">
                    <i class="fas fa-magic"></i> Tema Aleatório (Gerado por IA)
                </div>
                <div class="tema-conteudo">
                    ${escapeHtml(data.tema)}
                </div>
                <div class="tema-actions" style="margin-top: 15px; display: flex; gap: 10px; flex-wrap: wrap;">
                    <button onclick="carregarTemaAleatorio()" class="btn-novo-tema">
                        <i class="fas fa-dice"></i> Novo tema aleatório
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
                Não foi possível conectar ao servidor de IA.
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
        cultura: 'Cultura',
        politica: 'Política'
    };
    
    temaContainer.innerHTML = `
        <div class="tema-titulo">
            <i class="fas fa-spinner fa-pulse"></i> Gerando tema sobre ${categoriasNomes[categoria] || categoria}...
        </div>
        <div class="tema-conteudo" style="text-align: center;">
            A IA está criando um tema especial para você!
        </div>
    `;
    
    try {
        const response = await fetch(`${MICRO_API_URL}/tema/${categoria}`);
        const data = await response.json();
        
        if (data.sucesso) {
            temaContainer.innerHTML = `
                <div class="tema-titulo">
                    <i class="fas fa-tag"></i> Tema sobre ${categoriasNomes[categoria] || categoria}
                </div>
                <div class="tema-conteudo">
                    ${escapeHtml(data.tema)}
                </div>
                <div class="tema-actions" style="margin-top: 15px; display: flex; gap: 10px; flex-wrap: wrap;">
                    <button onclick="carregarTemaAleatorio()" class="btn-novo-tema">
                        <i class="fas fa-dice"></i> Tema aleatório
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
        carregarTemaAleatorio();
    }
}

// Histórico mockado (já que não tem API)
async function carregarHistoricoMockado() {
    const container = document.getElementById('historicoList');
    
    container.innerHTML = `
        <div class="empty-state">
            <i class="fas fa-inbox"></i>
            <p>Você ainda não enviou nenhuma redação.</p>
            <p>Escreva sua primeira redação acima!</p>
        </div>
    `;
}

// Enviar redação (salva no localStorage por enquanto)
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
    
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-pulse"></i> Enviando...';
    submitBtn.disabled = true;
    
    // Simular envio (salvar no localStorage)
    setTimeout(() => {
        const redacoes = JSON.parse(localStorage.getItem('redacoes') || '[]');
        redacoes.unshift({
            id: Date.now(),
            titulo: titulo,
            conteudo: conteudo,
            data: new Date().toLocaleDateString('pt-BR'),
            status: 'pendente'
        });
        localStorage.setItem('redacoes', JSON.stringify(redacoes));
        
        mostrarNotificacao('✅ Redação enviada com sucesso! Aguarde a correção.', 'success');
        
        document.getElementById('titulo').value = '';
        document.getElementById('conteudo').value = '';
        
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
        
        carregarHistoricoLocal();
    }, 1000);
}

// Carregar histórico do localStorage
function carregarHistoricoLocal() {
    const container = document.getElementById('historicoList');
    const redacoes = JSON.parse(localStorage.getItem('redacoes') || '[]');
    
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
    
    container.innerHTML = redacoes.map(red => `
        <div class="redacao-item">
            <div class="redacao-titulo">
                <span>${escapeHtml(red.titulo)}</span>
                <span class="redacao-data">${red.data}</span>
            </div>
            <div>
                <span class="redacao-status status-pendente">
                    ⏳ Aguardando correção
                </span>
            </div>
        </div>
    `).join('');
}

function limparFormulario() {
    if (confirm('Tem certeza que deseja limpar o formulário? Todo o texto será perdido.')) {
        document.getElementById('titulo').value = '';
        document.getElementById('conteudo').value = '';
        mostrarNotificacao('Formulário limpo!', 'info');
    }
}

// Notificações
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

// Eventos
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
            carregarHistoricoLocal();
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

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Carregar histórico ao iniciar
carregarHistoricoLocal();

// Estilos para animações
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
`;
document.head.appendChild(style);