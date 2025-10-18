document.getElementById("userImage").addEventListener("change", function (e) {
  const file = e.target.files[0];
  const preview = document.getElementById("imagePreview");

  if (file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      preview.src = e.target.result;
      preview.style.display = "block";
    };
    reader.readAsDataURL(file);
  } else {
    preview.style.display = "none";
  }
});

// Form validation
document.getElementById("managerForm").addEventListener("submit", function (e) {
  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const gender = document.getElementById("gender").value;
  const address = document.getElementById("address").value.trim();
  const department = document.getElementById("department").value;

  let isValid = true;

  // Reset previous errors
  document.querySelectorAll(".is-invalid").forEach((el) => {
    el.classList.remove("is-invalid");
  });

  // Name validation
  if (name.length < 2) {
    document.getElementById("name").classList.add("is-invalid");
    isValid = false;
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    document.getElementById("email").classList.add("is-invalid");
    isValid = false;
  }

  // Phone validation
  const phoneRegex = /^[0-9]{10}$/;
  if (!phoneRegex.test(phone.replace(/\D/g, ""))) {
    document.getElementById("phone").classList.add("is-invalid");
    isValid = false;
  }

  // Gender validation
  if (!gender) {
    document.getElementById("gender").classList.add("is-invalid");
    isValid = false;
  }

  // Address validation
  if (address.length < 5) {
    document.getElementById("address").classList.add("is-invalid");
    isValid = false;
  }

  // Department validation
  if (!department) {
    document.getElementById("department").classList.add("is-invalid");
    isValid = false;
  }

  if (!isValid) {
    e.preventDefault();
    // Show error message
    const errorAlert = document.createElement("div");
    errorAlert.className = "alert alert-error";
    errorAlert.innerHTML =
      '<i class="fas fa-exclamation-circle me-2"></i>Please fix the errors highlighted below.';
    document.querySelector(".form-header").after(errorAlert);
  }
});

// Auto-format phone number
document.getElementById("phone").addEventListener("input", function (e) {
  let value = e.target.value.replace(/\D/g, "");
  if (value.length > 10) value = value.substring(0, 10);
  e.target.value = value;
});

// Auto-hide alerts after 5 seconds
setTimeout(() => {
  const alerts = document.querySelectorAll(".alert");
  alerts.forEach((alert) => {
    alert.style.transition = "opacity 0.5s ease";
    alert.style.opacity = "0";
    setTimeout(() => alert.remove(), 500);
  });
}, 5000);
