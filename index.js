let tasks = [];
let currentFilter = 'all';
const API_URL = 'https://jsonplaceholder.typicode.com/todos';

const navHome = document.getElementById('nav-home');
const navApp = document.getElementById('nav-app');
const homeView = document.getElementById('home-view');
const appView = document.getElementById('app-view');
const getStartedBtn = document.getElementById('get-started-btn');

const taskForm = document.getElementById('task-form');
const taskInput = document.getElementById('task-input');
const taskList = document.getElementById('task-list');
const errorBanner = document.getElementById('error-banner');
const taskCounter = document.getElementById('task-counter');
const filterButtons = document.querySelectorAll('.filter-btn');

function switchView(viewName) {
    if (viewName === 'home') {
        homeView.classList.add('active-view');
        homeView.classList.remove('hidden');
        appView.classList.remove('active-view');
        appView.classList.add('hidden');
        navHome.classList.add('active');
        navApp.classList.remove('active');
    } else {
        appView.classList.add('active-view');
        appView.classList.remove('hidden');
        homeView.classList.remove('active-view');
        homeView.classList.add('hidden');
        navApp.classList.add('active');
        navHome.classList.remove('active');
        
        if (tasks.length === 0) {
            fetchTasks();
        }
    }
}

function showError(message) {
    errorBanner.textContent = message;
    errorBanner.classList.remove('hidden');
    setTimeout(() => {
        errorBanner.classList.add('hidden');
    }, 5000);
}

function escapeHTML(str) {
    return String(str).replace(/[&<>"']/g, char => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    }[char]));
}
const englishTitles = [
    'complete javascript assingment',
    'review pull requests',
    'practice DOM manipulation',
    'prepare presentation slides',
];

async function fetchTasks() {
    try {
        const response = await fetch(`${API_URL}?_limit=4`);
        if (!response.ok) throw new Error('Failed to fetch tasks.');

        const data = await response.json();

        tasks = data.map((item, index) => ({
            id: item.id,
            title: englishTitles[index] || 'Task ${index + 1}',
            completed: item.completed
        }));
        renderTasks();
    } catch (error) {
        showError('Could not load tasks. Please check your internet connection.');
        console.error(error);
    }
}

async function postTask(newTaskTitle) {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                title: newTaskTitle,
                completed: false,
                userId: 1
            })
        });

        if (!response.ok) throw new Error('Failed to save task on server.');

        const savedTask = await response.json();

        tasks.unshift({
            id: savedTask.id ?? Date.now(),
            title: savedTask.title,
            completed: false
        });

        renderTasks();
    } catch (error) {
        showError('Error adding task. Saved locally instead.');

        tasks.unshift({
            id: Date.now(),
            title: newTaskTitle,
            completed: false
        });
        renderTasks();
    }
}

function renderTasks() {
    taskList.innerHTML = '';

    const filteredTasks = tasks.filter(task => {
        if (currentFilter === 'pending') return !task.completed;
        if (currentFilter === 'completed') return task.completed;
        return true;
    });

    if (filteredTasks.length === 0) {
        taskList.innerHTML = '<li style="text-align: center; padding: 1.5rem; color: #3b4451;">No tasks found.</li>';
    }

    filteredTasks.forEach(task => {
        const li = document.createElement('li');
        li.className = `task-item ${task.completed ? 'completed' : ''}`;
        li.dataset.id = task.id;

        li.innerHTML = `
            <div class="task-info">
                <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
                <span class="task-text">${escapeHTML(task.title)}</span>
            </div>
            <button class="delete-btn">Delete</button>
        `;

        taskList.appendChild(li);
    });

    updateCounter();
}

function updateCounter() {
    const pendingCount = tasks.filter(task => !task.completed).length;

    if (pendingCount === 1) {
        taskCounter.textContent = '1 task remaining';
    } else {
        taskCounter.textContent = `${pendingCount} tasks remaining`;
    }
}

taskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = taskInput.value.trim();
    if (!title) return;

    postTask(title);
    taskInput.value = '';
});

document.addEventListener('click', (e) => {
    if (e.target === navHome) switchView('home');
    if (e.target === navApp || e.target === getStartedBtn) switchView('app');

    if (e.target.classList.contains('filter-btn')) {
        filterButtons.forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');
        currentFilter = e.target.dataset.filter;
        renderTasks();
    }

    if (e.target.classList.contains('delete-btn')) {
        const taskItem = e.target.closest('.task-item');
        if (!taskItem) return;

        const taskId = Number(taskItem.dataset.id);
        tasks = tasks.filter(task => task.id !== taskId);
        renderTasks();
    }
});

taskList.addEventListener('change', (e) => {
    if (e.target.classList.contains('task-checkbox')) {
        const taskItem = e.target.closest('.task-item');
        if (!taskItem) return;

        const taskId = Number(taskItem.dataset.id);
        const task = tasks.find(item => item.id === taskId);

        if (task) {
            task.completed = e.target.checked;
            renderTasks();
        }
    }
});