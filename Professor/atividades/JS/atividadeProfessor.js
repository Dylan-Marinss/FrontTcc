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

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const series = await response.json();

            console.log("Turmas:", series);

            selectSerie.innerHTML =
                '<option value="">Selecione a turma</option>';

            series.forEach(serie => {

                const option = document.createElement("option");

                option.value = serie.idSerie || serie.id;
                option.textContent = serie.nomeSerie;

                selectSerie.appendChild(option);
            });

        } catch (error) {

            console.error("Erro ao carregar turmas:", error);

            selectSerie.innerHTML =
                '<option value="">Erro ao carregar turmas</option>';
        }
    }

    // =========================================
    // CARREGAR DIFICULDADES
    // =========================================

    async function carregarDificuldades() {

        try {

            const response = await fetch("http://localhost:8080/niveldificuldade");

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const dificuldades = await response.json();

            console.log("Dificuldades:", dificuldades);

            selectDificuldade.innerHTML =
                '<option value="">Selecione a dificuldade</option>';

            dificuldades.forEach(dificuldade => {

                const option = document.createElement("option");

                option.value = dificuldade.idNivelDificuldade;
                option.textContent = dificuldade.nome;

                selectDificuldade.appendChild(option);
            });

        } catch (error) {

            console.error("Erro ao carregar dificuldades:", error);

            selectDificuldade.innerHTML =
                '<option value="">Erro ao carregar dificuldades</option>';
        }
    }

    // =========================================
    // CARREGAR DISCIPLINAS
    // =========================================

    async function carregarDisciplinas() {

        try {

            const response = await fetch("http://localhost:8080/disciplinas");

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const disciplinas = await response.json();

            console.log("Disciplinas:", disciplinas);

            selectDisciplina.innerHTML =
                '<option value="">Selecione a disciplina</option>';

            disciplinas.forEach(disciplina => {

                const option = document.createElement("option");

                option.value = disciplina.idDisciplina || disciplina.id;
                option.textContent = disciplina.nome;

                selectDisciplina.appendChild(option);
            });

        } catch (error) {

            console.error("Erro ao carregar disciplinas:", error);

            selectDisciplina.innerHTML =
                '<option value="">Erro ao carregar disciplinas</option>';
        }
    }

    // =========================================
    // INICIAR
    // =========================================

    carregarTurmas();
    carregarDificuldades();
    carregarDisciplinas();

});