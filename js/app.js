var viewModel = function() {

    var self = this;

    this.init = function() {

        this.configFoursquare();

        // initialize Maps geocoder for reuse
        this.geocoder = new google.maps.Geocoder();

        // initialize observables
        this.searchFocus = ko.observable(true);

        this.searchTerm = ko.observable('Popular');
        this.poi = ko.observable('');

        this.coordinates = ko.observable({
            lat: '',
            lng: ''
        });

        this.latLng = ko.computed(function() {
            return this.coordinates().lat + ',' + this.coordinates().lng;
        }, this);

        this.filterQuery = ko.observable('');

        // array of venues with markers
        this.venuesArray = ko.observableArray();

        this.placesExpanded = ko.observable(false);

        this.currentMode = ko.observable('');

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

        this.myDataRef = new Firebase('https://fendneighborhoodmap.firebaseio.com/');

        this.user = ko.observable('');

        this.loggingIn = ko.observable(false);

    };

    this.configFoursquare = function() {
        this.Foursquare = {
            cID: "AHMKTGNPJOKRI5HSWIQ4GZVRFDXUA2UD4T4ZRBIYRN413QL5",
            cSecret: "S3D4Y0R1430KP33VNL3MZW320ZFV22YQ2VT02SUX2XCTAD5R",
            APIbaseURL: "https://api.foursquare.com/",
            version: "20140601",
            defaultQuery: ko.observable('topPicks'),
            radius: ko.observable(5000)
        };
    };

    this.expandPlaces = function() {
        self.placesExpanded(!self.placesExpanded());
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

        var darkStyle = [{"featureType":"all","elementType":"labels.text.fill","stylers":[{"saturation":36},{"color":"#707070"},{"lightness":40}]},{"featureType":"all","elementType":"labels.text.stroke","stylers":[{"visibility":"on"},{"color":"#000000"},{"lightness":16}]},{"featureType":"all","elementType":"labels.icon","stylers":[{"visibility":"off"}]},{"featureType":"administrative","elementType":"geometry.fill","stylers":[{"color":"#000000"},{"lightness":20}]},{"featureType":"administrative","elementType":"geometry.stroke","stylers":[{"color":"#000000"},{"lightness":17},{"weight":1.2}]},{"featureType":"landscape","elementType":"geometry","stylers":[{"color":"#424242"}]},{"featureType":"poi","elementType":"geometry","stylers":[{"color":"#000000"},{"lightness":21}]},{"featureType":"poi","elementType":"labels","stylers":[{"visibility":"on"}]},{"featureType":"poi","elementType":"labels.icon","stylers":[{"visibility":"off"}]},{"featureType":"road.highway","elementType":"geometry.fill","stylers":[{"lightness":17},{"color":"#484848"}]},{"featureType":"road.highway","elementType":"geometry.stroke","stylers":[{"lightness":29},{"weight":0.2},{"color":"#ff0000"},{"visibility":"off"}]},{"featureType":"road.arterial","elementType":"geometry","stylers":[{"color":"#000000"},{"lightness":18}]},{"featureType":"road.local","elementType":"geometry","stylers":[{"color":"#000000"},{"lightness":16}]},{"featureType":"transit","elementType":"geometry","stylers":[{"color":"#000000"},{"lightness":19}]},{"featureType":"water","elementType":"geometry","stylers":[{"color":"#000000"},{"lightness":17}]}];

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

                self.mapOptions = {
                    center: pos,
                    disableDefaultUI: true,
                    mapTypeControlOptions: {
                        mapTypeIds: [
                        google.maps.MapTypeId.ROADMAP, 'map_style'
                    ]}
                };

                this.map = new google.maps.Map(document.getElementById('mapDiv'), self.mapOptions);

                this.infoWindow = new google.maps.InfoWindow();

                self.geoLocate(pos.lat, pos.lng);

                self.initializeTime();

            }.bind(this), function() {
                self.handleLocationError();
            });

        } else {
            // Browser doesn't support Geolocation
            this.handleLocationError();
        }
        // Geolocation error handling
        this.handleLocationError = function() {
            // TODO: replace with actual error handling
            console.log('Error: The Geolocation service failed.');
            var result = $.ajax({
                url: 'http://freegeoip.net/json/',
                success: function(result) {
                    var pos = {
                        lat: result.latitude,
                        lng: result.longitude
                    };

                    self.coordinates(pos);

                    self.mapOptions = {
                        center: pos,
                        disableDefaultUI: true,
                        mapTypeControlOptions: {
                            mapTypeIds: [
                            google.maps.MapTypeId.ROADMAP, 'map_style'
                        ]}
                    };

                    self.map = new google.maps.Map(document.getElementById('mapDiv'), self.mapOptions);

                    self.infoWindow = new google.maps.InfoWindow();

                    self.geoLocate(pos.lat, pos.lng);

                    self.initializeTime();

                }
            });
        }

        this.mapBounds = new google.maps.LatLngBounds();
    };

    this.initializeTime = function() {
        var currentTime = new Date().getHours();

        if (currentTime <= 19 && currentTime >= 7) {
            self.currentMode('light');
        } else { self.currentMode(''); }

        // Associate styled map with the MapTypeId
        self.toggleMapMode();

    };

    this.updateSearch = function() {
        var service = new google.maps.places.PlacesService(self.map);
        var request = {
            "query": self.poi()
        };
        service.textSearch(request, self.updateLatLng);
    };

    this.updateLatLng = function(results, status) {
        if (status == google.maps.places.PlacesServiceStatus.OK) {
            var loc = results[0].geometry.location;
            self.coordinates({
                lat: loc.lat(),
                lng: loc.lng()
            });
        }
        self.hideMarkers();
        self.venuesArray([]);
        self.mapBounds = new google.maps.LatLngBounds();
        self.getVenueData();
    };

    this.hideMarkers = function() {
        var len = self.venuesArray().length;
        var venue;
        for (var i = 0; i < len; i++) {
            venue = self.venuesArray()[i];
            venue.marker.setMap(null);
        }
    };

    // use a Foursquare based search to return info about venues
    this.getVenueData = function() {
        var filter;
        if (self.searchTerm() &&
            self.searchTerm().toLowerCase() !== 'popular') {
            filter = '&query=' + self.searchTerm();
        } else {
            filter = '&section=' + self.Foursquare.defaultQuery();
        }
        var url = self.Foursquare.APIbaseURL + 'v2/venues/explore?' + 'client_id=' + self.Foursquare.cID + '&client_secret=' + self.Foursquare.cSecret + '&v=' + self.Foursquare.version + filter + '&radius=' + self.Foursquare.radius() + '&ll=' + self.latLng() + '&time=any&day=any&limit=35&venuePhotos=1';
        $.ajax({
            "url": url,
            "success": function(data) {
                var venue;
                var venues = data.response.groups[0].items;
                for (var v = 0, len = venues.length; v < len; v++) {
                    venue = venues[v].venue;
                    if (!venue.hours) {
                        venue.hours = {
                            isOpen: false,
                            status: "Not Available"
                        };
                    }
                    venue.rating = parseFloat(venue.rating).toFixed(1);
                    if (venue.rating === 'NaN') {
                        venue.rating = '--';
                    }
                    if (!venue.price) {
                        venue.price = {
                            'tier': 0
                        };
                    }
                    if (venue.featuredPhotos) {
                        var photo = venue.featuredPhotos.items[0];
                        venue.photoURL = photo.prefix + '250x100' + photo.suffix;
                    }
                    venue.venueVisible = ko.observable(true);
                    venue.venueExpanded = ko.observable(false);
                    venue.marker = self.createMarker(venue);
                    self.venuesArray.push(venue);
                }
                self.orderVenues();
            }
        });

    };

    this.orderVenues = function() {
        var venuesArray = self.venuesArray();
        var orderedVenues = venuesArray.sort(function(a, b) {
            if (a.rating > b.rating || b.rating === 'NaN') {
                return -1;
            } if (b.rating > a.rating || a.rating === 'NaN') {
                return 1;
            } return 0;
        });
        self.venuesArray(orderedVenues);
    }

    this.createMarker = function(place) {
        var lat = place.location.lat;
        var lng = place.location.lng;
        var pos = {
            "lat": lat,
            "lng": lng
        };

        var icon = place.categories[0].icon;
        var bg = 'bg_';
        var size = '32';
        var img = icon.prefix;
        var ext = icon.suffix;

        var iconImage = img + bg + size + ext;

        var marker = new google.maps.Marker({
            map: self.map,
            position: pos,
            icon: iconImage,
            size: new google.maps.Size(5, 5)
        });

        var placeRating = place.rating || 'No rating';
        var placePrice = new Array(place.price.tier + 1).join('$');

        var placePhoto = place.photoURL || '';
        var placeImage;
        if (placePhoto) {
            placeImage = '<img class="infowindow-pic" src=' + placePhoto + '>';
        } else { placeImage = placePhoto; }

        var content = '<div class="infowindow"><h3 class="infowindow-title">' + place.name + '</h3><div class="infowindow-pic">' + placeImage + '</div><div class="infowindow-info"><h4 class="infowindow-rating">Rating: ' + placeRating + '</h4><h4 class="infowindow-price">Price: ' + placePrice + '</h4></div></div>';

        marker.content = content;

        marker.toggleAnimation = function() {
            if (marker.getAnimation() !== null) {
                marker.setAnimation(null);
            } else {
                marker.setAnimation(google.maps.Animation.BOUNCE);
            }
        };

        google.maps.event.addListener(marker, 'click', (function(content, marker, infoWindow, place){
            return function() {
                infoWindow.setContent(marker.content);
                infoWindow.open(self.map, this);
                self.map.panTo(marker.getPosition());
                self.toggleVenueExpand(place);
            }
        })(content, marker, self.infoWindow, place));

        self.mapBounds.extend(new google.maps.LatLng(lat, lng));
        // fit the map to the new marker
        this.map.fitBounds(self.mapBounds);
        // center the map
        this.map.setCenter(self.mapBounds.getCenter());
        // return marker
        return marker;
    };

    this.chooseVenue = function(data, event) {
        var len = self.venuesArray().length;
        var venue;
        for (var i = 0; i < len; i++) {
            venue = self.venuesArray()[i];
            venue.venueExpanded(false);
        }
        data.marker.setMap(self.map);
        self.infoWindow.setContent(data.marker.content);
        self.infoWindow.open(self.map, data.marker);
        self.map.panTo(data.marker.getPosition());
    };

    this.showAll = function(event) {
        self.infoWindow.close();
        var len = self.venuesArray().length;
        var venue;
        for (var i = 0; i < len; i++) {
            venue = self.venuesArray()[i];
            venue.marker.setMap(self.map);
        }
        self.map.fitBounds(self.mapBounds);
    };

    this.favoriteVenue = function() {
        // add backend to favorite venue
    };

    // convert latLng to a text location
    this.geoLocate = function(lat, lng) {
        var latlng;
        if (typeof lat === 'number' && typeof lng === 'number') {
            latlng = new google.maps.LatLng(lat, lng);
            self.geocoder.geocode({'latLng': latlng}, function(results, status) {
                if (status == google.maps.GeocoderStatus.OK) {
                    self.getLocations(results);
                }
            });
        } else {
            navigator.geolocation.getCurrentPosition(function(position) {
                latlng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
                self.geocoder.geocode({'latLng': latlng}, function(results, status) {
                    if (status == google.maps.GeocoderStatus.OK) {
                        self.coordinates({
                            'lat': latlng.lat(),
                            'lng': latlng.lng()
                        });
                        self.updateLatLng();
                    }
                });
            }, self.handleLocationError);
        }
    };

    // empty any existing locations
    // set the current location
    // fetch venue data
    this.getLocations = function(result) {
        self.hideMarkers();
        self.mapBounds = new google.maps.LatLngBounds();
        self.poi(result[0].address_components[2].long_name);
        self.getVenueData();
    };

    // toggle the dark/light mode
    this.toggleMapMode = function() {
        if (this.currentMode() === 'light') {
            this.map.mapTypes.set('map_style', this.lightMode);
            this.map.setMapTypeId('map_style');
            this.currentMode('');
        } else {
            this.map.mapTypes.set('map_style', this.darkMode);
            this.map.setMapTypeId('map_style');
            this.currentMode('light');
        }
    };

    // live filter of returned venues
    this.filterVenues = function() {
        var len = this.venuesArray().length;
        var search = this.filterQuery().toLowerCase();
        for (var i = 0; i < len; i++) {
            var venue = this.venuesArray()[i];
            venueName = venue.name.toLowerCase();
            if (venueName.indexOf(search) >= 0) {
                venue.venueVisible(true);
                venue.marker.setMap(self.map);
            } else {
                venue.venueVisible(false);
                venue.marker.setMap(null);
            }
        }
    };

    // closes all venues first
    // then opens/closes chosen venue
    this.toggleVenueExpand = function($data, event) {
        var len = self.venuesArray().length;
        var venue;
        if (!$data.venueExpanded()) {
            for (var i = 0; i < len; i++) {
                venue = self.venuesArray()[i];
                venue.venueExpanded(false);
            }
            self.chooseVenue($data, event);
        }
        $data.venueExpanded(!$data.venueExpanded());
    };

    // initialize view
    this.init();

};

$(function() {
    ko.applyBindings( new viewModel() );
}());