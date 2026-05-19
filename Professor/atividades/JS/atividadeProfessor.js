document.addEventListener("DOMContentLoaded", function () {

    console.log("👨‍🏫 Página Atividade carregada");

    const selectSerie = document.getElementById("serie");
    const selectDificuldade = document.getElementById("dificuldadeQuestao");
    const selectDisciplina = document.getElementById("disciplina");

    // =========================================
    // CARREGAR TURMAS
    // =========================================

    async function carregarTurmas() {
        try {
            const response = await fetch("http://localhost:8080/series");
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const series = await response.json();
            console.log("Turmas:", series);
            selectSerie.innerHTML = '<option value="">Selecione a turma</option>';
            series.forEach(serie => {
                const option = document.createElement("option");
                option.value = serie.idSerie || serie.id;
                option.textContent = serie.nomeSerie;
                selectSerie.appendChild(option);
            });
        } catch (error) {
            console.error("Erro ao carregar turmas:", error);
            selectSerie.innerHTML = '<option value="">Erro ao carregar turmas</option>';
        }
    }

    // =========================================
    // CARREGAR DIFICULDADES
    // =========================================

    async function carregarDificuldades() {
        try {
            const response = await fetch("http://localhost:8080/niveldificuldade");
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const dificuldades = await response.json();
            console.log("Dificuldades:", dificuldades);
            selectDificuldade.innerHTML = '<option value="">Selecione a dificuldade</option>';
            dificuldades.forEach(dificuldade => {
                const option = document.createElement("option");
                option.value = dificuldade.idNivelDificuldade;
                option.textContent = dificuldade.nome;
                selectDificuldade.appendChild(option);
            });
        } catch (error) {
            console.error("Erro ao carregar dificuldades:", error);
            selectDificuldade.innerHTML = '<option value="">Erro ao carregar dificuldades</option>';
        }
    }

    // =========================================
    // CARREGAR DISCIPLINAS
    // =========================================

    async function carregarDisciplinas() {
        try {
            const response = await fetch("http://localhost:8080/disciplinas");
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const disciplinas = await response.json();
            console.log("Disciplinas:", disciplinas);
            selectDisciplina.innerHTML = '<option value="">Selecione a disciplina</option>';
            disciplinas.forEach(disciplina => {
                const option = document.createElement("option");
                option.value = disciplina.idDisciplina || disciplina.id;
                option.textContent = disciplina.nome;
                selectDisciplina.appendChild(option);
            });
        } catch (error) {
            console.error("Erro ao carregar disciplinas:", error);
            selectDisciplina.innerHTML = '<option value="">Erro ao carregar disciplinas</option>';
        }
    }

    // =========================================
    // DROPDOWN CUSTOMIZADO
    // =========================================
    function criarDropdownCustom(selectEl) {
        const wrapper = document.createElement('div');
        wrapper.className = 'custom-select-wrapper';

        const selected = document.createElement('div');
        selected.className = 'custom-select-selected';
        selected.innerHTML = `<span>${selectEl.options[0]?.text || 'Selecione...'}</span><i class="fas fa-chevron-down"></i>`;

        const list = document.createElement('div');
        list.className = 'custom-select-list';

        wrapper.appendChild(selected);
        wrapper.appendChild(list);

        // Esconde o select original mas mantém no DOM
        selectEl.style.display = 'none';
        selectEl.parentNode.insertBefore(wrapper, selectEl);
        wrapper.appendChild(selectEl);

        // Abre/fecha
        selected.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = wrapper.classList.contains('open');
            fecharTodosDropdowns();
            if (!isOpen) {
                wrapper.classList.add('open');
                renderOpcoes();
            }
        });

        function renderOpcoes() {
            list.innerHTML = '';
            Array.from(selectEl.options).forEach((opt, i) => {
                const item = document.createElement('div');
                item.className = 'custom-select-item';
                if (opt.value === selectEl.value) item.classList.add('active');
                item.textContent = opt.text;
                item.dataset.value = opt.value;

                item.addEventListener('click', () => {
                    selectEl.value = opt.value;
                    selected.innerHTML = `<span>${opt.text}</span><i class="fas fa-chevron-down"></i>`;
                    wrapper.classList.remove('open');
                    // Dispara change para qualquer listener existente
                    selectEl.dispatchEvent(new Event('change'));
                });

                list.appendChild(item);
            });
        }

        // Atualiza o dropdown quando o select é populado via fetch
        const observer = new MutationObserver(() => {
            const firstOpt = selectEl.options[0];
            if (firstOpt) {
                selected.innerHTML = `<span>${firstOpt.text}</span><i class="fas fa-chevron-down"></i>`;
            }
        });
        observer.observe(selectEl, { childList: true });

        return wrapper;
    }

    function fecharTodosDropdowns() {
        document.querySelectorAll('.custom-select-wrapper.open')
            .forEach(w => w.classList.remove('open'));
    }

    // Fecha ao clicar fora
    document.addEventListener('click', fecharTodosDropdowns);

    // =========================================
    // INICIAR
    // =========================================

    carregarTurmas();
    carregarDificuldades();
    carregarDisciplinas();
    criarDropdownCustom(selectSerie);
    criarDropdownCustom(selectDificuldade);
    criarDropdownCustom(selectDisciplina);

    // =========================================
    // BOTÃO CRIAR ATIVIDADE
    // =========================================

    document.getElementById("btnSalvarAtividade").addEventListener("click", function () {
        const idSerie = selectSerie.value;
        const idDificuldade = selectDificuldade.value;
        const idDisciplina = document.getElementById("disciplina").value;

        if (!idSerie) { alert("Selecione a turma."); return; }
        if (!idDificuldade) { alert("Selecione a dificuldade."); return; }
        if (!idDisciplina) { alert("Selecione a disciplina."); return; }

        localStorage.setItem("idSerie", idSerie);
        localStorage.setItem("idDificuldade", idDificuldade);
        localStorage.setItem("idDisciplina", idDisciplina);

        window.location.href = "atividadeCriar.html";
    });

    // =========================================
    // BOTÃO MINHAS ATIVIDADES
    // =========================================

    document.getElementById("btnConsultarAtividade").addEventListener("click", function () {
        window.location.href = "minhasAtividades.html";
    });

});