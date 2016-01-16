var viewModel = function() {

    var self = this;

    this.init = function() {

        // configure API requirements
        this.configFoursquare();
        this.configFlickr();

        // initialize Google Maps geocoder for reuse
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

        this.alerting = ko.observable(false);

        this.alertTitle = ko.observable();
        this.alertDetails = ko.observable();

        this.myDataRef = new Firebase('https://fendneighborhoodmap.firebaseio.com/');

        this.usersRef = this.myDataRef.child('users');

        this.venuesRef = this.myDataRef.child('venues');

        this.user = ko.observable('');

        this.loggedIn = ko.observable(false);

        this.loginExpanded = ko.observable(false);

        if (typeof(Storage)) {
            this.localStorageAvailable = true;
            this.getLocalUser();
        } else {
            this.localStorageAvailable = false;
        }

    };

    this.getLocalUser = function() {
        var user = localStorage.user;
        if (user) {
            this.user(user);
            this.login();
        } else {
            this.alertTitle('welcome');
            this.alertDetails('Please feel free to explore the map, create a user profile, and favorite locations.');
            this.toggleAlert('open', 'temporary');
        }
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

    this.configFlickr = function() {
        this.Flickr = {
            key: "&api_key=e3ce05cd3fe0a8e29946f1afa5afc492",
            secret: "1c5a3dd9614db005",
            method: "&method=flickr.photos.search",
            APIbaseURL: "https://api.flickr.com/services/rest/?format=json",
            sort: "&sort=interestingness-desc",
            mode: "&nojsoncallback=1"
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

    this.toggleAlert = function(mode, temp) {
        if (mode === 'open') { this.alerting(true); }
        else { this.alerting(false); }

        if (temp === 'temporary') {
            setTimeout(function() {
                self.alerting(false);
            }, 15000);
        }

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

            this.alertTitle('geolocation error')
            this.alertDetails('Please enable browser geolocation and try again for more accurate results, or attempt a new search.');
            this.toggleAlert('open');

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
        };

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
            venue.marker.marker.setMap(null);
        }
    };

    // use a Foursquare based search to return info about venues
    this.getVenueData = function() {
        var filter;
        if (self.searchTerm() &&
            self.searchTerm().toLowerCase() !== 'popular') {
            filter = '&query=' + self.searchTerm().split(' ').join('&');
        } else {
            filter = '&section=' + self.Foursquare.defaultQuery();
        }

        var url = self.Foursquare.APIbaseURL + 'v2/venues/explore?' + 'client_id=' + self.Foursquare.cID + '&client_secret=' + self.Foursquare.cSecret + '&v=' + self.Foursquare.version + filter + '&radius=' + self.Foursquare.radius() + '&ll=' + self.latLng() + '&time=any&day=any&limit=35&venuePhotos=1';

        $.getJSON(url)
            .success(function(data) {
                var venue;
                var venues = data.response.groups[0].items;
                for (var v = 0, len = venues.length; v < len; v++) {
                    venue = venues[v].venue;

                    var photo;

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

                    venue.currentPic = 0;

                    var photos = venue.featuredPhotos;
                    if (photos && photos.items.length) {
                        var initialPhoto = photos.items[venue.currentPic];
                        initialPhoto.size = '250x100';
                        venue.photoURL = ko.observable(initialPhoto.prefix + initialPhoto.size + initialPhoto.suffix);
                        venue.infowindowPic = venue.photoURL();
                    }

                    venue.venueVisible = ko.observable(true);
                    venue.venueExpanded = ko.observable(false);
                    venue.favorited = ko.observable(false);

                    venue.marker = new self.Marker(venue);
                    self.venuesArray.push(venue);
                }
            setTimeout(function() {
                self.orderVenues();
                self.venuesArray().forEach(function(venue) {
                    self.getPhotos(venue);
                });
            }, 1000);
        }).error(function(data) {
            self.alertTitle('foursquare error');
            self.alertDetails('There was an error with the Foursquare query. Please try again momentarily, or refine the query.');
            self.toggleAlert('open');
        });
    };

    this.orderVenues = function() {
        if (self.loggedIn()) {
            self.importUserFavorites(self.user());
        }
        var venuesArray = self.venuesArray();
        var orderedVenues = venuesArray.sort(function(a, b) {
            if (a.rating > b.rating || b.rating === 'NaN') {
                return -1;
            } if (b.rating > a.rating || a.rating === 'NaN') {
                return 1;
            } return 0;
        });
        self.venuesArray(orderedVenues);
    };

    this.getPhotos = function(place) {
        var images;
        var lat = place.location.lat;
        var lng = place.location.lng;

        var url = self.Flickr.APIbaseURL + self.Flickr.key + self.Flickr.method + self.Flickr.sort + self.Flickr.mode + '&lat=' + lat + '&lon=' + lng + '&text=' + place.name;

        $.getJSON(url).success(function(data) {
            var photos = data.photos.photo;
            if (photos.length) {
                var imagePrefix, imageSuffix;

                photos.forEach(function(photoData) {
                    imagePrefix = 'https://farm' + photoData.farm + '.staticflickr.com/'
                    imageSuffix = photoData.server + '/' + photoData.id + '_' + photoData.secret + '.jpg';
                    if (!place.featuredPhotos) {
                        place.featuredPhotos = {
                            'items': []
                        }
                    }
                    place.featuredPhotos.items.push({
                        prefix: imagePrefix,
                        suffix: imageSuffix,
                        size: ''
                    });
                });

            } else {
                console.log('Flickr image for ' + place.name + ' is not provided.');
            }
        }).fail(function(data) {
                self.alertTitle('flickr error');
                self.alertDetails('There was a problem harvesting Flickr photos for the venues. Please try again later.');
                self.toggleAlert('open', 'temporary');
        });
    };

    this.Marker = function(place) {
        var that = this;

        this.lat = place.location.lat;
        this.lng = place.location.lng;
        this.pos = {
            "lat": this.lat,
            "lng": this.lng
        };

        this.name = place.name;

        this.icon = place.categories[0].icon;
        this.bg = 'bg_';
        this.size = '32';
        var img = this.icon.prefix;
        var ext = this.icon.suffix;

        this.iconImage = (img + this.bg + this.size + ext) || 'http://maps.google.com/mapfiles/ms/icons/red-dot.png';

        this.marker = new google.maps.Marker({
            map: self.map,
            position: this.pos,
            icon: this.iconImage,
            size: new google.maps.Size(5, 5)
        });

        this.placeRating = place.rating || 'No rating';
        this.placePrice = new Array(place.price.tier + 1).join('$') || 'No price';

        var placePhoto = place.infowindowPic || '';
        if (placePhoto) {
            this.placeImage = '<img class="infowindow-img" src=' + placePhoto + '>';
        } else { this.placeImage = placePhoto; }

        this.marker.content = '<div class="infowindow"><h3 class="infowindow-title">' + this.name + '</h3><div class="infowindow-pic">' + this.placeImage + '</div><div class="infowindow-info"><h4 class="infowindow-rating">Rating: ' + this.placeRating + '</h4><h4 class="infowindow-price">Price: ' + this.placePrice + '</h4></div></div>';

        google.maps.event.addListener(this.marker, 'click', (function(content, marker, infoWindow, place){
            return function() {
                infoWindow.setContent(marker.content);
                infoWindow.open(self.map, this);
                self.map.panTo(marker.getPosition());
                self.toggleVenueExpand(place);
            };
        })(this.marker.content, this.marker, self.infoWindow, place));

        self.mapBounds.extend(new google.maps.LatLng(that.lat, that.lng));
        // fit the map to the new marker
        self.map.fitBounds(self.mapBounds);
        // center the map
        self.map.setCenter(self.mapBounds.getCenter());
    };

    this.cyclePics = function(direction, data) {
        var photos = data.featuredPhotos;
        if (photos && photos.items.length) {
            var photosLen = photos.items.length;
            if (direction === 'backwards') {
                if (data.currentPic > 0) {
                    data.currentPic--;
                } else { data.currentPic = photosLen - 1; }
            } else {
                if (data.currentPic < photosLen - 1) {
                    data.currentPic++;
                } else { data.currentPic = 0; }
            }
            var initialPhoto = photos.items[data.currentPic];
            data.photoURL(initialPhoto.prefix + initialPhoto.size + initialPhoto.suffix);
        }
    };

    this.chooseVenue = function(data, event) {
        var len = self.venuesArray().length;
        var venue;
        for (var i = 0; i < len; i++) {
            venue = self.venuesArray()[i];
            venue.venueExpanded(false);
        }
        data.marker.marker.setMap(self.map);
        self.infoWindow.setContent(data.marker.marker.content);
        self.infoWindow.open(self.map, data.marker.marker);
        self.map.setZoom(14);
        self.map.panTo(data.marker.marker.getPosition());
    };

    this.showAll = function(event) {
        self.infoWindow.close();
        var len = self.venuesArray().length;
        var venue;
        for (var i = 0; i < len; i++) {
            venue = self.venuesArray()[i];
            venue.venueVisible(true);
            venue.marker.marker.setMap(self.map);
            venue.venueExpanded(false);
        }
        self.map.fitBounds(self.mapBounds);
    };

    this.showFavorites = function(event) {
        self.infoWindow.close();
        var len = self.venuesArray().length;
        var venue;
        for (var i = 0; i < len; i++) {
            venue = self.venuesArray()[i];
            if (venue.favorited()) {
                venue.marker.marker.setMap(self.map);
            } else {
                venue.venueVisible(false);
                venue.marker.marker.setMap(null);
            }
            venue.venueExpanded(false);
        }
        self.map.fitBounds(self.mapBounds);
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
                        self.poi(results[0].address_components[2].long_name);
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
                venue.marker.marker.setMap(self.map);
            } else {
                venue.venueVisible(false);
                venue.marker.marker.setMap(null);
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
        } else {
            self.infoWindow.close();
        }
        $data.venueExpanded(!$data.venueExpanded());
    };

    this.toggleLogin = function() {
        this.loginExpanded(!this.loginExpanded());
    };

    this.contains = function(target, crosscheck) {
        var val = false;
        for (var l = 0, len = crosscheck.length; l < len; l++) {
            if (target.indexOf(crosscheck.charAt(l)) > -1) {
                val = true;
            }
        }
        return val;
    };

    this.login = function() {
        var loginPath = 'users/' + self.user();
        var user = self.user();
        if (user && !self.contains(user, ' .#$[]')) {
            this.myDataRef.child(loginPath).once('value', function(snapshot) {

                var result = snapshot.val();

                if (result) {
                    self.alertTitle('welcome back, ' + user);
                    self.alertDetails('You are logged in. Please feel free to explore and favorite any locations you find enjoyable.');
                    self.toggleAlert('open', 'temporary');
                    self.importUserFavorites(user);
                } else {
                    var users = {};
                    users[user] = 'No favorites yet.';
                    self.usersRef.update(users, function(error) {
                        if (error) {
                            self.alertTitle('login error');
                            self.alertDetails('The user profile could not be created at this time. Please try again later.');
                            self.toggleAlert('open', 'temporary');
                        } else {
                            self.alertTitle('welcome, ' + user);
                            self.alertDetails('The user profile was successfully created. Please feel free to explore and favorite any locations around the world you find enjoyable');
                            self.toggleAlert('open', 'temporary');
                        }
                    });

                }

                self.loggedIn(true);

                if (self.localStorageAvailable) {
                    localStorage.user = user;
                }
            });
        } else {
            self.alertTitle('user error');
            self.alertDetails('Please use a valid name. Paths must be non-empty strings, not containing the following characters: ". # $ [ ]".');
            self.toggleAlert('open', 'temporary');
        }
    };

    this.toggleVenueFavorite = function(current) {
        if (self.loggedIn()) {
            self.checkUserFavorites(self.user(), current, 'favorite');
        } else {
            self.alertTitle('login required');
            self.alertDetails('Please login or create a user profile first.');
            self.toggleAlert('open', 'temporary');
        }
    };

    this.favoriteVenue = function(result, current) {
        var user = self.user();
        if (!result) {
            var location = {};
            location.id = current.id;
            self.usersRef.child(user).push().update(location, function(error) {
                if (error) {
                    self.alertTitle('firebase error');
                    self.alertDetails('There was an error while handling user favorites. Please try again later.');
                    self.toggleAlert();
                } else {
                    current.favorited(true);
                }
            });
        } else {
            current.favorited(false);
        }
    };

    this.readFavorites = function() {
        this.usersRef.once('value', function(snapshot) {
            // var favorites = snapshot.val().favorites;
            if (true) {
                snapshot.forEach(function(child) {
                    var user = child.key();
                    self.checkUserFavorites(user);
                });
            } else { /* */ }
        });
    };

    this.checkUserFavorites = function(user, current, mode) {
        var result = false;
        this.usersRef.child(user).once('value', function(snapshot) {
            var venueID = current.id;
            var favorite, storedVenueID, firebaseID, result;
            var userFavoritesLen = snapshot.numChildren();

            if (userFavoritesLen) {
                snapshot.forEach(function(childSnapshot) {
                    favorite = childSnapshot.val();
                    firebaseID = childSnapshot.key();

                    storedVenueID = favorite.id;

                    result = (storedVenueID === venueID);

                    if (result) {
                        self.userAction(result,
                                    current,
                                    mode,
                                    firebaseID,
                                    userFavoritesLen);
                        return true;
                    }
                });

                if (!result) {
                    self.userAction(result,
                                    current,
                                    mode);
                }

            } else {
                self.userAction(result, current, mode);
            }

        });
    };

    this.userAction = function(result, current, mode, fID, len) {
        var user = self.user();
        switch (mode) {
                case ('favorite'):
                    if (result) {
                        var node = user + '/' + fID;
                        if (len > 1) {
                            self.usersRef.child(node).remove();
                            current.favorited(false);
                        } else {
                            var users = {};
                            users[user] = 'No favorites yet.';
                            self.usersRef.update(users, function(error) {
                                if (error) {
                                    self.alertTitle('favorite error');
                                    self.alertDetails('There was an error in saving the user favorite. Please try again later.');
                                    self.toggleAlert('open', 'temporary');
                                }
                            });
                        }
                        current.favorited(false);
                    } else {
                        self.favoriteVenue(result, current);
                        current.favorited(true);
                    }
                    break;
                case ('import'):
                    if (result) {
                        current.favorited(true);
                    } else {
                        current.favorited(false);
                    }
                    break;
        }
    };

    this.importUserFavorites = function(user) {
        self.venuesArray().forEach(function(venue) {
            self.checkUserFavorites(user, venue, 'import');
        });
    };

    // initialize view
    this.init();

};

$(function() {
    ko.applyBindings( new viewModel() );
}());