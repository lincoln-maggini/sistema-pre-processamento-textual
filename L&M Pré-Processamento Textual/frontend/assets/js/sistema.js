// funcao para realizar a decodificacao do token

function parseJwt(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (e) {
        console.error("Erro ao parsear JWT:", e);
        return null;
    }
}

// js de tudo

const app = {
    texto: "",
    modalSalvarAberto: false,
    nomeProcesso: "",

    resultadosEtapas: [],
    ultimosProcessos: [],

    etapas: [
        { id: "numeros", nome: "Remover Números" },
        { id: "caracteres", nome: "Remover Caracteres Especiais" },
        { id: "acentos", nome: "Remover Acentos" },
        { id: "minusculas", nome: "Converter para Minúsculas" },
        { id: "stopwords", nome: "Remover Stopwords" },
        { id: "stemming", nome: "Aplicar Stemming" },
        { id: "ranking", nome: "Ranking de palavras e gráficos" },
    ],

    ordemExecucao: [],
    statsEtapaAtual: null,
    statsResultados: null,

    isLoggedIn: false,
    usuarioId: null,
    usuarioNome: "",
    token: null,

    // barra de pesquisa
    searchQuery: '',

    // renomear processo
    selectedProcessoId: null,
    novoNomeProcesso: "",

    processoAtualId: null,
    processoAtualNome: "",

    // salva o draft no localStorage
    saveDraft() {
        try {
            const draft = {
                texto: this.texto,
                ordemExecucao: this.ordemExecucao,
                resultadosEtapas: this.resultadosEtapas
            };
            localStorage.setItem('draftProcess', JSON.stringify(draft));
        } catch (err) {
            console.warn('Erro ao salvar draft:', err);
        }
    },

    // restaura o draft do localStorage
    restoreDraft() {
        try {
            const draftJson = localStorage.getItem('draftProcess');
            if (draftJson) {
                const draft = JSON.parse(draftJson);
                this.texto = draft.texto || '';
                this.ordemExecucao = draft.ordemExecucao || [];
                this.resultadosEtapas = draft.resultadosEtapas || [];
            }
        } catch (err) {
            console.warn('Erro ao restaurar draft:', err);
        }
    },

    renderGraficos() {
        setTimeout(() => {
            this.resultadosEtapas.forEach((res, index) => {
                const container = document.querySelector(`#resultado-${index}`);
                if (!container) return;

                this.limparGraficos(container);  // limpa antes de recriar

                if (res.etapa === 'Ranking de palavras' && res.dados_grafico && res.tipo_grafico) {
                    const palavras = res.dados_grafico.map(item => item[0]);
                    const contagens = res.dados_grafico.map(item => item[1]);
                    const tipoGrafico = res.tipo_grafico;

                    const conteudoRolavel = container.querySelector('.conteudo-rolavel');
                    if (tipoGrafico === "nuvem") {
                        this.criarNuvemDePalavrasD3(conteudoRolavel, palavras, contagens);
                    } else {
                        const newCanvas = document.createElement('canvas');
                        newCanvas.id = `grafico-${index}`;
                        conteudoRolavel.appendChild(newCanvas);
                        this.criarGrafico(newCanvas, palavras, contagens, tipoGrafico);
                    }
                }
            });
        }, 0);
    },

    // funcao para realizar em si a decodificacao e sinalizar que a sessao foi bem sucedida

    initAuth() {
        this.token = localStorage.getItem("token");
        console.log("Token carregado do storage:", this.token);
        if (this.token) {
            const decoded = parseJwt(this.token);
            console.log("Decoded payload:", decoded);
            if (decoded && decoded.usuario_id) {
                if (decoded.tempo && Date.now() / 1000 < decoded.tempo) {
                    this.usuarioId = decoded.usuario_id;
                    this.usuarioNome = decoded.usuario_nome || "Usuário";
                    this.isLoggedIn = true;
                    console.log("Sessão válida - isLoggedIn setado para true");
                } else {
                    console.log("Token expirado - fazendo logout");
                    this.logout();
                }
            } else {
                console.error("Token inválido ou sem user_id - fazendo logout");
                this.logout();
            }
        } else {
            console.log("Nenhum token no storage - usuário não logado");
            this.isLoggedIn = false;
        }

        if (!this.processoAtualId) {
            this.restoreDraft();
        }
    },

    // funcao para sair da sessao

    logout() {
        localStorage.clear();
        this.token = null;
        this.isLoggedIn = false;
        this.ultimosProcessos = [];

        localStorage.removeItem('draftProcess');

        mostrarPopup("Sucesso", "Você saiu da conta.", "sucesso");

        const modalEl = document.getElementById("popupMensagem");
        const modalInstance = bootstrap.Modal.getInstance(modalEl);

        if (modalInstance) {
            modalEl.addEventListener('hidden.bs.modal', function handler() {
                window.location.href = "sistema.html";
                modalEl.removeEventListener('hidden.bs.modal', handler);
            });
        }
    },

    limparGraficos(container) {
        if (!container) return;
        container.querySelectorAll('canvas, svg.nuvem-palavras').forEach(el => el.remove());
    },

    // funcao para carregar processos do menu lateral

    async carregarProcesso(processo_id) {
        try {
            localStorage.removeItem('draftProcess');

            const response = await fetch(`http://localhost:5000/api/carregar-processo?id=${processo_id}`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });
            const data = await response.json();
            if (!data.success) {
                throw new Error(data.error || 'Erro ao carregar processo');
            }
            const proc = data.processo;
            this.processoAtualNome = proc.nome;
            this.processoAtualId = proc.id;
            // limpar estados atuais
            this.ordemExecucao = [];
            this.resultadosEtapas = [];
            this.texto = proc.texto_original;
            // reconstruir ordemExecucao e resultadosEtapas
            proc.etapas.forEach(e => {
                let etapaNome = e.etapa_nome;
                if (etapaNome === "Ranking de palavras") {
                    etapaNome = "Ranking de palavras e gráficos";
                }
                const etapaBase = this.etapas.find(et => et.nome === etapaNome);
                if (etapaBase) {
                    let etapaExec = { ...etapaBase };
                    if (etapaBase.id === 'ranking') {
                        etapaExec.limite = e.dados_grafico ? e.dados_grafico.length : 10;
                        etapaExec.grafico = e.tipo_grafico || '';
                    }

                    if (etapaNome !== "Texto Original" && etapaNome !== "Texto Processado por Completo") {
                        this.ordemExecucao.push(etapaExec);
                    }

                    this.resultadosEtapas.push({
                        etapa: e.etapa_nome,
                        texto: e.resultado_texto,
                        dados_grafico: e.dados_grafico,
                        tipo_grafico: e.tipo_grafico
                    });
                } else {
                    if (etapaNome === "Texto Original" || etapaNome === "Texto Processado por Completo") {
                        this.resultadosEtapas.push({
                            etapa: e.etapa_nome,
                            texto: e.resultado_texto,
                            dados_grafico: e.dados_grafico,
                            tipo_grafico: e.tipo_grafico
                        });
                        console.warn(`Etapa extra "${etapaNome}" carregada apenas nos resultados (sem card na ordem).`);
                    } else {
                        console.warn(`Etapa não encontrada: "${e.etapa_nome}"`);
                    }
                }
            });

            let rankingIndex = 0;
            this.resultadosEtapas.forEach(res => {
                if (res.etapa === 'Ranking de palavras') {
                    const etapaConfig = this.ordemExecucao.find((e, i) => e.id === 'ranking' && i === rankingIndex);
                    if (etapaConfig) {
                        res.tipo_grafico = etapaConfig.grafico || '';
                    }
                    rankingIndex++;
                }
            });

            // fechar o menu lateral
            const offcanvas = bootstrap.Offcanvas.getInstance(document.getElementById('offcanvasMenu'));
            if (offcanvas) offcanvas.hide();
            this.renderGraficos();
        } catch (err) {
            console.error(err);
            mostrarPopup("Erro", "Falha ao carregar o processo: " + err.message, "erro");
        }
    },

    // upload do texto

    triggerFileInput() {
        this.$refs.fileInput.click();
    },

    handleDrop(event) {
        event.preventDefault();
        const files = Array.from(event.dataTransfer.files);
        this.processFiles(files);
    },

    handleFileChange(event) {
        const files = Array.from(event.target.files);
        this.processFiles(files);
    },

    // evita que o navegador abra o arquivo ao arrastar sobre a página
    handleDragOver(event) {
        event.preventDefault();
    },

    processFiles(files) {
        const txtFiles = files.filter(f => f.type === 'text/plain');
        if (txtFiles.length === 0) {
            mostrarPopup("Aviso", "Apenas arquivos .txt são permitidos.", "aviso");
            return;
        }

        // lê todos os arquivos simultaneamente
        Promise.all(txtFiles.map(file => {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = e => {
                    // remove espaços extras no início/fim de cada arquivo
                    const text = e.target.result.trim();
                    resolve(text);
                };
                reader.onerror = () => reject(`Erro ao ler o arquivo: ${file.name}`);
                reader.readAsText(file);
            });
        }))
            .then(contents => {
                // junta todos os textos ao texto já existente, com 1 espaço entre eles
                const novoTexto = contents.join(' ');
                if (this.texto && this.texto.trim() !== "") {
                    this.texto += ' ' + novoTexto;  // concatena ao texto existente
                } else {
                    this.texto = novoTexto;
                }

                this.saveDraft();
            })
            .catch(err => {
                console.error(err);
                mostrarPopup("Erro", "Falha ao processar os arquivos.", "erro");
            });
    },

    // fim do upload texto

    adicionarEtapa(etapa) {
        // cada ranking já começa com configs padrão
        if (etapa.id === "ranking") {
            this.ordemExecucao.push({ ...etapa, limite: 10, grafico: "" });
        } else {
            this.ordemExecucao.push({ ...etapa });
        }

        this.saveDraft();
    },

    removerEtapa(index) {
        this.ordemExecucao.splice(index, 1);

        this.saveDraft();
    },

    // funcao para usar exemplo para o botao funcionar

    usarExemplo() {
        this.texto = '1 - O Pré-processamento textual é uma etapa crucial em qualquer projeto de Mineração de Textos (Text Mining) ou Processamento de Linguagem Natural (PLN). Ele transforma dados de texto brutos, que são frequentemente caóticos e cheios de ruídos, em um formato limpo e estruturado que os algoritmos de aprendizado de máquina podem processar de forma eficiente. Sem essa etapa, a qualidade da análise seria comprometida, levando a resultados imprecisos e insights enganosos.';

        this.saveDraft();
    },

    // funcao para o botao de novo processo funcionar
    novoProcesso() {
        // limpa tudo
        this.texto = "";
        this.ordemExecucao = [];
        this.resultadosEtapas = [];
        this.processoAtualId = null;
        this.processoAtualNome = "";

        // limpa input de arquivo
        if (this.$refs.fileInput) {
            this.$refs.fileInput.value = "";
        }

        // remove todos os gráficos antigos
        document.querySelectorAll('canvas, svg.nuvem-palavras').forEach(el => el.remove());

        // fecha o menu lateral
        const offcanvas = bootstrap.Offcanvas.getInstance(document.getElementById('offcanvasMenu'));
        if (offcanvas) offcanvas.hide();

        localStorage.removeItem('draftProcess');
    },

    // funcao para processar o texto, funcionar o botao

    async processarTexto() {
        if (!this.texto?.trim()) {
            mostrarPopup("Aviso", "Por favor, insira ou carregue um texto para processar.", "aviso");
            return;
        }
        // limpa os resultados anteriores antes de começar o novo processamento
        this.resultadosEtapas = [];

        try {
            const ordem = this.ordemExecucao.map(e => e.id);
            const configsRanking = this.ordemExecucao

                .filter(e => e.id === "ranking")
                .map(r => ({
                    limite: r.limite,
                    grafico: r.grafico
                }));

            const response = await fetch("http://localhost:5000/api/processar-texto", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    texto: this.texto,
                    ordem: ordem,
                    configs_ranking: configsRanking
                })
            });

            if (response.ok) {
                const data = await response.json();
                this.resultadosEtapas = data.resultados_processamento;

                // garante que cada resultado de ranking traga o tipo de gráfico selecionado
                this.resultadosEtapas.forEach((res, i) => {
                    if (res.etapa === "Ranking de palavras" && this.ordemExecucao[i]) {
                        const etapaConfig = this.ordemExecucao.find(e => e.id === "ranking");
                        if (etapaConfig) {
                            res.tipo_grafico = etapaConfig.grafico || "";
                        }
                    }
                });

                // busca a última etapa que não seja ranking
                let ultimaEtapaValida = null;
                for (let i = this.resultadosEtapas.length - 1; i >= 0; i--) {
                    if (this.resultadosEtapas[i].etapa !== "Ranking de palavras") {
                        ultimaEtapaValida = this.resultadosEtapas[i];
                        break;
                    }
                }

                // se não encontrou (significa que só tem ranking), usa o Texto Original
                if (!ultimaEtapaValida && this.resultadosEtapas.length > 0) {
                    ultimaEtapaValida = this.resultadosEtapas[0]; // geralmente é "Texto Original"
                }

                // adiciona o "Texto Processado por Completo" no topo
                if (ultimaEtapaValida) {
                    this.resultadosEtapas.unshift({
                        etapa: "Texto Processado por Completo",
                        texto: ultimaEtapaValida.texto,
                    });
                }

                this.renderGraficos();

                this.saveDraft();

            } else {
                const errorData = await response.json();
                mostrarPopup("Aviso", "Erro no processamento.", "erro");
            }

        } catch (error) {
            console.error("Erro ao processar:", error);
            mostrarPopup("Aviso", "Sem conexão com a api.", "erro");
        }
    },

    // funcoes dos botoes dos cards
    // funcao de copiar

    copiarResultado(res) {
        const conteudo = `Etapa: ${res.etapa}\n\n${res.texto}`;
        navigator.clipboard.writeText(conteudo)
            .then(() => {
                mostrarPopup("Sucesso", "Texto copiado para a área de transferência!", "sucesso");
            })
            .catch(() => {
                mostrarPopup("Aviso", "Não foi possível copiar o texto.", "aviso");
            });
    },

    // funcao de fazer download

    baixarResultado(res) {
        // monta o conteúdo do arquivo
        const conteudo = `Etapa: ${res.etapa}\n\n${res.texto}`;

        // cria um blob com o texto
        const blob = new Blob([conteudo], { type: "text/plain" });

        // cria link temporário para download
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);

        // nome do arquivo dinâmico: etapa_nome.txt
        const nomeArquivo = `${res.etapa.replace(/\s+/g, "_")}.txt`;
        link.download = nomeArquivo;

        // força o clique no link
        document.body.appendChild(link);
        link.click();

        // remove o link temporário
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
    },

    // funcao para  converter o svg da nuvem de palavras para png para a exportacao como pdf

    // função auxiliar: converte SVG para data URL PNG
    svgToPngDataURL(svgElement, width = 800, height = 400) {
        return new Promise((resolve) => {
            if (!svgElement) {
                resolve(null);
                return;
            }

            // serializa o SVG para string
            const svgData = new XMLSerializer().serializeToString(svgElement);
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");

            // define tamanho do canvas
            canvas.width = width;
            canvas.height = height;

            const img = new Image();

            // converte SVG para Blob → URL
            const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
            const url = URL.createObjectURL(svgBlob);

            img.onload = () => {
                ctx.drawImage(img, 0, 0, width, height); // Agora funciona!
                URL.revokeObjectURL(url);
                resolve(canvas.toDataURL("image/png"));
            };

            img.onerror = () => {
                console.warn("Falha ao carregar SVG como imagem.");
                URL.revokeObjectURL(url);
                resolve(null);
            };

            img.src = url;
        });
    },

    // funcao para exportar como pdf

    async exportarPDF(res, index) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        // título da etapa
        doc.setFontSize(14);
        doc.text(`Etapa: ${res.etapa}`, 10, 20);

        // texto processado
        doc.setFontSize(12);
        const texto = doc.splitTextToSize(res.texto, 180);
        doc.text(texto, 10, 35);

        // se for ranking com gráfico
        if (res.etapa === "Ranking de palavras" && res.tipo_grafico) {
            let imgData = null;

            if (res.tipo_grafico === "bar") {
                const canvas = document.getElementById(`grafico-${index}`);
                if (canvas) {
                    imgData = canvas.toDataURL("image/png", 1.0);
                }
            } else if (res.tipo_grafico === "nuvem") {
                const container = document.getElementById(`resultado-${index}`);
                const svg = container.querySelector("svg.nuvem-palavras");
                if (svg) {
                    imgData = await this.svgToPngDataURL(svg, 800, 400);
                }
            }

            if (imgData) {
                doc.addPage();
                doc.setFontSize(14);
                doc.text(`Gráfico: ${res.tipo_grafico === 'bar' ? 'Barras' : 'Nuvem de palavras'}`, 10, 20);
                doc.addImage(imgData, "PNG", 15, 30, 180, 100);
            }
        }

        const nomeArquivo = `${res.etapa.replace(/\s+/g, "_")}.pdf`;
        doc.save(nomeArquivo);
    },

    // funcao para criar os graficos

    // função de criação de gráfico (barras ou nuvem de palavras)
    criarGrafico(canvasElement, palavras, contagens, tipoGrafico) {
        // se for gráfico de barras, usa Chart.js normalmente
        if (tipoGrafico === "bar") {
            const chartInstance = Chart.getChart(canvasElement);
            if (chartInstance) chartInstance.destroy();

            new Chart(canvasElement.getContext("2d"), {
                type: "bar",
                data: {
                    labels: palavras,
                    datasets: [{
                        label: "Contagem de Palavras",
                        data: contagens,
                        backgroundColor: "rgba(54, 162, 235, 0.5)",
                        borderColor: "rgba(54, 162, 235, 1)",
                        borderWidth: 1
                    }]
                },
                options: { scales: { y: { beginAtZero: true } } }
            });
        }

        // se for nuvem de palavras, cria com D3
        else if (tipoGrafico === "nuvem") {
            const container = canvasElement.parentElement;
            this.criarNuvemDePalavrasD3(container, palavras, contagens);
        }
    },

    // função auxiliar para renderizar a nuvem de palavras com D3.js
    criarNuvemDePalavrasD3(container, palavras, contagens) {
        // remove apenas a nuvem anterior, sem apagar o ranking
        const nuvemAntiga = container.querySelector("svg.nuvem-palavras");
        if (nuvemAntiga) nuvemAntiga.remove();

        const width = container.clientWidth;
        const height = 200;

        // cria o SVG da nuvem logo após o conteúdo existente
        const svg = d3.select(container)
            .append("svg")
            .attr("class", "nuvem-palavras")
            .attr("width", "100%")
            .attr("height", height)
            .attr("viewBox", `0 0 ${width} ${height}`)
            .style("display", "block")

        // calcula mínimo e máximo de frequências
        const min = d3.min(contagens);
        const max = d3.max(contagens);

        // define o tamanho máximo e mínimo baseado na quantidade de palavras
        let minFont, maxFont;
        const total = palavras.length;

        if (total <= 10) {
            minFont = 25; maxFont = 90;
        } else if (total <= 25) {
            minFont = 20; maxFont = 70;
        } else if (total <= 50) {
            minFont = 14; maxFont = 50;
        } else if (total <= 100) {
            minFont = 10; maxFont = 35;
        } else {
            minFont = 8; maxFont = 25;
        }

        // escala proporcional de tamanho
        const fontSizeScale = d3.scaleLinear()
            .domain([min, max])
            .range([minFont, maxFont]);

        const words = palavras.map((p, i) => ({
            text: p,
            size: fontSizeScale(contagens[i])
        }));

        const color = d3.scaleOrdinal(d3.schemeCategory10);

        // geração da nuvem
        d3.layout.cloud()
            .size([width, height])
            .words(words)
            .padding(5)
            .spiral("archimedean")
            .rotate(() => ~~(Math.random() * 2) * 90)
            .font("Impact")
            .fontSize(d => d.size)
            .on("end", draw)
            .start();

        function draw(words) {
            svg.append("g")
                .attr("transform", `translate(${width / 2}, ${height / 2})`)
                .selectAll("text")
                .data(words)
                .enter()
                .append("text")
                .style("font-size", d => `${d.size}px`)
                .style("font-family", "Impact")
                .style("fill", (_, i) => color(i))
                .attr("text-anchor", "middle")
                .attr("transform", d => `translate(${d.x},${d.y})rotate(${d.rotate})`)
                .text(d => d.text);
        }
    },

    // funcao para listar os ultimos processos no menu lateral

    async carregarUltimosProcessos(search = '') {
        this.token = this.token || localStorage.getItem("token");
        if (!this.token) {
            console.log("Nenhum token encontrado, ignorando carga de processos.");
            return;
        }
        try {
            let url = "http://localhost:5000/api/listar-processos";
            if (search) {
                url += `?search=${encodeURIComponent(search)}`;
            }
            const response = await fetch(url, {
                headers: { "Authorization": `Bearer ${this.token}` }
            });

            const data = await response.json();

            console.log("Resposta de listar-processos:", response.status, data);

            if (data.success) {
                this.ultimosProcessos = data.processos;
            } else {
                console.error("Erro ao buscar processos:", data.error);
                mostrarPopup("Erro", data.error || "Falha ao carregar processos. Tente login novamente.", "erro");
            }

        } catch (err) {
            console.error("Falha ao carregar processos:", err);
            mostrarPopup("Erro", "Sem conexão com a API.", "erro");
        }
    },

    // funcao para abrir o modal de renomear

    renomearProcesso(processoId, nomeAtual) {
        this.selectedProcessoId = processoId;
        this.novoNomeProcesso = nomeAtual;

        const modalEl = document.getElementById("modalRenomear");
        const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
        modal.show();
    },

    // funcao para renomear processo

    async confirmarRenomear() {
        const novoNome = this.novoNomeProcesso.trim();
        // verifica se o novo nome foi preenchido
        if (!novoNome) {
            const modalEl = document.getElementById("modalRenomear");
            const modal = bootstrap.Modal.getInstance(modalEl);
            if (modal) modal.hide();

            setTimeout(() => {
                mostrarPopup("Aviso", "Por favor, insira um novo nome para o processo.", "aviso");
            }, 100);
            return;
        }

        // verifica se o novo nome já existe (excluindo o processo atual)
        if (this.ultimosProcessos.some(p => p.nome === novoNome && p.id !== this.selectedProcessoId)) {
            const modalEl = document.getElementById("modalRenomear");
            const modal = bootstrap.Modal.getInstance(modalEl);
            if (modal) modal.hide();

            setTimeout(() => {
                mostrarPopup("Aviso", "Já existe um processo com esse nome.", "aviso");
            }, 100);
            return;
        }

        const modalEl = document.getElementById("modalRenomear");
        const modal = bootstrap.Modal.getInstance(modalEl);
        modal.hide();

        const token = localStorage.getItem("token");

        try {
            const response = await fetch("http://localhost:5000/api/renomear-processo", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    processo_id: this.selectedProcessoId,
                    novo_nome: novoNome
                })
            });

            const data = await response.json();

            if (data.success) {
                await this.carregarUltimosProcessos();
                if (this.selectedProcessoId === this.processoAtualId) {
                    this.processoAtualNome = novoNome;
                }
            } else {
                mostrarPopup("Erro", data.error || "Falha ao renomear processo.", "erro");
            }
        } catch (error) {
            console.error("Erro ao renomear processo:", error);
            mostrarPopup("Erro", "Não foi possível renomear o processo. Verifique sua conexão.", "erro");
        }
    },

    // funcao para abrir modal de excluir processo

    excluirProcesso(processoId) {
        this.selectedProcessoId = processoId;
        const modalEl = document.getElementById("modalExcluir");
        const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
        modal.show();
    },

    // função para excluir o processo

    async confirmarExcluir() {
        const modalEl = document.getElementById("modalExcluir");
        const modal = bootstrap.Modal.getInstance(modalEl);
        modal.hide();

        const token = localStorage.getItem("token");

        try {
            const response = await fetch("http://localhost:5000/api/excluir-processo", {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    processo_id: this.selectedProcessoId
                })
            });

            const data = await response.json();

            if (data.success) {
                mostrarPopup("Sucesso", "Processo excluído com sucesso.", "sucesso");
                await this.carregarUltimosProcessos();
            } else {
                mostrarPopup("Erro", data.error || "Falha ao excluir o processo.", "erro");
            }
        } catch (error) {
            console.error("Erro ao excluir processo:", error);
            mostrarPopup("Erro", "Falha ao excluir o processo. Verifique sua conexão.", "erro");
        }

        this.novoProcesso();
    },

    // funcao para buscar com debounce (espera um tempo para fazer a pesquisa)

    buscarProcessos() {
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }
        this.debounceTimer = setTimeout(() => {
            this.carregarUltimosProcessos(this.searchQuery);
        }, 300);
    },

    // funcao de salvar o texto no banco de dados

    // funcao para abrir o modal de salvar

    salvar() {
        if (!this.isLoggedIn) {
            mostrarPopup("Aviso", "Faça login para salvar processos.", "aviso");
            return;
        }

        this.nomeProcesso = "";

        const modalEl = document.getElementById("modalSalvar");
        const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
        modal.show();
    },

    salvarComoNovo() {
        if (!this.isLoggedIn) {
            mostrarPopup("Aviso", "Você precisa estar logado para salvar processos. Faça login ou cadastre-se.", "aviso");
            return;
        }
        this.nomeProcesso = this.processoAtualNome || '';
        const modal = new bootstrap.Modal(document.getElementById('modalSalvar'));
        modal.show();
    },

    // confirma o salvamento

    confirmarSalvar() {
        const nome = this.nomeProcesso.trim();
        if (!nome) {
            mostrarPopup("Aviso", "Por favor, insira um nome para o processo.", "aviso");
            return;
        }
        this.salvarProcesso(nome, false);  // false para novo (POST)
        const modalEl = document.getElementById("modalSalvar");
        const modal = bootstrap.Modal.getInstance(modalEl);
        modal.hide();
    },

    atualizarProcesso() {
        if (!this.isLoggedIn) {
            mostrarPopup("Aviso", "Você precisa estar logado para atualizar processos. Faça login ou cadastre-se.", "aviso");
            return;
        }
        if (!this.processoAtualId) {
            mostrarPopup("Aviso", "Nenhum processo atual para atualizar.", "aviso");
            return;
        }

        const modal = new bootstrap.Modal(document.getElementById('modalAtualizar'));
        modal.show();
    },

    confirmarAtualizar() {
        this.salvarProcesso(this.processoAtualNome, true);
        const modalEl = document.getElementById("modalAtualizar");
        const modal = bootstrap.Modal.getInstance(modalEl);
        modal.hide();
    },

    async salvarProcesso(nome, isUpdate = false) {
        try {
            const textoOriginal = this.texto || "";

            const ultimaEtapaComTexto = [...this.resultadosEtapas]
                .reverse()
                .find(e => e.texto && e.texto.trim() !== "" && e.etapa !== "Ranking de palavras" && !e.dados_grafico);

            const textoFinal = ultimaEtapaComTexto ? ultimaEtapaComTexto.texto : this.texto;

            const payload = {
                nome_processo: nome,
                texto_original: textoOriginal,
                texto_final: textoFinal,
                resultados_etapas: this.resultadosEtapas.map((etapa, index) => ({
                    ordem_index: index,
                    etapa: etapa.etapa || etapa.nome || `Etapa ${index + 1}`,
                    texto: etapa.texto || "",
                    dados_grafico: etapa.dados_grafico || null,
                    tipo_grafico: etapa.tipo_grafico || null
                }))
            };

            const token = localStorage.getItem("token");

            let url = "http://localhost:5000/api/salvar-processo";
            let method = "POST";
            if (isUpdate) {
                url = `http://localhost:5000/api/atualizar-processo/${this.processoAtualId}`;
                method = "PUT";
            }

            const response = await fetch(url, {
                method: method,
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (response.ok) {
                const msg = isUpdate ? "Processo atualizado com sucesso!" : "Processo salvo com sucesso!";
                mostrarPopup("Sucesso", msg, "sucesso");
                await this.carregarUltimosProcessos();
                if (!isUpdate) {
                    this.processoAtualId = data.processo_id;
                    this.processoAtualNome = nome;
                }

                localStorage.removeItem('draftProcess');

            } else {
                mostrarPopup("Erro", data.error || "Erro ao salvar/atualizar o processo.", "erro");
            }

        } catch (error) {
            console.error("Erro ao salvar/atualizar processo:", error);
            mostrarPopup("Erro", "Falha na conexão com o servidor.", "erro");
        }
    },

    // funcao para calcular as estatisticas de cada etapa

    calcularEstatisticasTexto(texto) {
        // caracteres com espaço
        const charsComEspaco = texto.length;

        // caracteres sem espaço: remove todos os espaços em branco e conta
        const charsSemEspaco = texto.replace(/\s/g, '').length;

        // contagem de Palavras:
        // regex para substituir múltiplos espaços por um único espaço
        const textoLimpo = texto.trim().replace(/\s+/g, ' ');
        // divide pelo espaço e conta os elementos, tratando caso de texto vazio
        const palavrasArray = textoLimpo.split(' ');
        const contagemPalavras = textoLimpo === "" ? 0 : palavrasArray.length;

        return {
            charsComEspaco,
            charsSemEspaco,
            contagemPalavras
        };
    },

    // funcao para exibir o modal de estatisticas da etapa

    exibirEstatisticas(res) {
        this.statsResultados = this.calcularEstatisticasTexto(res.texto || "");
        this.statsEtapaAtual = res;

        setTimeout(() => {
            const statsModal = new bootstrap.Modal(document.getElementById('statsModal'));
            statsModal.show();
        }, 50);
    },

    // função de fazer o download do processo

    baixarProcesso() {
        // monta o conteúdo concatenando todas as etapas
        let conteudo = "=== Processo Completo ===\n\n";
        this.resultadosEtapas.forEach((res, i) => {
            conteudo += `Etapa ${i + 1}: ${res.etapa}\n\n`;
            conteudo += `${res.texto}\n\n`;
            conteudo += "-----------------------------\n\n";
        });

        // cria um blob com o conteúdo
        const blob = new Blob([conteudo], { type: "text/plain" });

        // cria link temporário para download
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);

        // nome do arquivo: processo_completo.txt
        link.download = "processo_completo.txt";

        // força o clique
        document.body.appendChild(link);
        link.click();

        // remove link temporário
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
    },

    // funcao para exportar o processo para pdf

    async exportarProcessoPDF() {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        let y = 20;
        const margemEsq = 10;
        const larguraTexto = 180;
        const alturaLinha = 7;

        for (let index = 0; index < this.resultadosEtapas.length; index++) {
            const res = this.resultadosEtapas[index];

            // título da etapa
            doc.setFontSize(14);
            if (y > 280) { doc.addPage(); y = 20; }
            doc.text(`Etapa: ${res.etapa}`, margemEsq, y);
            y += 10;

            // texto da etapa
            doc.setFontSize(12);
            const linhas = doc.splitTextToSize(res.texto || "", larguraTexto);
            for (const linha of linhas) {
                if (y > 280) { doc.addPage(); y = 20; }
                doc.text(linha, margemEsq, y);
                y += alturaLinha;
            }
            y += 5;

            // gráfico (se for ranking)
            if (res.etapa === "Ranking de palavras" && res.tipo_grafico) {
                let imgData = null;

                if (res.tipo_grafico === "bar") {
                    const canvas = document.getElementById(`grafico-${index}`);
                    if (canvas) {
                        imgData = canvas.toDataURL("image/png", 1.0);
                    }
                } else if (res.tipo_grafico === "nuvem") {
                    const container = document.querySelector(`#resultado-${index}`);
                    const svg = container?.querySelector("svg.nuvem-palavras");
                    if (svg) {
                        imgData = await this.svgToPngDataURL(svg, 800, 400);
                    }
                }

                if (imgData) {
                    if (y + 110 > 280) { doc.addPage(); y = 20; }
                    doc.setFontSize(12);
                    doc.text(`Gráfico: ${res.tipo_grafico === 'bar' ? 'Barras' : 'Nuvem de palavras'}`, margemEsq, y);
                    y += 10;
                    doc.addImage(imgData, "PNG", margemEsq, y, 180, 100);
                    y += 110;
                }
            }

            y += 10; // espaço entre etapas
        }

        doc.save("processo_completo.pdf");
    }

};

// funcao do popup

function mostrarPopup(titulo, mensagem, tipo = "info") {
    const modalEl = document.getElementById("popupMensagem");
    const modalContent = modalEl.querySelector(".modal-content");

    document.getElementById("popupTitulo").textContent = titulo;
    document.getElementById("popupMensagemTexto").textContent = mensagem;

    // remove as classes antigas
    modalContent.classList.remove("popup-success", "popup-error", "popup-warning");

    // adiciona conforme o tipo
    if (tipo === "sucesso") {
        modalContent.classList.add("popup-success");
    } else if (tipo === "erro") {
        modalContent.classList.add("popup-error");
    } else if (tipo === "aviso") {
        modalContent.classList.add("popup-warning");
    }

    const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
    modal.show();

    modalEl.addEventListener(
        "hidden.bs.modal",
        () => {
            document.querySelectorAll(".modal-backdrop").forEach(b => b.remove());
            document.body.classList.remove("modal-open");
            document.body.style.overflow = "";
            document.body.style.paddingRight = "";
        },
        { once: true }
    );
}


// petite vue e biblioteca do sortable

document.addEventListener("DOMContentLoaded", async () => {
    app.initAuth();
    if (app.isLoggedIn) {
        await app.carregarUltimosProcessos();
    }
    PetiteVue.createApp({ app }).mount();

    if (app.resultadosEtapas.length > 0) {
        app.renderGraficos();
    }

    // fecha outros dropdowns quando um novo é aberto no menu lateral
    document.addEventListener('show.bs.dropdown', function (event) {
        const currentToggle = event.target;
        // seleciona apenas os toggles dentro do offcanvasMenu para limitar o escopo
        const allToggles = document.querySelectorAll('#offcanvasMenu .dropdown [data-bs-toggle="dropdown"]');

        allToggles.forEach(toggle => {
            if (toggle !== currentToggle) {
                const dropdownInstance = bootstrap.Dropdown.getInstance(toggle);
                if (dropdownInstance) {
                    dropdownInstance.hide();
                }
            }
        });
    });

    const el = document.getElementById('lista-processos');
    Sortable.create(el, {
        animation: 150,
        onEnd: evt => {
            const [moved] = app.ordemExecucao.splice(evt.oldIndex, 1);
            app.ordemExecucao.splice(evt.newIndex, 0, moved);

            app.saveDraft();
        }
    });
});