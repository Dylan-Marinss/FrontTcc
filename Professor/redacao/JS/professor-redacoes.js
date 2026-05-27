// professor-redacoes.js - Redações dos Alunos (Versão Professor)

// Dados mockados (simulando as tabelas TBL_REDACAO e TBL_CORRECAOREDACAO)
let redacoesMock = [
    {
        idRedacao: 1,
        idAluno: 101,
        alunoNome: "João Silva",
        turma: "Turma A - 3º Ano",
        tema: "Os desafios da educação brasileira no século XXI",
        titulo: "A luta pela educação de qualidade",
        textoRedacao: "A educação no Brasil enfrenta diversos desafios... (texto completo aqui)",
        pontuacaoObtida: null,
        comentarios: null,
        status: "pendente",
        dataEnvio: "2024-11-20T10:30:00"
    },
    {
        idRedacao: 2,
        idAluno: 102,
        alunoNome: "Maria Santos",
        turma: "Turma A - 3º Ano",
        tema: "Os desafios da educação brasileira no século XXI",
        titulo: "Educação como base para o futuro",
        textoRedacao: "A educação é a base para o desenvolvimento... (texto completo aqui)",
        pontuacaoObtida: 750,
        comentarios: "Ótima redação! A argumentação está bem estruturada.",
        status: "corrigida",
        dataEnvio: "2024-11-19T14:20:00"
    },
    {
        idRedacao: 3,
        idAluno: 103,
        alunoNome: "Pedro Oliveira",
        turma: "Turma B - 2º Ano",
        tema: "Os impactos da inteligência artificial no mercado de trabalho",
        titulo: "IA e o futuro do trabalho",
        textoRedacao: "A inteligência artificial está transformando... (texto completo aqui)",
        pontuacaoObtida: null,
        comentarios: null,
        status: "pendente",
        dataEnvio: "2024-11-21T09:15:00"
    }
];

let redacaoAtual = null;

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    carregarRedacoes();
    inicializarEventos();
});

function carregarRedacoes() {
    const container = document.getElementById('redacoesContainer');
    
    if (redacoesMock.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-inbox"></i>
                <p>Nenhuma redação encontrada.</p>
                <p>As redações enviadas pelos alunos aparecerão aqui.</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = redacoesMock.map(redacao => `
        <div class="redacao-card" onclick="abrirModalCorrecao(${redacao.idRedacao})">
            <div class="card-header-redacao">
                <div class="aluno-info">
                    <div class="aluno-avatar">${redacao.alunoNome.charAt(0)}</div>
                    <div class="aluno-nome">${escapeHtml(redacao.alunoNome)}</div>
                </div>
                <div class="status-badge ${redacao.status === 'pendente' ? 'status-pendente' : 'status-corrigida'}">
                    ${redacao.status === 'pendente' ? '⏳ Pendente' : '✅ Corrigida'}
                </div>
            </div>
            <div class="redacao-tema">
                <i class="fas fa-tag"></i> ${escapeHtml(redacao.tema.substring(0, 60))}...
            </div>
            <div class="redacao-titulo">
                <i class="fas fa-heading"></i> ${escapeHtml(redacao.titulo)}
            </div>
            <div class="redacao-preview">
                ${escapeHtml(redacao.textoRedacao.substring(0, 100))}...
            </div>
            <div class="card-footer-redacao">
                <span><i class="fas fa-calendar"></i> ${formatarData(redacao.dataEnvio)}</span>
                ${redacao.pontuacaoObtida ? `<span class="redacao-nota"><i class="fas fa-star"></i> ${redacao.pontuacaoObtida}/1000</span>` : ''}
            </div>
        </div>
    `).join('');
}

function abrirModalCorrecao(idRedacao) {
    redacaoAtual = redacoesMock.find(r => r.idRedacao === idRedacao);
    if (!redacaoAtual) return;
    
    // Preencher modal
    document.getElementById('modalAluno').textContent = redacaoAtual.alunoNome;
    document.getElementById('modalTurma').textContent = redacaoAtual.turma;
    document.getElementById('modalTema').textContent = redacaoAtual.tema;
    document.getElementById('modalTitulo').textContent = redacaoAtual.titulo;
    document.getElementById('modalData').textContent = formatarData(redacaoAtual.dataEnvio);
    document.getElementById('modalTexto').textContent = redacaoAtual.textoRedacao;
    
    // Preencher nota se já existir
    const notaInput = document.getElementById('notaInput');
    const notaSlider = document.getElementById('notaSlider');
    const nota = redacaoAtual.pontuacaoObtida || '';
    notaInput.value = nota;
    notaSlider.value = nota || 500;
    
    document.getElementById('comentarioInput').value = redacaoAtual.comentarios || '';
    
    // Abrir modal
    document.getElementById('correcaoModal').style.display = 'block';
    document.body.style.overflow = 'hidden';
    
    // Sincronizar slider com input
    notaSlider.oninput = function() {
        notaInput.value = this.value;
    };
    
    notaInput.oninput = function() {
        notaSlider.value = this.value;
    };
}

function salvarCorrecao() {
    if (!redacaoAtual) return;
    
    const nota = parseInt(document.getElementById('notaInput').value) || 0;
    const comentario = document.getElementById('comentarioInput').value;
    
    // Validar nota
    if (nota < 0 || nota > 1000) {
        alert('A nota deve estar entre 0 e 1000');
        return;
    }
    
    // Atualizar redação
    redacaoAtual.pontuacaoObtida = nota;
    redacaoAtual.comentarios = comentario;
    redacaoAtual.status = 'corrigida';
    
    // Fechar modal
    fecharModal();
    
    // Recarregar lista
    carregarRedacoes();
    
    alert(`✅ Redação corrigida!\nNota: ${nota}/1000\n\nComentários salvos com sucesso.`);
}

function fecharModal() {
    document.getElementById('correcaoModal').style.display = 'none';
    document.body.style.overflow = 'auto';
    redacaoAtual = null;
}

function filtrarRedacoes() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const statusFilter = document.getElementById('statusFilter').value;
    const turmaFilter = document.getElementById('turmaFilter').value;
    
    let filtradas = [...redacoesMock];
    
    if (searchTerm) {
        filtradas = filtradas.filter(r => 
            r.alunoNome.toLowerCase().includes(searchTerm) || 
            r.titulo.toLowerCase().includes(searchTerm)
        );
    }
    
    if (statusFilter !== 'todos') {
        filtradas = filtradas.filter(r => r.status === statusFilter);
    }
    
    if (turmaFilter !== 'todas') {
        filtradas = filtradas.filter(r => r.turma.toLowerCase().includes(turmaFilter.toLowerCase()));
    }
    
    const container = document.getElementById('redacoesContainer');
    
    if (filtradas.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-search"></i>
                <p>Nenhuma redação encontrada com os filtros selecionados.</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = filtradas.map(redacao => `
        <div class="redacao-card" onclick="abrirModalCorrecao(${redacao.idRedacao})">
            <div class="card-header-redacao">
                <div class="aluno-info">
                    <div class="aluno-avatar">${redacao.alunoNome.charAt(0)}</div>
                    <div class="aluno-nome">${escapeHtml(redacao.alunoNome)}</div>
                </div>
                <div class="status-badge ${redacao.status === 'pendente' ? 'status-pendente' : 'status-corrigida'}">
                    ${redacao.status === 'pendente' ? '⏳ Pendente' : '✅ Corrigida'}
                </div>
            </div>
            <div class="redacao-tema">
                <i class="fas fa-tag"></i> ${escapeHtml(redacao.tema.substring(0, 60))}...
            </div>
            <div class="redacao-titulo">
                <i class="fas fa-heading"></i> ${escapeHtml(redacao.titulo)}
            </div>
            <div class="redacao-preview">
                ${escapeHtml(redacao.textoRedacao.substring(0, 100))}...
            </div>
            <div class="card-footer-redacao">
                <span><i class="fas fa-calendar"></i> ${formatarData(redacao.dataEnvio)}</span>
                ${redacao.pontuacaoObtida ? `<span class="redacao-nota"><i class="fas fa-star"></i> ${redacao.pontuacaoObtida}/1000</span>` : ''}
            </div>
        </div>
    `).join('');
}

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
}

function formatarData(dataString) {
    if (!dataString) return 'Data não disponível';
    try {
        const data = new Date(dataString);
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

// Expor funções globalmente
window.abrirModalCorrecao = abrirModalCorrecao;
window.filtrarRedacoes = filtrarRedacoes;