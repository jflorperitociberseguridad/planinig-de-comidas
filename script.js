const STORAGE_KEYS = {
  recipes: 'meal_planner_recipes_v1',
  plan: 'meal_planner_plan_v1',
};

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const MEALS = ['desayuno', 'almuerzo', 'cena'];

const recipeForm = document.getElementById('recipe-form');
const recipeNameInput = document.getElementById('recipe-name');
const recipeIngredientsInput = document.getElementById('recipe-ingredients');
const recipeList = document.getElementById('recipe-list');
const weeklyGrid = document.getElementById('weekly-grid');
const shoppingList = document.getElementById('shopping-list');
const dayTemplate = document.getElementById('day-template');
const clearPlanButton = document.getElementById('clear-plan');
const clearAllButton = document.getElementById('clear-all');

let recipes = loadFromStorage(STORAGE_KEYS.recipes, []);
let plan = loadFromStorage(STORAGE_KEYS.plan, createEmptyPlan());

initialize();

function initialize() {
  buildWeekUI();
  renderRecipes();
  renderPlanSelectors();
  renderShoppingList();

  recipeForm.addEventListener('submit', onRecipeSubmit);
  clearPlanButton.addEventListener('click', clearPlan);
  clearAllButton.addEventListener('click', clearAll);
}

function onRecipeSubmit(event) {
  event.preventDefault();

  const name = recipeNameInput.value.trim();
  const ingredientsRaw = recipeIngredientsInput.value.trim();

  if (!name || !ingredientsRaw) {
    return;
  }

  const ingredients = ingredientsRaw
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  const recipe = {
    id: crypto.randomUUID(),
    name,
    ingredients,
  };

  recipes.push(recipe);
  persistRecipes();

  recipeForm.reset();
  renderRecipes();
  renderPlanSelectors();
  renderShoppingList();
}

function buildWeekUI() {
  weeklyGrid.innerHTML = '';

  DAYS.forEach((day) => {
    const clone = dayTemplate.content.cloneNode(true);
    const article = clone.querySelector('.day-card');
    const title = clone.querySelector('.day-title');
    title.textContent = day;

    MEALS.forEach((meal) => {
      const selector = clone.querySelector(`select[data-meal="${meal}"]`);
      selector.dataset.day = day;
      selector.addEventListener('change', onPlanChange);
    });

    weeklyGrid.appendChild(article);
  });
}

function renderRecipes() {
  recipeList.innerHTML = '';

  if (recipes.length === 0) {
    const empty = document.createElement('li');
    empty.className = 'muted';
    empty.textContent = 'No hay recetas todavía.';
    recipeList.appendChild(empty);
    return;
  }

  recipes.forEach((recipe) => {
    const li = document.createElement('li');
    li.className = 'list-item';

    const left = document.createElement('div');
    left.innerHTML = `<strong>${recipe.name}</strong><div class="meta">${recipe.ingredients.join(', ')}</div>`;

    const removeButton = document.createElement('button');
    removeButton.className = 'inline-btn danger';
    removeButton.textContent = 'Eliminar';
    removeButton.addEventListener('click', () => removeRecipe(recipe.id));

    li.append(left, removeButton);
    recipeList.appendChild(li);
  });
}

function renderPlanSelectors() {
  const selects = weeklyGrid.querySelectorAll('select');

  selects.forEach((select) => {
    const day = select.dataset.day;
    const meal = select.dataset.meal;

    select.innerHTML = '';

    const emptyOption = document.createElement('option');
    emptyOption.value = '';
    emptyOption.textContent = '— Sin asignar —';
    select.appendChild(emptyOption);

    recipes.forEach((recipe) => {
      const option = document.createElement('option');
      option.value = recipe.id;
      option.textContent = recipe.name;
      select.appendChild(option);
    });

    select.value = plan?.[day]?.[meal] || '';
  });
}

function onPlanChange(event) {
  const select = event.target;
  const { day, meal } = select.dataset;
  const recipeId = select.value;

  if (!plan[day]) {
    plan[day] = {};
  }

  plan[day][meal] = recipeId;
  persistPlan();
  renderShoppingList();
}

function renderShoppingList() {
  shoppingList.innerHTML = '';

  const ingredientCounts = {};

  DAYS.forEach((day) => {
    MEALS.forEach((meal) => {
      const recipeId = plan?.[day]?.[meal];
      if (!recipeId) return;

      const recipe = recipes.find((item) => item.id === recipeId);
      if (!recipe) return;

      recipe.ingredients.forEach((ingredient) => {
        const key = ingredient.toLowerCase();
        ingredientCounts[key] = (ingredientCounts[key] || 0) + 1;
      });
    });
  });

  const items = Object.entries(ingredientCounts).sort((a, b) => a[0].localeCompare(b[0]));

  if (items.length === 0) {
    const empty = document.createElement('li');
    empty.className = 'muted';
    empty.textContent = 'Todavía no hay ingredientes para comprar.';
    shoppingList.appendChild(empty);
    return;
  }

  items.forEach(([ingredient, qty]) => {
    const li = document.createElement('li');
    li.className = 'list-item';
    li.textContent = `${capitalize(ingredient)} × ${qty}`;
    shoppingList.appendChild(li);
  });
}

function removeRecipe(id) {
  recipes = recipes.filter((recipe) => recipe.id !== id);

  DAYS.forEach((day) => {
    MEALS.forEach((meal) => {
      if (plan?.[day]?.[meal] === id) {
        plan[day][meal] = '';
      }
    });
  });

  persistRecipes();
  persistPlan();

  renderRecipes();
  renderPlanSelectors();
  renderShoppingList();
}

function clearPlan() {
  plan = createEmptyPlan();
  persistPlan();
  renderPlanSelectors();
  renderShoppingList();
}

function clearAll() {
  recipes = [];
  plan = createEmptyPlan();
  persistRecipes();
  persistPlan();
  renderRecipes();
  renderPlanSelectors();
  renderShoppingList();
}

function createEmptyPlan() {
  return DAYS.reduce((acc, day) => {
    acc[day] = { desayuno: '', almuerzo: '', cena: '' };
    return acc;
  }, {});
}

function persistRecipes() {
  localStorage.setItem(STORAGE_KEYS.recipes, JSON.stringify(recipes));
}

function persistPlan() {
  localStorage.setItem(STORAGE_KEYS.plan, JSON.stringify(plan));
}

function loadFromStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function capitalize(word) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}
