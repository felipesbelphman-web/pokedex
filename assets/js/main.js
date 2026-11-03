"use strict";
const listaPokemon = document.querySelector("#list-pokemon");
const botoesTipos = document.querySelectorAll(".btn-header");
const search = document.querySelector("#pokemon-search");
const sort = document.querySelector("#pokemon-sort");
const empty = document.querySelector("#favorites-empty");
const status = document.querySelector("#load-status");
const retry = document.querySelector("#retry-load");
let filtroAtual = "all";
let carregando = false;
const carregados = new Set();
let favoritos;
try {
 const salvos = JSON.parse(localStorage.getItem("pokedex-favorites") || "[]");
 favoritos = new Set(Array.isArray(salvos) ? salvos.map(Number).filter(id => Number.isInteger(id) && id >= 1 && id <= 151) : []);
} catch { favoritos = new Set(); }

function arquivoDoTipo(tipo) {
 return tipo === "fighting" ? "Fight" : tipo.charAt(0).toUpperCase() + tipo.slice(1);
}
function aplicarFiltro(card) {
 const query = search.value.trim().toLowerCase().replace(/^#/, "");
 const numero = Number(query);
 const matchSearch = !query || card.dataset.name.includes(query) ||
  (/^\d+$/.test(query) && Number(card.dataset.id) === numero);
 card.hidden = !matchSearch ||
  (filtroAtual !== "all" && !card.dataset.types.split(" ").includes(filtroAtual)) ||
  (location.hash === "#favorites" && !favoritos.has(Number(card.dataset.id)));
}
function ordenarCards() {
 const cards = [...listaPokemon.children];
 cards.sort((a,b) => {
  const direction = sort.value.endsWith("desc") ? -1 : 1;
  return direction * (sort.value.startsWith("name") ?
   a.dataset.name.localeCompare(b.dataset.name) : Number(a.dataset.id) - Number(b.dataset.id));
 });
 cards.forEach(card => listaPokemon.append(card));
}
function atualizarTelaFavoritos() {
 const isFavorites = location.hash === "#favorites";
 document.querySelector("#favorites-count").textContent = favoritos.size;
 for (const [selector, active] of [[".favorites-link",isFavorites],[".explore-link",!isFavorites]]) {
  const link = document.querySelector(selector);
  if(active) link.setAttribute("aria-current","page");
  else link.removeAttribute("aria-current");
 }
 document.querySelector("#page-title").textContent = isFavorites ? "Your favorite Pokémon" : "Discover your next Pokémon";
 let visible = 0;
 listaPokemon.querySelectorAll(".pokemon").forEach(card => {
  aplicarFiltro(card);
  if(!card.hidden) visible++;
 });
 document.querySelector("#results-count").textContent = visible + (visible === 1 ? " Pokémon" : " Pokémon") + (isFavorites ? " saved" : "");
 empty.hidden = visible !== 0 || carregando;
 document.querySelector("#empty-description").textContent = isFavorites && favoritos.size === 0 ?
  "Click a Pokémon’s Poké Ball to save it here." : "Try another name, number or type.";
 botoesTipos.forEach(button => button.setAttribute("aria-pressed", String(button.dataset.type === filtroAtual)));
 const extra = [...document.querySelectorAll(".more-panel .btn-header")].find(button => button.dataset.type === filtroAtual);
 document.querySelector("#more-label").innerHTML = `
  <img
    src="./image/filter.svg"
    alt=""
    aria-hidden="true"
    class="ui-icon"
  >
  <span>${extra ? extra.dataset.type : "More"}</span>
`;
}
botoesTipos.forEach(button => {
 const tipo = button.dataset.type;
 button.innerHTML = tipo === "all" ? "All Pokémon" :
  '<img src="./image/Types/' + arquivoDoTipo(tipo) + '.svg" alt=""><span>' + tipo + '</span>';
 button.addEventListener("click", () => {
  filtroAtual = tipo;
  document.querySelector(".more-types").open = false;
  atualizarTelaFavoritos();
 });
});
search.addEventListener("input",atualizarTelaFavoritos);
sort.addEventListener("change",ordenarCards);
window.addEventListener("hashchange", () => {
 filtroAtual = "all"; search.value = ""; atualizarTelaFavoritos();
});
document.querySelector("#reset-filters").addEventListener("click", () => {
 filtroAtual = "all"; search.value = ""; atualizarTelaFavoritos(); search.focus();
});
for(const layout of ["grid","list"]) {
 document.querySelector("#" + layout + "-view").addEventListener("click", () => {
  listaPokemon.classList.toggle("is-list", layout === "list");
  for(const mode of ["grid","list"]) document.querySelector("#" + mode + "-view").setAttribute("aria-pressed",String(layout === mode));
 });
}
document.addEventListener("click", event => {
 const details = document.querySelector(".more-types");
 if(!details.contains(event.target)) details.open = false;
});
document.addEventListener("keydown", event => {
 if(event.key === "Escape") document.querySelector(".more-types").open = false;
});
async function carregarPokemon() {
 if(carregando) return;
 carregando = true; retry.hidden = true; empty.hidden = true;
 listaPokemon.setAttribute("aria-busy","true");
 const pending = Array.from({length:151},(_,i)=>i+1).filter(id => !carregados.has(id));
 let next = 0;
 async function worker() {
  while(next < pending.length) {
   const id = pending[next++];
   try {
    const response = await fetch("https://pokeapi.co/api/v2/pokemon/" + id, {signal: AbortSignal.timeout(20000)});
    if(!response.ok) throw new Error("HTTP " + response.status);
    const poke = await response.json();
    mostrarPokemon(poke); carregados.add(id);
    ordenarCards(); atualizarTelaFavoritos();
   } catch(error) { console.error("Could not load Pokémon #" + id,error); }
   status.textContent = "Loaded " + carregados.size + " of 151 Pokémon…";
  }
 }
 await Promise.all(Array.from({length:8},worker));
 carregando = false;
 listaPokemon.setAttribute("aria-busy","false");
 status.hidden = carregados.size === 151;
 status.textContent = "Loaded " + carregados.size + " of 151 Pokémon. Some could not be loaded.";
 retry.hidden = carregados.size === 151;
 atualizarTelaFavoritos();
}
retry.addEventListener("click", () => {status.hidden = false; carregarPokemon();});
atualizarTelaFavoritos();
carregarPokemon();

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
    div.dataset.name = poke.name;
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
                        aria-label="${favoritos.has(poke.id) ? "Remove " + poke.name + " from favorites" : "Add " + poke.name + " to favorites"}"
                        aria-pressed="${favoritos.has(poke.id)}"
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
                            src="${imagem}" loading="lazy" decoding="async" width="220" height="220"
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
                            <img
                                src="./image/expand-lines.svg"
                                alt=""
                                aria-hidden="true"
                                class="stat-icon"
                            >
                            <span class="stat-label">Height</span>
                            <strong>${poke.height / 10} m</strong>
                        </div>

                        <div class="stat">
                            <img
                                src="./image/gym.svg"
                                alt=""
                                aria-hidden="true"
                                class="stat-icon"
                            >
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

    listaPokemon.append(div);
    aplicarFiltro(div);
}

const mobileLayout = window.matchMedia("(max-width: 600px)");
const searchTools = document.querySelector(".search-tools");
const filters = document.querySelector(".filters");
const sortBox = document.querySelector(".sort-box");
const moreTypes = document.querySelector(".more-types");

const filterActions = document.createElement("div");
filterActions.className = "filter-actions";

function ajustarOrdenacaoMobile() {
    if (mobileLayout.matches) {
        filters.append(filterActions);
        filterActions.append(sortBox, moreTypes);
    } else {
        searchTools.append(sortBox);
        filters.append(moreTypes);
        filterActions.remove();
    }
}

mobileLayout.addEventListener("change", ajustarOrdenacaoMobile);
ajustarOrdenacaoMobile();