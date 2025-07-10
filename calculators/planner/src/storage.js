/* storage.js – save/load Planner scenario from localStorage */

const key = 'plannerScenario';

export function saveScenario(data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error("❌ Failed to save scenario:", err);
  }
}

export function loadScenario() {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    console.error("❌ Failed to load scenario:", err);
    return null;
  }
}
