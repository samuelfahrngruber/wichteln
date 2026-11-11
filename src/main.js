import "./style.css";
import { draw, encodeGame, decodeGame } from "./game.js";
import { translations } from "./translations.js";

const app = document.querySelector("#app");
let language = new URLSearchParams(location.hash.slice(1)).get("lang") === "de" ? "de" : "en";
let names = [];
let exclusions = [];
let gameLink = "";
let revealed = -1;
let message = "";
const t = () => translations[language];

function element(tag, text, attributes = {}) {
  const node = document.createElement(tag);
  if (text) node.textContent = text;
  for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, value);
  return node;
}
function button(text, action, attributes = {}) {
  const node = element("button", text, { type: "button", ...attributes });
  node.addEventListener("click", action);
  return node;
}
function announce(key) {
  message = key;
  document.querySelector("#status").textContent = t()[key] || "";
}
function invalidateLink() {
  gameLink = "";
  message = "";
}
function labeled(label, control) {
  const wrapper = element("label", label);
  wrapper.append(control);
  return wrapper;
}

function render() {
  document.documentElement.lang = language;
  document.title = t().title;
  const params = new URLSearchParams(location.hash.slice(1));
  app.replaceChildren();
  const header = element("header");
  header.append(element("h1", t().title));
  for (const [code, label] of [
    ["en", "English"],
    ["de", "Deutsch"],
  ]) {
    header.append(
      button(
        label,
        () => {
          language = code;
          params.set("lang", code);
          history.replaceState(null, "", `#${params}`);
          if (gameLink) {
            const url = new URL(gameLink);
            const linkParams = new URLSearchParams(url.hash.slice(1));
            linkParams.set("lang", code);
            url.hash = linkParams.toString();
            gameLink = url.href;
          }
          render();
          document.querySelector(`button[lang="${code}"]`).focus();
        },
        { lang: code, "aria-pressed": String(language === code) },
      ),
    );
  }
  app.append(header);
  const main = element("main");
  app.append(main);
  const status = element("p", t()[message], {
    id: "status",
    role: "status",
    "aria-live": "polite",
  });
  if (params.has("game")) {
    try {
      renderCards(main, decodeGame(params.get("game")));
    } catch {
      main.append(element("p", t().invalid, { role: "alert" }));
    }
    main.append(element("a", t().newGame, { href: `#lang=${language}` }));
  } else {
    renderSetup(main);
  }
  main.append(status);
}

function renderSetup(main) {
  main.append(element("h2", t().setup));
  const form = element("form");
  const input = element("input", "", { id: "name", autocomplete: "off", required: "" });
  form.append(labeled(t().name, input), element("button", t().add, { type: "submit" }));
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const name = input.value.trim();
    if (!name) return announce("empty");
    if (names.includes(name)) return announce("duplicate");
    names.push(name);
    invalidateLink();
    render();
    document.querySelector("#name").focus();
    announce("added");
  });
  main.append(element("h3", t().participants), form);
  const list = element("ul");
  names.forEach((name, index) => {
    const item = element("li", name);
    item.append(
      button(
        t().remove,
        () => {
          names.splice(index, 1);
          exclusions = exclusions.filter((pair) => !pair.includes(name));
          invalidateLink();
          render();
          document.querySelector("#name").focus();
          announce("removed");
        },
        { "aria-label": `${t().remove}: ${name}` },
      ),
    );
    list.append(item);
  });
  main.append(list, element("h3", t().exclusions));
  const from = element("select", "", { id: "from" });
  const to = element("select", "", { id: "to" });
  for (const name of names) {
    from.append(element("option", name, { value: name }));
    to.append(element("option", name, { value: name }));
  }
  to.selectedIndex = names.length > 1 ? 1 : 0;
  function addExclusion(both) {
    if (!from.value || !to.value || from.value === to.value) return announce("pair");
    const pairs = [[from.value, to.value]];
    if (both) pairs.push([to.value, from.value]);
    for (const pair of pairs) {
      if (!exclusions.some(([a, b]) => a === pair[0] && b === pair[1])) exclusions.push(pair);
    }
    invalidateLink();
    render();
    document.querySelector("#from").focus();
    announce("exclusionAdded");
  }
  const controls = element("div", "", { class: "row" });
  controls.append(
    labeled(t().from, from),
    labeled(t().to, to),
    button(t().add, () => addExclusion(false)),
    button(t().both, () => addExclusion(true)),
  );
  main.append(controls);
  const rules = element("ul");
  exclusions.forEach(([a, b], index) => {
    const item = element("li", `${a} → ${b}`);
    item.append(
      button(
        t().remove,
        () => {
          exclusions.splice(index, 1);
          invalidateLink();
          render();
          document.querySelector("#from").focus();
          announce("exclusionRemoved");
        },
        { "aria-label": `${t().remove}: ${a} → ${b}` },
      ),
    );
    rules.append(item);
  });
  main.append(
    rules,
    button(t().create, () => {
      if (names.length < 2) return announce("minimum");
      const pairs = exclusions.map((pair) => pair.map((name) => names.indexOf(name)));
      const seed = crypto.getRandomValues(new Uint32Array(1))[0];
      try {
        const assignments = draw(names, pairs, seed);
        const url = new URL(location.href);
        url.hash = new URLSearchParams({
          lang: language,
          game: encodeGame({ version: 1, names, exclusions: pairs, seed, assignments }),
        });
        gameLink = url.href;
        message = "";
        render();
        document.querySelector("#game-link").focus();
      } catch {
        announce("impossible");
      }
    }),
  );
  if (gameLink) {
    const link = element("input", "", { id: "game-link", readonly: "", type: "url" });
    link.value = gameLink;
    link.addEventListener("focus", () => link.select());
    main.append(
      labeled(t().link, link),
      button(t().copy, async () => {
        try {
          await navigator.clipboard.writeText(gameLink);
          announce("copied");
        } catch {
          link.focus();
          link.select();
          announce("copyFailed");
        }
      }),
      element("a", t().open, { href: gameLink }),
    );
  }
  main.append(element("p", t().privacy));
}

function renderCards(main, game) {
  main.append(element("h2", t().cards), element("p", t().hint));
  const cards = element("div", "", { class: "cards" });
  game.names.forEach((name, index) => {
    const open = revealed === index;
    cards.append(
      button(
        open ? t().greeting(name, game.names[game.assignments[index]]) : name,
        () => {
          revealed = revealed === index ? -1 : index;
          render();
          document.querySelector(`#card-${index}`).focus();
        },
        {
          id: `card-${index}`,
          class: "card",
          "aria-pressed": String(open),
          "aria-label": open
            ? `${t().greeting(name, game.names[game.assignments[index]])} ${t().hide} ${name}`
            : `${t().reveal} ${name}`,
        },
      ),
    );
  });
  main.append(cards, element("p", t().privacy));
}
window.addEventListener("hashchange", () => {
  language = new URLSearchParams(location.hash.slice(1)).get("lang") === "de" ? "de" : "en";
  revealed = -1;
  message = "";
  render();
});
render();
