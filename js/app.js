var map;

var viewModel = function() {
    var self = this;

    this.init = function() {

        // initialize defaults

        // initialize Maps geocoder
        this.geocoder = new google.maps.Geocoder();

        // initialize observables
        this.poi = ko.observable('');
        // array of markers
        this.markerArray = ko.observableArray();

        this.expandList = ko.observable(false);

        // initialize map on window load
        google.maps.event.addDomListener(window, "load", self.initializeMap);


        // resize and recenter map on window resize
        google.maps.event.addDomListener(window, 'resize', function() {
            var center = map.getCenter();
            google.maps.event.trigger(map, 'resize');
            map.setCenter(center);
        });

        $('.fa-caret-down').on('click', function() {
            self.expandList(!self.expandList());
        });

        $('.ui-search').focus(function() {
            $('.search-button').addClass('ui-search-focus');
        }).focusout(function() {
            $('.search-button').removeClass('ui-search-focus');
        });

    };

    this.initializeMap = function() {
        // if browser has navigator geolocation
        if (navigator.geolocation) {
            // assign the current location
            navigator.geolocation.getCurrentPosition(function(position) {
                var pos = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };

                map = new google.maps.Map(document.getElementById('mapDiv'),
                {
                    center: pos,
                    disableDefaultUI: true,
                });

                self.infoWindow = new google.maps.InfoWindow();

                self.getLocation(pos.lat, pos.lng);

            }, function() {
                handleLocationError();
            });

        } else {
            // Browser doesn't support Geolocation
            handleLocationError();
        }
        // Geolocation error handling
        function handleLocationError() {
            console.log('Error: The Geolocation service failed.');
        }

        self.mapBounds = new google.maps.LatLngBounds();

    };

    this.clearMarkers = function(lat, lng) {
        this.markerArray().forEach(function(marker) {
            marker.setMap(null);
        });
    };

    // use a text based search to return markers
    this.populateMarkers = function() {

        if (this.markerArray().length) {
            this.clearMarkers();
        }

        self.mapBounds = new google.maps.LatLngBounds();

        var service = new google.maps.places.PlacesService(map);
        var request = {
            "query": this.poi()
        };

        service.textSearch(request, function(results, status) {
            if (status == google.maps.places.PlacesServiceStatus.OK) {

                var place, coordinates, lat, lng, bounds, marker;

                for (var i = 0; i < results.length; i++) {
                    place = results[i];

                    if (place.rating > 3.5) {

                        coordinates = place.geometry.location;
                        lat = coordinates.lat();
                        lng = coordinates.lng();

                        bounds = self.mapBounds;

                        // If the request succeeds, draw the place location on
                        // the map as a marker, and register an event to handle a
                        // click on the marker.
                        marker = new google.maps.Marker({
                            map: map,
                            position: place.geometry.location,
                            name: place.name,
                        });

                        self.markerArray.push(marker);

                        google.maps.event.addListener(marker, 'click', (function(marker, infoWindow, place){
                            return function() {
                                infoWindow.setContent(place.name)
                                infoWindow.open(map, this);
                                map.panTo(place.geometry.location);
                            }
                        })(marker, self.infoWindow, place));

                        bounds.extend(new google.maps.LatLng(lat, lng));
                        // fit the map to the new marker
                        map.fitBounds(bounds);
                        // center the map
                        map.setCenter(bounds.getCenter());
                    }
                }
            }
        });
    };



    // convert latLng to a text location
    this.getLocation = function(lat, lng) {
        var latlng = new google.maps.LatLng(lat, lng);
        this.geocoder.geocode({'latLng': latlng}, function(results, status) {
            if (status == google.maps.GeocoderStatus.OK) {
                self.poi('Entertainment in ' + results[1].address_components[0].long_name);
                self.populateMarkers();
            }
        });
    };

    this.init();

};

$(function() {
    ko.applyBindings( new viewModel() );
}());