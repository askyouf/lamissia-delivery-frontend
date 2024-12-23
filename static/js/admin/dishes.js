// Глобальные переменные
let dishModal;
let currentDishId = null;

document.addEventListener('DOMContentLoaded', function() {
    // Инициализация модального окна
    dishModal = new bootstrap.Modal(document.getElementById('dishModal'));
    
    // Обработчики событий для кнопок
    document.querySelectorAll('[data-bs-target="#addDishModal"]').forEach(button => {
        button.addEventListener('click', () => openDishModal());
    });
});

// Открытие модального окна для создания/редактирования блюда
function openDishModal(dishId = null) {
    currentDishId = dishId;
    const form = document.getElementById('dishForm');
    const title = document.getElementById('dishModalTitle');
    
    // Сброс формы
    form.reset();
    document.getElementById('dishImagePreview').src = '/static/images/no-photo.svg';
    document.getElementById('dishId').value = '';
    
    if (dishId) {
        // Режим редактирования
        title.textContent = 'Редактировать блюдо';
        loadDishData(dishId);
    } else {
        // Режим создания
        title.textContent = 'Добавить блюдо';
    }
    
    dishModal.show();
}

// Загрузка данных блюда для редактирования
function loadDishData(dishId) {
    fetch(`/api/admin/dish/${dishId}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const dish = data.dish;
                document.getElementById('dishId').value = dish.id;
                document.getElementById('dishName').value = dish.name;
                document.getElementById('dishDescription').value = dish.description;
                document.getElementById('dishCategory').value = dish.category_id;
                document.getElementById('dishPrice').value = dish.price;
                document.getElementById('dishWeight').value = dish.weight;
                document.getElementById('dishCalories').value = dish.calories;
                document.getElementById('dishIngredients').value = dish.ingredients;
                document.getElementById('isSpicy').checked = dish.is_spicy;
                document.getElementById('isVegetarian').checked = dish.is_vegetarian;
                
                if (dish.image) {
                    document.getElementById('dishImagePreview').src = dish.image;
                }
            } else {
                showNotification('Ошибка при загрузке данных блюда', 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showNotification('Ошибка при загрузке данных блюда', 'error');
        });
}

// Сохранение блюда
function saveDish() {
    const form = document.getElementById('dishForm');
    
    // Проверка валидации формы
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    const formData = new FormData(form);
    const url = currentDishId ? `/api/admin/dish/${currentDishId}` : '/api/admin/dish';
    const method = currentDishId ? 'PUT' : 'POST';
    
    // Отключаем кнопку сохранения
    const saveButton = document.querySelector('#dishModal .btn-primary');
    saveButton.disabled = true;
    saveButton.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Сохранение...';
    
    fetch(url, {
        method: method,
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification(currentDishId ? 'Блюдо успешно обновлено' : 'Блюдо успешно добавлено');
            dishModal.hide();
            location.reload(); // Перезагрузка страницы для обновления списка блюд
        } else {
            showNotification(data.error || 'Ошибка при сохранении блюда', 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification('Ошибка при сохранении блюда', 'error');
    })
    .finally(() => {
        // Возвращаем кнопку в исходное состояние
        saveButton.disabled = false;
        saveButton.innerHTML = 'Сохранить';
    });
}

// Удаление блюда
function deleteDish(dishId) {
    if (confirm('Вы уверены, что хотите удалить это блюдо?')) {
        fetch(`/api/admin/dish/${dishId}`, {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showNotification('Блюдо успешно удалено');
                // Удаляем карточку блюда из DOM
                const dishCard = document.querySelector(`.dish-card[data-dish-id="${dishId}"]`);
                if (dishCard) {
                    dishCard.remove();
                }
            } else {
                showNotification(data.error || 'Ошибка при удалении блюда', 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showNotification('Ошибка при удалении блюда', 'error');
        });
    }
}

// Функция для отображения уведомлений
function showNotification(message, type = 'success') {
    // Проверяем, существует ли контейнер для уведомлений
    let notificationContainer = document.querySelector('.notification-container');
    if (!notificationContainer) {
        notificationContainer = document.createElement('div');
        notificationContainer.className = 'notification-container position-fixed top-0 end-0 p-3';
        document.body.appendChild(notificationContainer);
    }
    
    // Создаем уведомление
    const notification = document.createElement('div');
    notification.className = `alert alert-${type} alert-dismissible fade show`;
    notification.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    // Добавляем уведомление в контейнер
    notificationContainer.appendChild(notification);
    
    // Автоматически скрываем уведомление через 3 секунды
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 150);
    }, 3000);
}

// Функция для предварительного просмотра изображения
function previewImage(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            document.getElementById('dishImagePreview').src = e.target.result;
        }
        
        reader.readAsDataURL(input.files[0]);
    }
}
