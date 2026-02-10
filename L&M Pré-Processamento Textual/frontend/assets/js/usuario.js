function UsuarioApp() {
    return {
        nomeUsuario: "",
        nome: "",
        email: "",
        telefone: "",
        dataCriacao: "",
        erro: "",

        // validações
        errors: {},
        valids: {},

        async mounted() {
            const token = localStorage.getItem("token");
            if (!token) {
                window.location.href = "login.html";
                return;
            }

            try {
                const resp = await fetch("http://localhost:5000/api/usuario", {
                    headers: { "Authorization": "Bearer " + token }
                });

                const data = await resp.json();

                if (!resp.ok) {
                    mostrarPopup("Aviso", data.erro || "Sessão expirada. Faça login novamente.", "erro");
                    localStorage.removeItem("token");
                    window.location.href = "login.html";
                    return;
                }

                this.nome = data.nome;
                this.email = data.email;
                this.telefone = data.telefone;
                this.dataCriacao = data.dataCriacao;
                this.nomeUsuario = data.nome.split(" ")[0];

            } catch {
                mostrarPopup("Erro", "Erro ao carregar dados do usuário.", "erro");
            }
        },

        logout() {
            localStorage.removeItem("token");
            window.location.href = "login.html";
        },

        // validações
        validarNome() {
            const nome = document.getElementById("inputNome").value.trim();
            const partes = nome.split(" ").filter(p => p.length > 0);
            if (partes.length < 2) {
                this.errors.nome = "Digite seu nome completo.";
                this.valids.nome = "";
                return false;
            }
            this.errors.nome = "";
            this.valids.nome = "Correto.";
            return true;
        },

        validarEmail() {
            const email = document.getElementById("inputEmail").value.trim();
            const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!regex.test(email)) {
                this.errors.email = "Digite um e-mail válido.";
                this.valids.email = "";
                return false;
            }
            this.errors.email = "";
            this.valids.email = "Correto.";
            return true;
        },

        validarTelefone() {
            const tel = document.getElementById("inputTelefone").value.replace(/\D/g, "");
            if (tel.length < 10 || tel.length > 11) {
                this.errors.telefone = "Digite um telefone válido (10 ou 11 dígitos).";
                this.valids.telefone = "";
                return false;
            }
            this.errors.telefone = "";
            this.valids.telefone = "Correto.";
            return true;
        },

        mascararTelefone() {
            const input = document.getElementById("inputTelefone");
            let tel = input.value.replace(/\D/g, "");
            if (tel.length > 11) tel = tel.slice(0, 11);
            if (tel.length > 10) {
                input.value = tel.replace(/^(\d{2})(\d{5})(\d{4})$/, "($1) $2-$3");
            } else if (tel.length > 5) {
                input.value = tel.replace(/^(\d{2})(\d{4})(\d{0,4})$/, "($1) $2-$3");
            } else if (tel.length > 2) {
                input.value = tel.replace(/^(\d{2})(\d{0,5})$/, "($1) $2");
            } else {
                input.value = tel;
            }
        },

        validarSenha() {
            const senha = document.getElementById("inputSenha").value;
            if (senha && senha.length < 8) {
                this.errors.senha = "A senha deve ter pelo menos 8 caracteres.";
                this.valids.senha = "";
                return false;
            }
            this.errors.senha = "";
            this.valids.senha = senha ? "Correto." : "";
            return true;
        },

        // atualizações
        async atualizarPerfil() {
            if (!this.validarNome() || !this.validarEmail() || !this.validarTelefone() || !this.validarSenha()) {
                mostrarPopup("Aviso", "Corrija os erros antes de salvar.", "erro");
                return;
            }

            const token = localStorage.getItem("token");
            if (!token) return;

            const nome = document.getElementById("inputNome").value;
            const email = document.getElementById("inputEmail").value;
            const telefone = document.getElementById("inputTelefone").value;
            const senha = document.getElementById("inputSenha").value;

            const payload = { nome, email, telefone };
            if (senha) payload.senha = senha;

            try {
                const resp = await fetch("http://localhost:5000/api/usuario", {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": "Bearer " + token
                    },
                    body: JSON.stringify(payload)
                });

                const data = await resp.json();

                if (!resp.ok) {
                    mostrarPopup("Erro", data.erro || "Erro ao atualizar perfil.", "erro");
                    return;
                }
                if (data.token) {
                    localStorage.setItem("token", data.token);
                }

                const modalEl = document.getElementById("editarModal");
                const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
                modal.hide();

                mostrarPopup("Sucesso", "Perfil atualizado com sucesso!", "sucesso");

                setTimeout(() => location.reload(), 1200);

            } catch {
                mostrarPopup("Erro", "Erro na conexão com o servidor.", "erro");
            }
        }
    };
}

function mostrarPopup(titulo, mensagem, tipo = "info") {
    const modalEl = document.getElementById("popupMensagem");
    const modalContent = modalEl.querySelector(".modal-content");

    document.getElementById("popupTitulo").textContent = titulo;
    document.getElementById("popupMensagemTexto").textContent = mensagem;

    modalContent.classList.remove("popup-success", "popup-error");
    if (tipo === "sucesso") modalContent.classList.add("popup-success");
    else if (tipo === "erro") modalContent.classList.add("popup-error");

    const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
    modal.show();

    modalEl.addEventListener("hidden.bs.modal", () => {
        document.querySelectorAll(".modal-backdrop").forEach(b => b.remove());
        document.body.classList.remove("modal-open");
        document.body.style.overflow = "";
        document.body.style.paddingRight = "";
    }, { once: true });
}

document.addEventListener("DOMContentLoaded", () => {
    PetiteVue.createApp({ app }).mount();
})
