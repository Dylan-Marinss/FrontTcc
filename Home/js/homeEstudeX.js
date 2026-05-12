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
    const nomeElement = document.getElementById('nomeAluno');
    if (nomeElement) {
        nomeElement.textContent = nomeAluno;
    }
}

// Inicializar modal de notificações
function initNotifications() {
    const notificationIcon = document.getElementById('notificationsIcon');
    const modal = document.getElementById('notificationsModal');
    const closeModal = document.querySelector('.close-modal');
    
    if (notificationIcon && modal) {
        notificationIcon.addEventListener('click', function() {
            modal.style.display = 'block';
            const badge = document.querySelector('.notification-badge');
            if (badge) {
                badge.style.display = 'none';
            }
        });
    }
    
    if (closeModal && modal) {
        closeModal.addEventListener('click', function() {
            modal.style.display = 'none';
        });
    }
    
    window.addEventListener('click', function(e) {
        if (modal && e.target === modal) {
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
    
    // ========== BOTÃO DO PLANO DE ESTUDO - CORREÇÃO ==========
    const planoBtn = document.getElementById('planoEstudoBtn');
    if (planoBtn) {
        planoBtn.addEventListener('click', function() {
            // ALTERE ESTE CAMINHO para onde seu arquivo realmente está
            // Opção 1: Se o arquivo estiver na mesma pasta que home-Estudex.html
            window.location.href = 'consultarPlanoEstudo-home.html';
            
            // Opção 2: Se estiver em uma pasta diferente, use o caminho correto
            // Ex: window.location.href = '../pasta/consultarPlanoEstudo-home.html';
        });
    }
}

// Lidar com ações
function handleAction(actionType) {
    switch(actionType) {
        case 'plano':
            // ALTERE ESTE CAMINHO para onde seu arquivo realmente está
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
        default:
            console.log('Ação não reconhecida');
    }
}

// Atualizar dados da home (simulado)
function atualizarDadosHome() {
    const progressoSemanal = Math.floor(Math.random() * 30) + 60;
    const horasEstudo = (Math.random() * 20 + 5).toFixed(1);
    const taxaAcerto = Math.floor(Math.random() * 25) + 70;
    
    const progressoElement = document.getElementById('progressoSemanal');
    const horasElement = document.getElementById('horasEstudo');
    const taxaElement = document.getElementById('taxaAcerto');
    
    if (progressoElement) progressoElement.textContent = `${progressoSemanal}%`;
    if (horasElement) horasElement.textContent = `${horasEstudo}h`;
    if (taxaElement) taxaElement.textContent = `${taxaAcerto}%`;
    
    const circles = document.querySelectorAll('.indicator-circle');
    circles.forEach(circle => {
        circle.style.transition = 'transform 0.3s ease';
    });
}

let intervalId = setInterval(() => {
    atualizarDadosHome();
}, 30000);

window.addEventListener('beforeunload', function() {
    if (intervalId) {
        clearInterval(intervalId);
    }
});

document.addEventListener('DOMContentLoaded', () => {
  const sidebar = document.querySelector('.sidebar');
  const menuToggle = document.getElementById('menu-toggle');
  const welcomeCard = document.querySelector('.welcome-card');
  const actionItems = document.querySelectorAll('.action-item');
  const shortcutBtns = document.querySelectorAll('.shortcut-btn');
  const notificationsIcon = document.querySelector('.notifications-icon');
  const pageTitle = document.querySelector('.page-title');

  // 1. Funcionalidade de Colapsar/Expandir Sidebar
  if (menuToggle && sidebar) {
      menuToggle.addEventListener('click', () => {
          if (window.innerWidth <= 768) {
              sidebar.classList.toggle('active');
          } else {
              sidebar.classList.toggle('collapsed');
          }
      });
  }

  // 2. Efeito de Entrada Suave no Card de Boas-vindas
  if (welcomeCard) {
      welcomeCard.style.animation = 'slideInDown 0.6s ease-out';
  }

  // 3. Efeito de Hover nos Itens de Ação
  actionItems.forEach((item, index) => {
      item.style.animationDelay = `${index * 0.1}s`;
      item.addEventListener('mouseenter', () => {
          item.style.boxShadow = '0 4px 15px rgba(187, 134, 252, 0.2)';
      });
      item.addEventListener('mouseleave', () => {
          item.style.boxShadow = 'none';
      });
  });

  // 4. Efeito de Hover nos Botões de Atalho
  shortcutBtns.forEach((btn, index) => {
      btn.addEventListener('mouseenter', () => {
          btn.style.boxShadow = '0 8px 25px rgba(187, 134, 252, 0.3)';
      });
      btn.addEventListener('mouseleave', () => {
          btn.style.boxShadow = '0 4px 12px rgba(187, 134, 252, 0.1)';
      });
  });

  // 5. Funcionalidade de Notificações
  if (notificationsIcon) {
      notificationsIcon.addEventListener('click', () => {
          showNotificationPopup();
      });
  }

  // 6. Animação de Glitch no Título da Página
  if (pageTitle) {
      pageTitle.classList.add('glitch-text');
      setTimeout(() => {
          pageTitle.classList.remove('glitch-text');
      }, 5000);
  }

  // 7. Animação de Fundo (Scanline) - Efeito Futurista
  const body = document.body;
  body.style.setProperty('--scanline-opacity', '0.05');

  const style = document.createElement('style');
  style.innerHTML = `
      @keyframes slideInDown {
          from {
              opacity: 0;
              transform: translateY(-20px);
          }
          to {
              opacity: 1;
              transform: translateY(0);
          }
      }

      @keyframes fadeInUp {
          from {
              opacity: 0;
              transform: translateY(20px);
          }
          to {
              opacity: 1;
              transform: translateY(0);
          }
      }

      .action-item {
          animation: fadeInUp 0.5s ease-out forwards;
          opacity: 0;
      }

      body::before {
          content: '';
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: repeating-linear-gradient(
              0deg,
              rgba(0, 0, 0, var(--scanline-opacity)),
              rgba(0, 0, 0, var(--scanline-opacity)) 1px,
              transparent 1px,
              transparent 2px
          );
          pointer-events: none;
          z-index: -1;
          opacity: 0.5;
      }
  `;
  document.head.appendChild(style);
});