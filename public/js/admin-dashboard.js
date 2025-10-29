// Toggle sidebar submenu
function toggleSubmenu(e) {
  e.preventDefault();
  const parent = e.target.closest("li");
  parent.classList.toggle("open");
}

// Switch between sections - FIXED VERSION
function switchTab(e, tabName) {
  if (e) e.preventDefault();

  console.log("Switching to tab:", tabName);

  // Hide all sections
  const sections = document.querySelectorAll(".content-section");
  sections.forEach((section) => {
    section.style.display = "none";
  });

  // Show selected section
  const selectedSection = document.getElementById(tabName);
  if (selectedSection) {
    selectedSection.style.display = "block";
    console.log("Successfully switched to:", tabName);

    // Update page title
    const title = selectedSection.querySelector("h2");
    if (title) {
      document.querySelector(".topbar h1").textContent = title.textContent;
    }
  } else {
    console.error("Section not found:", tabName);
    // Fallback: show dashboard if section not found
    const dashboard = document.getElementById("dashboard");
    if (dashboard) {
      dashboard.style.display = "block";
    }
  }

  // Update active nav link
  if (e && e.target) {
    const navLinks = document.querySelectorAll(".nav-link");
    navLinks.forEach((link) => {
      link.classList.remove("active");
    });

    const clickedLink = e.target.closest(".nav-link");
    if (clickedLink) {
      clickedLink.classList.add("active");
    }
  }
}

// Initialize dashboard on page load
document.addEventListener("DOMContentLoaded", function () {
  console.log("Admin dashboard initialized");

  // Show dashboard by default
  const dashboard = document.getElementById("dashboard");
  if (dashboard) {
    dashboard.style.display = "block";
  }

  // Close alerts after 5 seconds
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

// Technician Functions
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

// Manager Functions
function viewManager(id) {
  window.location.href = "/admin/managers/" + id + "/details";
}

function editManager(id) {
  window.location.href = "/admin/managers/" + id + "/edit";
}

function deleteManager(id) {
  if (confirm("Are you sure you want to delete this manager?")) {
    window.location.href = "/admin/managers/" + id + "/delete";
  }
}

function deactivateManager(id) {
  if (confirm("Are you sure you want to deactivate this manager?")) {
    window.location.href = "/admin/managers/" + id + "/deactivate";
  }
}

// Simple debug function (optional - remove if not needed)
function debugManagerSections() {
  console.log("=== DEBUG ===");
  console.log("managers-list:", document.getElementById("managers-list"));
  console.log("managers-add:", document.getElementById("managers-add"));
  console.log("technicians-list:", document.getElementById("technicians-list"));
  console.log("technicians-add:", document.getElementById("technicians-add"));
  console.log("dashboard:", document.getElementById("dashboard"));
}
