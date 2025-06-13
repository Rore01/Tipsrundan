const SIMULERA = true; // sätt till true för att simulera position
let questions = [];
let currentQuestionIndex = 0;
let score = 0;
let map, userMarker, nextMarker;

async function loadQuestions() {
  const response = await fetch('frågor.json');
  questions = await response.json();
  setupMap();
  checkPosition();
}

function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // meter
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c;
}

function setupMap() {
  map = L.map('map').setView([58.7529, 17.0079], 14);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);


  questions.forEach((q, i) => {
    L.circle([q.lat, q.lng], {
      color: 'blue',
      radius: 50,
      fillOpacity: 0.1
    }).addTo(map);

    L.marker([q.lat, q.lng])
      .addTo(map)
      .bindPopup(`Fråga ${i + 1}`);
  });
}

function checkPosition() {
  if (SIMULERA) {
    simulatePosition();
    return;
  }

  if (!navigator.geolocation) {
    alert('Geolocation stöds inte.');
    return;
  }

  navigator.geolocation.watchPosition(
    (position) => {
      handlePosition(position.coords.latitude, position.coords.longitude);
    },
    (error) => {
      console.error(error);
    },
    { enableHighAccuracy: true }
  );
}

function simulatePosition() {
  const interval = setInterval(() => {
    if (currentQuestionIndex >= questions.length) {
      clearInterval(interval);
      return;
    }
    const q = questions[currentQuestionIndex];
    handlePosition(q.lat, q.lng);
  }, 3000);
}

function handlePosition(latitude, longitude) {
  if (!map) return;


  if (userMarker) {
    userMarker.setLatLng([latitude, longitude]);
  } else {
    userMarker = L.marker([latitude, longitude], { title: 'Din position' }).addTo(map);
  }

 
  const question = questions[currentQuestionIndex];
  if (nextMarker) {
    nextMarker.setLatLng([question.lat, question.lng]);
  } else {
    nextMarker = L.marker([question.lat, question.lng], {
      title: 'Nästa plats',
      icon: L.icon({
        iconUrl: 'https://cdn-icons-png.flaticon.com/512/252/252025.png',
        iconSize: [30, 30]
      })
    }).addTo(map);
  }


  const group = new L.featureGroup([userMarker, nextMarker]);
  map.fitBounds(group.getBounds().pad(0.5));

  const distance = getDistance(latitude, longitude, question.lat, question.lng);
  document.getElementById('distance').textContent = `Avstånd till nästa plats: ${Math.round(distance)} meter`;

  if (distance < 50) {
    showQuestion(question);
  }
}

function showQuestion(question) {
  const box = document.getElementById('question-box');
  if (!box.classList.contains('hidden')) return; 
  box.classList.remove('hidden');
  document.getElementById('question-text').textContent = question.fråga;
  document.getElementById('question-image').src = question.bild;
}

function submitAnswer() {
  const input = document.getElementById('answer-input');
  const answer = input.value.trim();
  const correct = questions[currentQuestionIndex].svar;

  if (answer.toLowerCase() === correct.toLowerCase()) {
    score += questions[currentQuestionIndex].poäng;
    document.getElementById('score').textContent = `Poäng: ${score}`;
  }

  input.value = '';
  document.getElementById('question-box').classList.add('hidden');
  currentQuestionIndex++;

  if (currentQuestionIndex < questions.length) {

  } else {
    alert('Du har slutfört tipsrundan! Total poäng: ' + score);
  }
}

loadQuestions();
