// homeEstudeX.js - Funcionalidades da página Home

document.addEventListener('DOMContentLoaded', function() {
    // Carregar nome do aluno (simulado - pode ser integrado com API depois)
    carregarDadosAluno();
    
    // Inicializar notificações
    initNotifications();
    
    // Inicializar ações
    initActions();
    
    // Atualizar dados dinâmicos
    atualizarDadosHome();
});

// Carregar dados do aluno (simulado com localStorage)
function carregarDadosAluno() {
    const nomeAluno = localStorage.getItem('nomeAluno') || 'Estudante';
    document.getElementById('nomeAluno').textContent = nomeAluno;
}

// Inicializar modal de notificações
function initNotifications() {
    const notificationIcon = document.getElementById('notificationsIcon');
    const modal = document.getElementById('notificationsModal');
    const closeModal = document.querySelector('.close-modal');
    
    if (notificationIcon) {
        notificationIcon.addEventListener('click', function() {
            modal.style.display = 'block';
            // Marcar como lidas
            const badge = document.querySelector('.notification-badge');
            if (badge) {
                badge.style.display = 'none';
            }
        });
    }
    
    if (closeModal) {
        closeModal.addEventListener('click', function() {
            modal.style.display = 'none';
        });
    }
    
    // Fechar modal ao clicar fora
    window.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
}

// Inicializar ações dos cards
function initActions() {
    // Ações da lista
    const actions = document.querySelectorAll('.action-item');
    actions.forEach(action => {
        action.addEventListener('click', function() {
            const actionType = this.getAttribute('data-action');
            handleAction(actionType);
        });
    });
    
    // Botão do plano de estudo
    const planoBtn = document.getElementById('planoEstudoBtn');
    if (planoBtn) {
        planoBtn.addEventListener('click', function() {
            handleAction('plano');
        });
    }
}

// Lidar com ações - CORRIGIDO para redirecionar para a página correta
function handleAction(actionType) {
    switch(actionType) {
        case 'plano':
            // Redireciona para a página de Plano de Estudo
            window.location.href = '../../../Aluno/plano-estudo/HTML/consultarPlanoEstudo-home.html';
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
        default:
            console.log('Ação não reconhecida');
    }
}

// Atualizar dados da home (simulado)
function atualizarDadosHome() {
    // Simular atualização de dados
    const progressoSemanal = Math.floor(Math.random() * 30) + 60; // 60-90%
    const horasEstudo = (Math.random() * 20 + 5).toFixed(1); // 5-25h
    const taxaAcerto = Math.floor(Math.random() * 25) + 70; // 70-95%
    
    document.getElementById('progressoSemanal').textContent = `${progressoSemanal}%`;
    document.getElementById('horasEstudo').textContent = `${horasEstudo}h`;
    document.getElementById('taxaAcerto').textContent = `${taxaAcerto}%`;
    
    // Atualizar barra de progresso dos indicadores (efeito visual)
    const circles = document.querySelectorAll('.indicator-circle');
    circles.forEach(circle => {
        circle.style.transition = 'transform 0.3s ease';
    });
}

// Atualizar dados a cada 30 segundos (opcional)
let intervalId = setInterval(() => {
    atualizarDadosHome();
}, 30000);

// Limpar intervalo quando a página for descarregada
window.addEventListener('beforeunload', function() {
    if (intervalId) {
        clearInterval(intervalId);
    }
});