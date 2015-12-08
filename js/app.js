var map;

var viewModel = function() {
    var self = this;

    this.init = function() {

        this.Foursquare = {
            cID: "AHMKTGNPJOKRI5HSWIQ4GZVRFDXUA2UD4T4ZRBIYRN413QL5",
            cSecret: "S3D4Y0R1430KP33VNL3MZW320ZFV22YQ2VT02SUX2XCTAD5R",
            APIbaseURL: "https://api.foursquare.com/",
            version: "20140601",
            query: ko.observable('topPicks'),
            radius: ko.observable(2000)
        };

        // initialize Maps geocoder
        this.geocoder = new google.maps.Geocoder();

        // initialize observables
        this.searchFocus = ko.observable(true);
        this.poi = ko.observable('');

        this.filterFocus = ko.observable(false);
        this.filterQuery = ko.observable('');
        // array of markers
        this.markerArray = ko.observableArray();
        this.venuesArray = ko.observableArray();

        this.expandList = ko.observable(false);

        // initialize map on window load
        google.maps.event.addDomListener(window, "load", self.initializeMap);


        // resize and recenter map on window resize
        google.maps.event.addDomListener(window, 'resize', function() {
            var center = map.getCenter();
            google.maps.event.trigger(map, 'resize');
            map.setCenter(center);
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

                self.geoLocate(pos.lat, pos.lng);

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

    this.hideMarker = function(marker) {
        marker.setMap(null);
    };

    this.delMarker = function(marker) {
        marker = null;
    };

    // use a Foursquare based search to return info about venues
    this.getVenueData = function() {
        $.ajax({
            "url": self.Foursquare.APIbaseURL + "v2/venues/explore?" + "client_id=" + self.Foursquare.cID + "&client_secret=" + self.Foursquare.cSecret + "&v=" + self.Foursquare.version + "&radius=" + self.Foursquare.radius() + "&section=" + self.Foursquare.query() + "&near=" + self.poi(),
            "success": function(data) {
                var venue;
                var venues = data.response.groups[0].items;
                for (var v = 0, len = venues.length; v < len; v++) {
                    venue = venues[v].venue;
                    console.log(venue);
                    self.venuesArray.push(venue);
                }
                self.populateMap();
            }
        });

    };

    this.clearMap = function() {
        this.markerArray().forEach(function(marker) {
            self.hideMarker(marker);
            self.delMarker(marker);
        });
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

        marker = new google.maps.Marker({
            map: map,
            position: pos
        });

        self.markerArray.push(marker);

        google.maps.event.addListener(marker, 'click', (function(marker, infoWindow, place){
            return function() {
              infoWindow.setContent(place.name)
              infoWindow.open(map, this);
              map.panTo(pos);
            }
        })(marker, self.infoWindow, place));

        bounds = self.mapBounds;

        bounds.extend(new google.maps.LatLng(lat, lng));
        // fit the map to the new marker
        map.fitBounds(bounds);
        // center the map
        map.setCenter(bounds.getCenter());
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

    this.init();

};

$(function() {
    ko.applyBindings( new viewModel() );
}());