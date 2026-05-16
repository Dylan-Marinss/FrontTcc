// js/professor-script.js

/**
 * EstudeX - Perfil do Professor
 * JavaScript para integração com o banco de dados
 */

// Configuração da API - ALTERE PARA A URL DO SEU BACKEND
const CONFIG = {
    API_BASE_URL: 'http://localhost:8080',
    PROFESSOR_ID: 1,
    ENDPOINTS: {
        PERFIL: '/professores/{id}/perfil',
        RANKING: '/professores/{id}/ranking-turmas',
        TURMAS: '/series',                            // ✅ ENDPOINT QUE EXISTE
        ALUNOS: '/alunos',                            // ✅ ENDPOINT QUE EXISTE
        ESTATISTICAS: '/professores/{id}/estatisticas',
    },
    TIMEOUT: 30000
};

class ProfessorDashboard {
    constructor() {
        this.professorId = this.getProfessorId();
        this.turmaSelecionada = null;
        this.cache = new Map();
        this.init();
    }

    getProfessorId() {
        const storedId = sessionStorage.getItem('estudex_professor_id');
        if (storedId) return parseInt(storedId);

        const urlParams = new URLSearchParams(window.location.search);
        const urlId = urlParams.get('professor');
        if (urlId) {
            sessionStorage.setItem('estudex_professor_id', urlId);
            return parseInt(urlId);
        }

        return CONFIG.PROFESSOR_ID;
    }

    async init() {
        this.setupEventListeners();

        try {
            // Marcar item do menu ativo baseado na página atual
            this.marcarMenuAtivo();

            // Carregar todos os dados
            await Promise.all([
                this.carregarPerfilProfessor(),
                this.carregarRankingTurmas(),
                this.carregarTurmas(),
                this.carregarEstatisticasFooter()
            ]);
        } catch (error) {
            console.error('Erro na inicialização:', error);
        }
    }

    setupEventListeners() {
        // Menu toggle
        const menuToggle = document.getElementById('menuToggle');
        if (menuToggle) {
            menuToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                document.getElementById('sidebar').classList.toggle('collapsed');

                if (window.innerWidth <= 768) {
                    document.getElementById('sidebar').classList.toggle('active');
                }
            });
        }

        // Fechar alunos
        const fecharAlunos = document.getElementById('fecharAlunos');
        if (fecharAlunos) {
            fecharAlunos.addEventListener('click', () => {
                document.getElementById('alunosSection').style.display = 'none';
                this.turmaSelecionada = null;
            });
        }

        // Fechar modal
        const modalClose = document.getElementById('modalClose');
        if (modalClose) {
            modalClose.addEventListener('click', () => {
                document.getElementById('modal').style.display = 'none';
            });
        }

        // Fechar modal ao clicar fora
        window.addEventListener('click', (e) => {
            const modal = document.getElementById('modal');
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });

        // Responsividade
        window.addEventListener('resize', () => {
            if (window.innerWidth > 768) {
                document.getElementById('sidebar').classList.remove('active');
            }
        });

        // Sidebar footer (Configurações)
        const sidebarFooter = document.getElementById('sidebarFooter');
        if (sidebarFooter) {
            sidebarFooter.addEventListener('click', () => {
                window.location.href = 'configuracoes.html';
            });
        }
    }

    // Marcar item do menu ativo baseado na página atual
    marcarMenuAtivo() {
        const currentPage = window.location.pathname.split('/').pop() || 'home-Estudex.html';
        const navItems = document.querySelectorAll('.nav-item');

        navItems.forEach(item => {
            const href = item.getAttribute('href');
            if (href === currentPage) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }

    async request(endpoint, options = {}) {
        const cacheKey = `${options.method || 'GET'}_${endpoint}`;
        const cached = this.cache.get(cacheKey);

        if (cached && !options.forceRefresh && (Date.now() - cached.timestamp < 60000)) {
            return cached.data;
        }

        try {
            const url = endpoint.startsWith('http') ? endpoint : `${CONFIG.API_BASE_URL}${endpoint}`;

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), CONFIG.TIMEOUT);

            const response = await fetch(url, {
                ...options,
                signal: controller.signal,
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                }
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();

            this.cache.set(cacheKey, {
                data,
                timestamp: Date.now()
            });

            return data;
        } catch (error) {
            if (error.name === 'AbortError') {
                throw new Error('Timeout da requisição');
            }
            throw error;
        }
    }

    // ========== PERFIL DO PROFESSOR ==========
    async carregarPerfilProfessor() {
        const container = document.getElementById('profileHeader');

        try {
            const endpoint = CONFIG.ENDPOINTS.PERFIL.replace('{id}', this.professorId);
            const professor = await this.request(endpoint);

            container.innerHTML = `
                <div class="avatar-large">
                    <img src="${professor.avatar || 'https://via.placeholder.com/100x100/BB86FC/ffffff?text=Prof'}" 
                         alt="${professor.nome || 'Professor'}"
                         onerror="this.src='https://via.placeholder.com/100x100/BB86FC/ffffff?text=Prof'">
                </div>
                
                <div class="profile-info">
                    <h2>${professor.nome || 'Prof. Ricardo Oliveira'}</h2>
                    <p class="instituicao">${professor.instituicao || 'Colégio EstudeX'} · ${professor.disciplina || 'Matemática e Física'}</p>
                    <div class="badge-nivel">Nível de Acesso: ${professor.nivelAcesso || 'M2 (70%)'}</div>
                    <div class="bio">
                        <i class="fas fa-quote-left"></i> 
                        ${professor.bio || 'Docente há 12 anos, especialista em preparação para vestibulares. Acompanhamento personalizado com foco em resultados.'}
                    </div>
                    <div class="tags">
                        ${professor.tags ? professor.tags.map(tag =>
                `<span class="tag">#${tag}</span>`
            ).join('') : `
                            <span class="tag">#Matemática</span>
                            <span class="tag">#Física</span>
                            <span class="tag">#Vestibular</span>
                            <span class="tag">#ENEM</span>
                            <span class="tag">#Foco</span>
                        `}
                    </div>
                </div>
                
                <div class="stats-mini">
                    <div>
                        <strong>${professor.totalAtividades || 245}</strong> 
                        <span>atividades</span>
                    </div>
                    <div>
                        <strong>${professor.taxaAcertos || 87}%</strong> 
                        <span>aproveit.</span>
                    </div>
                    <div>
                        <strong>${professor.horasEstudo || 142}h</strong> 
                        <span>estudo/mês</span>
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('Erro ao carregar perfil:', error);

            // Dados mockados em caso de erro
            container.innerHTML = `
                <div class="avatar-large">
                    <img src="https://via.placeholder.com/100x100/BB86FC/ffffff?text=Prof" alt="Professor">
                </div>
                
                <div class="profile-info">
                    <h2>Prof. Ricardo Oliveira</h2>
                    <p class="instituicao">Colégio EstudeX · Matemática e Física</p>
                    <div class="badge-nivel">Nível de Acesso: M2 (70%)</div>
                    <div class="bio">
                        <i class="fas fa-quote-left"></i> 
                        Docente há 12 anos, especialista em preparação para vestibulares. Acompanhamento personalizado com foco em resultados.
                    </div>
                    <div class="tags">
                        <span class="tag">#Matemática</span>
                        <span class="tag">#Física</span>
                        <span class="tag">#Vestibular</span>
                        <span class="tag">#ENEM</span>
                        <span class="tag">#Foco</span>
                    </div>
                </div>
                
                <div class="stats-mini">
                    <div><strong>245</strong> <span>atividades</span></div>
                    <div><strong>87%</strong> <span>aproveit.</span></div>
                    <div><strong>142h</strong> <span>estudo/mês</span></div>
                </div>
            `;
        }
    }


    // ========== TURMAS ==========
    async carregarTurmas() {
        const container = document.getElementById('turmasGrid');
        

        try {
            const turmas = await this.request('/series');

            if (turmas && turmas.length > 0) {
                container.innerHTML = turmas.map(turma => `
                    <div class="turma-card" data-turma-id="${turma.id}" 
                    onclick="professorDashboard.carregarAlunosDaTurma(${turma.id}, '${turma.nomeSerie}')">
                    <div class="icone"><i class="fas fa-user-graduate"></i></div>
                    <div class="nome-turma">${turma.nomeSerie}</div>
                    </div>
                    
                `).join('');
            } else {
                // Turmas padrão
                container.innerHTML = this.getTurmasPadrao();
            }
        } catch (error) {
            console.error('Erro ao carregar turmas:', error);
            container.innerHTML = this.getTurmasPadrao();
        }
    }

    getTurmasPadrao() {
        return `
            <div class="turma-card" data-turma-id="6" onclick="professorDashboard.carregarAlunosDaTurma(6, '6º ano')">
                <div class="icone"><i class="fas fa-users"></i></div>
                <div class="nome-turma">6º ano</div>
                <div class="detalhe">32 alunos</div>
            </div>
            <div class="turma-card" data-turma-id="7" onclick="professorDashboard.carregarAlunosDaTurma(7, '7º ano')">
                <div class="icone"><i class="fas fa-users"></i></div>
                <div class="nome-turma">7º ano</div>
                <div class="detalhe">29 alunos</div>
            </div>
            <div class="turma-card" data-turma-id="8" onclick="professorDashboard.carregarAlunosDaTurma(8, '8º ano')">
                <div class="icone"><i class="fas fa-users"></i></div>
                <div class="nome-turma">8º ano</div>
                <div class="detalhe">31 alunos</div>
            </div>
            <div class="turma-card" data-turma-id="9" onclick="professorDashboard.carregarAlunosDaTurma(9, '9º ano')">
                <div class="icone"><i class="fas fa-user-graduate"></i></div>
                <div class="nome-turma">9º ano</div>
                <div class="detalhe">28 alunos</div>
            </div>
            <div class="turma-card" data-turma-id="10" onclick="professorDashboard.carregarAlunosDaTurma(10, '1ª série EM')">
                <div class="icone"><i class="fas fa-user-graduate"></i></div>
                <div class="nome-turma">1ª série EM</div>
                <div class="detalhe">35 alunos</div>
            </div>
            <div class="turma-card" data-turma-id="11" onclick="professorDashboard.carregarAlunosDaTurma(11, '2ª série EM')">
                <div class="icone"><i class="fas fa-user-graduate"></i></div>
                <div class="nome-turma">2ª série EM</div>
                <div class="detalhe">33 alunos</div>
            </div>
            <div class="turma-card" data-turma-id="12" onclick="professorDashboard.carregarAlunosDaTurma(12, '3ª série EM')">
                <div class="icone"><i class="fas fa-user-graduate"></i></div>
                <div class="nome-turma">3ª série EM</div>
                <div class="detalhe">27 alunos</div>
            </div>
        `;
    }

    // ========== ALUNOS DA TURMA ==========
    async carregarAlunosDaTurma(turmaId, turmaNome) {
        try {
            this.turmaSelecionada = turmaId;

            const alunosSection = document.getElementById('alunosSection');
            const alunosContainer = document.getElementById('alunosContainer');
            const turmaTitulo = document.getElementById('turmaTitulo');

            alunosContainer.innerHTML = `
            <div class="loading-spinner">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Carregando alunos...</p>
            </div>
            `;

            alunosSection.style.display = 'block';
            turmaTitulo.innerHTML = `<i class="fas fa-user-graduate"></i> Alunos da ${turmaNome}`;

            console.log('1 - entrou na função');

            const response = await fetch(`http://localhost:8080/alunos/serie/${turmaId}`);
            console.log('2 - fez fetch');

            const todosAlunos = await response.json();
            console.log('3 - recebeu JSON', todosAlunos);

            const alunos = todosAlunos; 

            if (alunos && alunos.length > 0) {
                alunosContainer.innerHTML = alunos.map(aluno => `
    <div class="aluno-card">
        <div class="aluno-avatar">
            ${aluno.nome ? aluno.nome[0] : '?'}
        </div>
        <div class="aluno-info">
            <h4>${aluno.nome}</h4>
        </div>
    </div>
`).join('');
            } else {
                alunosContainer.innerHTML = '<p class="empty-state">Nenhum aluno</p>';
            }
        } catch (error) {
            console.error('ERRO REAL:', error);
        }
    }


    async verDetalhesTurma(turmaId) {
        this.carregarAlunosDaTurma(turmaId, 'Turma');
    }

    async verDetalhesAluno(alunoId) {
        // Implementar detalhes do aluno
        console.log('Ver detalhes do aluno:', alunoId);
    }

    // ========== HELPER FUNCTIONS ==========
    getIconeTurma(serie) {
        const serieStr = String(serie || '');
        if (serieStr.includes('6') || serieStr.includes('7') || serieStr.includes('8')) {
            return 'fa-users';
        }
        return 'fa-user-graduate';
    }

    getIniciais(nome, sobrenome = '') {
        if (!nome) return '??';
        const primeira = nome.charAt(0);
        const segunda = sobrenome ? sobrenome.charAt(0) : (nome.split(' ')[1]?.charAt(0) || '');
        return (primeira + segunda).toUpperCase();
    }
}

// Inicialização
let professorDashboard;

document.addEventListener('DOMContentLoaded', () => {
    professorDashboard = new ProfessorDashboard();
    window.professorDashboard = professorDashboard;
});