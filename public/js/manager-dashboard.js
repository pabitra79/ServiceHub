function switchTab(event, tabName) {
  event.preventDefault();

  // Hide all sections
  const sections = document.querySelectorAll(".content-section");
  sections.forEach((section) => {
    section.classList.remove("active");
    section.style.display = "none";
  });

  // Show selected section
  const selectedSection = document.getElementById(tabName);
  if (selectedSection) {
    selectedSection.classList.add("active");
    selectedSection.style.display = "block";
  }

  // Update active nav link
  const navLinks = document.querySelectorAll(".nav-link");
  navLinks.forEach((link) => link.classList.remove("active"));
  event.target.closest(".nav-link").classList.add("active");
}

function toggleSubmenu(event) {
  event.preventDefault();
  const submenu = event.target.closest("li").querySelector(".submenu");
  if (submenu) {
    submenu.style.display =
      submenu.style.display === "block" ? "none" : "block";
  }
  if (
    event.target.getAttribute("href") &&
    event.target.getAttribute("href").startsWith("/")
  ) {
    return true; // Allow default navigation
  }

  event.preventDefault();

  // Hide all content sections
  document.querySelectorAll(".content-section").forEach((section) => {
    section.classList.remove("active");
  });

  // Remove active class from all nav links
  document.querySelectorAll(".nav-link").forEach((link) => {
    link.classList.remove("active");
  });

  // Show the selected tab content
  const targetTab = document.getElementById(tabId);
  if (targetTab) {
    targetTab.classList.add("active");
    event.target.classList.add("active");
  }
}
