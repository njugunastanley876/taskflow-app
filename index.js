// State Management
let tasks = [];
let currentFilter = 'all';
const API_URL = 'https://jsonplaceholder.typicode.com/todos';

// DOM Element References
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

// --- 1. SPA View Switching Logic ---
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
        
        // Fetch tasks on initial load of the app view if empty
        if (tasks.length === 0) {
            fetchTasks();
        }
    }
}

// --- Error Handling Utility ---
function showError(message) {
    errorBanner.textContent = message;
    errorBanner.classList.remove('hidden');
    setTimeout(() => {
        errorBanner.classList.add('hidden');
    }, 5000);
}

// --- 2. API Requests: GET & POST ---
const englishTitles = [
    "complete javascript work",
    "Finish assignments",
    "Push work to github",
    "Go for exercises",
    "Take rest while reading book",
];
async function fetchTasks() {
    try {
        const response = await fetch(`${API_URL}?_limit=4`)
        if (!response.ok) throw new Error('Failed to fetch tasks.');

        const data = await response.json();
        //map data to local structure with English titles
        tasks = data.map((item, index) => ({
            id: item.id,
            title: englishTitles[index] || item.title,
            completed:item.completed
        }));
        renderTasks();
    } catch (error) {
        showError('could not load tasks. please check your internet connection.');
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
            }),
        });

        if (!response.ok) throw new Error('Failed to save task on server.');

        const savedTask = await response.json();
        
        // Append to local state with a unique client-side safeguard ID if needed
        tasks.unshift({
            id: Date.now(), // Fallback unique ID
            title: savedTask.title,
            completed: false
        });
        
        renderTasks();
    } catch (error) {
        showError('Error adding task. Saved locally instead.');
        // Graceful fallback: add locally even if network request fails
        tasks.unshift({
            id: Date.now(),
            title: newTaskTitle,
            completed: false
        });
        renderTasks();
    }
}

// --- Rendering & UI Updates ---
function renderTasks() {
    taskList.innerHTML = '';

    // Filter tasks based on active selection
    const filteredTasks = tasks.filter(task => {
        if (currentFilter === 'pending') return !task.completed;
        if (currentFilter === 'completed') return task.completed;
        return true; // 'all'
    });

    if (filteredTasks.length === 0) {
        taskList.innerHTML = `<li style="text-align: center; padding: 1.5rem; color: #64748b;">No tasks found.</li>`;
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
    const pendingCount = tasks.filter(t => !t.completed).length;
    taskCounter.textContent = `${pendingCount} task${pendingCount === 1 ? '' : 's'} remaining`;
}

// Security utility to prevent basic XSS injection
function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
        tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
}

// --- 3. Event Listeners (Requirement: submit, click, change) ---

// 1. SUBMIT Event Listener: Handles form submission for new tasks
taskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = taskInput.value.trim();
    if (!title) return;

    postTask(title);
    taskInput.value = '';
});

// 2. CLICK Event Listener: Handles navigation, filters, deletions, and CTAs
document.addEventListener('click', (e) => {
    // Navigation clicks
    if (e.target === navHome) switchView('home');
    if (e.target === navApp || e.target === getStartedBtn) switchView('app');

    // Filter button clicks
    if (e.target.classList.contains('filter-btn')) {
        filterButtons.forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');
        currentFilter = e.target.dataset.filter;
        renderTasks();
    }

    // Delete task button clicks
    if (e.target.classList.contains('delete-btn')) {
        const taskItem = e.target.closest('.task-item');
        const taskId = Number(taskItem.dataset.id);
        tasks = tasks.filter(t => t.id !== taskId);
        renderTasks();
    }
});

// 3. CHANGE Event Listener: Handles checkbox toggling for task completion status
taskList.addEventListener('change', (e) => {
    if (e.target.classList.contains('task-checkbox')) {
        const taskItem = e.target.closest('.task-item');
        const taskId = Number(taskItem.dataset.id);
        const task = tasks.find(t => t.id === taskId);
        
        if (task) {
            task.completed = e.target.checked;
            renderTasks();
        }
    }
});