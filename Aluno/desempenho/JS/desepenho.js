// desempenho.js - Página de Desempenho do Aluno

// ========== CONFIGURAÇÕES ==========
const API_URL = 'http://localhost:8080';
const ID_ALUNO_LOGADO = 1;

// Variáveis globais
let todasAtividades = [];
let atividadesRespondidas = [];
let dadosAluno = null;
let lineChart = null;
let barChart = null;

// ========== INICIALIZAÇÃO ==========
document.addEventListener('DOMContentLoaded', async () => {
    await carregarDados();
});

// ========== CARREGAR DADOS DA API ==========
async function carregarDados() {
    try {
        // Carregar todas as atividades
        await carregarTodasAtividades();
        
        // Carregar atividades respondidas pelo aluno
        await carregarAtividadesRespondidas();
        
        // Carregar dados do aluno
        await carregarDadosAluno();
        
        // Calcular e exibir estatísticas
        calcularEstatisticas();
        
        // Renderizar gráficos
        renderizarGraficos();
        
        // Renderizar tabela de atividades
        renderizarTabelaAtividades();
        
        // Gerar recomendações personalizadas
        gerarRecomendacoes();
        
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
        mostrarErro('Erro ao carregar dados de desempenho');
    }
}

// Carregar todas as atividades
async function carregarTodasAtividades() {
    try {
        const response = await fetch(`${API_URL}/atividades/${ID_ALUNO_LOGADO}`);
        if (!response.ok) throw new Error('Erro ao carregar atividades');
        todasAtividades = await response.json();
    } catch (error) {
        console.error('Erro:', error);
        todasAtividades = [];
    }
}

// Carregar atividades respondidas pelo aluno
async function carregarAtividadesRespondidas() {
    try {
        const response = await fetch(`${API_URL}/atividadesrespostas${ID_ALUNO_LOGADO}`);
        if (!response.ok) throw new Error('Erro ao carregar respostas');
        const todasRespostas = await response.json();
        
        // Filtrar apenas as respostas do aluno logado que têm nota
        atividadesRespondidas = todasRespostas.filter(r => 
            r.idAluno === ID_ALUNO_LOGADO && 
            r.pontuacao !== null && 
            r.pontuacao !== undefined
        );
    } catch (error) {
        console.error('Erro:', error);
        atividadesRespondidas = [];
    }
}

// Carregar dados do aluno
async function carregarDadosAluno() {
    try {
        const response = await fetch(`${API_URL}/alunos/${ID_ALUNO_LOGADO}`);
        if (!response.ok) throw new Error('Erro ao carregar aluno');
        dadosAluno = await response.json();
    } catch (error) {
        console.error('Erro:', error);
        dadosAluno = null;
    }
}

// ========== CÁLCULO DE ESTATÍSTICAS ==========
function calcularEstatisticas() {
    if (!atividadesRespondidas.length) {
        mostrarDadosVazios();
        return;
    }
    
    // Total de atividades respondidas
    const totalRespondidas = atividadesRespondidas.length;
    
    // Calcular soma das notas e notas máximas
    let somaNotas = 0;
    let somaMaximas = 0;
    let maiorNota = 0;
    let notasMaximasCount = 0;
    
    atividadesRespondidas.forEach(resposta => {
        // Buscar a atividade correspondente
        const atividade = todasAtividades.find(a => a.idAtividade === resposta.idAtividade);
        const notaMaxima = atividade?.pontuacaoMaxima || 100;
        const notaObtida = resposta.pontuacao || 0;
        
        somaNotas += notaObtida;
        somaMaximas += notaMaxima;
        
        if (notaObtida > maiorNota) maiorNota = notaObtida;
        
        // Calcular percentual da nota
        const percentual = (notaObtida / notaMaxima) * 100;
        if (percentual >= 90) notasMaximasCount++;
    });
    
    // Média geral (percentual)
    const mediaPercentual = somaMaximas > 0 ? (somaNotas / somaMaximas) * 100 : 0;
    
    // Média por atividade
    const mediaPorAtividade = totalRespondidas > 0 ? somaNotas / totalRespondidas : 0;
    
    // Total de pontos acumulados
    const totalPontos = somaNotas;
    
    // Classificação baseada na média
    let classificacao = '';
    if (mediaPercentual >= 85) classificacao = 'Avançado 🚀';
    else if (mediaPercentual >= 70) classificacao = 'Proficiente 📚';
    else if (mediaPercentual >= 50) classificacao = 'Intermediário 📖';
    else classificacao = 'Iniciante 🌱';
    
    // Atualizar DOM
    document.getElementById('totalRespondidas').textContent = totalRespondidas;
    document.getElementById('mediaGeral').textContent = mediaPercentual.toFixed(1) + '%';
    document.getElementById('maiorNota').textContent = maiorNota.toFixed(0);
    document.getElementById('taxaAcerto').textContent = mediaPercentual.toFixed(1) + '%';
    document.getElementById('percentualAcerto').textContent = mediaPercentual.toFixed(0) + '%';
    document.getElementById('classificacao').textContent = classificacao;
    document.getElementById('totalPontos').textContent = totalPontos.toFixed(0);
    document.getElementById('mediaPorAtividade').textContent = mediaPorAtividade.toFixed(1);
    document.getElementById('notasMaximas').textContent = notasMaximasCount;
    
    // Atualizar círculo de progresso
    const circumference = 282.7;
    const offset = circumference - (mediaPercentual / 100) * circumference;
    const circle = document.getElementById('performanceCircle');
    if (circle) {
        circle.style.strokeDashoffset = offset;
    }
    
    // Salvar dados para uso posterior
    window.desempenhoData = {
        totalRespondidas,
        mediaPercentual,
        maiorNota,
        mediaPorAtividade,
        totalPontos,
        notasMaximasCount,
        classificacao
    };
}

function mostrarDadosVazios() {
    document.getElementById('totalRespondidas').textContent = '0';
    document.getElementById('mediaGeral').textContent = '0%';
    document.getElementById('maiorNota').textContent = '0';
    document.getElementById('taxaAcerto').textContent = '0%';
    document.getElementById('percentualAcerto').textContent = '0%';
    document.getElementById('classificacao').textContent = 'Iniciante 🌱';
    document.getElementById('totalPontos').textContent = '0';
    document.getElementById('mediaPorAtividade').textContent = '0';
    document.getElementById('notasMaximas').textContent = '0';
}

// ========== GRÁFICOS ==========
function renderizarGraficos() {
    if (!atividadesRespondidas.length) {
        mostrarGraficosVazios();
        return;
    }
    
    // Preparar dados para o gráfico de linha (evolução das notas)
    const dadosLinha = prepararDadosEvolucao();
    
    // Gráfico de Linha
    const ctxLine = document.getElementById('lineChart').getContext('2d');
    
    if (lineChart) lineChart.destroy();
    
    lineChart = new Chart(ctxLine, {
        type: 'line',
        data: {
            labels: dadosLinha.labels,
            datasets: [{
                label: 'Nota Obtida (%)',
                data: dadosLinha.notas,
                borderColor: '#BB86FC',
                backgroundColor: 'rgba(187, 134, 252, 0.1)',
                borderWidth: 3,
                pointBackgroundColor: '#a21fa2',
                pointBorderColor: '#BB86FC',
                pointRadius: 5,
                pointHoverRadius: 8,
                tension: 0.3,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: { color: '#E0E0E0' }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `Nota: ${context.raw}%`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    grid: { color: '#2a2a2a' },
                    title: {
                        display: true,
                        text: 'Percentual de Acerto (%)',
                        color: '#9E9E9E'
                    }
                },
                x: {
                    grid: { color: '#2a2a2a' },
                    title: {
                        display: true,
                        text: 'Atividades (Ordem de Realização)',
                        color: '#9E9E9E'
                    }
                }
            }
        }
    });
    
    // Gráfico de Barras (Distribuição das Notas)
    const dadosBarras = prepararDadosDistribuicao();
    
    const ctxBar = document.getElementById('barChart').getContext('2d');
    
    if (barChart) barChart.destroy();
    
    barChart = new Chart(ctxBar, {
        type: 'bar',
        data: {
            labels: ['0-49%', '50-69%', '70-84%', '85-100%'],
            datasets: [{
                label: 'Quantidade de Atividades',
                data: dadosBarras,
                backgroundColor: ['#FF3D00', '#FFC107', '#4FC3F7', '#00E676'],
                borderRadius: 8,
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: { color: '#E0E0E0' }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.raw} atividade(s)`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: '#2a2a2a' },
                    title: {
                        display: true,
                        text: 'Número de Atividades',
                        color: '#9E9E9E'
                    }
                },
                x: {
                    grid: { color: '#2a2a2a' },
                    title: {
                        display: true,
                        text: 'Faixa de Acerto',
                        color: '#9E9E9E'
                    }
                }
            }
        }
    });
}

function prepararDadosEvolucao() {
    // Ordernar por data (mais antigo primeiro)
    const ordenadas = [...atividadesRespondidas].sort((a, b) => {
        return new Date(a.momentoFim) - new Date(b.momentoFim);
    });
    
    const labels = [];
    const notas = [];
    
    ordenadas.forEach((resposta, index) => {
        const atividade = todasAtividades.find(a => a.idAtividade === resposta.idAtividade);
        const notaMaxima = atividade?.pontuacaoMaxima || 100;
        const percentual = ((resposta.pontuacao || 0) / notaMaxima) * 100;
        
        labels.push(`Atividade ${index + 1}`);
        notas.push(percentual.toFixed(1));
    });
    
    return { labels, notas };
}

function prepararDadosDistribuicao() {
    const faixas = [0, 0, 0, 0]; // 0-49%, 50-69%, 70-84%, 85-100%
    
    atividadesRespondidas.forEach(resposta => {
        const atividade = todasAtividades.find(a => a.idAtividade === resposta.idAtividade);
        const notaMaxima = atividade?.pontuacaoMaxima || 100;
        const percentual = ((resposta.pontuacao || 0) / notaMaxima) * 100;
        
        if (percentual < 50) faixas[0]++;
        else if (percentual < 70) faixas[1]++;
        else if (percentual < 85) faixas[2]++;
        else faixas[3]++;
    });
    
    return faixas;
}

function mostrarGraficosVazios() {
    const ctxLine = document.getElementById('lineChart').getContext('2d');
    const ctxBar = document.getElementById('barChart').getContext('2d');
    
    if (lineChart) lineChart.destroy();
    if (barChart) barChart.destroy();
    
    lineChart = new Chart(ctxLine, {
        type: 'line',
        data: {
            labels: ['Nenhuma atividade concluída'],
            datasets: [{
                label: 'Nota Obtida (%)',
                data: [0],
                borderColor: '#BB86FC',
                backgroundColor: 'rgba(187, 134, 252, 0.1)'
            }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
    
    barChart = new Chart(ctxBar, {
        type: 'bar',
        data: {
            labels: ['0-49%', '50-69%', '70-84%', '85-100%'],
            datasets: [{
                label: 'Quantidade de Atividades',
                data: [0, 0, 0, 0],
                backgroundColor: ['#FF3D00', '#FFC107', '#4FC3F7', '#00E676']
            }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
}

// ========== TABELA DE ATIVIDADES ==========
function renderizarTabelaAtividades() {
    const tbody = document.getElementById('atividadesTableBody');
    
    if (!atividadesRespondidas.length) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="empty-state">
                    <i class="fas fa-inbox"></i>
                    <p>Você ainda não respondeu nenhuma atividade.</p>
                    <p>Complete atividades para ver seu desempenho!</p>
                </td>
            </tr>
        `;
        return;
    }
    
    // Ordenar por data (mais recente primeiro)
    const ordenadas = [...atividadesRespondidas].sort((a, b) => {
        return new Date(b.momentoFim) - new Date(a.momentoFim);
    });
    
    tbody.innerHTML = ordenadas.map(resposta => {
        const atividade = todasAtividades.find(a => a.idAtividade === resposta.idAtividade);
        const titulo = atividade?.titulo || 'Atividade';
        const notaMaxima = atividade?.pontuacaoMaxima || 100;
        const notaObtida = resposta.pontuacao || 0;
        const percentual = (notaObtida / notaMaxima) * 100;
        const data = formatarData(resposta.momentoFim);
        
        let statusClass = '';
        let statusText = '';
        
        if (percentual >= 85) {
            statusClass = 'status-excellent';
            statusText = 'Excelente';
        } else if (percentual >= 70) {
            statusClass = 'status-good';
            statusText = 'Bom';
        } else if (percentual >= 50) {
            statusClass = 'status-average';
            statusText = 'Regular';
        } else {
            statusClass = 'status-low';
            statusText = 'Precisa Melhorar';
        }
        
        return `
            <tr>
                <td><strong>${escapeHtml(titulo)}</strong></td>
                <td>${data}</td>
                <td>${notaObtida.toFixed(0)}</td>
                <td>${notaMaxima}</td>
                <td>
                    <div class="progress-bar-mini">
                        <div class="progress-fill-mini" style="width: ${percentual}%"></div>
                    </div>
                    <span style="font-size: 0.75rem;">${percentual.toFixed(1)}%</span>
                </td>
                <td><span class="status-badge ${statusClass}">${statusText}</span></td>
            </tr>
        `;
    }).join('');
}

// ========== RECOMENDAÇÕES PERSONALIZADAS ==========
function gerarRecomendacoes() {
    const container = document.getElementById('recommendationsContainer');
    
    if (!atividadesRespondidas.length) {
        container.innerHTML = `
            <div class="recommendation-card">
                <div class="recommendation-title">
                    <i class="fas fa-rocket"></i> Comece Agora!
                </div>
                <div class="recommendation-description">
                    Você ainda não respondeu nenhuma atividade. Que tal começar agora mesmo?
                    Acesse a página de Atividades e comece a acumular XP!
                </div>
                <a href="../../../Aluno/atividade/HTML/atividades-Estudex.html" class="recommendation-action">
                    Ver Atividades <i class="fas fa-arrow-right"></i>
                </a>
            </div>
        `;
        return;
    }
    
    const recomendacoes = [];
    const media = window.desempenhoData?.mediaPercentual || 0;
    
    // Recomendação baseada na média geral
    if (media < 50) {
        recomendacoes.push({
            titulo: '📚 Reforço necessário!',
            descricao: 'Sua média está abaixo de 50%. Recomendamos revisar os conteúdos básicos e refazer as atividades com menor desempenho.',
            acao: 'Ver atividades pendentes',
            link: '../../../Aluno/atividade/HTML/atividades-Estudex.html',
            prioridade: 'high'
        });
    } else if (media < 70) {
        recomendacoes.push({
            titulo: '🎯 Continue praticando!',
            descricao: 'Você está no caminho certo! Com um pouco mais de prática, você pode alcançar notas ainda melhores.',
            acao: 'Ver matérias para revisar',
            link: '#',
            prioridade: 'medium'
        });
    } else if (media >= 85) {
        recomendacoes.push({
            titulo: '🏆 Excelente desempenho!',
            descricao: 'Parabéns! Você está indo muito bem. Que tal desafiar-se com atividades mais avançadas?',
            acao: 'Ver próximos desafios',
            link: '../../../Aluno/atividade/HTML/atividades-Estudex.html',
            prioridade: 'low'
        });
    }
    
    // Identificar matéria com pior desempenho (simulado)
    const piorNota = Math.min(...atividadesRespondidas.map(r => r.pontuacao || 0));
    if (piorNota < 50) {
        recomendacoes.push({
            titulo: '⚠️ Atenção em atividades específicas',
            descricao: 'Você teve desempenho abaixo do esperado em algumas atividades. Revise o conteúdo e tente novamente!',
            acao: 'Revisar atividades',
            link: '../../../Aluno/atividade/HTML/atividades-Estudex.html',
            prioridade: 'high'
        });
    }
    
    // Recomendação geral
    if (atividadesRespondidas.length >= 5) {
        recomendacoes.push({
            titulo: '💪 Mantenha o ritmo!',
            descricao: `Você já completou ${atividadesRespondidas.length} atividades! Continue assim para acumular mais XP e melhorar suas notas.`,
            acao: 'Ver estatísticas',
            link: '#',
            prioridade: 'low'
        });
    }
    
    container.innerHTML = recomendacoes.map(rec => `
        <div class="recommendation-card ${rec.prioridade}">
            <div class="recommendation-title">
                <i class="fas ${rec.prioridade === 'high' ? 'fa-exclamation-triangle' : rec.prioridade === 'medium' ? 'fa-chart-line' : 'fa-check-circle'}"></i>
                ${rec.titulo}
            </div>
            <div class="recommendation-description">
                ${rec.descricao}
            </div>
            <a href="${rec.link}" class="recommendation-action">
                ${rec.acao} <i class="fas fa-arrow-right"></i>
            </a>
        </div>
    `).join('');
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

// ========== ESTILOS PARA ALERTAS ==========
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { opacity: 0; transform: translateX(100%); }
        to { opacity: 1; transform: translateX(0); }
    }
    @keyframes fadeOut {
        from { opacity: 1; transform: translateX(0); }
        to { opacity: 0; transform: translateX(100%); }
    }
`;
document.head.appendChild(style);