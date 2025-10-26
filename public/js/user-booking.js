// Star rating functionality
document.addEventListener("DOMContentLoaded", function () {
  document.querySelectorAll(".star-rating").forEach((ratingEl) => {
    const stars = ratingEl.querySelectorAll(".star");
    const hiddenInput = document.getElementById(
      `rating-input-${ratingEl.id.split("-")[1]}`
    );

    let currentRating = 0;

    stars.forEach((star) => {
      star.addEventListener("click", function () {
        const rating = parseInt(this.getAttribute("data-rating"));
        currentRating = rating;
        hiddenInput.value = rating;

        // Update star display
        stars.forEach((s, index) => {
          if (index < rating) {
            s.classList.add("active");
          } else {
            s.classList.remove("active");
          }
        });
      });

      star.addEventListener("mouseover", function () {
        const rating = parseInt(this.getAttribute("data-rating"));
        stars.forEach((s, index) => {
          if (index < rating) {
            s.style.color = "#ffc107";
          } else {
            s.style.color = "#ddd";
          }
        });
      });

      star.addEventListener("mouseout", function () {
        stars.forEach((s, index) => {
          if (index < currentRating) {
            s.style.color = "#ffc107";
          } else {
            s.style.color = "#ddd";
          }
        });
      });
    });
  });
});

      // Star rating functionality
      document.addEventListener('DOMContentLoaded', function() {
        document.querySelectorAll('.star-rating').forEach(ratingEl => {
          const bookingId = ratingEl.id.split('-')[1];
          const stars = ratingEl.querySelectorAll('.star');
          const hiddenInput = document.getElementById(`rating-input-${bookingId}`);
          
          let currentRating = 0;
          
          stars.forEach(star => {
            star.addEventListener('click', function() {
              const rating = parseInt(this.getAttribute('data-rating'));
              currentRating = rating;
              hiddenInput.value = rating;
              
              // Update star display
              stars.forEach((s, index) => {
                if (index < rating) {
                  s.classList.add('active');
                } else {
                  s.classList.remove('active');
                }
              });
            });
            
            star.addEventListener('mouseover', function() {
              const rating = parseInt(this.getAttribute('data-rating'));
              stars.forEach((s, index) => {
                if (index < rating) {
                  s.style.color = '#ffc107';
                } else {
                  s.style.color = '#ddd';
                }
              });
            });
            
            star.addEventListener('mouseout', function() {
              stars.forEach((s, index) => {
                if (index < currentRating) {
                  s.style.color = '#ffc107';
                } else {
                  s.style.color = '#ddd';
                }
              });
            });
          });
        });
      });

      // Character count for comments
      function updateCharCount(textarea, countId) {
        const countElement = document.getElementById(countId);
        const count = textarea.value.length;
        countElement.textContent = `${count}/500 characters`;
        
        if (count > 450) {
          countElement.style.color = '#dc3545';
        } else if (count > 400) {
          countElement.style.color = '#ffc107';
        } else {
          countElement.style.color = '#6c757d';
        }
      }

      // Initialize character count on page load
      document.addEventListener('DOMContentLoaded', function() {
        document.querySelectorAll('textarea').forEach(textarea => {
          const countId = textarea.id.replace('comment-', 'char-count-');
          updateCharCount(textarea, countId);
        });
      });


