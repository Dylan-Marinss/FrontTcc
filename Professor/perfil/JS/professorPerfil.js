// ============================================================
//  CONFIGURAÇÃO
// ============================================================
const API_URL = 'http://localhost:8080';
const ID_PROFESSOR_LOGADO = 6; // substituir pelo ID real após login

// ============================================================
//  INICIALIZAÇÃO
// ============================================================
document.addEventListener('DOMContentLoaded', async () => {
    await carregarPerfil();
    await carregarTurmas();
    inicializarEdicao();
});

// ============================================================
//  CARREGAR PERFIL DO PROFESSOR
// ============================================================
async function carregarPerfil() {
    try {
        const response = await fetch(`${API_URL}/utilizadores/${ID_PROFESSOR_LOGADO}`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const prof = await response.json();

        // Header
        document.getElementById('prof-nome').textContent        = prof.nome || 'Professor';
        document.getElementById('prof-instituicao').textContent = 'EstudeX';

        // -------------------------------------------------------
        // TODO: BIO DO PROFESSOR
        // Por enquanto a bio está estática/hardcoded.
        // Quando for implementar:
        //   1. Adicionar coluna `Bio VARCHAR(500)` na TBL_PROFESSOR
        //   2. Expor o campo no endpoint GET /professores/{id}
        //   3. Substituir a linha abaixo por: prof.bio || 'Sem biografia cadastrada.'
        //   4. No PUT de edição, incluir o campo bio no body e salvar via /professores/{id}
        // -------------------------------------------------------
        document.getElementById('bio-texto').textContent = 'Sem biografia cadastrada.';

        // Dados pessoais
        document.getElementById('info-nome').textContent   = prof.nome   || '—';
        document.getElementById('info-uf').textContent     = prof.uf     || '—';
        document.getElementById('info-cidade').textContent = prof.cidade || '—';
        document.getElementById('info-cpf').textContent    = prof.cpf    || '—';

        // -------------------------------------------------------
        // TODO: EMAIL DO PROFESSOR
        // A coluna Email já existe na TBL_PROFESSOR (foi criada).
        // Para ativar:
        //   1. Garantir que o endpoint GET /professores/{id} retorna o campo email
        //   2. Descomentar as linhas abaixo
        // -------------------------------------------------------
        // document.getElementById('info-email').textContent = prof.email || '—';
        // document.getElementById('edit-email').value       = prof.email || '';

        // -------------------------------------------------------
        // TODO: DATA DE CADASTRO (info-membro)
        // A coluna dataCadastro não existe na TBL_UTILIZADOR ainda.
        // Para ativar:
        //   1. Adicionar coluna `DataCadastro DATETIME DEFAULT GETDATE()` na TBL_UTILIZADOR
        //   2. Descomentar: document.getElementById('info-membro').textContent = formatarData(prof.dataCadastro);
        // -------------------------------------------------------
        document.getElementById('info-membro').textContent = '—';

        // Preenche inputs de edição
        document.getElementById('edit-nome').value   = prof.nome   || '';
        document.getElementById('edit-uf').value     = prof.uf     || '';
        document.getElementById('edit-cidade').value = prof.cidade || '';
        document.getElementById('edit-cpf').value    = prof.cpf    || '';

        // -------------------------------------------------------
        // TODO: DISCIPLINAS DO PROFESSOR
        // A TBL_PROFESSOR tem idDisciplina (só uma disciplina por enquanto).
        // Para ativar as tags de disciplina:
        //   1. Garantir que o endpoint retorna o objeto disciplina dentro do professor
        //   2. Substituir o array vazio por: [prof.disciplina] ou prof.disciplinas
        // -------------------------------------------------------
        renderizarDisciplinas([]);

        // -------------------------------------------------------
        // TODO: STATS (total de turmas, alunos, atividades)
        // Esses dados precisam vir de endpoints específicos, ex:
        //   GET /professores/{id}/stats → { totalTurmas, totalAlunos, totalAtividades }
        // Quando existirem, substituir os '—' pelos valores reais.
        // -------------------------------------------------------
        document.getElementById('stat-turmas').textContent     = '—';
        document.getElementById('stat-alunos').textContent     = '—';
        document.getElementById('stat-atividades').textContent = '—';

    } catch (error) {
        console.error('Erro ao carregar perfil:', error);
        document.getElementById('prof-nome').textContent = 'Erro ao carregar';
        document.getElementById('bio-texto').textContent = 'Não foi possível carregar as informações.';
    }
}

function renderizarDisciplinas(disciplinas) {
    const container = document.getElementById('prof-disciplinas');
    if (!disciplinas.length) {
        container.innerHTML = '<span class="tag">Sem disciplinas cadastradas</span>';
        return;
    }
    container.innerHTML = disciplinas.map(d =>
        `<span class="tag"><i class="fas fa-book"></i> ${d.nome || d}</span>`
    ).join('');
}

// ============================================================
//  CARREGAR TURMAS
// ============================================================
async function carregarTurmas() {
    const grid = document.getElementById('turmasGrid');

    try {
        const response = await fetch(`${API_URL}/turmas/professor/${ID_PROFESSOR_LOGADO}`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const turmas = await response.json();

        if (!turmas.length) {
            grid.innerHTML = `
                <div style="grid-column:1/-1; text-align:center; color:var(--text-muted); padding:30px;">
                    <i class="fas fa-users" style="font-size:2.5rem; margin-bottom:10px; display:block;"></i>
                    Nenhuma turma vinculada.
                </div>`;
            return;
        }

        grid.innerHTML = turmas.map(t => `
            <div class="turma-card" onclick="abrirAlunos(${t.id}, '${escapeHtml(t.nome)}')">
                <i class="fas fa-chalkboard icone"></i>
                <div class="nome-turma">${escapeHtml(t.nome)}</div>
                <div class="detalhe">${escapeHtml(t.disciplina?.nome || t.disciplina || '—')}</div>
                <div class="detalhe" style="margin-top:4px;">
                    <i class="fas fa-user-graduate" style="color:var(--primary-color);"></i>
                    ${t.totalAlunos ?? 0} alunos
                </div>
            </div>
        `).join('');

    } catch (error) {
        console.error('Erro ao carregar turmas:', error);
        grid.innerHTML = `
            <div style="grid-column:1/-1; text-align:center; color:var(--accent-color); padding:30px;">
                <i class="fas fa-exclamation-triangle"></i> Erro ao carregar turmas.
            </div>`;
    }
}

// ============================================================
//  ALUNOS DA TURMA
// ============================================================
async function abrirAlunos(idTurma, nomeTurma) {
    const section   = document.getElementById('alunosSection');
    const container = document.getElementById('alunosContainer');
    const titulo    = document.getElementById('turmaTitulo');

    titulo.innerHTML = `<i class="fas fa-user-graduate"></i> Alunos — ${nomeTurma}`;
    container.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Carregando alunos...</div>';

    section.classList.remove('hidden');
    section.scrollIntoView({ behavior: 'smooth', block: 'start' });

    try {
        const response = await fetch(`${API_URL}/turmas/${idTurma}/alunos`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const alunos = await response.json();

        if (!alunos.length) {
            container.innerHTML = `
                <div style="grid-column:1/-1; text-align:center; color:var(--text-muted); padding:20px;">
                    Nenhum aluno nesta turma.
                </div>`;
            return;
        }

        container.innerHTML = alunos.map(a => {
            const iniciais = (a.nome || 'A').split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();
            return `
                <div class="aluno-card">
                    <div class="aluno-avatar">${iniciais}</div>
                    <div class="aluno-info">
                        <h4>${escapeHtml(a.nome)}</h4>
                        <p>
                            <i class="fas fa-circle" style="font-size:0.5rem; color:var(--status-completed);"></i>
                            ${escapeHtml(a.serie?.nomeSerie || a.serie || 'Série não definida')}
                        </p>
                    </div>
                </div>`;
        }).join('');

    } catch (error) {
        console.error('Erro ao carregar alunos:', error);
        container.innerHTML = `
            <div style="grid-column:1/-1; text-align:center; color:var(--accent-color); padding:20px;">
                <i class="fas fa-exclamation-triangle"></i> Erro ao carregar alunos.
            </div>`;
    }
}

document.getElementById('fecharAlunos')?.addEventListener('click', () => {
    document.getElementById('alunosSection').classList.add('hidden');
});

// ============================================================
//  EDIÇÃO DO PERFIL
// ============================================================
function inicializarEdicao() {
    const btnEditar   = document.getElementById('btnEditar');
    const btnCancelar = document.getElementById('btnCancelar');
    const btnSalvar   = document.getElementById('btnSalvar');
    const editActions = document.getElementById('editActions');

    const campos = ['nome', 'cpf', 'uf', 'cidade'];
    // TODO: adicionar 'email' no array acima quando o endpoint de professor retornar o campo email

    btnEditar?.addEventListener('click', () => {
        campos.forEach(c => {
            document.getElementById(`info-${c}`)?.classList.add('hidden');
            document.getElementById(`edit-${c}`)?.classList.remove('hidden');
        });
        editActions?.classList.remove('hidden');
        btnEditar.classList.add('hidden');
    });

    btnCancelar?.addEventListener('click', () => {
        campos.forEach(c => {
            document.getElementById(`info-${c}`)?.classList.remove('hidden');
            document.getElementById(`edit-${c}`)?.classList.add('hidden');
        });
        editActions?.classList.add('hidden');
        btnEditar?.classList.remove('hidden');
    });

    btnSalvar?.addEventListener('click', async () => {
        const body = {
            nome:   document.getElementById('edit-nome').value.trim(),
            cpf:    document.getElementById('edit-cpf').value.trim(),
            uf:     document.getElementById('edit-uf').value.trim(),
            cidade: document.getElementById('edit-cidade').value.trim(),
            // TODO: descomentar quando endpoint de professor aceitar email no PUT
            // email: document.getElementById('edit-email').value.trim(),
        };

        btnSalvar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';
        btnSalvar.disabled = true;

        try {
            const response = await fetch(`${API_URL}/utilizadores/${ID_PROFESSOR_LOGADO}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            // Atualiza os valores exibidos
            document.getElementById('info-nome').textContent   = body.nome;
            document.getElementById('info-cpf').textContent    = body.cpf;
            document.getElementById('info-uf').textContent     = body.uf;
            document.getElementById('info-cidade').textContent = body.cidade;
            document.getElementById('prof-nome').textContent   = body.nome;
            // TODO: descomentar quando email estiver ativo
            // document.getElementById('info-email').textContent = body.email;

            btnCancelar.click();
            showAlert('✅ Perfil atualizado com sucesso!', 'success');

        } catch (error) {
            console.error('Erro ao salvar:', error);
            showAlert('❌ Erro ao salvar alterações.', 'error');
        } finally {
            btnSalvar.innerHTML = '<i class="fas fa-save"></i> Salvar';
            btnSalvar.disabled = false;
        }
    });
}

// ============================================================
//  UTILITÁRIOS
// ============================================================
function formatarData(dataString) {
    if (!dataString) return '—';
    try {
        const d = new Date(dataString);
        if (isNaN(d.getTime())) return dataString;
        return d.toLocaleDateString('pt-BR');
    } catch { return dataString; }
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showAlert(message, type) {
    const alert = document.createElement('div');
    alert.style.cssText = `
        position:fixed; top:20px; right:20px; z-index:9999;
        padding:14px 22px; border-radius:12px; font-weight:500;
        display:flex; align-items:center; gap:10px;
        font-family:'Poppins',sans-serif; font-size:0.9rem;
        animation: slideInRight 0.3s ease;
        ${type === 'success'
            ? 'background:rgba(0,230,118,0.15); border:1px solid #00E676; color:#00E676;'
            : 'background:rgba(255,61,0,0.15); border:1px solid #FF3D00; color:#FF3D00;'}
    `;
    alert.textContent = message;
    document.body.appendChild(alert);
    setTimeout(() => {
        alert.style.opacity = '0';
        alert.style.transition = 'opacity 0.3s';
        setTimeout(() => alert.remove(), 300);
    }, 4000);
}