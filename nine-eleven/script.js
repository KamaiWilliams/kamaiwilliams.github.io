const thetaLink = document.querySelector('.title-screen a');

thetaLink.addEventListener('mouseenter', () => {
  console.log("Hovered over Theta.NYC link!");
});

thetaLink.addEventListener('mouseleave', () => {
  console.log("Left Theta.NYC link!");
});