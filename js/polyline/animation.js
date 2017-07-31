var app = app || {};

(function() {
  app.animateRoute = function(coords, route, options) {
    var opts = options || {};
    var step = 0;
    var numSteps = opts.steps || 20;
    var animationSpeed = opts.speed || 0.50;
    var offset = route.animationIndex;
    var nextOffset = route.animationIndex + 1;
    var departure;
    var destination;
    var nextStop;
    var path;
    var interval;

    if (nextOffset >= coords.length) {
      clearInterval(interval);
      return false;
    }

    departure = coords[offset];
    destination = coords[nextOffset];

    var polylineOptions = opts.polylineOptions || {
      strokeColor: '#50bfe6',
      strokeOpacity: 1,
      strokeWeight: 5
    };
    polylineOptions.map = app.map;
    polylineOptions.path = [departure, departure];

    path = new google.maps.Polyline(polylineOptions)

    route.renderedPaths.push(path);

    interval = setInterval(function() {
      step++;
      if (step > numSteps) {
        route.animationIndex++;
        app.animateRoute(coords, route, options);
        clearInterval(interval);
      } else {
        nextStop = google.maps.geometry.spherical.interpolate(departure,destination, step / numSteps);
        path.setPath([departure, nextStop]);
      }
    }, animationSpeed);
  };
})();
