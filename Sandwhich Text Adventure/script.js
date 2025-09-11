// Simple text adventure engine
const scenes = {
    start: {
      text: "It's lunch time so you go to the kitchen to make a sandwhich.\nYou open the cabinet and look at your bread options, what bread do you want to use?",
      choices: [
        { text: "White bread", next: "whitebread" },
        { text: "Whole wheat", next: "wholewheat" },
        { text: "Bagel", next: "bagel" },
        { text: "No Bread", next: "starve" },
      ]
    },
    whitebread: {
      text: "You get two slices of white bread.\nWhat filling do you want?",
      choices: [
        { text: "Turkey", next: "turkey" },
        { text: "Peanut butter & jelly", next: "pbj" }
      ]
    },
    wholewheat: {
      text: "Whole wheat bread, nice and hearty.\nWhat will you add?",
      choices: [
        { text: "Ham & cheese", next: "hamcheese" },
        { text: "Veggie sandwich", next: "veggie" }
      ]
    },
    bagel: {
      text: "You slice and toast a bagel.\nWhat spread goes on it?",
      choices: [
        { text: "Cream cheese", next: "creamcheese" },
        { text: "Cream cheese & lox", next: "lox" }
      ]
    },
    starve: {
      text: "You starve. Why would you want no bread if your'e trying to make a sandwhich?",
      choices: [{ text: "Restart", next: "start" }]
    },

    turkey: {
      text: "You layer on slices of turkey.\nDo you wanna add some cheese?",
      choices: [
        { text: "Add cheese", next: "turkeycheese" },
        { text: "Keep it simple", next: "turkeyplain" }
      ]
    },
    pbj: {
      text: "You spread peanut butter and jelly. Real simple but gets the job done.\nEnjoy your'e diy uncrustable!",
      choices: [{ text: "Eat", next: "eat" }]
    },
    hamcheese: {
      text: "You pile on ham and cheese.\nAdd veggies?",
      choices: [
        { text: "Yes, lettuce & tomato", next: "hamveggie" },
        { text: "No, keep it plain", next: "eat" }
      ]
    },
    veggie: {
      text: "You stack cucumbers, peppers, and sprouts.\nTime to eat!",
      choices: [{ text: "Eat", next: "eat" }]
    },
    creamcheese: {
      text: "A simple cream cheese bagel.\nMunch time",
      choices: [{ text: "Eat", next: "eat" }]
    },
    lox: {
      text: "Smoked salmon with cream cheese.\nReady to eat",
      choices: [{ text: "Eat", next: "eat" }]
    },
    turkeycheese: {
      text: "Turkey & cheese together.\nYou need a bev for this dry meal!",
      choices: [{ text: "Eat", next: "eat" }]
    },
    turkeyplain: {
      text: "Just turkey on bread.\nEat Eat Eat!",
      choices: [{ text: "Eat", next: "eat" }]
    },
    hamveggie: {
      text: "Ham, cheese, lettuce & tomato.\nMunch time!",
      choices: [{ text: "Eat", next: "eat" }]
    },
    eat: {
      text: "You eat your sandwich. Your'e hella satisfied. \n\nWanna play again?",
      choices: [{ text: "Restart", next: "start" }]
    }
  };
  
  const gameDiv = document.getElementById("game");
  
  function render(sceneKey) {
    const scene = scenes[sceneKey];
    gameDiv.innerHTML = "";
  
    const textEl = document.createElement("p");
    textEl.textContent = scene.text;
    gameDiv.appendChild(textEl);
  
    scene.choices.forEach(choice => {
      const btn = document.createElement("span");
      btn.textContent = choice.text;
      btn.className = "choice";
      btn.onclick = () => render(choice.next);
      gameDiv.appendChild(btn);
    });
  }
  
  // start the game
  render("start");
  