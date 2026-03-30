

const audioPool = {};

function playSound(folder, index) {

  const key = `${folder}${index}`;
  const path = `jerkbeat/${folder}/${folder}${index}.wav`;

  if (!audioPool[key]) {
    audioPool[key] = [];
  }

  let sound = audioPool[key].find(a => a.paused);

  if (!sound) {
    sound = new Audio(path);
    sound.volume = 1;
    audioPool[key].push(sound);
  }

  sound.currentTime = 0;
  sound.play().catch(err => console.log("sound error:", err));

}