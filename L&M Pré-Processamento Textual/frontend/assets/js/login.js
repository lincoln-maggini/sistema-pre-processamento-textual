function App() {
    return {
        // campos
        loginEmail: "",
        loginSenha: "",
        registrarNome: "",
        registrarEmail: "",
        registrarTelefone: "",
        registrarSenha: "",
        registrarConfirmar: "",

        // mensagens de erro ou sucesso
        erroLogin: "",
        sucessoLogin: "",
        erroCadastro: "",
        sucessoCadastro: "",

        errors: {},
        valids: {},

        // validações
        validarNome() {
            const nome = this.registrarNome.trim();
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

        validarEmail(email, tipo = "email") {
            const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

            if (!regex.test(email.trim())) {
                if (tipo === "loginEmail") {
                    this.errors.loginEmail = "Digite um e-mail válido.";
                    this.valids.loginEmail = "";
                } else {
                    this.errors.email = "Digite um e-mail válido.";
                    this.valids.email = "";
                }
                return false;
            }

            if (tipo === "loginEmail") {
                this.errors.loginEmail = "";
                this.valids.loginEmail = "Correto.";
            } else {
                this.errors.email = "";
                this.valids.email = "Correto.";
            }

            return true;
        },

        validarTelefone() {
            const tel = this.registrarTelefone.replace(/\D/g, "");
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
            let tel = this.registrarTelefone.replace(/\D/g, ""); // remove tudo que não é número
            if (tel.length > 11) tel = tel.slice(0, 11); // limita a 11 dígitos

            if (tel.length > 10) { // formato celular (11 dígitos)
                this.registrarTelefone = tel.replace(/^(\d{2})(\d{5})(\d{4})$/, "($1) $2-$3");
            } else if (tel.length > 5) { // formato fixo (10 dígitos)
                this.registrarTelefone = tel.replace(/^(\d{2})(\d{4})(\d{0,4})$/, "($1) $2-$3");
            } else if (tel.length > 2) {
                this.registrarTelefone = tel.replace(/^(\d{2})(\d{0,5})$/, "($1) $2");
            } else {
                this.registrarTelefone = tel;
            }
        },

        validarSenha() {
            if (this.registrarSenha.length < 8) {
                this.errors.senha = "A senha deve ter pelo menos 8 caracteres.";
                this.valids.senha = "";
                return false;
            }
            this.errors.senha = "";
            this.valids.senha = "Correto.";
            return true;
        },

        confirmarSenha() {
            // se algum dos campos estiver vazio
            if (!this.registrarSenha || !this.registrarConfirmar) {
                this.errors.confirmarSenha = "Preencha ambos os campos de senha.";
                this.valids.confirmarSenha = "";
                return false;
            }

            // se as senhas não coincidirem
            if (this.registrarSenha !== this.registrarConfirmar) {
                this.errors.confirmarSenha = "As senhas não coincidem.";
                this.valids.confirmarSenha = "";
                return false;
            }

            // se passou em todas as verificações
            this.errors.confirmarSenha = "";
            this.valids.confirmarSenha = "Correto.";
            return true;
        },

        validarLoginSenha() {
            this.errors.loginSenha = "";
            this.valids.loginSenha = "";

            if (this.loginSenha.length > 0 && this.loginSenha.length < 8) {
                this.errors.loginSenha = "A senha deve conter no mínimo 8 caracteres.";
                this.valids.loginSenha = "";
            } else if (this.loginSenha.length >= 8) {
                this.valids.loginSenha = "Correto.";
            }
        },

        // login
        async login() {
            this.erroLogin = "";
            this.sucessoLogin = "";

            // validações de login
            if (!this.loginEmail || !this.loginSenha) {
                this.erroLogin = "Preencha todos os campos.";
                return;
            }

            if (!this.validarEmail(this.loginEmail, "loginEmail")) {
                this.erroLogin = "Digite um e-mail válido.";
                return;
            }

            if (this.loginSenha.length < 8) {
                this.erroLogin = "A senha deve conter no mínimo 8 caracteres.";
                return;
            }

            try {
                const resp = await fetch("http://localhost:5000/api/login", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        email: this.loginEmail,
                        senha: this.loginSenha
                    })
                });

                const data = await resp.json();
                console.log("Resposta do login:", resp.status, data);

                if (!resp.ok) {
                    this.erroLogin = data.erro || "Erro ao fazer login.";
                    console.error("Erro no login:", this.erroLogin);  // Log no console
                    return;  // Não redireciona se erro
                }

                // verificações dos status http
                if (resp.status === 404) {
                    this.erroLogin = "Usuário não encontrado.";
                    return;
                }

                if (resp.status === 401) {
                    this.erroLogin = "Senha incorreta.";
                    return;
                }

                if (resp.status === 400) {
                    this.erroLogin = data.erro || "Preencha todos os campos.";
                    return;
                }

                // login com sucesso
                this.sucessoLogin = "Login realizado com sucesso!";
                localStorage.setItem("token", data.token);
                console.log("Token salvo:", data.token);

                // redireciona
                window.location.href = "usuario.html";

            } catch (err) {
                this.erroLogin = "Erro de conexão com o servidor.";
                console.error("Exceção no login:", err);
            }
        },


        // cadastro
        async registrar() {
            this.erroCadastro = "";
            this.sucessoCadastro = "";

            // validações antes do envio
            const validacoes = [
                this.validarNome(),
                this.validarEmail(this.registrarEmail),
                this.validarTelefone(),
                this.validarSenha(),
                this.confirmarSenha()
            ];

            if (validacoes.includes(false)) {
                this.erroCadastro = "Por favor, corrija os erros antes de continuar.";
                return;
            }

            try {
                const resp = await fetch("http://localhost:5000/api/registrar", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        nome: this.registrarNome,
                        email: this.registrarEmail,
                        telefone: this.registrarTelefone,
                        senha: this.registrarSenha
                    })
                });

                const data = await resp.json();

                if (!resp.ok) {
                    this.erroCadastro = data.erro || "Erro ao cadastrar.";
                    return;
                }

                // após cadastro, faz login automaticamente
                const loginResp = await fetch("http://localhost:5000/api/login", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        email: this.registrarEmail,
                        senha: this.registrarSenha
                    })
                });

                const loginData = await loginResp.json();

                if (!loginResp.ok) {
                    this.erroCadastro = loginData.erro || "Erro ao fazer login após cadastro.";
                    return;
                }

                // salva token e redireciona
                localStorage.setItem("token", loginData.token);
                window.location.href = "usuario.html";

            } catch (err) {
                this.erroCadastro = "Erro de conexão com o servidor.";
            }
        }
    };
}

document.addEventListener("DOMContentLoaded", () => {
    PetiteVue.createApp({ app }).mount();
})


