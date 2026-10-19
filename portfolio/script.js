// FADE IN PROJECTS

const projects = document.querySelectorAll(".project");

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {

    if (entry.isIntersecting) {
      entry.target.style.opacity = 1;
      entry.target.style.transform = "translateY(0)";
    }

  });
}, {
  threshold: 0.2
});

projects.forEach((project) => {

  project.style.opacity = 0;
  project.style.transform = "translateY(60px)";
  project.style.transition = "all 1s ease";

  observer.observe(project);

});


document.querySelectorAll(".slideshow-container").forEach((container) => {
  const slides = container.querySelectorAll(".slide");
  const prevBtn = container.querySelector(".prev");
  const nextBtn = container.querySelector(".next");

  let index = 0;

  function showSlide(i) {
    slides.forEach((slide, idx) => {
      slide.classList.toggle("active", idx === i);
    });
  }

  prevBtn.addEventListener("click", () => {
    index = (index - 1 + slides.length) % slides.length;
    showSlide(index);
  });

  nextBtn.addEventListener("click", () => {
    index = (index + 1) % slides.length;
    showSlide(index);
  });

  showSlide(index);
});




document.querySelectorAll("[data-slideshow]").forEach((slideshow) => {
  const slides = Array.from(slideshow.querySelectorAll(".sm-slide"));
  const previousButton = slideshow.querySelector(".sm-prev");
  const nextButton = slideshow.querySelector(".sm-next");
  const counter = slideshow.querySelector(".sm-slide-counter");

  if (!slides.length || !previousButton || !nextButton) return;

  let currentIndex = 0;

  function showSlide(index) {
      currentIndex = (index + slides.length) % slides.length;

      slides.forEach((slide, i) => {
          slide.classList.toggle("is-active", i === currentIndex);
      });

      if (counter) {
          counter.textContent = `${currentIndex + 1} / ${slides.length}`;
      }
  }

  previousButton.addEventListener("click", () => {
      showSlide(currentIndex - 1);
  });

  nextButton.addEventListener("click", () => {
      showSlide(currentIndex + 1);
  });

  showSlide(0);
});
