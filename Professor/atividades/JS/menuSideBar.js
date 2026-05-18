document.addEventListener('DOMContentLoaded', () => {
    const sidebar    = document.querySelector('.sidebar');
    const menuToggle = document.getElementById('menu-toggle');

    // ── Colapsar / expandir sidebar ──────────────────────────
    if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', () => {
            if (window.innerWidth <= 768) {
                sidebar.classList.toggle('active');
            } else {
                sidebar.classList.toggle('collapsed');
                // Adiciona classe no body pra mover o main-content
                // (necessário porque a sidebar é position: fixed)
                document.body.classList.toggle('sidebar-collapsed');
            }
        });
    }

    // ── Fechar sidebar ao clicar fora (mobile) ───────────────
    document.addEventListener('click', (e) => {
        if (
            window.innerWidth <= 768 &&
            sidebar &&
            sidebar.classList.contains('active') &&
            !sidebar.contains(e.target)
        ) {
            sidebar.classList.remove('active');
        }
    });

    // ── Marcar item ativo pela URL atual ─────────────────────
    const currentPage = window.location.pathname.split('/').pop();

    document.querySelectorAll('.sidebar-nav .nav-item').forEach(item => {
        item.classList.remove('active');
        const href = (item.getAttribute('href') || '').split('/').pop();
        if (href && href === currentPage) {
            item.classList.add('active');
        }
    });
});