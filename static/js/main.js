// Управление корзиной
class Cart {
    constructor() {
        this.items = JSON.parse(localStorage.getItem('cart') || '[]');
        this.updateCartCount();
    }

    addItem(item) {
        const existingItem = this.items.find(i => i.id === item.id);
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            this.items.push({...item, quantity: 1});
        }
        this.save();
        this.showNotification('Блюдо добавлено в корзину');
    }

    removeItem(id) {
        this.items = this.items.filter(item => item.id !== id);
        this.save();
    }

    updateQuantity(id, quantity) {
        const item = this.items.find(i => i.id === id);
        if (item) {
            item.quantity = quantity;
            if (item.quantity <= 0) {
                this.removeItem(id);
            }
        }
        this.save();
    }

    clear() {
        this.items = [];
        this.save();
    }

    save() {
        localStorage.setItem('cart', JSON.stringify(this.items));
        this.updateCartCount();
    }

    updateCartCount() {
        const count = this.items.reduce((sum, item) => sum + item.quantity, 0);
        document.querySelector('.cart-count').textContent = count;
    }

    showNotification(message) {
        const toast = document.createElement('div');
        toast.className = 'toast show';
        toast.setAttribute('role', 'alert');
        toast.innerHTML = `
            <div class="toast-body">
                ${message}
            </div>
        `;
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }
}

// Инициализация корзины
const cart = new Cart();

// Обработчики событий для добавления в корзину
document.addEventListener('DOMContentLoaded', function() {
    // Добавление в корзину
    document.querySelectorAll('.add-to-cart').forEach(button => {
        button.addEventListener('click', function() {
            const dishId = this.dataset.dishId;
            const dishCard = this.closest('.dish-card');
            const dish = {
                id: dishId,
                name: dishCard.querySelector('.card-title').textContent,
                price: parseFloat(dishCard.querySelector('.price').textContent),
                image: dishCard.querySelector('img').src
            };
            cart.addItem(dish);
        });
    });

    // Анимация при прокрутке
    const animateOnScroll = () => {
        const elements = document.querySelectorAll('.animate-fade-in');
        elements.forEach(element => {
            const elementTop = element.getBoundingClientRect().top;
            const elementVisible = 150;
            if (elementTop < window.innerHeight - elementVisible) {
                element.classList.add('visible');
            }
        });
    };

    window.addEventListener('scroll', animateOnScroll);
    animateOnScroll();

    // Плавная прокрутка к якорям
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Валидация форм
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('submit', function(e) {
            if (!form.checkValidity()) {
                e.preventDefault();
                e.stopPropagation();
            }
            form.classList.add('was-validated');
        });
    });

    // Обработка промокодов
    const promoForm = document.getElementById('promoForm');
    if (promoForm) {
        promoForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const promoCode = document.getElementById('promoCode').value.toUpperCase();
            // Здесь будет проверка промокода на сервере
            if (promoCode === 'WELCOME20') {
                cart.showNotification('Промокод применен! Скидка 20%');
            } else {
                cart.showNotification('Неверный промокод');
            }
        });
    }

    // Мобильное меню
    const mobileMenuButton = document.querySelector('.navbar-toggler');
    const mobileMenu = document.querySelector('.navbar-collapse');
    if (mobileMenuButton && mobileMenu) {
        mobileMenuButton.addEventListener('click', function() {
            mobileMenu.classList.toggle('show');
        });

        // Закрытие мобильного меню при клике вне его
        document.addEventListener('click', function(e) {
            if (!mobileMenu.contains(e.target) && !mobileMenuButton.contains(e.target)) {
                mobileMenu.classList.remove('show');
            }
        });
    }

    // Lazy loading для изображений
    if ('loading' in HTMLImageElement.prototype) {
        const images = document.querySelectorAll('img[loading="lazy"]');
        images.forEach(img => {
            img.src = img.dataset.src;
        });
    } else {
        // Fallback для браузеров, не поддерживающих lazy loading
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/lozad.js/1.16.0/lozad.min.js';
        document.body.appendChild(script);
        script.onload = function() {
            const observer = lozad();
            observer.observe();
        };
    }
});

// Обработка платежей
class PaymentProcessor {
    constructor() {
        this.stripe = Stripe('your-publishable-key'); // Замените на ваш ключ Stripe
    }

    async processPayment(orderData) {
        try {
            const response = await fetch('/create-payment-intent', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(orderData)
            });
            
            const data = await response.json();
            
            const result = await this.stripe.confirmCardPayment(data.clientSecret, {
                payment_method: {
                    card: elements.getElement('card'),
                    billing_details: {
                        name: orderData.customerName
                    }
                }
            });

            if (result.error) {
                throw new Error(result.error.message);
            }
            
            return result.paymentIntent;
        } catch (error) {
            console.error('Payment failed:', error);
            throw error;
        }
    }
}

// Геолокация для определения адреса доставки
class LocationService {
    async getCurrentLocation() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Геолокация не поддерживается вашим браузером'));
                return;
            }

            navigator.geolocation.getCurrentPosition(
                position => {
                    resolve({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    });
                },
                error => {
                    reject(error);
                }
            );
        });
    }

    async getAddressFromCoordinates(lat, lng) {
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
            );
            const data = await response.json();
            return data.display_name;
        } catch (error) {
            console.error('Failed to get address:', error);
            throw error;
        }
    }
}

// Инициализация сервисов
const paymentProcessor = new PaymentProcessor();
const locationService = new LocationService();

// Автозаполнение адреса
document.getElementById('detectLocation')?.addEventListener('click', async function() {
    try {
        const location = await locationService.getCurrentLocation();
        const address = await locationService.getAddressFromCoordinates(
            location.lat,
            location.lng
        );
        document.getElementById('address').value = address;
    } catch (error) {
        cart.showNotification('Не удалось определить местоположение');
    }
});
