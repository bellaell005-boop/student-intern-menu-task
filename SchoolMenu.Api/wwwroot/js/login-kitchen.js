document.addEventListener("DOMContentLoaded", () => {

    /* =====================================================
       THEME
    ===================================================== */

    const body = document.body;
    const toggle = document.getElementById("themeToggle");

    const stored = localStorage.getItem("trapeza-theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

    if (stored === "dark" || (!stored && prefersDark)) {
        body.classList.add("dark");
        toggle.setAttribute("aria-pressed", "true");
    }

    if (toggle) {

        toggle.addEventListener("click", () => {

            const dark = body.classList.toggle("dark");

            toggle.setAttribute("aria-pressed", dark);

            localStorage.setItem(
                "trapeza-theme",
                dark ? "dark" : "light"
            );

        });

    }

    /* =====================================================
       ACTIVE BUTTON
    ===================================================== */

    document.querySelectorAll(".btn-link[data-swap]").forEach(btn => {

        btn.addEventListener("click", () => {

            document.querySelectorAll(".btn-link")
                .forEach(b => b.classList.remove("is-active"));

            btn.classList.add("is-active");

        });

    });

    /* =====================================================
       FOOTER YEAR
    ===================================================== */

    const year = document.getElementById("year");

    if (year) {

        year.textContent = new Date().getFullYear();

    }

    /* =====================================================
       LOGIN
    ===================================================== */

    const loginForm = document.getElementById("loginForm");

    if (!loginForm)
        return;

    loginForm.addEventListener("submit", async function (e) {

        e.preventDefault();

        const email = document
            .getElementById("loginEmail")
            .value
            .trim();

        const password = document
            .getElementById("loginPassword")
            .value;

        try {

            const user = await login(email, password);

            if (user.role !== "Kitchen") {

                alert("Нямате достъп до кухнята.");

                await logout();

                return;

            }
            //да сменя после ако не работи на admin.html
            window.location.href = "kitchen.html";

        }

        catch (err) {

            alert(err.message);

        }

    });

});