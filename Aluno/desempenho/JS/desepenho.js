// ============================================================
//  CONFIGURAÇÃO
// ============================================================
const API_URL = 'http://localhost:8080';
const ID_ALUNO_LOGADO = 1; // substituir pelo ID real após login

// ============================================================
//  ESTADO
// ============================================================
let todasRespostas = [];
let respostasFiltradas = [];
let lineChart = null;
let barChart = null;

// Paleta de cores por disciplina (título da atividade)
const CORES_DISCIPLINAS = [
    '#BB86FC', // roxo principal
    '#03DAC6', // ciano
    '#FF6B6B', // vermelho
    '#FFD93D', // amarelo
    '#6BCB77', // verde
    '#4D96FF', // azul
    '#FF922B', // laranja
    '#F06595', // rosa
    '#74C0FC', // azul claro
    '#A9E34B', // verde limão
];

const mapaCores = {};
let indiceCor = 0;

function obterCorDisciplina(titulo) {
    if (!mapaCores[titulo]) {
        mapaCores[titulo] = CORES_DISCIPLINAS[indiceCor % CORES_DISCIPLINAS.length];
        indiceCor++;
    }
    return mapaCores[titulo];
}

// Retorna o nome da disciplina se existir, senão usa o título da atividade
function nomeDisciplina(r) {
    return r.atividade?.disciplina?.nome || r.atividade?.titulo || 'Sem disciplina';
}

// ============================================================
//  INICIALIZAÇÃO
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    carregarDesempenho();
});

// ============================================================
//  CARREGAR DADOS
// ============================================================
async function carregarDesempenho() {
    try {
        const res = await fetch(`${API_URL}/atividadesrespostas`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const todas = await res.json();

        // Filtra apenas as respostas do aluno logado
        todasRespostas = todas.filter(r => r.aluno?.id === ID_ALUNO_LOGADO);

        // Ordena por data de início
        todasRespostas.sort((a, b) => new Date(a.momentoInicio) - new Date(b.momentoInicio));

        respostasFiltradas = [...todasRespostas];

        popularFiltroAtividades();
        atualizarTudo();

    } catch (err) {
        console.error('Erro ao carregar desempenho:', err);
        document.getElementById('atividadesTableBody').innerHTML = `
            <tr>
                <td colspan="6" class="empty-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Erro ao carregar dados. Verifique o backend.</p>
                </td>
            </tr>`;
    }
}

// ============================================================
//  POPULAR FILTRO DE DISCIPLINAS
// ============================================================
function popularFiltroAtividades() {
    // Extrai disciplinas únicas das respostas
    const disciplinas = [...new Map(
        todasRespostas
            .filter(r => r.atividade?.disciplina)
            .map(r => [r.atividade.disciplina.id, r.atividade.disciplina.nome])
    ).entries()].map(([id, nome]) => nome);

    // Fallback: se nenhuma atividade tem disciplina ainda, usa título
    const itens = disciplinas.length > 0
        ? disciplinas
        : [...new Set(todasRespostas.map(r => r.atividade?.titulo || 'Sem título'))];

    let container = document.getElementById('filtro-atividade-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'filtro-atividade-container';
        container.style.cssText = 'margin-bottom: 20px; display: flex; align-items: center; gap: 12px;';

        const label = document.createElement('label');
        label.textContent = 'Filtrar por disciplina:';
        label.style.cssText = 'color: var(--text-muted); font-size: 0.9rem;';

        const select = document.createElement('select');
        select.id = 'filtro-atividade';
        select.style.cssText = `
            background-color: var(--bg-card);
            color: var(--text-light);
            border: 1px solid var(--border-color);
            padding: 8px 14px;
            border-radius: 8px;
            font-size: 0.9rem;
            cursor: pointer;
            font-family: var(--font-main);
            outline: none;
        `;
        select.addEventListener('change', aplicarFiltro);

        const optTodas = document.createElement('option');
        optTodas.value = '';
        optTodas.textContent = 'Todas as disciplinas';
        select.appendChild(optTodas);

        itens.forEach(nome => {
            obterCorDisciplina(nome);
            const opt = document.createElement('option');
            opt.value = nome;
            opt.textContent = nome;
            select.appendChild(opt);
        });

        container.appendChild(label);
        container.appendChild(select);

        const chartsGrid = document.querySelector('.charts-grid');
        chartsGrid.parentElement.insertBefore(container, chartsGrid);
    }

    itens.forEach(t => obterCorDisciplina(t));
}

// ============================================================
//  APLICAR FILTRO
//  — não filtra os dados, só redesenha o gráfico com destaque
// ============================================================
function aplicarFiltro() {
    respostasFiltradas = [...todasRespostas];
    atualizarTudo();
}

// ============================================================
//  ATUALIZAR TUDO
// ============================================================
function atualizarTudo() {
    atualizarEstatisticas();
    atualizarCirculoDesempenho();
    atualizarGraficoLinha();
    atualizarGraficoBarra();
    atualizarTabela();
}

// ============================================================
//  ESTATÍSTICAS RÁPIDAS
// ============================================================
function atualizarEstatisticas() {
    const total = respostasFiltradas.length;
    const somaNotas = respostasFiltradas.reduce((acc, r) => acc + (r.pontuacao || 0), 0);
    const media = total > 0 ? (somaNotas / total).toFixed(1) : '0';

    document.getElementById('totalRespondidas').textContent = total;
    document.getElementById('mediaGeral').textContent = media;
}

// ============================================================
//  CÍRCULO DE DESEMPENHO
// ============================================================
function atualizarCirculoDesempenho() {
    const total = respostasFiltradas.length;
    const somaNotas = respostasFiltradas.reduce((acc, r) => acc + (r.pontuacao || 0), 0);
    const somaMax   = respostasFiltradas.reduce((acc, r) => acc + (r.atividade?.pontuacaoMaxima || 10), 0);
    const totalPontos = somaNotas;
    const mediaPorAtividade = total > 0 ? (somaNotas / total).toFixed(1) : 0;
    const notasMaximas = respostasFiltradas.filter(r => r.pontuacao >= (r.atividade?.pontuacaoMaxima || 10)).length;
    const percentual = somaMax > 0 ? Math.round((somaNotas / somaMax) * 100) : 0;

    // Classificação
    let classificacao = 'Iniciante';
    if (percentual >= 90) classificacao = 'Expert';
    else if (percentual >= 75) classificacao = 'Avançado';
    else if (percentual >= 60) classificacao = 'Intermediário';
    else if (percentual >= 40) classificacao = 'Básico';

    document.getElementById('percentualAcerto').textContent = `${percentual}%`;
    document.getElementById('classificacao').textContent = classificacao;
    document.getElementById('totalPontos').textContent = totalPontos;
    document.getElementById('mediaPorAtividade').textContent = mediaPorAtividade;
    document.getElementById('notasMaximas').textContent = notasMaximas;

    // Animação do círculo SVG
    const circunferencia = 282.7;
    const offset = circunferencia - (percentual / 100) * circunferencia;
    const circle = document.getElementById('performanceCircle');
    if (circle) {
        circle.style.strokeDashoffset = offset;
    }
}

// ============================================================
//  GRÁFICO DE LINHA — Chart.js
//  X = sequência de tentativas por disciplina (1ª, 2ª, 3ª…)
//  Y = nota real obtida
//  Disciplina selecionada no filtro = linha destacada
// ============================================================
let lineChartInstance = null;

function atualizarGraficoLinha() {
    // Garante que o elemento é um <canvas>
    let el = document.getElementById('lineChart');
    if (!el) return;
    if (el.tagName === 'DIV') {
        el.outerHTML = '<canvas id="lineChart" class="chart-canvas"></canvas>';
        el = document.getElementById('lineChart');
    }

    if (todasRespostas.length === 0) {
        el.style.display = 'none';
        return;
    }
    el.style.display = '';

    const filtroSelecionado = document.getElementById('filtro-atividade')?.value || '';

    // Uma série por disciplina
    const disciplinas = [...new Set(todasRespostas.map(r => nomeDisciplina(r)))];

    // Para cada disciplina, lista as notas em ordem cronológica
    const porDisciplina = {};
    disciplinas.forEach(d => {
        porDisciplina[d] = todasRespostas
            .filter(r => nomeDisciplina(r) === d)
            .map(r => r.pontuacao ?? 0);
    });

    // Eixo X: labels "1", "2", "3"… até o máximo de tentativas
    const maxTentativas = Math.max(...disciplinas.map(d => porDisciplina[d].length));
    const labels = Array.from({ length: maxTentativas }, (_, i) => String(i + 1));

    // Nota máxima para escala do eixo Y
    const notaMaxima = Math.max(...todasRespostas.map(r => r.atividade?.pontuacaoMaxima ?? 10));

    // Monta datasets
    const datasets = disciplinas.map(d => {
        const cor = obterCorDisciplina(d);
        const destacada = !filtroSelecionado || filtroSelecionado === d;

        const dados = Array.from({ length: maxTentativas }, (_, i) =>
            porDisciplina[d][i] !== undefined ? porDisciplina[d][i] : null
        );

        return {
            label: d,
            data: dados,
            borderColor: destacada ? cor : cor + '33',
            backgroundColor: destacada ? cor + '22' : 'transparent',
            borderWidth: destacada ? 3 : 1.5,
            pointRadius: destacada ? 6 : 3,
            pointHoverRadius: destacada ? 8 : 4,
            pointBackgroundColor: destacada ? cor : cor + '33',
            tension: 0.4,
            spanGaps: true,
        };
    });

    if (lineChartInstance) lineChartInstance.destroy();

    lineChartInstance = new Chart(el, {
        type: 'line',
        data: { labels, datasets },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#9E9E9E',
                        font: { size: 11 },
                        boxWidth: 12,
                        padding: 16,
                    }
                },
                tooltip: {
                    callbacks: {
                        title: ctx => `${ctx[0].dataset.label} — ${ctx[0].label}ª tentativa`,
                        label: ctx => ` Nota: ${ctx.parsed.y}`
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Nº da tentativa',
                        color: '#9E9E9E',
                        font: { size: 11 }
                    },
                    ticks: { color: '#9E9E9E', font: { size: 11 } },
                    grid: { color: '#2a2a2a' },
                },
                y: {
                    title: {
                        display: true,
                        text: 'Nota',
                        color: '#9E9E9E',
                        font: { size: 11 }
                    },
                    min: 0,
                    max: notaMaxima,
                    ticks: { color: '#9E9E9E', stepSize: 1 },
                    grid: { color: '#2a2a2a' },
                }
            }
        }
    });
}

// ============================================================
//  GRÁFICO DE BARRAS — Chart.js (distribuição de notas)
// ============================================================
function atualizarGraficoBarra() {
    const canvas = document.getElementById('barChart');
    if (!canvas) return;

    // Garante que é um canvas
    if (canvas.tagName !== 'CANVAS') return;

    const disciplinas = [...new Set(respostasFiltradas.map(r => nomeDisciplina(r)))];

    const labels = disciplinas;
    const dados  = disciplinas.map(d => {
        const group = respostasFiltradas.filter(r => nomeDisciplina(r) === d);
        const soma  = group.reduce((acc, r) => acc + (r.pontuacao || 0), 0);
        const max   = group.reduce((acc, r) => acc + (r.atividade?.pontuacaoMaxima || 10), 0);
        return max > 0 ? Math.round((soma / max) * 100) : 0;
    });

    const cores = disciplinas.map(d => obterCorDisciplina(d));
    const coresBorda = cores.map(c => c + 'CC');

    if (barChart) barChart.destroy();

    barChart = new Chart(canvas, {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                label: 'Aproveitamento (%)',
                data: dados,
                backgroundColor: cores.map(c => c + '55'),
                borderColor: coresBorda,
                borderWidth: 2,
                borderRadius: 6,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: ctx => ` ${ctx.parsed.y}% de aproveitamento`
                    }
                }
            },
            scales: {
                x: {
                    ticks: { color: '#9E9E9E', font: { size: 11 } },
                    grid:  { color: '#2a2a2a' },
                },
                y: {
                    min: 0,
                    max: 100,
                    ticks: { color: '#9E9E9E', callback: v => v + '%' },
                    grid:  { color: '#2a2a2a' },
                }
            }
        }
    });
}

// ============================================================
//  TABELA DE HISTÓRICO
// ============================================================
function atualizarTabela() {
    const tbody = document.getElementById('atividadesTableBody');
    if (!tbody) return;

    if (respostasFiltradas.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="empty-state">
                    <i class="fas fa-inbox"></i>
                    <p>Nenhuma atividade encontrada.</p>
                </td>
            </tr>`;
        return;
    }

    tbody.innerHTML = respostasFiltradas.map(r => {
        const titulo     = r.atividade?.titulo || 'Sem título';
        const disciplina = nomeDisciplina(r);
        const nota   = r.pontuacao ?? 0;
        const max    = r.atividade?.pontuacaoMaxima ?? 10;
        const perc   = max > 0 ? Math.round((nota / max) * 100) : 0;
        const data   = formatarData(r.momentoFim || r.momentoInicio);
        const cor    = obterCorDisciplina(disciplina);

        let statusClass, statusLabel;
        if (perc >= 90)      { statusClass = 'status-excellent'; statusLabel = 'Excelente'; }
        else if (perc >= 70) { statusClass = 'status-good';      statusLabel = 'Bom'; }
        else if (perc >= 50) { statusClass = 'status-average';   statusLabel = 'Regular'; }
        else                 { statusClass = 'status-low';        statusLabel = 'Baixo'; }

        return `
            <tr>
                <td>
                    <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${cor};margin-right:8px;"></span>
                    <span style="font-weight:600">${disciplina}</span>
                    <span style="color:var(--text-muted);font-size:0.8rem;margin-left:6px;">— ${titulo}</span>
                </td>
                <td>${data}</td>
                <td>${nota}</td>
                <td>${max}</td>
                <td>
                    <div style="display:flex;align-items:center;gap:8px;">
                        <div class="progress-bar-mini">
                            <div class="progress-fill-mini" style="width:${perc}%; background: linear-gradient(90deg, ${cor}, ${cor}99);"></div>
                        </div>
                        <span style="font-size:0.8rem;color:var(--text-muted)">${perc}%</span>
                    </div>
                </td>
                <td><span class="status-badge ${statusClass}">${statusLabel}</span></td>
            </tr>`;
    }).join('');
}

// ============================================================
//  UTILITÁRIOS
// ============================================================
function formatarData(dataString) {
    if (!dataString) return 'Data não disponível';
    try {
        const data = new Date(dataString);
        if (isNaN(data.getTime())) return dataString;
        return data.toLocaleDateString('pt-BR') + ' ' +
               data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } catch {
        return dataString;
    }
}

// ============================================================
//  MENU SIDEBAR
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    const menuToggle = document.getElementById('menu-toggle');
    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            document.querySelector('.sidebar').classList.toggle('collapsed');
            document.querySelector('.dashboard-content').classList.toggle('collapsed');
        });
    }
});