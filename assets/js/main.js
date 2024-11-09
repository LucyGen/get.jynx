// Import the i18n manager
import i18n from './i18n.js';

class AppManager {
    constructor() {
        // Store references to frequently used elements
        this.elements = {
            header: document.querySelector('.header'),
            mobileMenu: {
                button: document.querySelector('.menu-toggle'),
                nav: document.querySelector('#primary-navigation'),
            },
            signupForm: document.querySelector('#signup-form'),
            feedbackSection: {
                buttons: document.querySelectorAll('[data-feedback]'),
                form: document.querySelector('#feedback-form'),
            },
            demoButton: document.querySelector('[data-i18n="hero.cta_secondary"]'),
        };

        // State management
        this.state = {
            lastScrollPosition: 0,
            isHeaderVisible: true,
            isMobileMenuOpen: false,
            hasSubmittedFeedback: localStorage.getItem('feedbackSubmitted'),
        };

        this.init();
    }

    /**
     * Initialize the application
     */
    init() {
        this.setupEventListeners();
        this.setupIntersectionObserver();
        this.setupFormValidation();
        this.setupScrollEffects();
    }

    /**
     * Set up all event listeners
     */
    setupEventListeners() {
        // Mobile menu handling
        this.elements.mobileMenu.button?.addEventListener('click', () => this.toggleMobileMenu());

        // Form submissions
        this.elements.signupForm?.addEventListener('submit', (e) => this.handleSignupSubmit(e));

        // Feedback system
        this.elements.feedbackSection.buttons.forEach(button => {
            button.addEventListener('click', () => this.handleFeedbackClick(button));
        });
        this.elements.feedbackSection.form?.addEventListener('submit', (e) => this.handleFeedbackSubmit(e));

        // Demo video handling
        this.elements.demoButton?.addEventListener('click', () => this.showDemoVideo());

        // Scroll handling
        this.handleScroll = this.debounce(this.handleScroll.bind(this), 10);
        window.addEventListener('scroll', this.handleScroll);

        // Resize handling
        this.handleResize = this.debounce(this.handleResize.bind(this), 150);
        window.addEventListener('resize', this.handleResize);

        // Handle escape key
        document.addEventListener('keydown', (e) => this.handleEscapeKey(e));

        // Handle click outside mobile menu
        document.addEventListener('click', (e) => this.handleClickOutside(e));
    }

    /**
     * Set up intersection observer for animations
     */
    setupIntersectionObserver() {
        const options = {
            root: null,
            rootMargin: '0px',
            threshold: 0.1
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animated');
                    // Unobserve after animation
                    observer.unobserve(entry.target);
                }
            });
        }, options);

        // Observe all animatable elements
        document.querySelectorAll('.animate-on-scroll').forEach(el => {
            observer.observe(el);
        });
    }

    /**
     * Set up form validation
     */
    setupFormValidation() {
        if (!this.elements.signupForm) return;

        const inputs = this.elements.signupForm.querySelectorAll('input[required]');
        inputs.forEach(input => {
            input.addEventListener('input', () => this.validateInput(input));
            input.addEventListener('blur', () => this.validateInput(input));
        });
    }

    /**
     * Validate individual form input
     * @param {HTMLInputElement} input - The input element to validate
     * @returns {boolean} - Whether the input is valid
     */
    validateInput(input) {
        const value = input.value.trim();
        let isValid = true;
        let errorMessage = '';

        switch (input.type) {
            case 'email':
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                isValid = emailRegex.test(value);
                errorMessage = i18n.translate('form.email.error');
                break;
            case 'text':
                isValid = value.length >= 2;
                errorMessage = i18n.translate('form.team_name.error');
                break;
        }

        const errorElement = input.parentElement.querySelector('.error-message');
        if (errorElement) {
            errorElement.textContent = isValid ? '' : errorMessage;
        }

        input.setAttribute('aria-invalid', !isValid);
        return isValid;
    }

    /**
     * Handle sign-up form submission
     * @param {Event} e - The submit event
     */
    async handleSignupSubmit(e) {
        e.preventDefault();

        const form = e.target;
        const inputs = form.querySelectorAll('input[required]');
        let isValid = true;

        // Validate all inputs
        inputs.forEach(input => {
            if (!this.validateInput(input)) {
                isValid = false;
            }
        });

        if (!isValid) return;

        const submitButton = form.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.classList.add('loading');

        try {
            // Collect form data
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());

            // Simulate API call (replace with actual API endpoint)
            await this.simulateApiCall(data);

            // Show success message
            this.showNotification('success', i18n.translate('form.success'));
            form.reset();
        } catch (error) {
            console.error('Signup error:', error);
            this.showNotification('error', i18n.translate('form.error'));
        } finally {
            submitButton.disabled = false;
            submitButton.classList.remove('loading');
        }
    }

    /**
     * Handle feedback button clicks
     * @param {HTMLElement} button - The clicked feedback button
     */
    handleFeedbackClick(button) {
        if (this.state.hasSubmittedFeedback) return;

        const type = button.dataset.feedback;
        const form = this.elements.feedbackSection.form;

        if (type === 'no') {
            form.classList.remove('hidden');
            form.querySelector('textarea').focus();
        } else {
            this.submitFeedback({ type: 'positive' });
        }
    }

    /**
     * Handle feedback form submission
     * @param {Event} e - The submit event
     */
    async handleFeedbackSubmit(e) {
        e.preventDefault();

        const form = e.target;
        const textarea = form.querySelector('textarea');
        const feedback = textarea.value.trim();

        if (!feedback) return;

        try {
            await this.submitFeedback({
                type: 'negative',
                feedback
            });

            form.classList.add('hidden');
            this.showNotification('success', i18n.translate('feedback.thanks'));
        } catch (error) {
            console.error('Feedback error:', error);
            this.showNotification('error', i18n.translate('errors.generic'));
        }
    }

    /**
     * Submit feedback to backend
     * @param {Object} data - The feedback data
     */
    async submitFeedback(data) {
        // Simulate API call (replace with actual API endpoint)
        await this.simulateApiCall(data);
        localStorage.setItem('feedbackSubmitted', 'true');
        this.state.hasSubmittedFeedback = true;
    }

    /**
     * Toggle mobile menu
     */
    toggleMobileMenu() {
        const { button, nav } = this.elements.mobileMenu;
        const isExpanded = button.getAttribute('aria-expanded') === 'true';
        
        button.setAttribute('aria-expanded', !isExpanded);
        nav.classList.toggle('active');
        this.state.isMobileMenuOpen = !isExpanded;

        // Prevent body scroll when menu is open
        document.body.style.overflow = !isExpanded ? 'hidden' : '';
    }

    /**
     * Handle scroll effects
     */
    handleScroll() {
        const currentScroll = window.pageYOffset;
        
        // Header show/hide logic
        if (currentScroll > this.state.lastScrollPosition && currentScroll > 100) {
            // Scrolling down
            if (this.state.isHeaderVisible) {
                this.elements.header.classList.add('header-hidden');
                this.state.isHeaderVisible = false;
            }
        } else {
            // Scrolling up
            if (!this.state.isHeaderVisible) {
                this.elements.header.classList.remove('header-hidden');
                this.state.isHeaderVisible = true;
            }
        }

        this.state.lastScrollPosition = currentScroll;
    }

    /**
     * Handle window resize
     */
    handleResize() {
        // Close mobile menu if window is resized to desktop view
        if (window.innerWidth >= 768 && this.state.isMobileMenuOpen) {
            this.toggleMobileMenu();
        }
    }

    /**
     * Handle escape key press
     * @param {KeyboardEvent} e - The keyboard event
     */
    handleEscapeKey(e) {
        if (e.key === 'Escape' && this.state.isMobileMenuOpen) {
            this.toggleMobileMenu();
        }
    }

    /**
     * Handle clicks outside mobile menu
     * @param {MouseEvent} e - The click event
     */
    handleClickOutside(e) {
        if (this.state.isMobileMenuOpen && 
            !this.elements.mobileMenu.nav.contains(e.target) && 
            !this.elements.mobileMenu.button.contains(e.target)) {
            this.toggleMobileMenu();
        }
    }

    /**
     * Show demo video modal
     */
    showDemoVideo() {
        // Implementation depends on video player requirements
        // This is a basic example
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <button class="modal-close" aria-label="${i18n.translate('accessibility.close_modal')}">×</button>
                <div class="video-container">
                    <!-- Add video player implementation here -->
                    <div class="video-placeholder">Demo Video</div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';

        modal.querySelector('.modal-close').addEventListener('click', () => {
            document.body.removeChild(modal);
            document.body.style.overflow = '';
        });
    }

    /**
     * Show notification
     * @param {string} type - The notification type ('success' or 'error')
     * @param {string} message - The notification message
     */
    showNotification(type, message) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.setAttribute('role', 'alert');
        notification.textContent = message;

        document.body.appendChild(notification);

        // Remove notification after 5 seconds
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 5000);
    }

    /**
     * Simulate API call (replace with actual API calls)
     * @param {Object} data - The data to send
     * @returns {Promise} - Resolves after a simulated delay
     */
    simulateApiCall(data) {
        return new Promise((resolve) => {
            console.log('API call with data:', data);
            setTimeout(resolve, 1000);
        });
    }

    /**
     * Debounce function for performance optimization
     * @param {Function} func - The function to debounce
     * @param {number} wait - The debounce delay in milliseconds
     * @returns {Function} - The debounced function
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Initialize i18n first (already handled by i18n.js)
    // Then initialize app
    const app = new AppManager();
});

// Handle service worker if needed
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .then(registration => {
                console.log('ServiceWorker registration successful');
            })
            .catch(err => {
                console.error('ServiceWorker registration failed:', err);
            });
    });
}

// Export app manager for potential external use
export default AppManager;