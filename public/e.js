var map = null;
var holes = null;
var course = null;
var R = 6378137;
var ihole = 0;
function rad(x) {
  return (x * Math.PI) / 180;
}
function fastHaversine(p1, p2) {
  var lat = rad(p1.lat());
  var cLat = Math.cos(lat);
  var dLat = rad(p2.lat() - p1.lat());
  var dLong = rad(p2.lng() - p1.lng());
  var sdLat = dLat / 2;
  var sdLong = dLong / 2;
  var a = sdLat * sdLat + cLat * cLat * sdLong * sdLong;
  var c = (2 + a) * Math.sqrt(a);
  var d = R * c;
  return d;
}
function nextHole() {
  ihole++;
  if (ihole === 18) ihole = 0;
  setHole();
}
function setHole() {
  var el = document.getElementById("hole");
  el.value = ihole + 1;
  if (holes[ihole].getMap() === null) {
    holes[ihole].setMap(map);
    dragHole();
  } else {
    goToHole();
  }
}
function dragHole() {
  var p = map.getCenter();
  var p1 = new google.maps.LatLng(p.lat(), p.lng());
  var p2 = new google.maps.LatLng(p.lat(), p.lng() + 0.0002);
  holes[ihole].setPath([p1, p2]);
  google.maps.event.addListener(holes[ihole].getPath(), "set_at", showDistance);
  google.maps.event.addListener(
    holes[ihole].getPath(),
    "insert_at",
    showDistance
  );
  showDistance();
}
function goToHole() {
  var p = holes[ihole].getPath().getAt(0);
  map.setCenter(p);
  showDistance();
}
function showDistance() {
  var p = holes[ihole].getPath();
  var s = "";
  var tot = 0;
  for (j = 1; j < p.length; j++) {
    var d = fastHaversine(p.getAt(j), p.getAt(j - 1));
    tot += d;
    s += d.toFixed(0);
    s += "-";
  }
  s += ">";
  s += tot.toFixed(0);
  var el = document.getElementById("distance");
  el.value = s;
}
function addFirebase() {
  course = {};
  var el = document.getElementById("name");
  var coursename = el.value;
  var encName = coursename.replace(new RegExp(" ", "g"), "-").toLowerCase();
  course.name = coursename;
  el = document.getElementById("country");
  var country = el.value;
  course.country = country;
  course.holes = [];
  for (i = 0; i < 18; i++) {
    course.holes[i] = [];
    path = holes[i].getPath();
    for (j = 0; j < path.length; j++) {
      course.holes[i][j] = {};
      course.holes[i][j].lat = path.getAt(j).lat();
      course.holes[i][j].lng = path.getAt(j).lng();
    }
  }
  ref = firebase.database().ref("courses/" + encName);
  ref.set(course, function (error) {
    if (error) {
      console.log(error.code);
      if (error.code === "PERMISSION_DENIED") {
        window.open("login.html", "_blank");
      }
    } else {
      var url = "v.html?c=" + encName;
      window.open(url, "_blank");
    }
  });
}
function dragMap() {
  var el = document.getElementById("where");
  var s = el.value;
  var ss = s.split(",");
  var lat = parseFloat(ss[0]);
  var lng = parseFloat(ss[1]);
  p = new google.maps.LatLng(lat, lng);
  map.setCenter(p);
  var polyOptions = {
    editable: true,
    visible: true,
    map: null,
    strokeColor: "rgb(238, 136, 34)",
    strokeOpacity: 1,
    strokeWeight: 3,
  };
  holes = [];
  for (ihole = 0; ihole < 18; ihole++) {
    holes[ihole] = new google.maps.Polyline(polyOptions);
    dragHole();
  }
  ihole = 0;
  setHole();
}
function init() {
  // Firebase analytics
  firebase.analytics();
  // map
  var mapOptions = {
    center: new google.maps.LatLng(52.55445, -1.73364),
    zoom: 18,
    panControl: false,
    rotateControl: true,
    zoomControl: true,
    zoomControlOptions: {
      position: google.maps.ControlPosition.RIGHT,
      style: google.maps.ZoomControlStyle.LARGE,
    },
    streetViewControl: false,
    mapTypeControl: false,
    mapTypeId: google.maps.MapTypeId.SATELLITE,
    fullscreenControl: false,
    keyboardShortcuts: false,
  };
  var el = document.getElementById("gmap");
  map = new google.maps.Map(el, mapOptions);
  dragMap();
  // controls
  el = document.getElementById("dragmap");
  el.onclick = dragMap;
  el = document.getElementById("draghole");
  el.onclick = dragHole;
  el = document.getElementById("nexthole");
  el.onclick = nextHole;
  el = document.getElementById("gotohole");
  el.onclick = goToHole;
  el = document.getElementById("set");
  el.onclick = addFirebase;
  // keyboard
  Mousetrap.bind("enter", dragMap);
  Mousetrap.bind("d", dragHole);
  Mousetrap.bind("n", nextHole);
  Mousetrap.bind("g", goToHole);
}
