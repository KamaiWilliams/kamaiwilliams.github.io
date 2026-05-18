const items = document.querySelectorAll('.carousel-item');
const caption = document.querySelector('.carousel-caption');

const nextBtn = document.querySelector('.arrow.right');
const prevBtn = document.querySelector('.arrow.left');

let index = 0;

function updateCarousel() {
  items.forEach((item, i) => {
    item.classList.remove('active', 'prev', 'next', 'far-prev', 'far-next');

    if (i === index) {
      item.classList.add('active');
    } 
    else if (i === index - 1 || (index === 0 && i === items.length - 1)) {
      item.classList.add('prev');
    } 
    else if (i === index + 1 || (index === items.length - 1 && i === 0)) {
      item.classList.add('next');
    } 
    else if (i === index - 2 || (index === 0 && i === items.length - 2)) {
      item.classList.add('far-prev');
    } 
    else if (i === index + 2 || (index === items.length - 1 && i === 1)) {
      item.classList.add('far-next');
    }
  });

  caption.textContent = items[index].dataset.caption;
}

nextBtn.addEventListener('click', () => {
  index = (index + 1) % items.length;
  updateCarousel();
});

prevBtn.addEventListener('click', () => {
  index = (index - 1 + items.length) % items.length;
  updateCarousel();
});

updateCarousel();

document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') {
      index = (index + 1) % items.length;
      updateCarousel();
    }
  
    if (e.key === 'ArrowLeft') {
      index = (index - 1 + items.length) % items.length;
      updateCarousel();
    }
  });

  let startX = 0;
let endX = 0;

const carousel = document.querySelector('.carousel');

carousel.addEventListener('touchstart', (e) => {
  startX = e.touches[0].clientX;
});

carousel.addEventListener('touchmove', (e) => {
  endX = e.touches[0].clientX;
});

carousel.addEventListener('touchend', () => {
  handleSwipe();
});

// also support mouse drag (optional but nice)
carousel.addEventListener('mousedown', (e) => {
  startX = e.clientX;

  const onMouseMove = (e) => {
    endX = e.clientX;
  };

  const onMouseUp = () => {
    handleSwipe();
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
  };

  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup', onMouseUp);
});

function handleSwipe() {
  const threshold = 50; // minimum distance to count as swipe

  if (startX - endX > threshold) {
    // swipe left → next
    index = (index + 1) % items.length;
    updateCarousel();
  } else if (endX - startX > threshold) {
    // swipe right → prev
    index = (index - 1 + items.length) % items.length;
    updateCarousel();
  }

  // reset
  startX = 0;
  endX = 0;
}