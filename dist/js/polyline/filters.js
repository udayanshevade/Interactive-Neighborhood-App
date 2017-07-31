var app = app || {};

(function() {

   app.filters = {
      /*
       * Douglas Peucker line simplification routine
       * http://www.bdcc.co.uk/Gmaps/GDouglasPeuker.js
       */
      GDPeuker: function(data) {

        var gdp = GDouglasPeuker(data.map(function(d) {
          return d.googLatLng;
        }));
        var result = data.filter(function(c) {
          return gdp.indexOf(c.googLatLng) > -1;
        });

        return result;
      },

      /*
       * Calculate a maxium possible distance between the coordinates
       * http://thinkmetric.org.uk/speed.html
       */
      maxDistanceTravelled: function(data) {

        var maxMetersPerSec = 13, // 50km/h
            i, curr, last, result = [];

        for(i=0;i<data.length;i++) {

          curr = data[i];

          if (last) {

            // seconds between current and last coord
            var diff = curr.timestamp - last.timestamp;
            var maxDistance = diff * maxMetersPerSec;
            var traveledDistance = google.maps.geometry.spherical.computeDistanceBetween(last.googLatLng, curr.googLatLng);

            if (traveledDistance > maxDistance) {
              continue;
            } else {
              result.push(curr);
            }

          } else {
            result.push(curr);
          }

          last = curr;

        }

        return result;
      }
   };

})();
