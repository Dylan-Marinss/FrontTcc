
// professor-criar-atividade.js
document.addEventListener("DOMContentLoaded", function () {
    console.log('👨‍🏫 Página do Professor - Criar Atividade carregada');

    // Elementos do DOM
    const selectTipo = document.getElementById('tipoAtividade');
    const selectTurma = document.getElementById('turma');
    const selectDisciplina = document.getElementById('disciplina');
    const btnSalvar = document.getElementById('btnSalvarAtividade');

    // Estado das questões
    let contadorQuestoes = 0;
    let questoes = [];

    // =============================================
    // PREENCHER DATA DE CRIAÇÃO AUTOMATICAMENTE
    // =============================================
    

    function adicionarQuestao() {
        const tipoQuestao = document.getElementById('tipoQuestao').value;

        if (!tipoQuestao) {
            alert('Selecione o tipo de questão primeiro!');
            return;
        }

        contadorQuestoes++;
        const questaoId = `questao_${contadorQuestoes}`;

        const questaoDiv = document.createElement('div');
        questaoDiv.className = 'questao-card';
        questaoDiv.id = questaoId;
        questaoDiv.dataset.tipo = tipoQuestao;

        let htmlQuestao = `
            <div class="questao-header">
                <span class="questao-titulo">Questão ${contadorQuestoes}</span>
                <button type="button" class="btn-remover-questao" onclick="removerQuestao('${questaoId}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
            <textarea class="questao-enunciado" placeholder="Digite o enunciado da questão..." rows="3" required></textarea>
        `;

        if (tipoQuestao === 'alternativa') {
            htmlQuestao += `
                <div class="alternativas-container" id="${questaoId}_alternativas">
                    <div class="alternativa-item">
                        <input type="radio" name="${questaoId}_correta" value="0" required>
                        <input type="text" placeholder="Alternativa A" class="alternativa-texto" required>
                    </div>
                    <div class="alternativa-item">
                        <input type="radio" name="${questaoId}_correta" value="1" required>
                        <input type="text" placeholder="Alternativa B" class="alternativa-texto" required>
                    </div>
                    <div class="alternativa-item">
                        <input type="radio" name="${questaoId}_correta" value="2" required>
                        <input type="text" placeholder="Alternativa C" class="alternativa-texto" required>
                    </div>
                    <button type="button" class="btn-adicionar-alternativa" onclick="adicionarAlternativa('${questaoId}')">
                        <i class="fas fa-plus"></i> Adicionar Alternativa
                    </button>
                </div>
            `;
        } else if (tipoQuestao === 'assertiva') {
            htmlQuestao += `
                <div class="assertiva-container">
                    <label class="assertiva-option">
                        <input type="radio" name="${questaoId}_assertiva" value="true" required> Verdadeiro
                    </label>
                    <label class="assertiva-option">
                        <input type="radio" name="${questaoId}_assertiva" value="false" required> Falso
                    </label>
                </div>
            `;
        }

        questaoDiv.innerHTML = htmlQuestao;
        listaQuestoes.appendChild(questaoDiv);

        questoes.push({
            id: questaoId,
            tipo: tipoQuestao
        });
    }

    // Funções globais
    window.removerQuestao = function (questaoId) {
        const questao = document.getElementById(questaoId);
        if (questao) {
            questao.remove();
            questoes = questoes.filter(q => q.id !== questaoId);
            renumerarQuestoes();
        }
    };

    window.adicionarAlternativa = function (questaoId) {
        const container = document.getElementById(`${questaoId}_alternativas`);
        const alternativaCount = container.querySelectorAll('.alternativa-item').length;
        const letra = String.fromCharCode(65 + alternativaCount);

        const novaAlternativa = document.createElement('div');
        novaAlternativa.className = 'alternativa-item';
        novaAlternativa.innerHTML = `
            <input type="radio" name="${questaoId}_correta" value="${alternativaCount}" required>
            <input type="text" placeholder="Alternativa ${letra}" class="alternativa-texto" required>
        `;

        container.insertBefore(novaAlternativa, container.querySelector('.btn-adicionar-alternativa'));
    };

    function renumerarQuestoes() {
        const questoesCards = document.querySelectorAll('.questao-card');
        questoesCards.forEach((card, index) => {
            const titulo = card.querySelector('.questao-titulo');
            if (titulo) titulo.textContent = `Questão ${index + 1}`;
        });
    }

    // =============================================
    // VALIDAÇÃO E SALVAMENTO (Adaptado para backend)
    // =============================================
    btnSalvar.addEventListener('click', async function () {
        // Validações básicas
        if (!selectTipo.value) {
            alert('Selecione o tipo de atividade!');
            return;
        }

        if (!selectTurma.value) {
            alert('Selecione a turma!');
            return;
        }

        if (!selectDisciplina.value) {
            alert('Selecione a disciplina!');
            return;
        }

        // Mostrar loading
        btnSalvar.disabled = true;
        btnSalvar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';

        // Construir objeto da atividade
        const atividade = {
            id: Date.now(),
            tipo: selectTipo.value,
            turma: selectTurma.value,
            disciplina: selectDisciplina.value,
            dataCriacao: dataCriacao.value,
            status: 'ativa',
            criadoPor: 'Professor', // Seria substituído pelo ID do professor no backend
            createdAt: new Date().toISOString()
        };

        // Adicionar campos específicos conforme o tipo
        try {
            switch (selectTipo.value) {
                case 'redacao':
                    atividade.titulo = document.getElementById('tituloRedacao').value;
                    atividade.tema = document.getElementById('temaRedacao').value;
                    atividade.textoApoio = document.getElementById('textoApoio').value;
                    atividade.instrucoes = document.getElementById('instrucoes').value;
                    atividade.dataEntrega = document.getElementById('dataEntregaRedacao').value;
                    atividade.notaMaxima = document.getElementById('notaMaximaRedacao').value;

                    if (!atividade.titulo || !atividade.tema || !atividade.textoApoio) {
                        throw new Error('Preencha todos os campos obrigatórios da redação!');
                    }
                    break;

                case 'questao':
                    atividade.tipoQuestao = document.getElementById('tipoQuestao').value;
                    atividade.dificuldade = document.getElementById('dificuldadeQuestao').value;
                    atividade.questoes = coletarQuestoes();

                    if (!atividade.tipoQuestao || atividade.questoes.length === 0) {
                        throw new Error('Adicione pelo menos uma questão válida!');
                    }
                    break;

                case 'videoaula':
                    atividade.titulo = document.getElementById('tituloVideoaula').value;
                    atividade.descricao = document.getElementById('descricaoVideoaula').value;
                    atividade.urlVideo = document.getElementById('urlVideo').value;
                    atividade.duracao = document.getElementById('duracaoVideo').value;
                    atividade.materiais = document.getElementById('materiaisComplementares').value;
                    atividade.topicos = document.getElementById('topicosAula').value;

                    if (!atividade.titulo || !atividade.descricao || !atividade.urlVideo) {
                        throw new Error('Preencha todos os campos obrigatórios da videoaula!');
                    }
                    break;

                case 'simulado':
                    atividade.titulo = document.getElementById('tituloSimulado').value;
                    atividade.quantidadeQuestoes = document.getElementById('quantidadeQuestoes').value;
                    atividade.tempoTotal = document.getElementById('tempoTotal').value;
                    atividade.notaMinima = document.getElementById('notaMinima').value;
                    atividade.materias = Array.from(document.getElementById('materiasSimulado').selectedOptions).map(opt => opt.value);
                    atividade.instrucoes = document.getElementById('instrucoesSimulado').value;
                    atividade.mostrarGabarito = document.getElementById('mostrarGabarito').checked;
                    atividade.permitirTentativas = document.getElementById('permitirTentativas').checked;

                    if (!atividade.titulo || atividade.materias.length === 0) {
                        throw new Error('Preencha todos os campos obrigatórios do simulado!');
                    }
                    break;
            }

            // Salvar no localStorage (temporário - será substituído pelo backend)
            salvarLocalmente(atividade);

            // Simular envio para backend
            // const response = await fetch('/api/atividades', {
            //     method: 'POST',
            //     headers: { 'Content-Type': 'application/json' },
            //     body: JSON.stringify(atividade)
            // });

            // if (!response.ok) throw new Error('Erro ao salvar no servidor');

            alert('✅ Atividade criada com sucesso!');
            window.location.href = 'professor-atividades.html';

        } catch (error) {
            alert('❌ ' + error.message);
            btnSalvar.disabled = false;
            btnSalvar.innerHTML = '<i class="fas fa-save"></i> Publicar Atividade';
        }
    });

    function coletarQuestoes() {
        const questoesArray = [];

        document.querySelectorAll('.questao-card').forEach(card => {
            const questao = {
                enunciado: card.querySelector('.questao-enunciado').value,
                tipo: card.dataset.tipo
            };

            if (questao.tipo === 'alternativa') {
                questao.alternativas = [];
                card.querySelectorAll('.alternativa-item').forEach((item, index) => {
                    questao.alternativas.push({
                        texto: item.querySelector('.alternativa-texto').value,
                        correta: item.querySelector('input[type="radio"]').checked
                    });
                });
            } else if (questao.tipo === 'assertiva') {
                const radio = card.querySelector('input[type="radio"]:checked');
                questao.correta = radio ? radio.value === 'true' : false;
            }

            questoesArray.push(questao);
        });

        return questoesArray;
    }

    function salvarLocalmente(atividade) {
        let atividades = JSON.parse(localStorage.getItem('atividades_professor')) || [];
        atividades.push(atividade);
        localStorage.setItem('atividades_professor', JSON.stringify(atividades));
    }

    const selectSerie = document.getElementById("serie");

    async function carregarTurmas() {
        try {
            const response = await fetch("http://localhost:8080/series");
            const series = await response.json();

            selectSerie.innerHTML = '<option value="">Selecione a turma</option>';

            series.forEach(serie => {
                const option = document.createElement("option");
                option.value = serie.id;
                option.textContent = serie.nomeSerie;
                selectSerie.appendChild(option);
            });

        } catch (error) {
            console.error("Erro ao carregar turmas:", error);
        }
    }
        carregarTurmas(); // chama direto, sem outro DOMContentLoaded
});