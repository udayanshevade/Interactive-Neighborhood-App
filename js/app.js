var viewModel = function() {

    var self = this;

    this.init = function() {

        this.configFoursquare();

        // initialize Maps geocoder
        this.geocoder = new google.maps.Geocoder();

        // initialize observables
        this.searchFocus = ko.observable(true);

        this.poi = ko.observable('');

        this.coordinates = ko.observable({
            lat: '',
            lng: ''
        });

        this.latLng = ko.computed(function() {
            return this.coordinates().lat + ',' + this.coordinates().lng;
        }, this);

        this.filterFocus = ko.observable(false);
        this.filterQuery = ko.observable('');
        // array of markers
        this.markerArray = ko.observableArray();
        this.venuesArray = ko.observableArray();

        this.expandList = ko.observable(false);

        this.currentMode = ko.observable('light');

        // initialize map on window load
        google.maps.event.addDomListener(window, "load", self.initializeMap.bind(this));


        // resize and recenter map on window resize
        google.maps.event.addDomListener(window, 'resize', function() {
            var center = self.map.getCenter();
            google.maps.event.trigger(self.map, 'resize');
            self.map.setCenter(center);
        });


        $('.ui-search').focus(function() {
            self.focusSearch();
        }).focusout(function() {
            self.focusOutSearch();
        });

        $('.ui-search').focus();

        $('.ui-form').mouseover(function() {
            self.focusSearch()
        }).mouseout(function() {
            if (!$('.ui-search').is(':focus')) {
                self.focusOutSearch();
            }
        });

    };

    this.configFoursquare = function() {
        this.Foursquare = {
            cID: "AHMKTGNPJOKRI5HSWIQ4GZVRFDXUA2UD4T4ZRBIYRN413QL5",
            cSecret: "S3D4Y0R1430KP33VNL3MZW320ZFV22YQ2VT02SUX2XCTAD5R",
            APIbaseURL: "https://api.foursquare.com/",
            version: "20140601",
            query: ko.observable('topPicks'),
            radius: ko.observable(3500),
        };
    };

    this.expandPlaces = function() {
        self.expandList(!self.expandList());
    };

    this.focusSearch = function() {
        $('.ui-form').addClass('ui-focus-opac');
        $('.ui-filter-form').removeClass('ui-focus-opac');
    };

    this.focusOutSearch = function() {
        $('.ui-filter').focus();
        $('.ui-form').removeClass('ui-focus-opac');
        $('.ui-filter-form').addClass('ui-focus-opac');
    };

    this.initializeMap = function() {

        var lightStyle = [{"featureType":"administrative","elementType":"labels.text.fill","stylers":[{"color":"#444444"}]},{"featureType":"administrative.country","elementType":"geometry.fill","stylers":[{"visibility":"on"}]},{"featureType":"administrative.province","elementType":"labels.icon","stylers":[{"hue":"#ff0000"},{"visibility":"on"}]},{"featureType":"landscape","elementType":"all","stylers":[{"color":"#f2f2f2"}]},{"featureType":"poi","elementType":"all","stylers":[{"visibility":"off"}]},{"featureType":"road","elementType":"all","stylers":[{"saturation":-100},{"lightness":45}]},{"featureType":"road.highway","elementType":"all","stylers":[{"visibility":"simplified"}]},{"featureType":"road.arterial","elementType":"labels.icon","stylers":[{"visibility":"off"}]},{"featureType":"transit","elementType":"all","stylers":[{"visibility":"off"}]},{"featureType":"water","elementType":"all","stylers":[{"color":"#46bcec"},{"visibility":"on"}]}];

        var darkStyle = [{"featureType":"all","elementType":"labels.text.fill","stylers":[{"saturation":36},{"color":"#000000"},{"lightness":40}]},{"featureType":"all","elementType":"labels.text.stroke","stylers":[{"visibility":"on"},{"color":"#000000"},{"lightness":16}]},{"featureType":"all","elementType":"labels.icon","stylers":[{"visibility":"off"}]},{"featureType":"administrative","elementType":"geometry.fill","stylers":[{"color":"#000000"},{"lightness":20}]},{"featureType":"administrative","elementType":"geometry.stroke","stylers":[{"color":"#000000"},{"lightness":17},{"weight":1.2}]},{"featureType":"landscape","elementType":"all","stylers":[{"visibility":"on"}]},{"featureType":"landscape","elementType":"geometry","stylers":[{"color":"#000000"},{"lightness":20}]},{"featureType":"landscape","elementType":"labels.icon","stylers":[{"saturation":"-100"},{"lightness":"-54"}]},{"featureType":"poi","elementType":"all","stylers":[{"visibility":"on"},{"lightness":"0"}]},{"featureType":"poi","elementType":"geometry","stylers":[{"color":"#000000"},{"lightness":21}]},{"featureType":"poi","elementType":"labels.icon","stylers":[{"saturation":"-89"},{"lightness":"-55"}]},{"featureType":"road","elementType":"labels.icon","stylers":[{"visibility":"off"}]},{"featureType":"road.highway","elementType":"geometry.fill","stylers":[{"color":"#000000"},{"lightness":17}]},{"featureType":"road.highway","elementType":"geometry.stroke","stylers":[{"color":"#000000"},{"lightness":29},{"weight":0.2}]},{"featureType":"road.arterial","elementType":"geometry","stylers":[{"color":"#000000"},{"lightness":18}]},{"featureType":"road.local","elementType":"geometry","stylers":[{"color":"#000000"},{"lightness":16}]},{"featureType":"transit","elementType":"geometry","stylers":[{"color":"#000000"},{"lightness":19}]},{"featureType":"transit.station","elementType":"labels.icon","stylers":[{"visibility":"on"},{"saturation":"-100"},{"lightness":"-51"}]},{"featureType":"water","elementType":"geometry","stylers":[{"color":"#000000"},{"lightness":17}]}];

        this.lightMode = new google.maps.StyledMapType(lightStyle,
            {name: "Light Mode"});

        this.darkMode = new google.maps.StyledMapType(darkStyle,
            {name: "Dark Mode"});

        // if browser has navigator geolocation
        if (navigator.geolocation) {
            // assign the current location
            navigator.geolocation.getCurrentPosition(function(position) {
                var pos = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };

                self.coordinates(pos);

                var mapOptions = {
                    center: pos,
                    disableDefaultUI: true,
                    mapTypeControlOptions: {
                        mapTypeIds: [
                        google.maps.MapTypeId.ROADMAP, 'map_style'
                    ]}
                };

                this.map = new google.maps.Map(document.getElementById('mapDiv'), mapOptions);

                this.infoWindow = new google.maps.InfoWindow();

                self.geoLocate(pos.lat, pos.lng);

                // Associate styled map with the MapTypeId
                self.toggleMapMode();



            }.bind(this), function() {
                handleLocationError();
            });

        } else {
            // Browser doesn't support Geolocation
            handleLocationError();
        }
        // Geolocation error handling
        function handleLocationError() {
            // TODO: replace with actual error handling
            console.log('Error: The Geolocation service failed.');
        }

        this.mapBounds = new google.maps.LatLngBounds();
    };

    this.hideMarker = function(marker) {
        marker.setMap(null);
    };

    this.delMarker = function() {
        this.markerArray().pop().setMap(null);
    };

    this.updateSearch = function() {
        this.clearMap();
        var service = new google.maps.places.PlacesService(self.map);
        var request = {
            "query": self.poi()
        };
        service.textSearch(request, self.updateLatLng);
    };

    this.updateLatLng = function(results, status) {
        var loc = results[0].geometry.location;
        if (status == google.maps.places.PlacesServiceStatus.OK) {
            self.coordinates({
                lat: loc.lat(),
                lng: loc.lng()
            });
        }
        self.getVenueData();
    };

    // use a Foursquare based search to return info about venues
    this.getVenueData = function() {
        var url = self.Foursquare.APIbaseURL + "v2/venues/explore?" + "client_id=" + self.Foursquare.cID + "&client_secret=" + self.Foursquare.cSecret + "&v=" + self.Foursquare.version + "&radius=" + self.Foursquare.radius() + "&section=" + self.Foursquare.query() + "&ll=" + self.latLng();
        $.ajax({
            "url": url,
            "success": function(data) {
                var venue;
                var venues = data.response.groups[0].items;
                for (var v = 0, len = venues.length; v < len; v++) {
                    venue = venues[v].venue;
                    self.venuesArray.push(venue);
                }
                self.populateMap();
            }
        });

    };

    this.clearMap = function() {
        var len = this.markerArray().length;
        for (var i = 0; i < len; i++) {
            this.markerArray()[i].setMap(null);
        }
    };

    this.populateMap = function() {
        var arr = this.venuesArray();
        for (var m = 0, len = arr.length; m < len; m++) {
            this.setMarker(arr[m]);
        }
    };

    this.setMarker = function(place) {
        var lat = place.location.lat;
        var lng = place.location.lng;
        var pos = {
            "lat": lat,
            "lng": lng
        };

        var marker = new google.maps.Marker({
            map: self.map,
            position: pos
        });

        self.markerArray.push(marker);

        google.maps.event.addListener(marker, 'click', (function(marker, infoWindow, place){
            return function() {
              infoWindow.setContent(place.name)
              infoWindow.open(self.map, this);
              self.map.panTo(pos);
            }
        })(marker, self.infoWindow, place));

        bounds = self.mapBounds;

        bounds.extend(new google.maps.LatLng(lat, lng));
        // fit the map to the new marker
        this.map.fitBounds(bounds);
        // center the map
        this.map.setCenter(bounds.getCenter());
    };


    // convert latLng to a text location
    this.geoLocate = function(lat, lng) {
        var latlng = new google.maps.LatLng(lat, lng);
        this.geocoder.geocode({'latLng': latlng}, function(results, status) {
            if (status == google.maps.GeocoderStatus.OK) {
                self.poi(results[1].address_components[0].long_name);
                self.getVenueData();
            }
        });
    };

    // toggle the dark/light mode
    this.toggleMapMode = function() {
        if (this.currentMode() === 'light') {
            this.map.mapTypes.set('map_style', this.lightMode);
            this.map.setMapTypeId('map_style');
            this.currentMode('dark');
        } else {
            this.map.mapTypes.set('map_style', this.darkMode);
            this.map.setMapTypeId('map_style');
            this.currentMode('light');
        }
    };


    this.init();

};

$(function() {
    ko.applyBindings( new viewModel() );
}());