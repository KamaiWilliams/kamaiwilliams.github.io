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


// SLIDESHOW

const slides = document.querySelectorAll(".slide");

const nextBtn = document.querySelector(".next");
const prevBtn = document.querySelector(".prev");

let currentSlide = 0;

function showSlide(index) {

  slides.forEach((slide) => {
    slide.classList.remove("active");
  });

  slides[index].classList.add("active");

}

nextBtn.addEventListener("click", () => {

  currentSlide++;

  if (currentSlide >= slides.length) {
    currentSlide = 0;
  }

  showSlide(currentSlide);

});

prevBtn.addEventListener("click", () => {

  currentSlide--;

  if (currentSlide < 0) {
    currentSlide = slides.length - 1;
  }

  showSlide(currentSlide);

});