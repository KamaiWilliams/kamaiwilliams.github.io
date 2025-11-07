const slides = document.querySelectorAll(".slide");
const nextButtons = document.querySelectorAll(".nextBtn");
const startBtn = document.getElementById("startSurveyBtn");
const progressBar = document.getElementById("progressBar");
const submitBtn = document.getElementById("submitBtn");

let currentSlide = 0;

function showSlide(index) {
  slides.forEach(slide => slide.classList.remove("active"));
  slides[index].classList.add("active");

  // Update progress bar
  const progress = (index / (slides.length - 1)) * 100;
  progressBar.style.width = `${progress}%`;
}

startBtn.addEventListener("click", () => {
  currentSlide = 1;
  showSlide(currentSlide);
});

nextButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    currentSlide++;
    if (currentSlide < slides.length) showSlide(currentSlide);
  });
});

submitBtn.addEventListener("click", () => {
  alert("Thank you for participating in the survey!");
  currentSlide = 0;
  showSlide(currentSlide);
});

// Initialize
showSlide(0);
