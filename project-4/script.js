function updateDateTime() {
    const now = new Date();
    
    const timeOptions = {
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hour12: true
    };
    
    const dateOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    
    const currentTime = now.toLocaleTimeString([], timeOptions);
    const currentDate = now.toLocaleDateString([], dateOptions);
  
    document.getElementById('time').textContent = currentTime;
    document.getElementById('date').textContent = currentDate;
  }
  
  // Update immediately
  updateDateTime();
  
  // Update every second
  setInterval(updateDateTime, 1000);

  
function updateSkyColor() {
  const sky = document.querySelector('.sky');
  const hour = new Date().getHours();

  let color;

  if (hour >= 5 && hour < 8) {
    // Dawn
    color = '#FFD9A0'; // soft orange-pink
  } else if (hour >= 8 && hour < 11) {
    // Day
    color = '#BDF6FF';
  } else if (hour >= 10 && hour < 12) {
    // Day
    color = '#A7EBFE';
  } else if (hour >= 12 && hour < 14) {
    // Day
    color = '##9CDEF9  ';
  } else if (hour >= 14 && hour < 17) {
    // Day
    color = '##93CEFA  '; // light blue
  } else if (hour >= 17 && hour < 19) {
    // Sunset
    color = '#87C8FF'; // darkr blue
  } else if (hour >= 19 && hour < 21) {
    // Dusk
    color = '#2B3A67'; // deep blue-violet
  } else {
    // Night
    color = '#0D1B2A'; // very dark blue
  }

  sky.style.backgroundColor = color;
}

updateSkyColor();
// Optional: update every 5 minutes
setInterval(updateSkyColor, 5 * 60 * 1000);

