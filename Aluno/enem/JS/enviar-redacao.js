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
// enviar-redacao.js
document.addEventListener("DOMContentLoaded", function () {
    console.log('🚀 Página de envio de redação carregada');
    
    // Verifica se o RedacaoStorage existe
    if (typeof RedacaoStorage === 'undefined') {
        console.error('❌ RedacaoStorage não encontrado!');
        alert('Erro de configuração: redacao-storage.js não foi carregado. Contate o suporte.');
        return;
    }
    
    // Elementos do formulário
    const textarea = document.getElementById("redacaoTexto");
    const contador = document.getElementById("contador");
    const botao = document.getElementById("btnEnviar");
    const temaTitulo = document.querySelector('.tema-titulo');
    const textoMotivador = document.querySelector('.texto-motivador');
    
    // Log para debug
    console.log('Elementos encontrados:', {
        textarea: !!textarea,
        contador: !!contador,
        botao: !!botao,
        temaTitulo: !!temaTitulo,
        textoMotivador: !!textoMotivador
    });
    
    // =============================================
    // CARREGAR TEMA E TEXTO DE APOIO DO LOCALSTORAGE
    // =============================================
    const temaSalvo = localStorage.getItem("temaEscolhido");
    const textoApoioSalvo = localStorage.getItem("textoApoioEscolhido");
    
    if (temaSalvo && temaTitulo) {
        temaTitulo.textContent = temaSalvo;
        console.log('✅ Tema carregado do localStorage:', temaSalvo);
    }
    
    if (textoApoioSalvo && textoMotivador) {
        textoMotivador.textContent = textoApoioSalvo;
        console.log('✅ Texto de apoio carregado do localStorage');
    }
    
    // Limpa o localStorage depois de carregar (opcional)
    // Se quiser manter para recarregar a página, comente estas linhas
    // localStorage.removeItem("temaEscolhido");
    // localStorage.removeItem("textoApoioEscolhido");
    
    // Verifica elementos obrigatórios
    if (!textarea) {
        console.error('❌ Textarea não encontrado!');
        alert('Erro: Campo de texto não encontrado.');
        return;
    }
    
    if (!contador) {
        console.error('❌ Contador não encontrado!');
        alert('Erro: Contador não encontrado.');
        return;
    }
    
    if (!botao) {
        console.error('❌ Botão não encontrado!');
        alert('Erro: Botão de enviar não encontrado.');
        return;
    }

    console.log('✅ Todos os elementos encontrados, inicializando...');

    // Configuração
    const MIN_CARACTERES = 800;

    // Função para atualizar contador
    function atualizarContador() {
        const total = textarea.value.length;
        
        // Atualiza contador
        contador.textContent = `${total} caracteres`;
        
        // Validações de cor
        if (total < MIN_CARACTERES) {
            contador.style.color = "red";
        } else {
            contador.style.color = "green";
        }
        
        // Habilita/desabilita botão
        botao.disabled = total < MIN_CARACTERES;
        
        return total;
    }

    // Event listener para contagem
    textarea.addEventListener("input", function () {
        atualizarContador();
    });

    // Event listener para envio
    botao.addEventListener("click", function (e) {
        e.preventDefault();
        
        console.log('Botão de enviar clicado');
        
        const texto = textarea.value.trim();
        const totalCaracteres = texto.length;
        
        console.log('Texto length:', totalCaracteres);
        
        // Validações
        if (totalCaracteres < MIN_CARACTERES) {
            alert(`❌ Sua redação precisa ter pelo menos ${MIN_CARACTERES} caracteres. Atualmente tem ${totalCaracteres}.`);
            textarea.focus();
            return;
        }

        // Mostra loading
        const textoOriginalBotao = botao.innerHTML;
        botao.disabled = true;
        botao.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';

        // Pega o tema e texto de apoio da página
        const tema = temaTitulo ? temaTitulo.textContent.trim() : 'Tema da Semana';
        const textoApoio = textoMotivador ? textoMotivador.textContent.trim() : '';

        // Coletar dados da redação
        const redacao = {
            titulo: `Redação ${new Date().toLocaleDateString('pt-BR')}`,
            tema: tema,
            textoApoio: textoApoio, // Salva também o texto de apoio
            texto: texto,
            palavras: texto.split(/\s+/).filter(p => p.length > 0).length,
            dataEnvio: new Date().toISOString(),
            status: 'aguardando',
            nota: null,
            feedback: null
        };

        console.log('Redação a ser salva:', redacao);

        // Salvar no localStorage
        try {
            const redacaoSalva = RedacaoStorage.salvarRedacao(redacao);
            console.log('✅ Redação salva com sucesso:', redacaoSalva);
            
            // Limpa o localStorage do tema depois de salvar
            localStorage.removeItem("temaEscolhido");
            localStorage.removeItem("textoApoioEscolhido");
            
            // Mostra mensagem de sucesso
            alert(`✅ Redação enviada com sucesso!\n\nTema: ${redacao.tema}\nPalavras: ${redacao.palavras}`);
            
            // Redireciona para o histórico
            window.location.href = "historico-enem.html";
            
        } catch (error) {
            console.error('❌ Erro ao salvar redação:', error);
            alert("❌ Erro ao enviar redação. Tente novamente.");
            
            // Reverte botão
            botao.disabled = false;
            botao.innerHTML = textoOriginalBotao;
        }
    });

    // Atalho de teclado (Ctrl+Enter para enviar)
    textarea.addEventListener("keydown", function (e) {
        if (e.ctrlKey && e.key === 'Enter') {
            e.preventDefault();
            botao.click();
        }
    });

    // Inicializa contador
    setTimeout(() => {
        atualizarContador();
        console.log('✅ Página de envio de redação inicializada com sucesso');
    }, 100);
});