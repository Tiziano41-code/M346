const API = '/api';

const PRIORITY_LABEL = { low: 'Tief', medium: 'Mittel', high: 'Hoch' };

async function loadTasks() {
  try {
    const res = await fetch(`${API}/tasks`);
    const tasks = await res.json();
    const list = document.getElementById('taskList');
    list.innerHTML = '';
    tasks.forEach(t => {
      const li = document.createElement('li');
      if (t.done) li.classList.add('done');
      li.innerHTML = `
        <input type="checkbox" ${t.done ? 'checked' : ''} onchange="toggleTask(${t.id}, this.checked)">
        <span class="task-text">${escapeHtml(t.title)}</span>
        <span class="priority priority-${t.priority}">${PRIORITY_LABEL[t.priority]}</span>
        <span class="date">${t.created_at}</span>
        <button class="delete-btn" onclick="confirmDelete(${t.id})">Löschen</button>
      `;
      list.appendChild(li);
    });
    setStatus('', false);
  } catch (e) {
    setStatus('Fehler: Backend nicht erreichbar', true);
  }
}

async function addTask() {
  const input = document.getElementById('taskInput');
  const priority = document.getElementById('prioritySelect').value;
  const title = input.value.trim();
  if (!title) { setStatus('Bitte eine Aufgabe eingeben', true); return; }
  await fetch(`${API}/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, priority })
  });
  input.value = '';
  loadTasks();
}

async function toggleTask(id, done) {
  await fetch(`${API}/tasks/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ done })
  });
  loadTasks();
}

function confirmDelete(id) {
  if (confirm('Aufgabe wirklich löschen?')) {
    deleteTask(id);
  }
}

async function deleteTask(id) {
  await fetch(`${API}/tasks/${id}`, { method: 'DELETE' });
  loadTasks();
}

function setStatus(msg, isError) {
  const el = document.getElementById('status');
  el.textContent = msg;
  el.className = 'status' + (isError ? '' : ' ok');
}

function escapeHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

document.getElementById('taskInput').addEventListener('keydown', e => {
  if (e.key === 'Enter') addTask();
});

loadTasks();
