
// historico-enem.js
let desempenhoChart;

// Função para carregar redações do localStorage
function carregarRedacoes() {
    const redacoes = RedacaoStorage.getTodasRedacoes();
    const historicoList = document.getElementById('historicoRedacoes');
    
    if (!historicoList) return;
    
    historicoList.innerHTML = '';
    
    if (redacoes.length === 0) {
        historicoList.innerHTML = '<li class="empty-state">Nenhuma redação encontrada. Escreva sua primeira redação!</li>';
        return;
    }
    
    // Ordenar por data (mais recente primeiro)
    redacoes.sort((a, b) => new Date(b.dataEnvio) - new Date(a.dataEnvio));
    
    redacoes.forEach(redacao => {
        const data = new Date(redacao.dataEnvio).toLocaleDateString('pt-BR');
        const statusClass = redacao.status === 'corrigida' ? 'status-corrigida' : 'status-aguardando';
        const statusText = redacao.status === 'corrigida' ? 'Corrigida' : 'Aguardando';
        const notaText = redacao.nota ? `Nota: ${redacao.nota.toFixed(1)}` : 'Nota: -';
        
        const li = document.createElement('li');
        li.className = 'redacao-item';
        li.dataset.id = redacao.id;
        li.innerHTML = `
            <div class="redacao-info">
                <strong>${redacao.titulo || 'Sem título'}</strong>
                <small>${data}</small>
            </div>
            <div class="redacao-status ${statusClass}">
                <span class="status-badge">${statusText}</span>
                <span class="nota-preview">${notaText}</span>
            </div>
        `;
        
        li.addEventListener('click', () => abrirModalRedacao(redacao));
        historicoList.appendChild(li);
    });
}

// Função para atualizar estatísticas
function atualizarEstatisticas() {
    const stats = RedacaoStorage.getEstatisticas();
    
    document.getElementById('totalRedacoes').textContent = stats.total;
    document.getElementById('corrigidas').textContent = stats.corrigidas;
    document.getElementById('aguardando').textContent = stats.aguardando;
    document.getElementById('mediaNotas').textContent = stats.media;
}

// Função para abrir modal com detalhes da redação
function abrirModalRedacao(redacao) {
    const modal = document.getElementById('modalRedacao');
    if (!modal) return;
    
    document.getElementById('modalTema').textContent = redacao.tema || 'Tema não definido';
    document.getElementById('modalStatus').textContent = redacao.status === 'corrigida' ? 'Corrigida' : 'Aguardando correção';
    document.getElementById('modalNota').textContent = redacao.nota ? redacao.nota.toFixed(1) : '-';
    document.getElementById('modalFeedback').textContent = redacao.feedback || 'Aguardando correção...';
    document.getElementById('modalTexto').textContent = redacao.texto;
    
    modal.classList.add('show');
    
    // Configurar fechar modal
    const closeBtn = document.getElementById('closeModal');
    closeBtn.onclick = () => modal.classList.remove('show');
    
    window.onclick = (event) => {
        if (event.target === modal) {
            modal.classList.remove('show');
        }
    };
}

// Função para inicializar o gráfico
function initChart(periodo = 6) {
    const canvas = document.getElementById('desempenhoChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    if (desempenhoChart) {
        desempenhoChart.destroy();
    }
    
    // Pegar dados reais do localStorage
    const dados = RedacaoStorage.getDadosMensais(periodo);
    
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, 'rgba(187, 134, 252, 0.8)');
    gradient.addColorStop(1, 'rgba(162, 31, 162, 0.1)');
    
    desempenhoChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: dados.labels,
            datasets: [{
                label: 'Nota Média',
                data: dados.notas,
                borderColor: '#BB86FC',
                backgroundColor: gradient,
                tension: 0.4,
                fill: true,
                pointBackgroundColor: '#a21fa2',
                pointBorderColor: '#BB86FC',
                pointHoverBackgroundColor: '#FF3D00',
                pointHoverBorderColor: '#FFFFFF',
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: '#1E1E1E',
                    titleColor: '#BB86FC',
                    bodyColor: '#E0E0E0',
                    borderColor: '#BB86FC',
                    borderWidth: 1,
                    callbacks: {
                        label: (context) => `Nota: ${context.raw.toFixed(1)}`,
                        afterLabel: (context) => {
                            const quantidade = dados.quantidades[context.dataIndex];
                            return `Redações: ${quantidade}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 10,
                    grid: { color: 'rgba(187, 134, 252, 0.1)' },
                    ticks: {
                        color: '#9E9E9E',
                        callback: (value) => value.toFixed(1)
                    }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: '#9E9E9E' }
                }
            }
        }
    });
    
    // Atualizar estatísticas do gráfico
    atualizarEstatisticasGrafico(dados);
}

function atualizarEstatisticasGrafico(dados) {
    const elementos = {
        melhorNota: document.getElementById('melhorNota'),
        mediaPeriodo: document.getElementById('mediaPeriodo'),
        totalPeriodo: document.getElementById('totalPeriodo'),
        evolucao: document.getElementById('evolucao')
    };
    
    const notasValidas = dados.notas.filter(n => n > 0);
    
    if (elementos.melhorNota) {
        const melhorNota = notasValidas.length > 0 ? Math.max(...notasValidas) : 0;
        elementos.melhorNota.textContent = melhorNota.toFixed(1);
    }
    
    if (elementos.mediaPeriodo) {
        const media = notasValidas.length > 0 
            ? notasValidas.reduce((a, b) => a + b, 0) / notasValidas.length 
            : 0;
        elementos.mediaPeriodo.textContent = media.toFixed(1);
    }
    
    if (elementos.totalPeriodo) {
        const total = dados.quantidades.reduce((a, b) => a + b, 0);
        elementos.totalPeriodo.textContent = total;
    }
    
    if (elementos.evolucao && notasValidas.length >= 2) {
        const primeiro = dados.notas.find(n => n > 0) || 0;
        const ultimo = [...dados.notas].reverse().find(n => n > 0) || 0;
        
        if (primeiro > 0 && ultimo > 0) {
            const evolucao = ((ultimo - primeiro) / primeiro * 100).toFixed(1);
            const icone = evolucao >= 0 ? 
                '<i class="fas fa-arrow-up" style="color: #00E676;"></i>' : 
                '<i class="fas fa-arrow-down" style="color: #FF3D00;"></i>';
            elementos.evolucao.innerHTML = `${Math.abs(evolucao)}% ${icone}`;
        } else {
            elementos.evolucao.innerHTML = '0%';
        }
    }
}

function setupFilters() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    
    filterBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            
            document.querySelectorAll('.filter-btn').forEach(b => {
                b.classList.remove('active');
            });
            
            this.classList.add('active');
            
            const periodo = parseInt(this.dataset.period);
            if (!isNaN(periodo)) {
                initChart(periodo);
            }
        });
    });
}

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    // Verificar se RedacaoStorage existe
    if (typeof RedacaoStorage === 'undefined') {
        console.error('RedacaoStorage não encontrado!');
        return;
    }
    
    // Carregar dados
    carregarRedacoes();
    atualizarEstatisticas();
    
    // Inicializar gráfico se existir
    if (document.getElementById('desempenhoChart')) {
        initChart(6);
        setupFilters();
    }
});