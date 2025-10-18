// User Dashboard JavaScript
document.addEventListener("DOMContentLoaded", function () {
  // Mobile menu toggle
  const mobileMenuBtn = document.querySelector(".mobile-menu-btn");
  const sidebar = document.querySelector(".sidebar");

  if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener("click", function () {
      sidebar.classList.toggle("active");
    });
  }

  // Notification bell click
  const notificationBell = document.querySelector(".notification-bell");
  if (notificationBell) {
    notificationBell.addEventListener("click", function () {
      alert("You have 3 new notifications!");
    });
  }

  // Service action buttons
  const actionButtons = document.querySelectorAll(".actions button");
  actionButtons.forEach((button) => {
    button.addEventListener("click", function () {
      const serviceId =
        this.closest(".table-row").querySelector(".service-id").textContent;

      if (this.classList.contains("btn-view")) {
        alert(`View details for ${serviceId}`);
      } else if (this.classList.contains("btn-cancel")) {
        if (confirm("Are you sure you want to cancel this service?")) {
          alert(`Cancelled ${serviceId}`);
        }
      } else if (this.classList.contains("btn-track")) {
        alert(`Tracking ${serviceId}`);
      } else if (this.classList.contains("btn-rate")) {
        alert(`Rate service ${serviceId}`);
      }
    });
  });

  // Quick action cards animation
  const quickActionCards = document.querySelectorAll(".quick-action-card");
  quickActionCards.forEach((card) => {
    card.addEventListener("mouseenter", function () {
      this.style.transform = "translateY(-5px) scale(1.02)";
    });

    card.addEventListener("mouseleave", function () {
      this.style.transform = "translateY(0) scale(1)";
    });
  });

  // Auto-hide alerts
  const alerts = document.querySelectorAll(".alert");
  alerts.forEach((alert) => {
    setTimeout(() => {
      alert.style.opacity = "0";
      setTimeout(() => alert.remove(), 300);
    }, 5000);
  });
});

// Sample function to update stats (you can replace with real data)
function updateDashboardStats(stats) {
  const statCards = document.querySelectorAll(".stat-info h3");
  if (statCards.length >= 4 && stats) {
    statCards[0].textContent = stats.pending || "0";
    statCards[1].textContent = stats.inProgress || "0";
    statCards[2].textContent = stats.completed || "0";
    statCards[3].textContent = stats.total || "0";
  }
}
