let divGmap;
let divDistance;
let selUnit;
let btnQuickprev;
let selHole;
let btnQuicknext;
let btnWeather;
let btnMenuopener;
let divMenu;
let btnPrev;
let btnNext;
let btnAutoplay;
let btnMeasure;
let divScrim;
let menuIsOpen = false;
let encName = '';
let course = null;
let map = null;
let holes = null;
let m1 = null;
let m2 = null;
let line = null;
let measuring = false;
let playing = false;
let autos = null;
const MINSTROKE = 2;
const MAXSTROKE = 4;
let primaryColor;
let secondaryColor;
let radius = 6975220;
let d = 0;
let ihole = 0;
function rad(x) {
  return x * Math.PI / 180;
}
function fastHaversine(p1, p2) {
  const lat = rad(p1.lat());
  const cLat = Math.cos(lat);
  const dLat = rad(p2.lat() - p1.lat());
  const dLong = rad(p2.lng() - p1.lng());
  const sdLat = dLat / 2;
  const sdLong = dLong / 2;
  const a = sdLat * sdLat + cLat * cLat * sdLong * sdLong;
  const c = (2 + a) * Math.sqrt(a);
  const r = radius * c;
  return r;
}
function setUnit() {
  const unit = selUnit.value;
  if (unit == 'yd')
    radius = 6975220;
  else
    radius = 6378137;
  if (measuring)
    handleDrag();
  else
    setHole(ihole);
}
function toggleUnit() {
  if (selUnit.value == 'yd')
    selUnit.value = 'mt';
  else
    selUnit.value = 'yd';
  setUnit();
}
function handleDrag() {
  const p = [m1.getPosition(), m2.getPosition()];
  line.setPath(p);
  d = fastHaversine(m1.getPosition(), m2.getPosition());
  divDistance.innerText = d.toFixed(0);
}
function handleDragEnd() {
  handleDrag();
  const isUserLost = (d > 1000);
  if (isUserLost)
    stopMeasuring();
}
function startMeasuring() {
  btnMeasure.childNodes[1].nodeValue = 'Stop measuring';
  holes[ihole].setOptions({ strokeWeight: MINSTROKE, strokeColor: secondaryColor });
  if (map.getZoom() < 18)
    map.setZoom(18);
  const p = map.getCenter();
  const DELTALNG = 0.0005;
  const p1 = new google.maps.LatLng(p.lat(), p.lng() - DELTALNG);
  const p2 = new google.maps.LatLng(p.lat(), p.lng() + DELTALNG);
  m1.setPosition(p1);
  m2.setPosition(p2);
  handleDrag();
  line.setMap(map);
  m1.setMap(map);
  m2.setMap(map);
  measuring = true;
}
function stopMeasuring() {
  btnMeasure.childNodes[1].nodeValue = 'Measure';
  m1.setMap(null);
  m2.setMap(null);
  m1.setAnimation(google.maps.Animation.DROP);
  m2.setAnimation(google.maps.Animation.DROP);
  line.setMap(null);
  measuring = false;
  setHole(ihole);
}
function toggleMeasuring() {
  if (measuring)
    stopMeasuring();
  else
    startMeasuring();
}
function setHole(n) {
  if (measuring) {
    stopMeasuring();
    measuring = false;
  }
  if (map.getZoom() < 16)
    map.setZoom(16);
  holes[ihole].setOptions({ strokeWeight: MINSTROKE, strokeColor: secondaryColor });
  ihole = n;
  holes[ihole].setOptions({ strokeWeight: MAXSTROKE, strokeColor: primaryColor });
  const c = {
    'lat': course.holes[ihole][0].lat / 2 + course.holes[ihole][1].lat / 2,
    'lng': course.holes[ihole][0].lng / 2 + course.holes[ihole][1].lng / 2
  };
  map.panTo(c);
  let d = 0;
  let ds = '';
  const p = holes[ihole].getPath();
  for (let i = 0; i < p.getLength() - 1; i++) {
    let dadd = fastHaversine(p.getAt(i), p.getAt(i + 1));
    d += dadd;
    ds += dadd.toFixed() + ' + ';
  }
  ds = ds.substr(0, ds.length - 3);
  ds += ' = ' + d.toFixed();
  selHole.value = (ihole + 1).toString();
  divDistance.innerText = ds;
}
function nextHole() {
  if (measuring) {
    stopMeasuring();
    measuring = false;
  }
  if (ihole >= 17) {
    setHole(0);
    return;
  }
  setHole(ihole + 1);
  return;
}
function prevHole() {
  if (ihole <= 0) {
    setHole(17);
    return;
  }
  setHole(ihole - 1);
  return;
}
function stopAutoPlay() {
  btnAutoplay.childNodes[1].nodeValue = 'Autoplay';
  for (let i = 0; i < 19; i++) {
    clearTimeout(autos[i]);
    autos[i] = null;
  }
  playing = false;
}
function autoPlay() {
  if (playing) {
    stopAutoPlay();
  }
  else {
    btnAutoplay.childNodes[1].nodeValue = 'Stop autoplay';
    let t = 0;
    autos = [];
    const f = i => {
      autos[i] = setTimeout(() => { setHole(i); }, t);
      t += 4000;
    };
    for (let i = 0; i < 18; i++) {
      f(i);
    }
    autos[18] = setTimeout(stopAutoPlay, t);
    playing = true;
  }
}
function toggleMenu() {
  if (menuIsOpen) {
    closeMenu();
  }
  else {
    openMenu();
  }
}
function closeMenu() {
  menuIsOpen = false;
  divMenu.classList.add('collapse');
  divScrim.classList.add('hide');
  btnMenuopener.children[0].classList.replace('fa-times', 'fa-bars');
}
function openMenu() {
  menuIsOpen = true;
  divMenu.classList.remove('collapse');
  divScrim.classList.remove('hide');
  btnMenuopener.children[0].classList.replace('fa-bars', 'fa-times');
}
function searchWeather() {
  const ll = course.holes[0][0];
  const q = ll.lat.toFixed(3) + ',' + ll.lng.toFixed(3);
  window.open('https://weather.com/weather/5day/l/' + q);
}
async function initMap() {
  // Elements
  divGmap = document.getElementById('gmap');
  divDistance = document.getElementById('distance');
  selUnit = document.getElementById('unit');
  btnQuickprev = document.getElementById('quickprev');
  selHole = document.getElementById('hole');
  btnQuicknext = document.getElementById('quicknext');
  btnWeather = document.getElementById('weather');
  btnMenuopener = document.getElementById('menuopener');
  divMenu = document.getElementById('menu');
  btnPrev = document.getElementById('prev');
  btnNext = document.getElementById('next');
  btnAutoplay = document.getElementById('autoplay');
  btnMeasure = document.getElementById('measure');
  divScrim = document.getElementById('scrim');
  // Map
  const mapOptions = {
    keyboardShortcuts: false,
    panControl: false,
    zoomControl: false,
    rotateControl: true,
    rotateControlOptions: {
      position: google.maps.ControlPosition.LEFT_BOTTOM
    },
    streetViewControl: false,
    mapTypeControl: false,
    mapTypeId: google.maps.MapTypeId.SATELLITE,
    fullscreenControl: false,
    zoom: 18,
    heading: 0,
    tilt: 45
  };
  map = new google.maps.Map(divGmap, mapOptions);
  // Initialize Firebase
  const config = {
    apiKey: "AIzaSyA6UsBqwd-dpNe4xIs580tb1mS6NLUUdJw",
    authDomain: "golfmaps-4087b.firebaseapp.com",
    databaseURL: "https://golfmaps-4087b.firebaseio.com",
    projectId: "golfmaps-4087b",
    storageBucket: "golfmaps-4087b.appspot.com",
    messagingSenderId: "104511302290",
    appId: "1:104511302290:web:1e535c8fac960594"
  };
  firebase.initializeApp(config);
  // Holes
  primaryColor = getComputedStyle(divMenu).getPropertyValue('--primary-color');
  secondaryColor = getComputedStyle(divMenu).getPropertyValue('--secondary-color');
  const url = new URL(window.location.href);
  encName = url.searchParams.get('c');
  const ref = firebase.database().ref('courses/' + encName);
  const snapshot = await ref.once('value');
  course = snapshot.val();
  document.title = course.name;
  holes = [];
  for (let i = 0; i < 18; i++) {
    let p = [];
    let l = course.holes[i].length;
    for (let j = 0; j < l; j++) {
      p[j] = new google.maps.LatLng(course.holes[i][j]);
    }
    holes[i] = new google.maps.Polyline({
      path: p,
      map: map,
      editable: false,
      strokeWeight: MINSTROKE,
      strokeColor: secondaryColor
    });
    google.maps.event.addListener(holes[i], 'click', () => {
      setHole(i);
    });
  }
  setHole(ihole);
  // Markers
  const vmax = Math.max(divGmap.clientWidth, divGmap.clientHeight);
  const size = 0.10 * vmax;
  const ico = {
    url: 'img/pin.png',
    scaledSize: new google.maps.Size(size, size)
  };
  const mOptions = {
    icon: ico,
    draggable: true,
    title: 'Drag me!',
    animation: google.maps.Animation.DROP
  };
  m1 = new google.maps.Marker(mOptions);
  m2 = new google.maps.Marker(mOptions);
  google.maps.event.addListener(m1, 'drag', handleDrag);
  google.maps.event.addListener(m2, 'drag', handleDrag);
  google.maps.event.addListener(m1, 'dragend', handleDragEnd);
  google.maps.event.addListener(m2, 'dragend', handleDragEnd);
  // Line
  line = new google.maps.Polyline({
    strokeColor: primaryColor,
    strokeOpacity: 1,
    strokeWeight: MAXSTROKE
  });
  // Controls
  map.controls[google.maps.ControlPosition.RIGHT_CENTER].push(btnQuickprev);
  btnQuickprev.addEventListener('click', prevHole);
  map.controls[google.maps.ControlPosition.RIGHT_CENTER].push(selHole);
  selHole.addEventListener('change', e => { setHole(e.target.value - 1); });
  map.controls[google.maps.ControlPosition.RIGHT_CENTER].push(btnQuicknext);
  btnQuicknext.addEventListener('click', nextHole);
  map.controls[google.maps.ControlPosition.TOP_RIGHT].push(divDistance);
  map.controls[google.maps.ControlPosition.RIGHT_TOP].push(selUnit);
  selUnit.addEventListener('change', setUnit);
  // Menu
  btnMenuopener.addEventListener('click', toggleMenu);
  btnPrev.addEventListener('click', () => { prevHole(); closeMenu(); });
  btnNext.addEventListener('click', () => { nextHole(); closeMenu(); });
  btnMeasure.addEventListener('click', () => { toggleMeasuring(); closeMenu(); });
  btnAutoplay.addEventListener('click', () => { autoPlay(); closeMenu(); });
  btnWeather.addEventListener('click', () => { searchWeather(); closeMenu(); });
  divScrim.addEventListener('click', closeMenu);
  // Keyboard
  const bindHoles = i => {
    let is = (i + 1).toString();
    Mousetrap.bind(is, () => { setHole(i); });
    Mousetrap.bind('shift+' + is, () => { setHole(i + 9); });
  };
  for(let i = 0; i < 9; i++) {
    bindHoles(i);
  }
  Mousetrap.bind(['right', 'down'], nextHole);
  Mousetrap.bind(['left', 'up'], prevHole);
  Mousetrap.bind('m', toggleMeasuring);
  Mousetrap.bind('y', toggleUnit);
  Mousetrap.bind('a', autoPlay);
}