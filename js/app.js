var viewModel = function() {

    // alias reference to this
    var self = this;

    /*
     * Initialize app
     */
    this.init = function() {

        // configure API requirements
        this.configFoursquare();
        this.configFlickr();

        // initialize Google Maps geocoder for reuse
        this.geocoder = new google.maps.Geocoder();

        // Initialize observables

        // determines form focus
        this.searchFocus = ko.observable(true);

        // binds search term, e.g. 'popular', ''
        this.searchTerm = ko.observable('Popular');
        // binds point of interest
        this.poi = ko.observable('');

        // binds coordinates object for search
        this.coordinates = ko.observable({
            lat: '',
            lng: ''
        });

        // binds a computed value for inserting into the API url
        // this is updated with the lat and lng
        this.latLng = ko.computed(function() {
            return this.coordinates().lat + ',' + this.coordinates().lng;
        }, this);

        // binds user filter input for returned venues
        this.filterQuery = ko.observable('');

        // binds array of returned venues
        this.venuesArray = ko.observableArray();

        // binds whether list of venues is expanded
        this.placesExpanded = ko.observable(false);

        // binds current day/night mode of map
        this.currentMode = ko.observable('');

        // initialize map on window load
        google.maps.event.addDomListener(window, "load", self.initializeMap.bind(this));

        // resize and recenter map on window resize
        google.maps.event.addDomListener(window, 'resize', function() {
            var center = self.map.getCenter();
            google.maps.event.trigger(self.map, 'resize');
            self.map.setCenter(center);
        });

        // binds whether the alert modal is visible
        this.alerting = ko.observable(false);

        // binds alert modal title
        this.alertTitle = ko.observable();
        // binds alert modal description
        this.alertDetails = ko.observable();

        // initialize reference to Firebase database
        this.myDataRef = new Firebase('https://fendneighborhoodmap.firebaseio.com/');
        // create reference to 'users' category in database
        this.usersRef = this.myDataRef.child('users');
        // TODO: set up a reference to 'venues' category in database
        this.venuesRef = this.myDataRef.child('venues');

        // binds logged in user
        this.user = ko.observable('');
        // binds whether a user is successfully logged in
        this.loggedIn = ko.observable(false);

        // binds whether the login interface is visible
        this.loginExpanded = ko.observable(false);

        // harvest persistent user from localStorage
        if (typeof(Storage)) {
            this.localStorageAvailable = true;
            this.getLocalUser();
        } else {
            this.localStorageAvailable = false;
        }
    };


    /*
     * Fetches the local user if one exists in localStorage
     */
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


    /*
     * Configure an object with default Foursquare terms
     */
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


    /*
     * Configure an object with default Flickr terms
     */
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


    /*
     * Toggle expansion of the venues list
     */
    this.expandPlaces = function() {
        self.placesExpanded(!self.placesExpanded());
    };



    /*
     * Toggles the alert modal
     */
    this.toggleAlert = function(mode, temp) {
        // enables the alert modal
        if (mode === 'open') { this.alerting(true); }
        // closes the alert modal
        else { this.alerting(false); }

        // if the alert is temporary closes the timeout
        if (temp === 'temporary') {
            setTimeout(function() {
                self.alerting(false);
            }, 15000);
        }
    };



    /*
     * Initialize the Google Map
     */
    this.initializeMap = function() {

        // JSON for the 'day' style of the map
        var lightStyle = [{"featureType":"water","elementType":"geometry","stylers":[{"color":"#e9e9e9"},{"lightness":17}]},{"featureType":"landscape","elementType":"geometry","stylers":[{"color":"#f5f5f5"},{"lightness":20}]},{"featureType":"road.highway","elementType":"geometry.fill","stylers":[{"color":"#ffffff"},{"lightness":17}]},{"featureType":"road.highway","elementType":"geometry.stroke","stylers":[{"color":"#ffffff"},{"lightness":29},{"weight":0.2}]},{"featureType":"road.arterial","elementType":"geometry","stylers":[{"color":"#ffffff"},{"lightness":18}]},{"featureType":"road.local","elementType":"geometry","stylers":[{"color":"#ffffff"},{"lightness":16}]},{"featureType":"poi","elementType":"geometry","stylers":[{"color":"#f5f5f5"},{"lightness":21}]},{"featureType":"poi.park","elementType":"geometry","stylers":[{"color":"#dedede"},{"lightness":21}]},{"elementType":"labels.text.stroke","stylers":[{"visibility":"on"},{"color":"#ffffff"},{"lightness":16}]},{"elementType":"labels.text.fill","stylers":[{"saturation":36},{"color":"#333333"},{"lightness":40}]},{"elementType":"labels.icon","stylers":[{"visibility":"off"}]},{"featureType":"transit","elementType":"geometry","stylers":[{"color":"#f2f2f2"},{"lightness":19}]},{"featureType":"administrative","elementType":"geometry.fill","stylers":[{"color":"#fefefe"},{"lightness":20}]},{"featureType":"administrative","elementType":"geometry.stroke","stylers":[{"color":"#fefefe"},{"lightness":17},{"weight":1.2}]}];

        // JSON for the 'night' style of the map
        var darkStyle = [{"featureType":"all","elementType":"labels.text.fill","stylers":[{"saturation":36},{"color":"#707070"},{"lightness":40}]},{"featureType":"all","elementType":"labels.text.stroke","stylers":[{"visibility":"on"},{"color":"#000000"},{"lightness":16}]},{"featureType":"all","elementType":"labels.icon","stylers":[{"visibility":"off"}]},{"featureType":"administrative","elementType":"geometry.fill","stylers":[{"color":"#000000"},{"lightness":20}]},{"featureType":"administrative","elementType":"geometry.stroke","stylers":[{"color":"#000000"},{"lightness":17},{"weight":1.2}]},{"featureType":"landscape","elementType":"geometry","stylers":[{"color":"#424242"}]},{"featureType":"poi","elementType":"geometry","stylers":[{"color":"#000000"},{"lightness":21}]},{"featureType":"poi","elementType":"labels","stylers":[{"visibility":"on"}]},{"featureType":"poi","elementType":"labels.icon","stylers":[{"visibility":"off"}]},{"featureType":"road.highway","elementType":"geometry.fill","stylers":[{"lightness":17},{"color":"#484848"}]},{"featureType":"road.highway","elementType":"geometry.stroke","stylers":[{"lightness":29},{"weight":0.2},{"color":"#ff0000"},{"visibility":"off"}]},{"featureType":"road.arterial","elementType":"geometry","stylers":[{"color":"#000000"},{"lightness":18}]},{"featureType":"road.local","elementType":"geometry","stylers":[{"color":"#000000"},{"lightness":16}]},{"featureType":"transit","elementType":"geometry","stylers":[{"color":"#000000"},{"lightness":19}]},{"featureType":"water","elementType":"geometry","stylers":[{"color":"#000000"},{"lightness":17}]}];

        // save the light and dark modes for switching
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

                // binds the coordinates
                self.coordinates(pos);


                // define the map options
                self.mapOptions = {
                    center: pos,
                    disableDefaultUI: true,
                    mapTypeControlOptions: {
                        mapTypeIds: [
                        google.maps.MapTypeId.ROADMAP, 'map_style'
                    ]}
                };

                this.map = new google.maps.Map(document.getElementById('mapDiv'), self.mapOptions);

                // initialize a blank infoWindow for later use
                this.infoWindow = new google.maps.InfoWindow();

                // enable the map using the geolocated coordinates
                self.geoLocate(pos.lat, pos.lng);

                // define the time of day for the map style
                self.initializeTime();

            }.bind(this), function() {
                // handle the geolocation error
                self.handleLocationError();
            });

        } else {
            // fallback in case browser doesn't support geolocation
            this.handleLocationError();
        }

        // Geolocation error handling
        this.handleLocationError = function() {
            // enable the geolocation error
            this.alertTitle('geolocation error')
            this.alertDetails('Please enable browser geolocation and try again for more accurate results, or attempt a new search.');
            this.toggleAlert('open');

            // use third-party geolocation api for approximate geolocation
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


    /*
     * Initialize the 'time' mode of the map display
     */
    this.initializeTime = function() {
        // define current time
        var currentTime = new Date().getHours();

        // set light/dark style for the map
        if (currentTime <= 19 && currentTime >= 7) {
            self.currentMode('light');
        } else { self.currentMode(''); }

        // Associate styled map with the MapTypeId
        self.toggleMapMode();

    };


    /*
     * User update of search
     */
    this.updateSearch = function() {
        // enable Google Maps API Places Service
        var service = new google.maps.places.PlacesService(self.map);
        // define search query with user point of interest
        var request = {
            "query": self.poi()
        };
        // perform Google Maps API text search
        service.textSearch(request, self.updateLatLng);
    };



    /*
     * Update current map coordinates
     */
    this.updateLatLng = function(results, status) {
        if (status == google.maps.places.PlacesServiceStatus.OK) {
            // find coordinates of places service result
            var loc = results[0].geometry.location;
            // save the coordinates associated with new location
            self.coordinates({
                lat: loc.lat(),
                lng: loc.lng()
            });
        }
        // hide markers
        self.hideMarkers();
        // empty current array of venues
        self.venuesArray([]);
        // define new map bounds
        self.mapBounds = new google.maps.LatLngBounds();
        // get new venue data
        self.getVenuesData();
    };


    /*
     * Delete markers
     */
    this.hideMarkers = function() {
        var len = self.venuesArray().length;
        var venue;
        for (var i = 0; i < len; i++) {
            venue = self.venuesArray()[i];
            // delete marker by
            // setting its map object to null
            venue.marker.marker.setMap(null);
        }
    };


    /*
     * Use a Foursquare based search to return info about venues
     */
    this.getVenuesData = function() {
        var filter;
        // for any unique non-generic user search term
        if (self.searchTerm() &&
            self.searchTerm().toLowerCase() !== 'popular') {
            // use it as the API query
            filter = '&query=' + self.searchTerm().split(' ').join('&');
        } else {
            // otherwise use a default query
            filter = '&section=' + self.Foursquare.defaultQuery();
        }

        // define the URL for the Foursquare API query
        var url = self.Foursquare.APIbaseURL + 'v2/venues/explore?' + 'client_id=' + self.Foursquare.cID + '&client_secret=' + self.Foursquare.cSecret + '&v=' + self.Foursquare.version + filter + '&radius=' + self.Foursquare.radius() + '&ll=' + self.latLng() + '&time=any&day=any&limit=35&venuePhotos=1';

        // Get Foursquare API query response
        $.getJSON(url)
            .success(function(data) {
                var venue;
                // access list of returned venues in the JSON response
                var venues = data.response.groups[0].items;
                // iterate over the returned venues
                for (var v = 0, len = venues.length; v < len; v++) {
                    // for each venue
                    venue = venues[v].venue;

                    var photo;

                    // if no venue hours are provided
                    if (!venue.hours) {
                        // create a default hours object
                        venue.hours = {
                            isOpen: false,
                            status: "Not Available"
                        };
                    }
                    // format venue rating as a decimal value
                    venue.rating = parseFloat(venue.rating).toFixed(1);
                    // if no rating, mark as unavailable
                    if (venue.rating === 'NaN') {
                        venue.rating = '--';
                    }
                    // if no price, mark price tier as empty
                    if (!venue.price) {
                        venue.price = {
                            'tier': 0
                        };
                    }

                    // current picture displayed
                    venue.currentPic = 0;

                    // define photos
                    var photos = venue.featuredPhotos;
                    // if photos are available
                    if (photos && photos.items.length) {
                        var initialPhoto = photos.items[venue.currentPic];
                        initialPhoto.size = '250x100';
                        // define current photoURL
                        venue.photoURL = ko.observable(initialPhoto.prefix + initialPhoto.size + initialPhoto.suffix);
                        // define infoWindow picture
                        venue.infowindowPic = venue.photoURL();
                    }

                    // by default all venues are initially visible
                    venue.venueVisible = ko.observable(true);
                    // no venues are expanded
                    venue.venueExpanded = ko.observable(false);
                    // no venues are favorited
                    venue.favorited = ko.observable(false);

                    // create a new marker object
                    venue.marker = new self.Marker(venue);
                    // push the venue to the venues array
                    self.venuesArray.push(venue);
                }
            // after the api requests are processed
            setTimeout(function() {
                // order the venues
                self.orderVenues();
                // get additional Flickr photos for each venue
                self.venuesArray().forEach(function(venue) {
                    self.getPhotos(venue);
                });
            }, 750);
        }).error(function(data) {
            // toggle alert if the foursquare response fails
            self.alertTitle('foursquare error');
            self.alertDetails('There was an error with the Foursquare query. Please try again momentarily, or refine the query.');
            self.toggleAlert('open');
        });
    };



    /*
     * Order the venues according to the ratings
     */
    this.orderVenues = function() {
        // if logged in, import favorites
        if (self.loggedIn()) {
            self.importUserFavorites(self.user());
        }
        var venuesArray = self.venuesArray();
        // sort venues in descending order by rating
        var orderedVenues = venuesArray.sort(function(a, b) {
            if (a.rating > b.rating || b.rating === 'NaN') {
                return -1;
            } if (b.rating > a.rating || a.rating === 'NaN') {
                return 1;
            } return 0;
        });
        // save the ordered venues
        self.venuesArray(orderedVenues);
    };



    /*
     * Get additional Flickr photos if any
     */
    this.getPhotos = function(place) {
        var images;
        var lat = place.location.lat;
        var lng = place.location.lng;

        // define url for Flickr query
        var url = self.Flickr.APIbaseURL + self.Flickr.key + self.Flickr.method + self.Flickr.sort + self.Flickr.mode + '&lat=' + lat + '&lon=' + lng + '&text=' + place.name;

        $.getJSON(url).success(function(data) {
            var photos = data.photos.photo;
            if (photos.length) {
                var imagePrefix, imageSuffix;

                // assign image objects to venue
                photos.forEach(function(photoData) {
                    // define prefix and suffix format
                    imagePrefix = 'https://farm' + photoData.farm + '.staticflickr.com/'
                    imageSuffix = photoData.server + '/' + photoData.id + '_' + photoData.secret + '.jpg';
                    // if no featuredPhotos property exists create one
                    if (!place.featuredPhotos) {
                        place.featuredPhotos = {
                            'items': []
                        }
                    }
                    // push the prefix and suffix fragments
                    // to be rendered as the user cycles through the
                    // available images in list view
                    place.featuredPhotos.items.push({
                        prefix: imagePrefix,
                        suffix: imageSuffix,
                        size: ''
                    });
                });

            } else {
                // log which images were unavailable
                console.log('Flickr images for ' + place.name + ' are not provided.');
            }
        }).fail(function(data) {
            // if Flickr fails, display alert modal
            self.alertTitle('flickr error');
            self.alertDetails('There was a problem harvesting Flickr photos for the venues. Please try again later.');
            self.toggleAlert('open', 'temporary');
        });
    };


    /*
     * Marker class
     */
    this.Marker = function(place) {
        var that = this;
        // encapsulate coordinates
        this.lat = place.location.lat;
        this.lng = place.location.lng;
        this.pos = {
            "lat": this.lat,
            "lng": this.lng
        };
        // encapsulate title
        this.name = place.name;

        // encapsulate icon properties
        this.icon = place.categories[0].icon;
        this.bg = 'bg_';
        this.size = '32';
        var img = this.icon.prefix;
        var ext = this.icon.suffix;

        // use custom icon if defined or default marker icon as a fallback
        this.iconImage = (img + this.bg + this.size + ext) || 'http://maps.google.com/mapfiles/ms/icons/red-dot.png';

        // create new Google Maps marker
        this.marker = new google.maps.Marker({
            map: self.map,
            position: this.pos,
            icon: this.iconImage,
            size: new google.maps.Size(5, 5)
        });

        // encapsulate rating
        this.placeRating = place.rating || 'No rating';
        this.placePrice = new Array(place.price.tier + 1).join('$') || 'No price';

        // define placePhoto
        var placePhoto = place.infowindowPic || '';
        if (placePhoto) {
            this.placeImage = '<img class="infowindow-img" src=' + placePhoto + '>';
        } else { this.placeImage = placePhoto; }

        // encapsulate marker content
        this.marker.content = '<div class="infowindow"><h3 class="infowindow-title">' + this.name + '</h3><div class="infowindow-pic">' + this.placeImage + '</div><div class="infowindow-info"><h4 class="infowindow-rating">Rating: ' + this.placeRating + '</h4><h4 class="infowindow-price">Price: ' + this.placePrice + '</h4></div></div>';

        // add click event to marker for opening infowindow
        google.maps.event.addListener(this.marker, 'click', (function(content, marker, infoWindow, place){
            return function() {
                infoWindow.setContent(marker.content);
                infoWindow.open(self.map, this);
                self.map.panTo(marker.getPosition());
                self.toggleVenueExpand(place);
            };
        })(this.marker.content, this.marker, self.infoWindow, place));

        // extend map bounds to include coordinates
        self.mapBounds.extend(new google.maps.LatLng(that.lat, that.lng));
        // fit the map to the expanded bounds
        self.map.fitBounds(self.mapBounds);
        // center the map
        self.map.setCenter(self.mapBounds.getCenter());
    };




    /*
     * Cycle through available photos
     */
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



    /*
     * Select and focus on venue from list or map
     */
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



    /*
     * Show all venues
     */
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



    /*
     * Show only user favorites, if any
     */
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



    /*
     * Convert geolocated coordinates to a text location
     */
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



    /*
     * Empty existing locations
     * Set current location
     * Fetch new venues data
     */
    this.getLocations = function(result) {
        self.hideMarkers();
        self.mapBounds = new google.maps.LatLngBounds();
        self.poi(result[0].address_components[2].long_name);
        self.getVenuesData();
    };



    /*
     * Toggle dark/light mode of map
     */
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

    /*
     * Live filter of list of venues
     */
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



    /*
     * Opens/closes chosen venue
     */
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



    /*
     * Toggle Login interface
     */
    this.toggleLogin = function() {
        this.loginExpanded(!this.loginExpanded());
    };



    /*
     * Helper function to see if target contains
     * any character found in the crosscheck string
     */
    this.contains = function(target, crosscheck) {
        var val = false;
        for (var l = 0, len = crosscheck.length; l < len; l++) {
            if (target.indexOf(crosscheck.charAt(l)) > -1) {
                val = true;
            }
        }
        return val;
    };


    /*
     * Log in the user via external app database
     */
    this.login = function() {
        var loginPath = 'users/' + self.user();
        var user = self.user();
        if (user && !self.contains(user, ' .#$[]')) {
            this.myDataRef.child(loginPath).once('value', function(snapshot) {

                var result = snapshot.val();

                if (result) {
                    // creates a welcome back alert if login successful
                    self.alertTitle('welcome back, ' + user);
                    self.alertDetails('You are logged in. Please feel free to explore and favorite any locations you find enjoyable.');
                    self.toggleAlert('open', 'temporary');
                    self.importUserFavorites(user);
                } else {
                    // if user doesn't exist create a new one
                    var users = {};
                    // user has no favorites
                    users[user] = 'No favorites yet.';
                    // store user in database
                    self.usersRef.update(users, function(error) {
                        // if user creation fails, display an error alert
                        if (error) {
                            self.alertTitle('login error');
                            self.alertDetails('The user profile could not be created at this time. Please try again later.');
                            self.toggleAlert('open', 'temporary');
                        // else create a welcome alert
                        } else {
                            self.alertTitle('welcome, ' + user);
                            self.alertDetails('The user profile was successfully created. Please feel free to explore and favorite any locations around the world you find enjoyable');
                            self.toggleAlert('open', 'temporary');
                        }
                    });

                }

                // set logged in status as true
                self.loggedIn(true);

                // if localStorage is available, persist user
                if (self.localStorageAvailable) {
                    localStorage.user = user;
                }
            });
        } else {
            // if login/signin invalid, create error alert
            self.alertTitle('user error');
            self.alertDetails('Please use a valid name. Paths must be non-empty strings, not containing the following characters: ". # $ [ ]".');
            self.toggleAlert('open', 'temporary');
        }
    };



    /*
     * User initiates favoriting
     */
    this.toggleVenueFavorite = function(current) {
        if (self.loggedIn()) {
            // check if current item is already favorited
            self.checkUserFavorites(self.user(), current, 'favorite');
        } else {
            // if not logged in, alert user
            self.alertTitle('login required');
            self.alertDetails('Please login or create a user profile first.');
            self.toggleAlert('open', 'temporary');
        }
    };



    /*
     * Add venue to user favorites in database
     */
    this.favoriteVenue = function(result, current) {
        var user = self.user();
        if (!result) {
            var location = {};
            // save location id in database
            location.id = current.id;
            self.usersRef.child(user).push().update(location, function(error) {
                // if update error, alert user
                if (error) {
                    self.alertTitle('firebase error');
                    self.alertDetails('There was an error while handling user favorites. Please try again later.');
                    self.toggleAlert();
                } else {
                    // otherwise toggle live 'favorited' status
                    current.favorited(true);
                }
            });
        } else {
            // unfavorite if the favorite already existed
            current.favorited(false);
        }
    };



    /*
     * Check user favorites in database
     */
    this.checkUserFavorites = function(user, current, mode) {
        // initialize false result
        var result = false;
        // check user's database favorites
        this.usersRef.child(user).once('value', function(snapshot) {
            var venueID = current.id;
            var favorite, storedVenueID, firebaseID, result;
            var userFavoritesLen = snapshot.numChildren();

            if (userFavoritesLen) {
                // for each location id in the user favorites
                snapshot.forEach(function(childSnapshot) {
                    favorite = childSnapshot.val();
                    firebaseID = childSnapshot.key();

                    storedVenueID = favorite.id;

                    // result is true if there is a match
                    result = (storedVenueID === venueID);

                    // if there is a match, propagate user action accordingly
                    if (result) {
                        self.userAction(result,
                                    current,
                                    mode,
                                    firebaseID,
                                    userFavoritesLen);
                        return true;
                    }
                });

                // if there is no match, firebaseID is not needed
                if (!result) {
                    self.userAction(result,
                                    current,
                                    mode);
                }

            } else {
                // otherwise proceed since no user favorites exist
                self.userAction(result, current, mode);
            }

        });
    };



    /*
     * User action for each location depending on mode and result
     */
    this.userAction = function(result, current, mode, fID, len) {
        // cache user
        var user = self.user();
        // switch based on the mode
        switch (mode) {
                // if user is favoriting/unfavoriting
                case ('favorite'):
                    // and if there is an existing match
                    if (result) {
                        var node = user + '/' + fID;
                        // if there are multiple user favorites already
                        if (len > 1) {
                            // remove the database match
                            self.usersRef.child(node).remove();
                            // unfavorite the location
                            current.favorited(false);
                        } else {
                            var users = {};
                            // set user favorites to placehodler string
                            users[user] = 'No favorites yet.';
                            self.usersRef.update(users, function(error) {
                                // if there is an error, alert user
                                if (error) {
                                    self.alertTitle('favorite error');
                                    self.alertDetails('There was an error in saving the user favorite. Please try again later.');
                                    self.toggleAlert('open', 'temporary');
                                }
                            });
                        }
                        // unfavorite current location
                        current.favorited(false);
                    } else {
                        // otherwise favorite the venue
                        self.favoriteVenue(result, current);
                        // set the venue status to favorited
                        current.favorited(true);
                    }
                    break;
                // if the user is just importing the favorites
                case ('import'):
                    // set favorited status true if there is a match
                    if (result) {
                        current.favorited(true);
                    } else {
                        current.favorited(false);
                    }
                    break;
        }
    };



    /*
     * Imports user favorites if any
     */
    this.importUserFavorites = function(user) {
        // for each location in the current venue array
        self.venuesArray().forEach(function(venue) {
            // import the locations
            self.checkUserFavorites(user, venue, 'import');
        });
    };

    // Initialize the view
    this.init();

};


// apply knockout bindings
$(function() {
    ko.applyBindings( new viewModel() );
}());