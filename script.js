document.addEventListener('DOMContentLoaded', () => {
    const taskInput = document.getElementById('taskInput');
    const addTaskBtn = document.getElementById('addTaskBtn');
    const taskList = document.getElementById('taskList');
    const itemsLeft = document.getElementById('itemsLeft');
    const clearCompletedBtn = document.getElementById('clearCompleted');
    const filterBtns = document.querySelectorAll('.filter-btn');

    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    let currentFilter = 'all';

    // Initial render
    renderTasks();

    // Event Listeners
    addTaskBtn.addEventListener('click', addTask);
    taskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addTask();
    });

    clearCompletedBtn.addEventListener('click', () => {
        tasks = tasks.filter(task => !task.completed);
        saveToLocalStorage();
        renderTasks(); // Render here is a bulk operation
    });

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            renderTasks();
        });
    });

    function saveToLocalStorage() {
        localStorage.setItem('tasks', JSON.stringify(tasks));
        updateStats();
    }

    function updateStats() {
        const activeCount = tasks.filter(task => !task.completed).length;
        itemsLeft.textContent = `${activeCount} item${activeCount !== 1 ? 's' : ''} left`;
    }

    function addTask() {
        const text = taskInput.value.trim();
        if (text) {
            const newTask = {
                id: Date.now(),
                text: text,
                completed: false,
                important: false,
                createdAt: new Date()
            };
            tasks.unshift(newTask); // Add to top
            taskInput.value = '';
            saveToLocalStorage();
            
            // Incrementally add to DOM if filter allows
            if (currentFilter !== 'completed') {
                const li = createTaskElement(newTask);
                // Try to place it after important items
                const importantItems = taskList.querySelectorAll('.important');
                if (importantItems.length > 0) {
                    importantItems[importantItems.length - 1].after(li);
                } else {
                    taskList.prepend(li);
                }
            }
        }
    }

    function toggleTask(id, li) {
        const task = tasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            saveToLocalStorage();
            
            // Update DOM directly for smooth transition
            if (task.completed) {
                li.classList.add('completed');
                li.querySelector('.task-checkbox').checked = true;
            } else {
                li.classList.remove('completed');
                li.querySelector('.task-checkbox').checked = false;
            }

            // Remove smoothly if it no longer matches current filter
            if (currentFilter === 'active' && task.completed) {
                removeElementSmoothly(li);
            } else if (currentFilter === 'completed' && !task.completed) {
                removeElementSmoothly(li);
            }
        }
    }

    function toggleImportant(id, li) {
        const task = tasks.find(t => t.id === id);
        if (task) {
            task.important = !task.important;
            saveToLocalStorage();
            
            // Update DOM directly
            const impBtn = li.querySelector('.important-btn');
            const svg = impBtn.querySelector('svg');
            if (task.important) {
                li.classList.add('important');
                impBtn.classList.add('active');
                svg.setAttribute('fill', 'var(--star-color)');
                svg.setAttribute('stroke', 'var(--star-color)');
            } else {
                li.classList.remove('important');
                impBtn.classList.remove('active');
                svg.setAttribute('fill', 'none');
                svg.setAttribute('stroke', 'currentColor');
            }
            // For app-like smoothness, we do not instantly jump it to the top.
            // It will be sorted correctly on the next page load or filter toggle.
        }
    }

    function removeElementSmoothly(element) {
        element.style.transition = 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)';
        element.style.transform = 'scale(0.95) translateX(-20px)';
        element.style.opacity = '0';
        element.style.marginBottom = `-${element.offsetHeight}px`; // collapse space
        setTimeout(() => element.remove(), 300);
    }

    function deleteTask(id, li) {
        removeElementSmoothly(li);
        tasks = tasks.filter(task => task.id !== id);
        saveToLocalStorage();
    }

    function renderTasks() {
        taskList.innerHTML = '';
        
        const filteredTasks = tasks.filter(task => {
            if (currentFilter === 'active') return !task.completed;
            if (currentFilter === 'completed') return task.completed;
            return true;
        });

        const sortedTasks = [...filteredTasks].sort((a, b) => {
            if (a.important === b.important) return 0;
            return a.important ? -1 : 1;
        });

        sortedTasks.forEach(task => {
            const li = createTaskElement(task);
            taskList.appendChild(li);
        });

        updateStats();
    }

    function createTaskElement(task) {
        const li = document.createElement('li');
        li.className = `task-item ${task.completed ? 'completed' : ''} ${task.important ? 'important' : ''}`;
        li.dataset.id = task.id;
        
        li.innerHTML = `
            <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
            <button class="important-btn ${task.important ? 'active' : ''}" aria-label="Mark important">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="${task.important ? 'var(--star-color)' : 'none'}" stroke="${task.important ? 'var(--star-color)' : 'currentColor'}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
            </button>
            <span class="task-text">${task.text}</span>
            <button class="delete-btn" aria-label="Delete task">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>
        `;

        const checkbox = li.querySelector('.task-checkbox');
        checkbox.addEventListener('change', () => toggleTask(task.id, li));

        const impBtn = li.querySelector('.important-btn');
        impBtn.addEventListener('click', () => toggleImportant(task.id, li));

        const delBtn = li.querySelector('.delete-btn');
        delBtn.addEventListener('click', () => deleteTask(task.id, li));

        // Add swipe gesture logic for an app-like feel
        let startX = 0;
        let currentX = 0;
        let isSwiping = false;

        li.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            isSwiping = true;
            li.style.transition = 'none'; // Disable transition during drag
        }, {passive: true});

        li.addEventListener('touchmove', (e) => {
            if (!isSwiping) return;
            currentX = e.touches[0].clientX - startX;
            
            // Limit swipe extent
            const limitedX = Math.max(-100, Math.min(100, currentX));
            li.style.transform = `translateX(${limitedX}px)`;
            
            // Visual feedback as limits are reached
            if (limitedX < -60) {
                li.style.opacity = '0.6'; // delete intent
            } else if (limitedX > 60) {
                li.style.opacity = '0.6'; // toggle intent
            } else {
                li.style.opacity = '1';
            }
        }, {passive: true});

        li.addEventListener('touchend', () => {
            if (!isSwiping) return;
            isSwiping = false;
            li.style.transition = 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.4s ease, margin-bottom 0.4s ease'; // re-enable transitions
            
            if (currentX < -60) {
                // Actions: Swipe Left to Delete
                li.style.transform = `translateX(-100%)`;
                li.style.opacity = '0';
                setTimeout(() => deleteTask(task.id, li), 300);
            } else if (currentX > 60) {
                // Actions: Swipe Right to Toggle Status
                li.style.transform = `translateX(100%)`;
                li.style.opacity = '0';
                setTimeout(() => {
                    toggleTask(task.id, li);
                    li.style.transform = `translateX(0)`;
                    li.style.opacity = '1';
                }, 300);
            } else {
                // Snap back if threshold not met
                li.style.transform = 'translateX(0)';
                li.style.opacity = '1';
            }
        });

        return li;
    }

    // Register Service Worker for PWA
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('sw.js').then(registration => {
                console.log('SW registered successfully');
            }).catch(error => {
                console.log('SW registration failed:', error);
            });
        });
    }
});
