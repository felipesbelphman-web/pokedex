const listaPokemon = document.querySelector("#list-pokemon");
const apiUrl = "https://pokeapi.co/api/v2/pokemon/";
const botoesTipos = document.querySelectorAll(".btn-header");

let filtroAtual = "all";

// Recupera os favoritos salvos neste navegador
let favoritos;

try {
    const salvos = JSON.parse(
        localStorage.getItem("pokedex-favorites") || "[]"
    );

    favoritos = new Set(
        Array.isArray(salvos) ? salvos.map(Number) : []
    );
} catch {
    favoritos = new Set();
}

const mensagemFavoritos = document.querySelector("#favorites-empty");
const linkFavoritos = document.querySelector(".favorites-link");

function atualizarTelaFavoritos() {
    const mostrandoFavoritos = location.hash === "#favorites";

    linkFavoritos.classList.toggle("is-active", mostrandoFavoritos);

    if (mostrandoFavoritos) {
        linkFavoritos.setAttribute("aria-current", "page");
    } else {
        linkFavoritos.removeAttribute("aria-current");
    }

    mensagemFavoritos.hidden =
        !mostrandoFavoritos || favoritos.size > 0;

    listaPokemon
        .querySelectorAll(".pokemon")
        .forEach(aplicarFiltro);
}

window.addEventListener("hashchange", () => {
    // Abre a tela sem limitar a um tipo anterior
    filtroAtual = "all";

    botoesTipos.forEach(botao => {
        botao.setAttribute(
            "aria-pressed",
            String(botao.id === "btn-all")
        );
    });

    atualizarTelaFavoritos();
});

atualizarTelaFavoritos();

/// Nome dos arquivos SVG dos tipos
function arquivoDoTipo(tipo) {
    return tipo === "fighting"
        ? "Fight"
        : tipo.charAt(0).toUpperCase() + tipo.slice(1);
}

function aplicarFiltro(card) {
    const tipos = card.dataset.types.split(" ");
    const id = Number(card.dataset.id);

    const correspondeAoTipo =
        filtroAtual === "all" || tipos.includes(filtroAtual);

    const correspondeAosFavoritos =
        location.hash !== "#favorites" || favoritos.has(id);

    card.hidden =
        !correspondeAoTipo || !correspondeAosFavoritos;
}

// Menu de tipos
botoesTipos.forEach(botao => {
    const tipo = botao.id === "btn-all" ? "all" : botao.id;

    botao.style.removeProperty("background-color");

    if (tipo === "all") {
        botao.textContent = "All Pokémon";
    } else {
        const arquivo = arquivoDoTipo(tipo);

        botao.style.setProperty(
            "--filter-color",
            `var(--type-${tipo})`
        );

        botao.innerHTML = `
            <img
                src="./image/Types/${arquivo}.svg"
                alt=""
                aria-hidden="true"
            >
            <span>${tipo}</span>
        `;
    }

    botao.setAttribute(
        "aria-pressed",
        String(tipo === filtroAtual)
    );

    botao.addEventListener("click", () => {
    filtroAtual = tipo;

    // All Pokémon sai da tela de favoritos
    if (tipo === "all" && location.hash === "#favorites") {
        location.hash = "all";
    }

        botoesTipos.forEach(item => {
            item.setAttribute(
                "aria-pressed",
                String(item === botao)
            );
        });

        listaPokemon
            .querySelectorAll(".pokemon")
            .forEach(aplicarFiltro);
    });
});

// Carrega os Pokémon
for (let i = 1; i <= 151; i++) {
    fetch(apiUrl + i)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Erro ao carregar Pokémon #${i}`);
            }

            return response.json();
        })
        .then(mostrarPokemon)
        .catch(error => console.error(error));
}

// Cria cada card
function mostrarPokemon(poke) {
    const numero = String(poke.id).padStart(3, "0");
    const tipoPrincipal = poke.types[0].type.name;

    const imagem =
        poke.sprites.other["official-artwork"].front_default ||
        poke.sprites.front_default;

    const tipos = poke.types.map(item => {
        const tipo = item.type.name;
        const arquivo = arquivoDoTipo(tipo);

        return `
            <p class="tipe ${tipo}">
                <img
                    src="./image/Types/${arquivo}.svg"
                    alt=""
                    aria-hidden="true"
                    class="type-icon"
                >
                <span>${tipo}</span>
            </p>
        `;
    }).join("");

    const habilidades = poke.abilities
        .map(item => item.ability.name.replaceAll("-", " "))
        .join(", ");

    const nomesStats = {
        hp: "HP",
        attack: "Attack",
        defense: "Defense",
        "special-attack": "Sp. Attack",
        "special-defense": "Sp. Defense",
        speed: "Speed"
    };

    const atributos = poke.stats.map(item => {
        const nome = nomesStats[item.stat.name] || item.stat.name;

        return `
            <div class="attribute">
                <div class="attribute-heading">
                    <span>${nome}</span>
                    <strong>${item.base_stat}</strong>
                </div>

                <meter
                    class="attribute-meter"
                    min="0"
                    max="255"
                    value="${item.base_stat}"
                    aria-label="${nome}"
                ></meter>
            </div>
        `;
    }).join("");

    const div = document.createElement("div");
    div.classList.add("pokemon", "pokemon-flip");

    div.dataset.id = String(poke.id);
    div.dataset.types = poke.types
        .map(item => item.type.name)
        .join(" ");

    div.style.setProperty(
        "--card-accent",
        `var(--type-${tipoPrincipal})`
    );

    div.innerHTML = `
        <div class="pokemon-inner">
            <div class="pokemon-front">
                <div
                    class="pokemon-top"
                    data-type="${tipoPrincipal}"
                >
                    <p class="pokemon-number">#${numero}</p>

                    <button
                        class="favorite-button"
                        type="button"
                        aria-label="Add ${poke.name} to favorites"
                        aria-pressed="false"
                    >
                        <img
                            src="./image/pokeball.svg"
                            alt=""
                            aria-hidden="true"
                            class="favorite-icon"
                        >
                    </button>

                    <div class="pokemon-imagem">
                        <img
                            src="${imagem}"
                            alt="${poke.name}"
                        >
                    </div>
                </div>

                <div class="pokemon-info">
                    <h2 class="pokemon-name">${poke.name}</h2>

                    <div class="pokemom-tips">
                        ${tipos}
                    </div>

                    <div class="pokemon-stats">
                        <div class="stat">
                            <span class="stat-label">Height</span>
                            <strong>${poke.height / 10} m</strong>
                        </div>

                        <div class="stat">
                            <span class="stat-label">Weight</span>
                            <strong>${poke.weight / 10} kg</strong>
                        </div>
                    </div>

                    <button class="details-button" type="button">
                        <img
                            src="./image/details-icon.png"
                            alt=""
                            aria-hidden="true"
                            class="action-icon"
                        >
                        <span>View details</span>
                    </button>
                </div>
            </div>

            <div class="pokemon-back" inert aria-hidden="true">
                <div class="back-heading">
                    <span class="back-number">#${numero}</span>
                    <h2 class="pokemon-name">${poke.name}</h2>
                </div>

                <div class="abilities-section">
                    <h3>Abilities</h3>
                    <p>${habilidades}</p>
                </div>

                <div class="attributes-section">
                    <h3>Base stats</h3>
                    ${atributos}
                </div>

                <button class="back-button" type="button">
                    <img
                        src="./image/back-icon.png"
                        alt=""
                        aria-hidden="true"
                        class="action-icon"
                    >
                    <span>Back</span>
                </button>
            </div>
        </div>
    `;

    const frente = div.querySelector(".pokemon-front");
    const verso = div.querySelector(".pokemon-back");
    const botaoDetalhes = div.querySelector(".details-button");
    const botaoVoltar = div.querySelector(".back-button");
    const botaoFavorito = div.querySelector(".favorite-button");

    // Alterna entre frente e verso
    function virarCard(mostrarVerso) {
        const elementoAtivo = document.activeElement;

        if (elementoAtivo instanceof HTMLElement) {
            elementoAtivo.blur();
        }

        frente.inert = mostrarVerso;
        verso.inert = !mostrarVerso;

        frente.setAttribute("aria-hidden", String(mostrarVerso));
        verso.setAttribute("aria-hidden", String(!mostrarVerso));

        div.classList.toggle("is-flipped", mostrarVerso);

        const destino = mostrarVerso
            ? botaoVoltar
            : botaoDetalhes;

        destino.focus({ preventScroll: true });
    }

    botaoDetalhes.addEventListener("click", () => {
        virarCard(true);
    });

    botaoVoltar.addEventListener("click", () => {
        virarCard(false);
    });

   // Recupera o estado salvo deste Pokémon
botaoFavorito.setAttribute(
    "aria-pressed",
    String(favoritos.has(poke.id))
);

botaoFavorito.addEventListener("click", () => {
    if (favoritos.has(poke.id)) {
        favoritos.delete(poke.id);
    } else {
        favoritos.add(poke.id);
    }

    const favoritado = favoritos.has(poke.id);

    botaoFavorito.setAttribute(
        "aria-pressed",
        String(favoritado)
    );

    botaoFavorito.setAttribute(
        "aria-label",
        favoritado
            ? `Remove ${poke.name} from favorites`
            : `Add ${poke.name} to favorites`
    );

    try {
        localStorage.setItem(
            "pokedex-favorites",
            JSON.stringify([...favoritos])
        );
    } catch (error) {
        console.error("Could not save favorites:", error);
    }

    atualizarTelaFavoritos();
});

    // Insere em ordem numérica, mesmo com respostas fora de ordem
    const proximoCard = Array.from(listaPokemon.children)
        .find(card => Number(card.dataset.id) > poke.id);

    listaPokemon.insertBefore(div, proximoCard || null);
}