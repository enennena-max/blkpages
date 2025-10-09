/**
 * BlkPages Booking System
 * Complete booking flow with calendar, payment, and confirmation
 */

class BookingSystem {
    constructor() {
        this.state = {
            currentStep: 1,
            selectedService: null,
            selectedDate: null,
            selectedTime: null,
            customerDetails: {},
            paymentMethod: null,
            sessionStartTime: Date.now(),
            sessionDuration: 30 * 60 * 1000, // 30 minutes
            timerInterval: null
        };

        this.services = [];
        this.availability = {};
        this.businessInfo = {};
        
        this.init();
    }

    init() {
        this.loadBusinessData();
        this.setupEventListeners();
        this.startSessionTimer();
        this.loadBookingData();
        this.updateProgressIndicator();
    }

    // Business data loading
    async loadBusinessData() {
        try {
            // In a real implementation, this would fetch from an API
            this.businessInfo = {
                id: 'royal-hair-studio',
                name: 'Royal Hair Studio',
                address: '123 High Street, London, SW1A 1AA',
                phone: '020 7123 4567',
                email: 'info@royalhairstudio.com',
                coordinates: { lat: 51.5074, lng: -0.1278 }
            };

            this.services = [
                {
                    id: 'haircut',
                    name: 'Haircut & Style',
                    duration: 60,
                    price: 45,
                    deposit: 13.50,
                    available: true,
                    description: 'Professional haircut and styling service'
                },
                {
                    id: 'coloring',
                    name: 'Hair Coloring',
                    duration: 120,
                    price: 85,
                    deposit: 25.50,
                    available: true,
                    description: 'Full hair coloring service with consultation'
                },
                {
                    id: 'styling',
                    name: 'Hair Styling',
                    duration: 90,
                    price: 65,
                    deposit: 19.50,
                    available: false,
                    description: 'Special occasion hair styling'
                },
                {
                    id: 'treatment',
                    name: 'Hair Treatment',
                    duration: 45,
                    price: 35,
                    deposit: 10.50,
                    available: true,
                    description: 'Deep conditioning and treatment service'
                }
            ];

            this.loadServices();
        } catch (error) {
            console.error('Error loading business data:', error);
            this.showError('Failed to load business information. Please refresh the page.');
        }
    }

    // Service selection
    loadServices() {
        const grid = document.getElementById('servicesGrid');
        if (!grid) return;

        grid.innerHTML = '';

        this.services.forEach(service => {
            const card = document.createElement('div');
            card.className = 'service-card';
            card.onclick = () => this.selectService(service);
            
            card.innerHTML = `
                <h3>${service.name}</h3>
                <p class="service-duration">${service.duration} minutes</p>
                <p class="service-price">£${service.price}</p>
                <p>Deposit: £${service.deposit}</p>
                ${!service.available ? '<p style="color: var(--error-color);">Fully Booked</p>' : ''}
            `;
            
            grid.appendChild(card);
        });
    }

    selectService(service) {
        if (!service.available) {
            this.showWaitingListForm(service);
            return;
        }

        // Remove previous selection
        document.querySelectorAll('.service-card').forEach(card => {
            card.classList.remove('selected');
        });

        // Add selection to clicked card
        event.currentTarget.classList.add('selected');
        
        this.state.selectedService = service;
        this.updateBookingSummary();
        this.saveBookingData();
        
        // Auto-advance to next step if calendar is ready
        if (this.state.currentStep === 1) {
            setTimeout(() => this.nextStep(), 500);
        }
    }

    showWaitingListForm(service) {
        const form = document.getElementById('waitingListForm');
        if (form) {
            form.classList.remove('hidden');
            form.scrollIntoView({ behavior: 'smooth' });
        }
    }

    async joinWaitingList() {
        const firstName = document.getElementById('waitingFirstName')?.value;
        const lastName = document.getElementById('waitingLastName')?.value;
        const email = document.getElementById('waitingEmail')?.value;
        const phone = document.getElementById('waitingPhone')?.value;
        const consent = document.getElementById('waitingConsent')?.checked;

        if (!firstName || !lastName || !email || !consent) {
            this.showError('Please fill in all required fields and accept the terms.');
            return;
        }

        try {
            // In a real implementation, this would send to the server
            const waitingListData = {
                serviceId: this.state.selectedService?.id,
                businessId: this.businessInfo.id,
                customer: { firstName, lastName, email, phone },
                consent: consent,
                timestamp: new Date().toISOString()
            };

            console.log('Joining waiting list:', waitingListData);
            
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            this.showSuccess('You have been added to the waiting list. We will notify you when a slot becomes available.');
            
            // Reset form
            const form = document.getElementById('waitingListForm');
            if (form) {
                form.reset();
                form.classList.add('hidden');
            }
        } catch (error) {
            console.error('Error joining waiting list:', error);
            this.showError('Failed to join waiting list. Please try again.');
        }
    }

    // Calendar functionality
    generateCalendar() {
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                          'July', 'August', 'September', 'October', 'November', 'December'];
        
        const monthElement = document.getElementById('calendarMonth');
        if (monthElement) {
            monthElement.textContent = `${monthNames[this.currentMonth]} ${this.currentYear}`;
        }

        const grid = document.getElementById('calendarGrid');
        if (!grid) return;

        grid.innerHTML = '';

        // Add day headers
        const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        dayHeaders.forEach(day => {
            const header = document.createElement('div');
            header.textContent = day;
            header.style.fontWeight = '600';
            header.style.color = 'var(--text-muted)';
            grid.appendChild(header);
        });

        // Generate calendar days
        const firstDay = new Date(this.currentYear, this.currentMonth, 1).getDay();
        const daysInMonth = new Date(this.currentYear, this.currentMonth + 1, 0).getDate();
        const today = new Date();

        for (let i = 0; i < firstDay; i++) {
            const empty = document.createElement('div');
            grid.appendChild(empty);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day';
            dayElement.textContent = day;
            
            const date = new Date(this.currentYear, this.currentMonth, day);
            const isPast = date < today;
            const isAvailable = this.checkDateAvailability(date);
            
            if (isPast) {
                dayElement.classList.add('unavailable');
            } else if (isAvailable) {
                dayElement.classList.add('available');
                dayElement.onclick = () => this.selectDate(day);
            } else {
                dayElement.classList.add('unavailable');
            }
            
            grid.appendChild(dayElement);
        }
    }

    checkDateAvailability(date) {
        // In a real implementation, this would check against actual availability
        // For now, simulate availability with some randomness
        const dayOfWeek = date.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        
        // Simulate different availability patterns
        if (isWeekend) {
            return Math.random() > 0.4; // 60% chance on weekends
        } else {
            return Math.random() > 0.2; // 80% chance on weekdays
        }
    }

    changeMonth(direction) {
        this.currentMonth += direction;
        if (this.currentMonth < 0) {
            this.currentMonth = 11;
            this.currentYear--;
        } else if (this.currentMonth > 11) {
            this.currentMonth = 0;
            this.currentYear++;
        }
        this.generateCalendar();
    }

    selectDate(day) {
        // Remove previous selection
        document.querySelectorAll('.calendar-day').forEach(dayEl => {
            dayEl.classList.remove('selected');
        });

        // Add selection to clicked day
        event.currentTarget.classList.add('selected');
        
        const date = new Date(this.currentYear, this.currentMonth, day);
        this.state.selectedDate = date;
        
        this.loadTimeSlots(date);
        this.updateBookingSummary();
        this.saveBookingData();
    }

    async loadTimeSlots(date) {
        const slots = [
            '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
            '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
            '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'
        ];

        const container = document.getElementById('timeSlots');
        if (!container) return;

        container.innerHTML = '';

        // Simulate loading time slots
        container.innerHTML = '<div style="text-align: center; padding: 20px;">Loading available times...</div>';

        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 500));
            
            container.innerHTML = '';

            slots.forEach(slot => {
                const slotElement = document.createElement('div');
                slotElement.className = 'time-slot';
                slotElement.textContent = slot;
                
                const isAvailable = this.checkTimeSlotAvailability(date, slot);
                
                if (isAvailable) {
                    slotElement.onclick = () => this.selectTime(slot);
                } else {
                    slotElement.classList.add('unavailable');
                }
                
                container.appendChild(slotElement);
            });
        } catch (error) {
            console.error('Error loading time slots:', error);
            container.innerHTML = '<div style="text-align: center; color: var(--error-color);">Failed to load time slots. Please try again.</div>';
        }
    }

    checkTimeSlotAvailability(date, time) {
        // In a real implementation, this would check against actual bookings
        // For now, simulate availability with some randomness
        const hour = parseInt(time.split(':')[0]);
        const isPeakTime = hour >= 12 && hour <= 16;
        
        if (isPeakTime) {
            return Math.random() > 0.3; // 70% chance during peak hours
        } else {
            return Math.random() > 0.1; // 90% chance during off-peak hours
        }
    }

    selectTime(time) {
        // Remove previous selection
        document.querySelectorAll('.time-slot').forEach(slot => {
            slot.classList.remove('selected');
        });

        // Add selection to clicked slot
        event.currentTarget.classList.add('selected');
        
        this.state.selectedTime = time;
        this.updateBookingSummary();
        this.saveBookingData();
        
        // Auto-advance to next step
        if (this.state.currentStep === 2) {
            setTimeout(() => this.nextStep(), 500);
        }
    }

    // Form validation
    validateCurrentStep() {
        switch (this.state.currentStep) {
            case 1:
                if (!this.state.selectedService) {
                    this.showError('Please select a service to continue.');
                    return false;
                }
                break;
            case 2:
                if (!this.state.selectedDate || !this.state.selectedTime) {
                    this.showError('Please select a date and time to continue.');
                    return false;
                }
                break;
            case 3:
                return this.validateCustomerDetails();
            case 4:
                return this.validatePaymentDetails();
        }
        return true;
    }

    validateCustomerDetails() {
        const firstName = document.getElementById('firstName')?.value;
        const lastName = document.getElementById('lastName')?.value;
        const email = document.getElementById('email')?.value;
        const phone = document.getElementById('phone')?.value;

        if (!firstName || !lastName || !email || !phone) {
            this.showError('Please fill in all required fields.');
            this.highlightErrors();
            return false;
        }

        if (!this.isValidEmail(email)) {
            this.showError('Please enter a valid email address.');
            return false;
        }

        if (!this.isValidPhone(phone)) {
            this.showError('Please enter a valid phone number.');
            return false;
        }

        return true;
    }

    validatePaymentDetails() {
        const paymentMethod = document.getElementById('paymentMethod')?.value;
        if (!paymentMethod) {
            this.showError('Please select a payment method.');
            return false;
        }

        // Additional validation for card details if needed
        if (paymentMethod !== 'venue') {
            // Validate card details
            const cardNumber = document.getElementById('cardNumber')?.value;
            const cardExpiry = document.getElementById('cardExpiry')?.value;
            const cardCVC = document.getElementById('cardCVC')?.value;

            if (!cardNumber || !cardExpiry || !cardCVC) {
                this.showError('Please fill in all card details.');
                return false;
            }
        }

        return true;
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    isValidPhone(phone) {
        const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,}$/;
        return phoneRegex.test(phone);
    }

    highlightErrors() {
        const requiredFields = ['firstName', 'lastName', 'email', 'phone'];
        requiredFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field && !field.value) {
                field.classList.add('error');
            } else if (field) {
                field.classList.remove('error');
            }
        });
    }

    // Navigation
    nextStep() {
        if (!this.validateCurrentStep()) {
            return;
        }

        if (this.state.currentStep < 5) {
            this.state.currentStep++;
            this.updateProgressIndicator();
            this.showCurrentStep();
            this.updateNavigationButtons();
        } else {
            this.completeBooking();
        }
    }

    previousStep() {
        if (this.state.currentStep > 1) {
            this.state.currentStep--;
            this.updateProgressIndicator();
            this.showCurrentStep();
            this.updateNavigationButtons();
        }
    }

    showCurrentStep() {
        // Hide all sections
        document.querySelectorAll('.booking-section').forEach(section => {
            section.classList.add('hidden');
        });

        // Show current section
        const sections = ['serviceSection', 'calendarSection', 'detailsSection', 'paymentSection', 'confirmationSection'];
        const currentSection = document.getElementById(sections[this.state.currentStep - 1]);
        if (currentSection) {
            currentSection.classList.remove('hidden');
            currentSection.scrollIntoView({ behavior: 'smooth' });
        }

        // Special handling for different steps
        switch (this.state.currentStep) {
            case 2:
                this.generateCalendar();
                break;
            case 4:
                this.updatePaymentSummary();
                break;
            case 5:
                this.showConfirmationDetails();
                break;
        }
    }

    updateProgressIndicator() {
        for (let i = 1; i <= 5; i++) {
            const step = document.getElementById(`step${i}`);
            if (step) {
                step.classList.remove('active', 'completed');
                
                if (i < this.state.currentStep) {
                    step.classList.add('completed');
                } else if (i === this.state.currentStep) {
                    step.classList.add('active');
                }
            }
        }
    }

    updateNavigationButtons() {
        const backBtn = document.getElementById('backBtn');
        const nextBtn = document.getElementById('nextBtn');

        if (backBtn) {
            backBtn.style.display = this.state.currentStep > 1 ? 'inline-flex' : 'none';
        }
        
        if (nextBtn) {
            if (this.state.currentStep === 5) {
                nextBtn.style.display = 'none';
            } else {
                nextBtn.style.display = 'inline-flex';
            }
        }
    }

    // Booking summary
    updateBookingSummary() {
        if (this.state.selectedService) {
            const service = this.state.selectedService;
            const serviceElement = document.getElementById('summaryService');
            const durationElement = document.getElementById('summaryDuration');
            const priceElement = document.getElementById('summaryPrice');

            if (serviceElement) serviceElement.textContent = service.name;
            if (durationElement) durationElement.textContent = `${service.duration} minutes`;
            if (priceElement) priceElement.textContent = `£${service.price}`;
        }

        if (this.state.selectedDate) {
            const dateStr = this.state.selectedDate.toLocaleDateString('en-GB', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });
            const dateElement = document.getElementById('summaryDate');
            if (dateElement) dateElement.textContent = dateStr;
        }

        if (this.state.selectedTime) {
            const timeElement = document.getElementById('summaryTime');
            if (timeElement) timeElement.textContent = this.state.selectedTime;
        }
    }

    // Payment handling
    updatePaymentSummary() {
        if (!this.state.selectedService) return;

        const service = this.state.selectedService;
        const deposit = service.deposit;
        const balance = service.price - deposit;

        const summaryElement = document.getElementById('paymentSummary');
        if (summaryElement) {
            summaryElement.innerHTML = `
                <div>Service: ${service.name} - £${service.price}</div>
                <div>Deposit: £${deposit}</div>
                <div>Balance due at venue: £${balance}</div>
            `;
        }
    }

    // Complete booking
    async completeBooking() {
        try {
            // Collect all booking data
            const bookingData = {
                service: this.state.selectedService,
                date: this.state.selectedDate,
                time: this.state.selectedTime,
                customer: this.collectCustomerDetails(),
                payment: this.collectPaymentDetails(),
                business: this.businessInfo,
                timestamp: new Date().toISOString()
            };

            console.log('Completing booking:', bookingData);

            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Show confirmation
            this.state.currentStep = 5;
            this.updateProgressIndicator();
            this.showCurrentStep();
            this.updateNavigationButtons();

            // Send confirmation emails/SMS
            await this.sendConfirmationNotifications(bookingData);

        } catch (error) {
            console.error('Error completing booking:', error);
            this.showError('Failed to complete booking. Please try again.');
        }
    }

    collectCustomerDetails() {
        return {
            firstName: document.getElementById('firstName')?.value,
            lastName: document.getElementById('lastName')?.value,
            email: document.getElementById('email')?.value,
            phone: document.getElementById('phone')?.value,
            notes: document.getElementById('notes')?.value
        };
    }

    collectPaymentDetails() {
        return {
            method: document.getElementById('paymentMethod')?.value,
            cardNumber: document.getElementById('cardNumber')?.value,
            cardExpiry: document.getElementById('cardExpiry')?.value,
            cardCVC: document.getElementById('cardCVC')?.value
        };
    }

    async sendConfirmationNotifications(bookingData) {
        try {
            // In a real implementation, this would send actual emails and SMS
            console.log('Sending confirmation notifications:', bookingData);
            
            // Simulate sending notifications
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            console.log('Confirmation notifications sent successfully');
        } catch (error) {
            console.error('Error sending notifications:', error);
        }
    }

    showConfirmationDetails() {
        if (this.state.selectedService) {
            const serviceElement = document.getElementById('confirmService');
            if (serviceElement) {
                serviceElement.textContent = this.state.selectedService.name;
            }
        }

        if (this.state.selectedDate && this.state.selectedTime) {
            const dateStr = this.state.selectedDate.toLocaleDateString('en-GB', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });
            const dateTimeElement = document.getElementById('confirmDateTime');
            if (dateTimeElement) {
                dateTimeElement.textContent = `${dateStr} at ${this.state.selectedTime}`;
            }
        }

        const paymentMethod = document.getElementById('paymentMethod')?.value;
        if (paymentMethod) {
            const paymentText = {
                'deposit': `Deposit paid: £${this.state.selectedService.deposit}`,
                'full': `Full amount paid: £${this.state.selectedService.price}`,
                'venue': 'Pay at venue'
            };
            const paymentElement = document.getElementById('confirmPayment');
            if (paymentElement) {
                paymentElement.textContent = paymentText[paymentMethod];
            }
        }
    }

    // Session timer
    startSessionTimer() {
        this.state.timerInterval = setInterval(() => this.updateTimer(), 1000);
    }

    updateTimer() {
        const elapsed = Date.now() - this.state.sessionStartTime;
        const remaining = this.state.sessionDuration - elapsed;
        
        if (remaining <= 0) {
            clearInterval(this.state.timerInterval);
            this.showSessionExpired();
            return;
        }

        const minutes = Math.floor(remaining / 60000);
        const seconds = Math.floor((remaining % 60000) / 1000);
        
        const timerText = document.getElementById('timerText');
        const timer = document.getElementById('sessionTimer');
        
        if (timerText) {
            timerText.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }
        
        if (timer) {
            if (remaining <= 120000) { // 2 minutes
                timer.classList.add('timer-warning');
            }
        }
    }

    showSessionExpired() {
        const timer = document.getElementById('sessionTimer');
        if (timer) {
            timer.classList.add('timer-expired');
            timer.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Session Expired';
        }
        
        alert('Your booking session has expired. Please start again.');
        location.reload();
    }

    // Utility functions
    addToCalendar() {
        const icsContent = this.generateICS();
        const blob = new Blob([icsContent], { type: 'text/calendar' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = 'appointment.ics';
        link.click();
        
        URL.revokeObjectURL(url);
    }

    generateICS() {
        const startDate = new Date(this.state.selectedDate);
        const [hours, minutes] = this.state.selectedTime.split(':');
        startDate.setHours(parseInt(hours), parseInt(minutes));
        
        const endDate = new Date(startDate);
        endDate.setMinutes(endDate.getMinutes() + this.state.selectedService.duration);
        
        const formatDate = (date) => {
            return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
        };
        
        return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//BlkPages//Booking System//EN
BEGIN:VEVENT
UID:${Date.now()}@blkpages.com
DTSTAMP:${formatDate(new Date())}
DTSTART:${formatDate(startDate)}
DTEND:${formatDate(endDate)}
SUMMARY:${this.state.selectedService.name} at ${this.businessInfo.name}
DESCRIPTION:Your appointment is confirmed.
LOCATION:${this.businessInfo.address}
END:VEVENT
END:VCALENDAR`;
    }

    manageBooking() {
        window.location.href = '/customer-dashboard.html';
    }

    // Error handling
    showError(message) {
        this.removeExistingAlerts();
        
        const alert = document.createElement('div');
        alert.className = 'alert error';
        alert.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
        
        const currentSection = document.querySelector('.booking-section:not(.hidden)');
        if (currentSection) {
            currentSection.insertBefore(alert, currentSection.firstChild);
        }
    }

    showSuccess(message) {
        this.removeExistingAlerts();
        
        const alert = document.createElement('div');
        alert.className = 'alert success';
        alert.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
        
        const currentSection = document.querySelector('.booking-section:not(.hidden)');
        if (currentSection) {
            currentSection.insertBefore(alert, currentSection.firstChild);
        }
    }

    removeExistingAlerts() {
        document.querySelectorAll('.alert').forEach(alert => {
            alert.remove();
        });
    }

    // Data persistence
    saveBookingData() {
        try {
            sessionStorage.setItem('bookingState', JSON.stringify(this.state));
        } catch (error) {
            console.error('Error saving booking data:', error);
        }
    }

    loadBookingData() {
        try {
            const saved = sessionStorage.getItem('bookingState');
            if (saved) {
                const data = JSON.parse(saved);
                Object.assign(this.state, data);
                
                // Restore UI state
                if (this.state.selectedService) {
                    this.updateBookingSummary();
                }
            }
        } catch (error) {
            console.error('Error loading booking data:', error);
        }
    }

    // Event listeners
    setupEventListeners() {
        // Navigation buttons
        const nextBtn = document.getElementById('nextBtn');
        const backBtn = document.getElementById('backBtn');
        
        if (nextBtn) {
            nextBtn.onclick = () => this.nextStep();
        }
        
        if (backBtn) {
            backBtn.onclick = () => this.previousStep();
        }

        // Calendar navigation
        window.changeMonth = (direction) => this.changeMonth(direction);
        
        // Waiting list
        window.joinWaitingList = () => this.joinWaitingList();
        
        // Calendar functions
        window.addToCalendar = () => this.addToCalendar();
        window.manageBooking = () => this.manageBooking();
    }
}

// Initialize booking system when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.bookingSystem = new BookingSystem();
});
