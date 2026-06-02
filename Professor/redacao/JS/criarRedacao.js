// professor-criar-redacao.js

const API_URL = 'http://localhost:8080';
const ID_PROFESSOR_LOGADO = 1;

document.addEventListener('DOMContentLoaded', async () => {
    await carregarRedacoesCriadas();
    inicializarEventos();
});

async function carregarRedacoesCriadas() {
    const container = document.getElementById('redacoesCriadasList');
    
    try {
        const response = await fetch(`${API_URL}/redacoes/professor/${ID_PROFESSOR_LOGADO}`);
        
        if (!response.ok) {
            throw new Error('Erro ao carregar');
        }
        
        const redacoes = await response.json();
        
        if (redacoes.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-inbox"></i>
                    <p>Você ainda não criou nenhuma redação.</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = redacoes.map(red => `
            <div class="redacao-criada-item">
                <div class="redacao-criada-titulo">
                    <span>${escapeHtml(red.titulo)}</span>
                    <span class="redacao-criada-data"><i class="fas fa-calendar"></i> Entrega: ${formatarData(red.dataEntrega)}</span>
                </div>
                <div class="redacao-criada-turma"><i class="fas fa-users"></i> Turma ${red.turmaId || '?'}</div>
                <div class="redacao-criada-tema"><i class="fas fa-tag"></i> ${escapeHtml(red.tema)}</div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Erro:', error);
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Erro ao carregar redações. Verifique se o backend está rodando.</p>
            </div>
        `;
    }
}

async function criarRedacao(event) {
    event.preventDefault();
    
    const titulo = document.getElementById('titulo').value.trim();
    const dataEntrega = document.getElementById('dataEntrega').value;
    const turmaId = document.getElementById('turma').value;
    const tema = document.getElementById('tema').value.trim();
    const descricao = document.getElementById('descricao').value.trim();
    
    if (!titulo || !dataEntrega || !turmaId || !tema) {
        mostrarNotificacao('Preencha todos os campos obrigatórios.', 'error');
        return;
    }
    
    const submitBtn = document.getElementById('criarBtn');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-pulse"></i> Criando...';
    submitBtn.disabled = true;
    
    try {
        const redacaoData = {
            titulo: titulo,
            tema: tema,
            descricao: descricao,
            dataEntrega: dataEntrega,
            turmaId: parseInt(turmaId),
            dataCriacao: new Date().toISOString()
        };
        
        const response = await fetch(`${API_URL}/redacoes/professor`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(redacaoData)
        });
        
        if (!response.ok) throw new Error('Erro ao criar');
        
        document.getElementById('confirmModal').style.display = 'block';
        
        // Limpar formulário
        document.getElementById('titulo').value = '';
        document.getElementById('dataEntrega').value = '';
        document.getElementById('turma').value = '';
        document.getElementById('tema').value = '';
        document.getElementById('descricao').value = '';
        
        await carregarRedacoesCriadas();
        mostrarNotificacao('✅ Redação criada com sucesso!', 'success');
        
    } catch (error) {
        console.error('Erro:', error);
        mostrarNotificacao('❌ Erro ao criar redação.', 'error');
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

function limparFormulario() {
    if (confirm('Limpar formulário?')) {
        document.getElementById('titulo').value = '';
        document.getElementById('dataEntrega').value = '';
        document.getElementById('turma').value = '';
        document.getElementById('tema').value = '';
        document.getElementById('descricao').value = '';
        mostrarNotificacao('Formulário limpo!', 'info');
    }
}

function mostrarNotificacao(mensagem, tipo) {
    const notification = document.createElement('div');
    notification.innerHTML = `<i class="fas ${tipo === 'success' ? 'fa-check-circle' : tipo === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i> ${mensagem}`;
    notification.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background-color: ${tipo === 'success' ? 'rgba(0,230,118,0.2)' : tipo === 'error' ? 'rgba(255,61,0,0.2)' : 'rgba(187,134,252,0.2)'};
        border: 1px solid ${tipo === 'success' ? '#00E676' : tipo === 'error' ? '#FF3D00' : '#BB86FC'};
        color: ${tipo === 'success' ? '#00E676' : tipo === 'error' ? '#FF3D00' : '#BB86FC'};
        padding: 12px 20px;
        border-radius: 8px;
        z-index: 3000;
        animation: slideInRight 0.3s ease;
    `;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
}

function formatarData(dataString) {
    if (!dataString) return '-';
    try {
        return new Date(dataString).toLocaleDateString('pt-BR');
    } catch {
        return dataString;
    }
}

function escapeHtml(text) {
    if (!text) return '';
    return text.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

function inicializarEventos() {
    document.getElementById('criarRedacaoForm')?.addEventListener('submit', criarRedacao);
    document.getElementById('limparBtn')?.addEventListener('click', limparFormulario);
    document.getElementById('refreshRedacoesBtn')?.addEventListener('click', () => carregarRedacoesCriadas());
    
    const closeModal = document.getElementById('closeConfirmModal');
    const okBtn = document.getElementById('okConfirmBtn');
    const modal = document.getElementById('confirmModal');
    
    if (closeModal) closeModal.onclick = () => modal.style.display = 'none';
    if (okBtn) okBtn.onclick = () => modal.style.display = 'none';
    window.onclick = (e) => { if (e.target === modal) modal.style.display = 'none'; };
}

const style = document.createElement('style');
style.textContent = `@keyframes slideInRight { from { opacity:0; transform:translateX(100%); } to { opacity:1; transform:translateX(0); } }`;
document.head.appendChild(style);