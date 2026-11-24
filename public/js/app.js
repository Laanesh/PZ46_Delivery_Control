const list = document.querySelector("#parcel-list");
const status = document.querySelector("#status");
const summary = document.querySelector("#summary");
const scenario = document.querySelector("#scenario");
const loadButton = document.querySelector("#load-button");
const cancelButton = document.querySelector("#cancel-button");
let activeController = null;
let serial = 0;
function setStatus(message, kind = "info") {
  status.textContent = message;
  status.dataset.kind = kind;
}
function renderParcels(items) {
  // TODO 1: выведите карточки доставок через createElement/textContent.
  // Пустой массив должен отображаться сообщением, а не ошибкой.
}
async function loadParcels() {
  // TODO 2: для каждого запроса создайте новый AbortController, signal и таймер 2500 мс.
  // При новом запросе отменяйте предыдущий; serial поможет игнорировать устаревший ответ.
  // TODO 3: различайте HTTP 503 (response.ok === false), ошибку JSON.parse/response.json(),
  // AbortError (вручную или по тайм-ауту), сетевые ошибки.
  // TODO 4: используйте try/catch/finally, очищайте таймер и возвращайте состояние кнопок.
  setStatus("TODO: реализуйте безопасный запрос");
}
loadButton.addEventListener("click", loadParcels);
cancelButton.addEventListener("click", () => {
  // TODO 5: отмените текущий запрос через activeController.abort().
});
function renderParcels(items) {
  list.replaceChildren();
  for (const parcel of items) {
    const card = document.createElement("article");
    card.className = "card";
    card.textContent = `${parcel.id} · ${parcel.recipient} · ${parcel.destination} · ${parcel.state}`;
    list.append(card);
  }
  if (!items.length) list.textContent = "Доставок пока нет";
  summary.textContent = `Доставок: ${items.length}`;
}

async function loadParcels() {
  const attempt = ++serial;
  activeController?.abort();
  const controller = new AbortController();
  activeController = controller;
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, 2500);
  cancelButton.disabled = false;
  setStatus("Загружаем доставки");
  try {
    const response = await fetch("/api/parcels?mode=" + encodeURIComponent(scenario.value), {signal: controller.signal});
    if (response.status === 503) throw new Error("Сервис доставки временно недоступен (503)");
    if (!response.ok) throw new Error(`Ошибка сервера: ${response.status}`);
    const data = await response.json();
    if (!Array.isArray(data.items)) throw new Error("Сервер вернул неверный список доставок");
    if (attempt !== serial) return;
    renderParcels(data.items);
    setStatus("Список доставок загружен", "success");
  } catch (error) {
    if (attempt !== serial) return;
    let message = error.message;
    if (controller.signal.aborted) message = timedOut ? "Время ожидания истекло (2500 мс)" : "Запрос отменён пользователем";
    else if (error instanceof SyntaxError) message = "Сервер вернул некорректный JSON";
    else if (error instanceof TypeError) message = "Не удалось подключиться к серверу";
    setStatus(message, "error");
  } finally {
    clearTimeout(timer);
    if (attempt === serial) {
      cancelButton.disabled = true;
      activeController = null;
    }
  }
}
loadButton.addEventListener("click", loadParcels);
cancelButton.addEventListener("click", () => activeController?.abort());
