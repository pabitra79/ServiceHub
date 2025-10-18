// Toggle sidebar submenu
function toggleSubmenu(e) {
  e.preventDefault();
  const parent = e.target.closest("li");
  parent.classList.toggle("open");
}

// Switch between sections
function switchTab(e, tabName) {
  e.preventDefault();

  // Hide all sections
  const sections = document.querySelectorAll(".content-section");
  sections.forEach((section) => {
    section.classList.remove("active");
  });

  // Show selected section
  const selectedSection = document.getElementById(tabName);
  if (selectedSection) {
    selectedSection.classList.add("active");

    // Update page title
    const title = selectedSection.querySelector("h2");
    if (title) {
      document.querySelector(".topbar h1").textContent = title.textContent;
    }
  }

  // Update active nav link
  const navLinks = document.querySelectorAll(".nav-link");
  navLinks.forEach((link) => {
    link.classList.remove("active");
  });
  e.target.closest(".nav-link")?.classList.add("active");

  // Close submenu if clicking a submenu item
  const submenu = e.target.closest(".submenu");
  if (submenu) {
    submenu.parentElement.querySelector(".nav-link").classList.add("active");
  }
}

// Close alerts after 5 seconds
document.addEventListener("DOMContentLoaded", function () {
  const alerts = document.querySelectorAll(".alert");
  alerts.forEach((alert) => {
    setTimeout(() => {
      alert.style.transition = "opacity 0.3s ease";
      alert.style.opacity = "0";
      setTimeout(() => {
        alert.remove();
      }, 300);
    }, 5000);
  });
});

// Form validation
document.addEventListener("submit", function (e) {
  const form = e.target;
  const inputs = form.querySelectorAll("input[required], select[required]");

  let isValid = true;
  inputs.forEach((input) => {
    if (!input.value.trim()) {
      isValid = false;
      input.style.borderColor = "#f44336";
    } else {
      input.style.borderColor = "#ddd";
    }
  });

  if (!isValid) {
    e.preventDefault();
    alert("Please fill in all required fields");
  }
});

// Action button handlers
document.addEventListener("click", function (e) {
  if (e.target.closest(".btn-delete")) {
    if (confirm("Are you sure you want to delete this record?")) {
      // Add delete logic here
      alert("Record deleted successfully");
    }
  }

  if (e.target.closest(".btn-edit")) {
    alert("Edit functionality to be implemented");
  }

  if (e.target.closest(".btn-view")) {
    alert("View functionality to be implemented");
  }
});
// Add these functions to your admin-dashboard.js
function viewTechnician(id) {
  window.location.href = "/admin/technicians/" + id + "/details";
}

function editTechnician(id) {
  window.location.href = "/admin/technicians/" + id + "/edit";
}

function deleteTechnician(id) {
  if (confirm("Are you sure you want to delete this technician?")) {
    window.location.href = "/admin/technicians/" + id + "/delete";
  }
}
