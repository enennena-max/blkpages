// =========================================================
// BLKPAGES DASHBOARD - Page Switching & Fade Transitions
// =========================================================

class Dashboard {
  constructor() {
    this.currentPage = 'bookings';
    this.isLoading = false;
    this.pages = {
      bookings: 'pages/bookings.html',
      payments: 'pages/payments.html',
      reviews: 'pages/reviews.html',
      loyalty: 'pages/loyalty.html',
      profile: 'pages/profile.html',
      messages: 'pages/messages.html'
    };
    
    this.init();
  }

  init() {
    this.setupNavigation();
    this.loadPage('bookings');
    this.setupNotifications();
  }

  setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const page = link.getAttribute('href').substring(1);
        this.switchPage(page);
      });
    });
  }

  async switchPage(pageName) {
    if (this.isLoading || pageName === this.currentPage) return;
    
    this.isLoading = true;
    this.currentPage = pageName;
    
    // Update active navigation
    this.updateActiveNav(pageName);
    
    // Fade out current content
    await this.fadeOut();
    
    // Load new page
    await this.loadPage(pageName);
    
    // Fade in new content
    await this.fadeIn();
    
    this.isLoading = false;
  }

  updateActiveNav(pageName) {
    document.querySelectorAll('.nav-link').forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${pageName}`) {
        link.classList.add('active');
      }
    });
  }

  async loadPage(pageName) {
    try {
      const response = await fetch(this.pages[pageName]);
      if (!response.ok) throw new Error(`Failed to load ${pageName}`);
      
      const html = await response.text();
      document.getElementById('dashboard-content').innerHTML = html;
    } catch (error) {
      console.error('Error loading page:', error);
      this.showError(`Failed to load ${pageName} page`);
    }
  }

  async fadeOut() {
    const content = document.getElementById('dashboard-content');
    content.style.opacity = '0';
    content.style.transform = 'translateY(20px)';
    
    return new Promise(resolve => {
      setTimeout(resolve, 200);
    });
  }

  async fadeIn() {
    const content = document.getElementById('dashboard-content');
    content.style.opacity = '1';
    content.style.transform = 'translateY(0)';
    
    return new Promise(resolve => {
      setTimeout(resolve, 200);
    });
  }

  showError(message) {
    document.getElementById('dashboard-content').innerHTML = `
      <div class="error-message">
        <h2>Error</h2>
        <p>${message}</p>
        <button onclick="location.reload()">Reload Page</button>
      </div>
    `;
  }

  setupNotifications() {
    // Notification system setup
    const notifBtn = document.getElementById('notifBtn');
    const notifDropdown = document.getElementById('notifDropdown');
    const notifList = document.getElementById('notifList');
    const notifBadge = document.getElementById('notifBadge');
    const notifClear = document.getElementById('notifClear');

    if (!notifBtn) return;

    // Demo notifications
    const notifications = [
      { 
        id: 1, 
        title: "Your booking with Glow Studio is confirmed", 
        time: "2 hours ago",
        unread: true
      },
      { 
        id: 2, 
        title: "You earned 10 BlkPoints", 
        time: "1 day ago",
        unread: true
      },
      { 
        id: 3, 
        title: "Payment received for Fade District", 
        time: "2 days ago",
        unread: false
      }
    ];

    // Render notifications
    function renderNotifications() {
      notifList.innerHTML = '';
      let unreadCount = 0;

      notifications.forEach(notif => {
        const item = document.createElement('div');
        item.className = `notif-item ${notif.unread ? 'unread' : ''}`;
        item.innerHTML = `
          <div class="notif-content">
            <div class="notif-text">${notif.title}</div>
            <div class="notif-time">${notif.time}</div>
          </div>
        `;
        
        item.addEventListener('click', () => {
          notif.unread = false;
          renderNotifications();
        });
        
        notifList.appendChild(item);
        if (notif.unread) unreadCount++;
      });

      notifBadge.hidden = unreadCount === 0;
    }

    // Event listeners
    notifBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      notifDropdown.hidden = !notifDropdown.hidden;
      if (!notifDropdown.hidden) {
        renderNotifications();
      }
    });

    notifClear.addEventListener('click', (e) => {
      e.stopPropagation();
      notifications.forEach(n => n.unread = false);
      renderNotifications();
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (!notifBtn.contains(e.target) && !notifDropdown.contains(e.target)) {
        notifDropdown.hidden = true;
      }
    });

    // Initial render
    renderNotifications();
  }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new Dashboard();
});

// Add CSS transitions
const style = document.createElement('style');
style.textContent = `
  .fade {
    transition: opacity 0.3s ease, transform 0.3s ease;
  }
  
  .loading {
    text-align: center;
    padding: 50px;
    color: #ccc;
  }
  
  .error-message {
    text-align: center;
    padding: 50px;
    color: #ff6b6b;
  }
  
  .error-message h2 {
    margin-bottom: 20px;
  }
  
  .error-message button {
    margin-top: 20px;
  }
`;
document.head.appendChild(style);
