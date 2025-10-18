// Mobile menu functionality
document.addEventListener("DOMContentLoaded", function () {
  const mobileMenuBtn = document.querySelector(".mobile-menu-btn");
  const navLinks = document.querySelector(".nav-links");
  const navAuth = document.querySelector(".nav-auth");

  if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener("click", function () {
      this.classList.toggle("active");
      navLinks.classList.toggle("active");
      navAuth.classList.toggle("active");
    });
  }

  // Add active class to current page link
  const currentPage = window.location.pathname;
  const navLinksAll = document.querySelectorAll(".nav-link");

  navLinksAll.forEach((link) => {
    if (link.getAttribute("href") === currentPage) {
      link.classList.add("active");
    }
  });
});
