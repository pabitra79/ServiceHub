function bookTechnician(technicianId, technicianName) {
  if (confirm(`Book technician ${technicianName}?`)) {
    // Redirect to booking page with technician ID
    window.location.href = `/booking?technician=${technicianId}`;
  }
}
function showPage(pageId) {
  // Hide all pages
  document.querySelectorAll(".page-content").forEach((page) => {
    page.classList.remove("active");
  });

  // Show selected page
  document.getElementById(pageId).classList.add("active");

  // Update active nav link
  document.querySelectorAll(".nav-links a").forEach((link) => {
    link.classList.remove("active");
  });

  // Set active class on clicked nav link
  event.target.classList.add("active");
}

// Mobile Menu Toggle
document
  .querySelector(".mobile-menu-btn")
  .addEventListener("click", function () {
    this.classList.toggle("active");
    document.querySelector(".nav-links").classList.toggle("active");
  });

// Function to view technician profile
function viewTechnicianProfile(id) {
  // This would redirect to the technician's profile page
  alert("Viewing technician profile with ID: " + id);
}
