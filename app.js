const STORAGE_KEY = "mealPlannerData.v2";
const SETTINGS_KEY = "mealPlannerSettings.v1";
const OPENAI_BASE_URL = "https://api.openai.com/v1";
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
  apiKey: document.querySelector("#apiKey"),
  textModel: document.querySelector("#textModel"),
  imageModel: document.querySelector("#imageModel"),
  imageSize: document.querySelector("#imageSize"),
  goal: document.querySelector("#goal"),
  generatePlanBtn: document.querySelector("#generatePlanBtn"),
  aiStatus: document.querySelector("#aiStatus"),
};

let state = loadState();
hydrateSettings();
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
    imageUrl: "",
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

refs.generatePlanBtn.addEventListener("click", async () => {
  const goal = refs.goal.value.trim();
  if (!goal) {
    setStatus("Escribe primero un objetivo para el menú.");
    return;
  }

  try {
    toggleAIControls(true);
    setStatus("Generando plan con IA...");

    const plan = await generatePlanWithAI(goal);
    if (!plan.length) {
      setStatus("La IA no devolvió comidas válidas.");
      return;
    }

    const normalized = plan.map((entry) => ({
      id: crypto.randomUUID(),
      day: DAYS.includes(entry.day) ? entry.day : "Lunes",
      type: normalizeMealType(entry.type),
      name: String(entry.name || "Platillo sin nombre").trim(),
      ingredients: Array.isArray(entry.ingredients)
        ? entry.ingredients.map((x) => String(x).trim()).filter(Boolean)
        : [],
      imageUrl: "",
    }));

    state = [...state, ...normalized];
    persist();
    render();
    setStatus(`Se agregaron ${normalized.length} comidas con IA.`);
  } catch (error) {
    setStatus(`Error IA: ${error.message}`);
  } finally {
    toggleAIControls(false);
  }
});

for (const el of [refs.apiKey, refs.textModel, refs.imageModel, refs.imageSize]) {
  el.addEventListener("input", persistSettings);
}

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

function hydrateSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);
    refs.apiKey.value = data.apiKey || "";
    refs.textModel.value = data.textModel || "gpt-4.1-mini";
    refs.imageModel.value = data.imageModel || "gpt-image-1";
    refs.imageSize.value = data.imageSize || "1024x1024";
  } catch {
    // no-op
  }
}

function persistSettings() {
  localStorage.setItem(
    SETTINGS_KEY,
    JSON.stringify({
      apiKey: refs.apiKey.value,
      textModel: refs.textModel.value,
      imageModel: refs.imageModel.value,
      imageSize: refs.imageSize.value,
    }),
  );
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
  info.innerHTML = `<div class="meal-type">${escapeHtml(meal.type)}</div><div class="meal-name">${escapeHtml(meal.name)}</div>`;

  const actions = document.createElement("div");
  actions.className = "meal-actions";

  const imageButton = document.createElement("button");
  imageButton.className = "secondary small-btn";
  imageButton.type = "button";
  imageButton.textContent = meal.imageUrl ? "Regenerar imagen IA" : "Generar imagen IA";
  imageButton.addEventListener("click", async () => {
    try {
      imageButton.disabled = true;
      imageButton.textContent = "Generando...";
      const imageUrl = await generateImageForMeal(meal);
      state = state.map((entry) => (entry.id === meal.id ? { ...entry, imageUrl } : entry));
      persist();
      render();
      setStatus(`Imagen creada para ${meal.name}.`);
    } catch (error) {
      setStatus(`Error imagen IA: ${error.message}`);
      imageButton.disabled = false;
      imageButton.textContent = "Generar imagen IA";
    }
  });

  const removeButton = document.createElement("button");
  removeButton.className = "delete-btn small-btn";
  removeButton.type = "button";
  removeButton.textContent = "Eliminar";
  removeButton.addEventListener("click", () => {
    state = state.filter((entry) => entry.id !== meal.id);
    persist();
    render();
  });

  actions.append(imageButton, removeButton);
  header.append(info, actions);

  item.appendChild(header);

  if (meal.ingredients.length) {
    const ingredients = document.createElement("p");
    ingredients.className = "ingredients";
    ingredients.textContent = `Ingredientes: ${meal.ingredients.join(", ")}`;
    item.appendChild(ingredients);
  }

  if (meal.imageUrl) {
    const image = document.createElement("img");
    image.className = "meal-image";
    image.alt = `Imagen de ${meal.name}`;
    image.loading = "lazy";
    image.src = meal.imageUrl;
    item.appendChild(image);
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

async function generatePlanWithAI(goal) {
  const key = refs.apiKey.value.trim();
  const model = refs.textModel.value.trim() || "gpt-4.1-mini";
  if (!key) {
    throw new Error("Falta API Key para usar IA.");
  }

  const prompt = [
    "Eres un nutricionista y chef. Responde solo con JSON válido.",
    "Genera 10 comidas para una semana en español.",
    "Formato exacto: [{\"day\":\"Lunes\",\"type\":\"Comida\",\"name\":\"...\",\"ingredients\":[\"...\"]}]",
    "Días permitidos: Lunes, Martes, Miércoles, Jueves, Viernes, Sábado, Domingo.",
    "Tipos permitidos: Desayuno, Comida, Cena, Snack.",
    `Objetivo del usuario: ${goal}`,
  ].join("\n");

  const response = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.7,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    throw new Error(`Error API texto (${response.status})`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || "[]";
  const parsed = safeParseJSONArray(content);

  return parsed.filter(
    (item) => item && typeof item === "object" && item.day && item.type && item.name,
  );
}

async function generateImageForMeal(meal) {
  const key = refs.apiKey.value.trim();
  const model = refs.imageModel.value.trim() || "gpt-image-1";
  const size = refs.imageSize.value;

  if (!key) {
    throw new Error("Falta API Key para generar imágenes.");
  }

  const prompt = `Fotografía gastronómica realista y apetecible de ${meal.name}. Ingredientes clave: ${meal.ingredients.join(
    ", ",
  )}. Composición profesional, iluminación natural.`;

  const response = await fetch(`${OPENAI_BASE_URL}/images/generations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model,
      size,
      prompt,
    }),
  });

  if (!response.ok) {
    throw new Error(`Error API imagen (${response.status})`);
  }

  const data = await response.json();
  const b64 = data.data?.[0]?.b64_json;
  const url = data.data?.[0]?.url;

  if (url) return url;
  if (b64) return `data:image/png;base64,${b64}`;
  throw new Error("No se recibió imagen de la API.");
}

function normalizeMealType(type) {
  const allowed = ["Desayuno", "Comida", "Cena", "Snack"];
  return allowed.includes(type) ? type : "Comida";
}

function safeParseJSONArray(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    const start = raw.indexOf("[");
    const end = raw.lastIndexOf("]");
    if (start < 0 || end < 0 || end <= start) return [];
    try {
      return JSON.parse(raw.slice(start, end + 1));
    } catch {
      return [];
    }
  }
}

function setStatus(message) {
  refs.aiStatus.textContent = message;
}

function toggleAIControls(disabled) {
  refs.generatePlanBtn.disabled = disabled;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
