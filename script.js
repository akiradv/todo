document.addEventListener('DOMContentLoaded', () => {
    // Configuração do tema
    const themeToggle = document.getElementById('theme-toggle');
    const themeIcon = themeToggle.querySelector('i');
    
    // Verificar se há um tema salvo no localStorage
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        themeIcon.classList.remove('fa-moon');
        themeIcon.classList.add('fa-sun');
    }
    
    // Alternar entre temas claro e escuro
    themeToggle.addEventListener('click', function() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        
        if (currentTheme === 'dark') {
            document.documentElement.removeAttribute('data-theme');
            localStorage.setItem('theme', 'light');
            themeIcon.classList.remove('fa-sun');
            themeIcon.classList.add('fa-moon');
        } else {
            document.documentElement.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
            themeIcon.classList.remove('fa-moon');
            themeIcon.classList.add('fa-sun');
        }
    });
    
    // Elementos DOM
    const taskInput = document.getElementById('task-input');
    const addButton = document.getElementById('add-button');
    const taskList = document.getElementById('task-list');
    const tasksCounter = document.getElementById('tasks-counter');
    const clearCompletedBtn = document.getElementById('clear-completed');
    const filters = document.querySelectorAll('.filter');
    
    // Detectar se é dispositivo móvel
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // Estado da aplicação
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    let currentFilter = 'all';
    
    // Inicialização
    renderTasks();
    updateTasksCounter();
    
    // Event Listeners
    addButton.addEventListener('click', addTask);
    taskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addTask();
    });
    
    // Foco automático no input em dispositivos não móveis
    if (!isMobile) {
        taskInput.focus();
    }
    
    // Prevenir zoom em dispositivos móveis ao focar no input
    if (isMobile) {
        taskInput.addEventListener('focus', () => {
            document.documentElement.style.fontSize = '16px';
        });
    }
    
    taskList.addEventListener('click', (e) => {
        const taskItem = e.target.closest('.task-item');
        if (!taskItem) return;
        
        const taskId = parseInt(taskItem.dataset.id);
        
        if (e.target.classList.contains('task-checkbox')) {
            toggleTaskStatus(taskId);
        } else if (e.target.classList.contains('delete-btn') || e.target.closest('.delete-btn')) {
            deleteTask(taskId);
        }
    });
    
    // Adicionar suporte para gestos de deslize em dispositivos móveis
    if (isMobile) {
        let touchStartX = 0;
        let touchEndX = 0;
        const minSwipeDistance = 50;
        
        taskList.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });
        
        taskList.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            handleSwipe(e);
        }, { passive: true });
        
        function handleSwipe(e) {
            const swipeDistance = touchEndX - touchStartX;
            if (Math.abs(swipeDistance) < minSwipeDistance) return;
            
            const taskItem = e.target.closest('.task-item');
            if (!taskItem) return;
            
            const taskId = parseInt(taskItem.dataset.id);
            
            if (swipeDistance < 0) {
                // Deslize para a esquerda - excluir tarefa
                deleteTask(taskId);
            } else {
                // Deslize para a direita - alternar status
                toggleTaskStatus(taskId);
            }
        }
    }
    
    clearCompletedBtn.addEventListener('click', clearCompletedTasks);
    
    filters.forEach(filter => {
        filter.addEventListener('click', () => {
            setCurrentFilter(filter.dataset.filter);
        });
    });
    
    // Funções
    function addTask() {
        const taskText = taskInput.value.trim();
        if (taskText === '') return;
        
        const newTask = {
            id: Date.now(),
            text: taskText,
            completed: false,
            createdAt: new Date().toISOString()
        };
        
        tasks.push(newTask);
        saveTasksToLocalStorage();
        renderTasks();
        updateTasksCounter();
        
        taskInput.value = '';
        taskInput.focus();
    }
    
    function toggleTaskStatus(taskId) {
        tasks = tasks.map(task => {
            if (task.id === taskId) {
                return { ...task, completed: !task.completed };
            }
            return task;
        });
        
        saveTasksToLocalStorage();
        renderTasks();
        updateTasksCounter();
    }
    
    function deleteTask(taskId) {
        // Encontrar a tarefa para mostrar no diálogo de confirmação
        const taskToDelete = tasks.find(task => task.id === taskId);
        if (!taskToDelete) return;
        
        // Verificar se a tarefa está concluída
        if (!taskToDelete.completed) {
            // Criar e mostrar o modal de confirmação
            showConfirmationModal(taskId, taskToDelete.text);
        } else {
            // Se a tarefa já estiver concluída, excluir diretamente
            removeTask(taskId);
        }
    }
    
    function removeTask(taskId) {
        tasks = tasks.filter(task => task.id !== taskId);
        saveTasksToLocalStorage();
        renderTasks();
        updateTasksCounter();
    }
    
    function showConfirmationModal(taskId, taskText) {
        // Remover qualquer modal existente
        const existingModal = document.querySelector('.confirmation-modal');
        if (existingModal) {
            existingModal.remove();
        }
        
        // Criar o modal de confirmação
        const modal = document.createElement('div');
        modal.className = 'confirmation-modal';
        
        modal.innerHTML = `
            <div class="modal-content">
                <h3>Confirmar exclusão</h3>
                <p>Você tem certeza que deseja excluir a tarefa não concluída?</p>
                <p class="task-preview">${escapeHTML(taskText)}</p>
                <div class="modal-buttons">
                    <button class="cancel-btn">Cancelar</button>
                    <button class="confirm-btn">Excluir</button>
                </div>
            </div>
        `;
        
        // Adicionar o modal ao corpo do documento
        document.body.appendChild(modal);
        
        // Animar a entrada do modal
        setTimeout(() => {
            modal.classList.add('show');
        }, 10);
        
        // Adicionar event listeners aos botões
        const cancelBtn = modal.querySelector('.cancel-btn');
        const confirmBtn = modal.querySelector('.confirm-btn');
        
        cancelBtn.addEventListener('click', () => {
            closeModal(modal);
        });
        
        confirmBtn.addEventListener('click', () => {
            closeModal(modal);
            removeTask(taskId);
        });
        
        // Fechar o modal ao clicar fora dele
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal(modal);
            }
        });
    }
    
    function closeModal(modal) {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.remove();
        }, 300);
    }
    
    function clearCompletedTasks() {
        // Verificar se há tarefas concluídas para excluir
        const completedTasks = tasks.filter(task => task.completed);
        if (completedTasks.length === 0) return;
        
        // Criar e mostrar o modal de confirmação
        const modal = document.createElement('div');
        modal.className = 'confirmation-modal';
        
        modal.innerHTML = `
            <div class="modal-content">
                <h3>Confirmar exclusão</h3>
                <p>Você tem certeza que deseja excluir todas as ${completedTasks.length} tarefas concluídas?</p>
                <div class="modal-buttons">
                    <button class="cancel-btn">Cancelar</button>
                    <button class="confirm-btn">Excluir</button>
                </div>
            </div>
        `;
        
        // Adicionar o modal ao corpo do documento
        document.body.appendChild(modal);
        
        // Animar a entrada do modal
        setTimeout(() => {
            modal.classList.add('show');
        }, 10);
        
        // Adicionar event listeners aos botões
        const cancelBtn = modal.querySelector('.cancel-btn');
        const confirmBtn = modal.querySelector('.confirm-btn');
        
        cancelBtn.addEventListener('click', () => {
            closeModal(modal);
        });
        
        confirmBtn.addEventListener('click', () => {
            closeModal(modal);
            // Excluir tarefas concluídas
            tasks = tasks.filter(task => !task.completed);
            saveTasksToLocalStorage();
            renderTasks();
            updateTasksCounter();
        });
        
        // Fechar o modal ao clicar fora dele
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal(modal);
            }
        });
    }
    
    function setCurrentFilter(filter) {
        currentFilter = filter;
        
        filters.forEach(f => {
            if (f.dataset.filter === filter) {
                f.classList.add('active');
            } else {
                f.classList.remove('active');
            }
        });
        
        renderTasks();
    }
    
    function renderTasks() {
        taskList.innerHTML = '';
        
        const filteredTasks = filterTasks();
        
        if (filteredTasks.length === 0) {
            // Mostrar mensagem quando não há tarefas
            const emptyMessage = document.createElement('li');
            emptyMessage.className = 'empty-message';
            emptyMessage.textContent = currentFilter === 'all' ? 
                'Nenhuma tarefa adicionada ainda.' : 
                currentFilter === 'active' ? 
                    'Nenhuma tarefa ativa.' : 
                    'Nenhuma tarefa concluída.';
            taskList.appendChild(emptyMessage);
            return;
        }
        
        filteredTasks.forEach(task => {
            const taskItem = document.createElement('li');
            taskItem.className = `task-item ${task.completed ? 'completed' : ''}`;
            taskItem.dataset.id = task.id;
            
            // Adicionar dica visual para deslize em dispositivos móveis
            const swipeHint = isMobile ? '<div class="swipe-hint">Deslize para ações</div>' : '';
            
            taskItem.innerHTML = `
                <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
                <span class="task-text">${escapeHTML(task.text)}</span>
                <button class="delete-btn" aria-label="Excluir tarefa"><i class="fas fa-trash"></i></button>
                ${swipeHint}
            `;
            
            taskList.appendChild(taskItem);
        });
    }
    
    function filterTasks() {
        switch (currentFilter) {
            case 'active':
                return tasks.filter(task => !task.completed);
            case 'completed':
                return tasks.filter(task => task.completed);
            default:
                return [...tasks];
        }
    }
    
    function updateTasksCounter() {
        const remainingTasks = tasks.filter(task => !task.completed).length;
        tasksCounter.textContent = `${remainingTasks} tarefa${remainingTasks !== 1 ? 's' : ''} restante${remainingTasks !== 1 ? 's' : ''}`;
    }
    
    function saveTasksToLocalStorage() {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }
    
    // Função de segurança para evitar XSS
    function escapeHTML(str) {
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
});