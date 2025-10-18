// // Image preview functionality
// document.getElementById("userImage").addEventListener("change", function (e) {
//   const file = e.target.files[0];
//   const preview = document.getElementById("imagePreview");

//   // Create preview element if it doesn't exist
//   if (!preview) {
//     const imgPreview = document.createElement("img");
//     imgPreview.id = "imagePreview";
//     imgPreview.style.maxWidth = "150px";
//     imgPreview.style.maxHeight = "150px";
//     imgPreview.style.borderRadius = "8px";
//     imgPreview.style.marginTop = "10px";
//     imgPreview.style.display = "none";
//     this.parentNode.appendChild(imgPreview);
//   }

//   const imagePreview = document.getElementById("imagePreview");

//   if (file) {
//     const reader = new FileReader();
//     reader.onload = function (e) {
//       imagePreview.src = e.target.result;
//       imagePreview.style.display = "block";
//     };
//     reader.readAsDataURL(file);
//   } else {
//     if (imagePreview) {
//       imagePreview.style.display = "none";
//     }
//   }
// });
// document.getElementById("userImage").addEventListener("change", function (e) {
//   const file = e.target.files[0];
//   const preview = document.getElementById("imagePreview");

//   if (file) {
//     const reader = new FileReader();
//     reader.onload = function (e) {
//       preview.src = e.target.result;
//       preview.style.display = "block";
//     };
//     reader.readAsDataURL(file);
//   } else {
//     preview.style.display = "none";
//   }
// });

// // Form validation - UPDATED FOR TECHNICIAN FORM
// document.querySelector("form").addEventListener("submit", function (e) {
//   const name = document.getElementById("name").value.trim();
//   const email = document.getElementById("email").value.trim();
//   const phone = document.getElementById("phone").value.trim();
//   const gender = document.getElementById("gender").value;
//   const address = document.getElementById("address").value.trim();
//   const specialization = document.getElementById("specialization").value;
//   const experience = document.getElementById("experience").value;

//   let isValid = true;

//   // Reset previous errors
//   document.querySelectorAll(".is-invalid").forEach((el) => {
//     el.classList.remove("is-invalid");
//   });

//   // Remove existing error alerts
//   document.querySelectorAll(".alert-error").forEach((alert) => alert.remove());

//   // Name validation
//   if (name.length < 2) {
//     document.getElementById("name").classList.add("is-invalid");
//     isValid = false;
//   }

//   // Email validation
//   const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//   if (!emailRegex.test(email)) {
//     document.getElementById("email").classList.add("is-invalid");
//     isValid = false;
//   }

//   // Phone validation
//   const phoneRegex = /^[0-9]{10}$/;
//   if (!phoneRegex.test(phone.replace(/\D/g, ""))) {
//     document.getElementById("phone").classList.add("is-invalid");
//     isValid = false;
//   }

//   // Address validation
//   if (address.length < 5) {
//     document.getElementById("address").classList.add("is-invalid");
//     isValid = false;
//   }

//   // Specialization validation (instead of department)
//   if (!specialization) {
//     document.getElementById("specialization").classList.add("is-invalid");
//     isValid = false;
//   }

//   // Experience validation
//   if (!experience) {
//     document.getElementById("experience").classList.add("is-invalid");
//     isValid = false;
//   }

//   if (!isValid) {
//     e.preventDefault();
//     // Show error message
//     const errorAlert = document.createElement("div");
//     errorAlert.className = "alert alert-error";
//     errorAlert.innerHTML =
//       '<i class="fas fa-exclamation-circle"></i> Please fix the errors highlighted below.';
//     document
//       .querySelector(".form-container")
//       .insertBefore(
//         errorAlert,
//         document.querySelector(".form-container").firstChild
//       );

//     // Auto-hide this alert after 5 seconds
//     setTimeout(() => {
//       errorAlert.style.transition = "opacity 0.5s ease";
//       errorAlert.style.opacity = "0";
//       setTimeout(() => errorAlert.remove(), 500);
//     }, 5000);
//   }
// });

// // Auto-format phone number
// document.getElementById("phone").addEventListener("input", function (e) {
//   let value = e.target.value.replace(/\D/g, "");
//   if (value.length > 10) value = value.substring(0, 10);
//   e.target.value = value;
// });

// // Add CSS for invalid fields
// const style = document.createElement("style");
// style.textContent = `
//   .is-invalid {
//     border-color: #e74c3c !important;
//     background-color: #fdf2f2 !important;
//   }

//   .alert-error {
//     background: #f8d7da;
//     color: #721c24;
//     padding: 12px 15px;
//     border-radius: 5px;
//     margin-bottom: 20px;
//     border: 1px solid #f5c6cb;
//   }
// `;
// document.head.appendChild(style);

// // Auto-hide flash alerts after 5 seconds
// setTimeout(() => {
//   const alerts = document.querySelectorAll(".alert");
//   alerts.forEach((alert) => {
//     alert.style.transition = "opacity 0.5s ease";
//     alert.style.opacity = "0";
//     setTimeout(() => alert.remove(), 500);
//   });
// }, 5000);

// // Real-time validation for better UX
// document.querySelectorAll("input, select, textarea").forEach((element) => {
//   element.addEventListener("blur", function () {
//     const value = this.value.trim();

//     if (this.id === "name" && value.length < 2) {
//       this.classList.add("is-invalid");
//     } else if (this.id === "email") {
//       const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//       if (!emailRegex.test(value)) {
//         this.classList.add("is-invalid");
//       } else {
//         this.classList.remove("is-invalid");
//       }
//     } else if (this.id === "phone") {
//       const phoneRegex = /^[0-9]{10}$/;
//       if (!phoneRegex.test(value.replace(/\D/g, ""))) {
//         this.classList.add("is-invalid");
//       } else {
//         this.classList.remove("is-invalid");
//       }
//     } else if (this.id === "address" && value.length < 5) {
//       this.classList.add("is-invalid");
//     } else if (
//       (this.id === "specialization" || this.id === "experience") &&
//       !value
//     ) {
//       this.classList.add("is-invalid");
//     } else {
//       this.classList.remove("is-invalid");
//     }
//   });
// });
// File input preview
document.getElementById("userImage").addEventListener("change", function (e) {
  const file = e.target.files[0];
  if (file) {
    if (file.size > 5 * 1024 * 1024) {
      alert("File size must be less than 5MB");
      this.value = "";
      return;
    }

    const validTypes = ["image/jpeg", "image/jpg", "image/png"];
    if (!validTypes.includes(file.type)) {
      alert("Please select a valid image file (JPG, PNG, JPEG)");
      this.value = "";
      return;
    }
  }
});

// Form validation
document.querySelector("form").addEventListener("submit", function (e) {
  const phone = document.getElementById("phone").value;
  if (!/^\d{10}$/.test(phone)) {
    e.preventDefault();
    alert("Please enter a valid 10-digit phone number");
    return;
  }

  const experience = document.getElementById("experience").value;
  if (experience < 0 || experience > 50) {
    e.preventDefault();
    alert("Experience should be between 0 and 50 years");
    return;
  }
});
