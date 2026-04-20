const STORAGE_KEY = "mealPlannerData.v1";
const DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

const refs = {
  form: document.querySelector("#mealForm"),
  day: document.querySelector("#day"),
  type: document.querySelector("#type"),
  name: document.querySelector("#name"),
  ingredients: document.querySelector("#ingredients"),
  weekBoard: document.querySelector("#weekBoard"),
  shoppingList: document.querySelector("#shoppingList"),
  clearWeek: document.querySelector("#clearWeek"),
  exportBtn: document.querySelector("#exportBtn"),
  dayColumnTemplate: document.querySelector("#dayColumnTemplate"),
};

let state = loadState();
render();

refs.form.addEventListener("submit", (event) => {
  event.preventDefault();

  const meal = {
    id: crypto.randomUUID(),
    day: refs.day.value,
    type: refs.type.value,
    name: refs.name.value.trim(),
    ingredients: refs.ingredients.value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
  };

  if (!meal.day || !meal.type || !meal.name) {
    return;
  }

  state.push(meal);
  persist();
  refs.form.reset();
  render();
});

refs.clearWeek.addEventListener("click", () => {
  const accepted = window.confirm("¿Seguro que quieres borrar todas las comidas de la semana?");
  if (!accepted) return;

  state = [];
  persist();
  render();
});

refs.exportBtn.addEventListener("click", () => {
  const payload = JSON.stringify(state, null, 2);
  const blob = new Blob([payload], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "plan-semanal-comidas.json";
  a.click();
  URL.revokeObjectURL(url);
});

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function render() {
  refs.weekBoard.innerHTML = "";

  for (const day of DAYS) {
    const column = refs.dayColumnTemplate.content.firstElementChild.cloneNode(true);
    column.querySelector(".day-title").textContent = day;
    const list = column.querySelector(".meal-list");

    const meals = state
      .filter((meal) => meal.day === day)
      .sort((a, b) => a.type.localeCompare(b.type, "es"));

    if (!meals.length) {
      const empty = document.createElement("li");
      empty.className = "empty";
      empty.textContent = "Sin comidas planeadas";
      list.appendChild(empty);
    } else {
      for (const meal of meals) {
        list.appendChild(createMealElement(meal));
      }
    }

    refs.weekBoard.appendChild(column);
  }

  renderShoppingList();
}

function createMealElement(meal) {
  const item = document.createElement("li");
  item.className = "meal-item";

  const header = document.createElement("header");

  const info = document.createElement("div");
  info.innerHTML = `<div class="meal-type">${meal.type}</div><div class="meal-name">${escapeHtml(meal.name)}</div>`;

  const removeButton = document.createElement("button");
  removeButton.className = "delete-btn";
  removeButton.type = "button";
  removeButton.textContent = "Eliminar";
  removeButton.addEventListener("click", () => {
    state = state.filter((entry) => entry.id !== meal.id);
    persist();
    render();
  });

  header.append(info, removeButton);

  item.appendChild(header);

  if (meal.ingredients.length) {
    const ingredients = document.createElement("p");
    ingredients.className = "ingredients";
    ingredients.textContent = `Ingredientes: ${meal.ingredients.join(", ")}`;
    item.appendChild(ingredients);
  }

  return item;
}

function renderShoppingList() {
  refs.shoppingList.innerHTML = "";
  const counts = new Map();

  for (const meal of state) {
    for (const ingredient of meal.ingredients) {
      const key = ingredient.toLowerCase();
      counts.set(key, (counts.get(key) || 0) + 1);
    }
  }

  if (!counts.size) {
    const li = document.createElement("li");
    li.className = "empty";
    li.textContent = "Aún no hay ingredientes para comprar.";
    refs.shoppingList.appendChild(li);
    return;
  }

  const sorted = [...counts.entries()].sort((a, b) => a[0].localeCompare(b[0], "es"));
  for (const [ingredient, amount] of sorted) {
    const li = document.createElement("li");
    li.textContent = `${ingredient} (${amount})`;
    refs.shoppingList.appendChild(li);
  }
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
