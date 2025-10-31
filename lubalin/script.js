const startBtn = document.getElementById('start-btn');
const nextBtn = document.getElementById('next-btn');
const pages = document.querySelectorAll('.page');
const questionText = document.getElementById('question-text');
const questionContent = document.getElementById('question-content');

let currentQuestion = 0;

const questions = [
  {
    type: 'text',
    text: 'Using one word, describe what the following symbol makes you feel.',
    image: 'https://upload.wikimedia.org/wikipedia/commons/4/49/Sombrero_icon.png',
    placeholder: 'Type one word...',
  },
  {
    type: 'text',
    text: 'This reminds me of ___________.',
    image: 'https://upload.wikimedia.org/wikipedia/commons/9/9d/Chili_pepper_icon.png',
    placeholder: 'What comes to mind...',
  },
  {
    type: 'multiple-choice',
    text: 'What kind of restaurant food does this symbol most remind you of?',
    image: 'https://upload.wikimedia.org/wikipedia/commons/d/d4/Taco_icon.png',
    options: ['Italian', 'French', 'Mexican', 'American', 'Thai'],
  },
  {
    type: 'slider',
    text: 'Rank how “Cowboy” this image feels to you.',
    image: 'https://upload.wikimedia.org/wikipedia/commons/8/84/Cowboy_hat_icon.png',
    min: 0,
    max: 10,
  },
  {
    type: 'color',
    text: 'What color do you associate with this dish?',
    image: 'https://upload.wikimedia.org/wikipedia/commons/f/f2/Guacamole_icon.png',
  },
  {
    type: 'text',
    text: 'What is a 3-word definition of “authentic”?',
    placeholder: 'Type your definition...',
  },
  {
    type: 'multiple-choice',
    text: 'Which of these symbols looks most authentic for a restaurant logo?',
    options: ['Sombrero', 'Cactus', 'Cowboy Hat', 'Chili Pepper', 'Guitar'],
  }
];

function showPage(id) {
  pages.forEach(page => page.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

function showQuestion() {
  const q = questions[currentQuestion];
  questionText.textContent = q.text;
  questionContent.innerHTML = '';

  if (q.image) {
    const img = document.createElement('img');
    img.src = q.image;
    img.classList.add('question-image');
    questionContent.appendChild(img);
  }

  if (q.type === 'text') {
    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = q.placeholder;
    questionContent.appendChild(input);
  } else if (q.type === 'multiple-choice') {
    const select = document.createElement('select');
    q.options.forEach(opt => {
      const option = document.createElement('option');
      option.value = opt;
      option.textContent = opt;
      select.appendChild(option);
    });
    questionContent.appendChild(select);
  } else if (q.type === 'slider') {
    const input = document.createElement('input');
    input.type = 'range';
    input.min = q.min;
    input.max = q.max;
    input.value = (q.max - q.min) / 2;
    questionContent.appendChild(input);
  } else if (q.type === 'color') {
    const input = document.createElement('input');
    input.type = 'color';
    questionContent.appendChild(input);
  }
}

startBtn.addEventListener('click', () => {
  showPage('question-page');
  showQuestion();
});

nextBtn.addEventListener('click', () => {
  currentQuestion++;
  if (currentQuestion < questions.length) {
    showQuestion();
  } else {
    showPage('end-page');
  }
});
