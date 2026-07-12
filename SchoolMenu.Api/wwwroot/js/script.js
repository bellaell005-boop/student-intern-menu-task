document.addEventListener('DOMContentLoaded', () => {
    const body = document.body;
    const toggle = document.getElementById('themeToggle');
    const stored = localStorage.getItem('trapeza-theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (stored === 'dark' || (!stored && prefersDark)) {
        body.classList.add('dark');
        toggle.setAttribute('aria-pressed', 'true');
    }

    toggle.addEventListener('click', () => {
        const isDark = body.classList.toggle('dark');
        toggle.setAttribute('aria-pressed', String(isDark));
        localStorage.setItem('trapeza-theme', isDark ? 'dark' : 'light');
    });

    // Login buttons: clicking one lights it up in the neighbour's colour
    const swapButtons = document.querySelectorAll(".btn-link[data-swap]");

    swapButtons.forEach(btn => {

        btn.addEventListener("click", () => {

            swapButtons.forEach(other => {
                other.classList.remove("is-active");
            });

            btn.classList.add("is-active");

        });

    });

    const yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();
});