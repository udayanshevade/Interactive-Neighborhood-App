var app = app || {};

(function(){

  app.Route = function(options) {
    this.options = this.extend(this._options, options);
    this.init();
  };

  app.Route.prototype = {
    // default options
    _options: {
      initializeFilters: true,
      animate: false
    },

    enabledFilters: {},

    init: function(){
      this.enabledFilters = (this.options.initializeFilters ? app.filters : {});
      this.animationIndex = 0;
      this.renderedPaths = [];
      this.line = {};
      this.coordinates = [];
      this.parseJSON(this._options.points);
    },

    parseJSON: function(data){
      this.coordinates = data.map(function(item){
        return {
          lat: item.lat(),
          lng: item.lng(),
          googLatLng: new google.maps.LatLng(item.lat(), item.lng())
        }
      });
    },

    updateRoutes: function(animationOptions) {
      var pathCoordinates = this.normalizeCoordinates().map(function(d) {
        return d.googLatLng;
      });

      if(this.options.animate) {
        this.enabledFilters = app.filters;
        pathCoordinates = this.normalizeCoordinates().map(function(d) {
          return d.googLatLng;
        });
        app.animateRoute(pathCoordinates, this, animationOptions);
        return;
      }

      this.line = new gmaps.Polyline({
        path: pathCoordinates,
        strokeColor: '#50bfe6',
        strokeOpacity: 1,
        strokeWeight: 5
      });

      this.line.setMap(this.map);
    },

    // Remove potentially erroneous points
    normalizeCoordinates: function() {
      var self = this;
      var filtersList = Object.keys(self.enabledFilters);

      return filtersList.reduce(function(memo, filter) {
        return self.enabledFilters[filter](memo);
      }, self.coordinates);
    },

    hide: function() {
      this.animationIndex = 0;
      this.renderedPaths.forEach(function(fragment) {
        fragment.setMap(null);
      });
      this.renderedPaths = [];
      return;
    },

    render: function(animationOptions) {
      if (this.line.setMap) {
        this.line.setMap(null);
      }
      this.options.animate = true;
      this.updateRoutes(animationOptions);
    },

    styleLine: function(styles) {
      if (this.renderedPaths && this.renderedPaths.length) {
        var properties = Object.keys(styles);
        this.renderedPaths.forEach(function(fragment) {
          properties.forEach(function(property) {
            fragment.setOptions({ property: styles[property ]});
          })
        });
      }
    },

    extend: function(a, b) {
      Object.keys(b).forEach(function(bKey) {
        a[bKey] = b[bKey];
      });
      return a;
    }
  }

})();
