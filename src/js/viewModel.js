var app = app || {};

(function() {
    /**
     * ViewModel for Knockout bindings
     */
    var ViewModel = function() {

        // alias reference to this
        var self = this;

        /* Early ViewModel observables */
        // decides loading state of app
        this.loading = ko.observable(true);
        // binds whether the alert modal is visible
        this.alerting = ko.observable(true);
        // initial search
        this.initialSearch = ko.observable(true);
        // alert on geolocation
        this.alertTitle = ko.observable('geolocation note');
        this.alertDetails = ko.observable('For best results enable browser geolocation, or attempt a new search.');

        /*
         * @description Contains venue data imported from Foursquare and Yelp
         * @constructor Class Venue
         * @params {object} location data
         */
        var Venue = function(venue) {
            this.FoursquareURL = self.Foursquare.baseVenueURL + venue.id;
            // sets the name of the venue
            this.name = venue.name;
            this.domID = venue.name.toLowerCase().split(' ').join('-').replace(/[^a-zA-Z0-9-]/g, '');
            this.location = venue.location;
            this.id = venue.id;
            // gets the place's categories or sets it to misc.
            this.setCategories(venue.categories);
            // sets venue hours
            this.setHours(venue.hours);
            // sets venue rating
            this.setRating(venue.rating);
            // sets venue price
            this.setPrice(venue.price);
            // sets venue contact and phone
            this.contact = venue.contact;
            this.url = venue.url;
            this.setPhone(this.contact.phone);
            // define photos
            this.setPhotos(venue.featuredPhotos);
            this.multiPhotos = ko.observable(false);
            // by default all venues are initially visible
            this.venueVisible = ko.observable(true);
            // no venues are expanded
            this.venueExpanded = ko.observable(false);
            // no venues are favorited
            this.favorited = ko.observable(false);

            // create a new marker object
            this.marker = new self.Marker(this);
        };

        /*
         * @description Gets the Categories for the venue
         * or sets the class field to miscellaneous
         * @param {array} Venue Type Categories
         */
        Venue.prototype.setCategories = function(categories) {
            this.categories = (categories && categories.length) ? categories : [{ name: 'Miscellaneous '}];
        };

        /*
         * @description Gets the Hours for the venue
         * or sets the class field to 'Not available'
         * @param {object} Venue Hours Info
         */
        Venue.prototype.setHours = function(hours) {
            this.hours = hours ? hours :
            { isOpen: null, status:'Hours not available' };
        };

        /*
         * @description Gets the Rating for the venue
         * or sets the class field to empty
         * @param {number} Venue Rating
         */
        Venue.prototype.setRating = function(rating) {
            // format venue rating as a decimal value
            rating = parseFloat(rating).toFixed(1);
            // if no rating, mark as unavailable
            this.rating = (rating === 'NaN') ? '--' : rating;
        };


        /*
         * @description Gets the Price for the venue
         * or sets the class field to empty
         * @param {object} Venue Price
         */
        Venue.prototype.setPrice = function(price) {
            // if no price, mark price tier as empty
            this.price = price ? price : { 'tier': 0 };
        };


        /*
         * @description Gets the Price for the venue
         * or sets the class field to empty
         * @param {object} Venue Price
         */
        Venue.prototype.setPhone = function(phone) {
            if (phone && phone.length === 10) {
              // bind empty observables for Yelp data
              this.review = ko.observable('Loading Yelp review');
              this.yelpURL = ko.observable();
            }
        };


        /*
         * @description Gets the Price for the venue
         * or sets the class field to empty
         * @param {object} Venue Price
         */
        Venue.prototype.setPhotos = function(photos) {
            // current picture displayed
            this.currentPic = 0;
            // if photos are available
            if (photos && photos.items.length) {
                var initialPhoto = photos.items[this.currentPic];
                initialPhoto.size = '250x100';
                // define current photoURL
                this.photoURL = ko.observable(initialPhoto.prefix + initialPhoto.size + initialPhoto.suffix);
                // define infoWindow picture
                this.infowindowPic = this.photoURL();
            }
        };




        /**
         * @description Callback to initialize app when map loads
         */
        this.init = function() {

            // configure API requirements
            this.configFoursquare();
            this.configFlickr();

            // configure yelp secrets
            this.yelpKeySecret = "EbOO2hHGytkLpd1lycWv7K-faa4";
            this.yelpTokenSecret = "oZEPYCr8TQ2cNaqrDN7_G0ISsis";

            // Initialize observables
            this.initializeObservables();

        };

        /*
         * @description Initializes Knockout observables
         */
        this.initializeObservables = function() {
            // binds search term, e.g. 'popular', ''
            this.searchTerm = ko.observable('Popular');
            // binds location
            this.poi = ko.observable('');
            // binds range options visibility
            this.rangeVisible = ko.observable(false);
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

            // binds empty location of interest
            this.anchorMarker = ko.observable();

            // binds array of returned venues
            this.venuesArray = ko.observableArray();
            // binds whether list of venues is expanded
            this.placesExpanded = ko.observable(false);
            // binds current day/night mode of map
            this.currentMode = ko.observable('');
            // binds logged in user
            this.user = ko.observable('');
            // binds whether a user is successfully logged in
            this.loggedIn = ko.observable(false);
            // binds whether the login interface is visible
            this.loginExpanded = ko.observable(false);
            this.selected = ko.observable(null);
            this.shouldScroll = ko.observable(false);
        };



        /**
         * Handles geolocation error or absence
         */
        this.handleLocationError = function() {
            // use third-party geolocation api for approximate geolocation
            $.getJSON('https://freegeoip.net/json/')
                .done(function(result) {
                    var pos = {
                        lat: result.latitude,
                        lng: result.longitude
                    };

                    self.coordinates(pos);

                    app.mapOptions.center = pos;

                    app.map = new google.maps.Map(document.getElementById('mapDiv'), app.mapOptions);

                    google.maps.event.addDomListener(window, 'resize', function() {
                        var center = app.map.getCenter();
                        google.maps.event.trigger(app.map, 'resize');
                        app.map.setCenter(center);
                    });

                    // define the time of day for the map style
                    self.initializeTime();

                    self.geoLocate(pos.lat, pos.lng);

                }).fail(function(result) {
                    // set default place to Rome
                    self.poi('Rome');
                    // Rome hardcoded if all else fails
                    self.coordinates({
                        lat: 41.90278349999999,
                        lng: 12.496365500000024
                    });

                    app.mapOptions.pos = self.coordinates();

                    app.map = new google.maps.Map(document.getElementById('mapDiv'), app.mapOptions);

                    self.initializeTime();

                    google.maps.event.addDomListener(window, 'resize', function() {
                        var center = app.map.getCenter();
                        google.maps.event.trigger(app.map, 'resize');
                        app.map.setCenter(center);
                    });

                    self.constructAlert({
                        title: 'geolocation failed',
                        details: 'All roads lead to Rome. But for a personalized experience please enable browser geolocation and try again, or attempt a new search.'
                    });
                    self.toggleAlert('open');
                    // default search
                    self.updateSearch();
                });
        };



        /**
         * Fetches the local user if one exists in localStorage
         */
        this.getLocalUser = function() {
            var user = localStorage.user;
            if (user) {
                self.user(user);
                self.login();
            } else {
                self.constructAlert({
                    title: 'welcome!',
                    details: 'Feel free to explore the map, create a user profile, and favorite locations.'
                });
                self.toggleAlert('open');
            }
        };



        /**
         * TODO: Fetches last searched location
         */
        this.getLastSearch = function() {
            var lastPOI = localStorage.lastPOI;
            var lastTerm = localStorage.lastTerm;
            if (lastPOI && lastTerm) {
                // TODO: get last search
            }
        };


        /**
         * Configure default Foursquare terms
         */
        this.configFoursquare = function() {
            this.Foursquare = {
                cID: "AHMKTGNPJOKRI5HSWIQ4GZVRFDXUA2UD4T4ZRBIYRN413QL5",
                cSecret: "S3D4Y0R1430KP33VNL3MZW320ZFV22YQ2VT02SUX2XCTAD5R",
                APIbaseURL: "https://api.foursquare.com/",
                baseVenueURL: "https://foursquare.com/v/",
                version: "20140601",
                defaultQuery: ko.observable('topPicks'),
                radius: ko.observable(10000)
            };
        };


        /**
         * Configure default Flickr terms
         */
        this.configFlickr = function() {
            this.Flickr = {
                key: "&api_key=e3ce05cd3fe0a8e29946f1afa5afc492",
                secret: "1c5a3dd9614db005",
                method: "&method=flickr.photos.search",
                APIbaseURL: "https://api.flickr.com/services/rest/?format=json",
                sort: "&sort=interestingness-desc",
                mode: '&nojsoncallback=1',
            };
        };


        /**
         * Configure default Yelp parameters
         */
        this.getYelpParams = function(phone) {
            return {
                oauth_consumer_key: 'cNPz9LqhgDj8zRplQ9P_FQ',
                oauth_token: 'CtUW644wLDpJK0flWMnh2aaZI1outOUw',
                oauth_signature_method: 'HMAC-SHA1',
                oauth_version : '1.0',
                callback: 'cb', // needed for jsonp implementation
                oauth_nonce: nonceGenerate(),
                oauth_timestamp: Math.floor(Date.now()/1000),
                phone: phone
            };
        };


        /*
         * Get Yelp data
         */
        this.getYelpData = function(place) {
            var baseUrl = 'https://api.yelp.com/v2/phone_search';

            // define Yelp parameters
            var parameters = this.getYelpParams(place.contact.phone);

            // generate encoded signature
            var encodedSignature = oauthSignature.generate('GET',
                baseUrl,
                parameters,
                self.yelpKeySecret,
                self.yelpTokenSecret);

            // assign encoded signature
            parameters.oauth_signature = encodedSignature;

            // define the settings to pass into the Yelp ajax request
            var settings = {
                url: baseUrl,
                data: parameters,
                cache: true,
                dataType: "jsonp",
            };

            // make Yelp API query
            $.ajax(settings)
                .done(function(results) {
                    var business = results.businesses[0];
                    if (business) {
                        // bind venue review
                        var review = business.snippet_text || 'No Yelp review available.';
                        place.review(review);
                        // bind venue URL
                        place.yelpURL(business.url);
                    }
                })
                .fail(function(err) {
                    self.constructAlert({
                        title: 'Yelp error',
                        details: 'There was an error with the Yelp API. Some requested data may be unavailable at this time. Please try again.',
                        delay: 2000
                    });
                    self.toggleAlert('open');
                });
        };



        /**
         * Toggle expansion of the venues list
         */
        this.expandPlaces = function() {
            this.placesExpanded(!this.placesExpanded());
            if (this.shouldScroll()) {
                this.shouldScroll(false);
                this.scrollToLocation(this.selected().domID);
            }
        };



        /**
         * Expands the radio options for range of query
         */
        this.expandRangeOptions = function() {
            self.rangeVisible(!self.rangeVisible());
        };



        /**
         * Toggles the alert modal
         */
        this.toggleAlert = function(mode, temp) {
            // enables the alert modal
            if (mode === 'open') { this.alerting(true); }
            // closes the alert modal
            else { this.alerting(false); }
        };



        /**
         * Constructs the alert message
         */
        this.constructAlert = function(obj) {
            var delay = obj.delay || 0;
            setTimeout(function() {
                self.alertTitle(obj.title);
                self.alertDetails(obj.details);
            }, delay);
        };



        /**
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



        /**
         * User update of search
         */
        this.updateSearch = function() {
            if (self.poi()) {
                self.loading(true);
                // enable Google Maps API Places Service
                var service = new google.maps.places.PlacesService(app.map);
                // define search query with user point of interest
                var request = {
                    "query": self.poi()
                };
                // perform Google Maps API text search
                service.textSearch(request, self.updateLatLng);
            } else {
                self.constructAlert({
                    title: 'invalid search',
                    details: 'Please enter a valid location. Specific locations yield accurate results.'
                });
                self.toggleAlert('open');
            }
        };



        /**
         * Update current map coordinates
         */
        this.updateLatLng = function(results, status) {
            if (status == google.maps.places.PlacesServiceStatus.OK) {
                if (results) {
                    // find coordinates of places service result
                    var loc = results[0].geometry.location;
                    // save the coordinates associated with new location
                    self.coordinates({
                        lat: loc.lat(),
                        lng: loc.lng()
                    });
                }
            } else {
                self.constructAlert({
                    title: 'google maps error',
                    details: 'There was an issue while discovering the specified location. Please try again.'
                });
                self.toggleAlert('open');
            }
            var lat = self.coordinates().lat;
            var lng = self.coordinates().lng;
            // hide markers
            self.hideMarkers();

            // define new map bounds
            app.mapBounds = new google.maps.LatLngBounds();

            // define new central anchor marker
            self.anchorMarker(new google.maps.Marker({
                map: app.map,
                position: {
                    "lat": lat,
                    "lng": lng
                },
                icon: self.currentMode() === 'light' ? app.lightIcon : app.darkIcon,
                size: new google.maps.Size(5, 5),
                title: 'Showing locations near:',
                animation: google.maps.Animation.DROP
            }));

            google.maps.event.addListener(self.anchorMarker(), 'click', (function(marker, infoWindow){
                return function() {
                    infoWindow.setContent('<div class="infowindow"><h3 class="infowindow-title">' + self.poi() + '</h3></div>');
                    infoWindow.open(app.map, this);
                    app.map.panTo(marker.getPosition());
                    app.map.panBy(0, -75);
                    app.map.setZoom(12);
                };
            })(self.anchorMarker(), app.infoWindow));
            // extend map bounds to include coordinates
            app.mapBounds.extend(new google.maps.LatLng(lat, lng));
            // get new venue data
            self.getVenuesData();
        };


        /**
         * Delete markers
         */
        this.hideMarkers = function() {
            var len = self.venuesArray().length;
            if (self.anchorMarker()) {
                self.anchorMarker().setMap(null);
                self.anchorMarker('');
            }
            var venue;
            for (var i = 0; i < len; i++) {
                venue = self.venuesArray()[i];
                // delete marker by
                // setting its map object to null
                venue.marker.marker.setMap(null);
            }
        };


        /**
         * Use a Foursquare based search to compile local venues
         */
        this.getVenuesData = function() {
            // empty current array of venues
            self.venuesArray([]);
            var filter;
            // for any unique non-generic user search term
            if (self.searchTerm() &&
                self.searchTerm().toLowerCase() !== 'popular') {
                // use it as the API query
                filter = '&query=' + self.searchTerm().split(' ').join('&');
            } else {
                // otherwise use a default query
                self.searchTerm('Popular');
                filter = '&section=' + self.Foursquare.defaultQuery();
            }

            // define the URL for the Foursquare API query
            var url = self.Foursquare.APIbaseURL + 'v2/venues/explore?' +
                'client_id=' + self.Foursquare.cID +
                '&client_secret=' + self.Foursquare.cSecret +
                '&v=' + self.Foursquare.version +
                filter +
                '&radius=' + self.Foursquare.radius() +
                '&ll=' + self.latLng() +
                '&time=any&day=any&limit=35&venuePhotos=1';

            // Get Foursquare API query response
            $.getJSON(url)
                .done(function(data) {
                    var venue;
                    // access list of returned venues in the JSON response
                    var venues = data.response.groups[0].items;

                    if (venues.length) {
                        // iterate over the returned venues
                        for (var v = 0, len = venues.length; v < len; v++) {
                            // for each venue
                            venue = venues[v].venue;

                            // push the venue to the venues array
                            self.venuesArray.push(new Venue(venue));
                        }
                    } else {
                        self.constructAlert({
                            title: 'try another search',
                            details: 'Just as with the meaning of life, this search provided no concrete results. Please try a valid search with a specific location for accurate results.'
                        });
                        self.toggleAlert('open');
                        self.loading(false);
                    }
                // after the api requests are processed
                setTimeout(function() {

                    // fit the map to the expanded bounds
                    app.map.fitBounds(app.mapBounds);
                    // center the map
                    app.map.setCenter(app.mapBounds.getCenter());

                    // order the venues
                    self.orderVenues();

                    if (!self.loggedIn() && self.initialSearch()) {

                        // initialize reference to Firebase database
                        self.myDataRef = new Firebase('https://fendneighborhoodmap.firebaseio.com/');
                        // create reference to 'users' category in database
                        self.usersRef = self.myDataRef.child('users');
                        // TODO: set up a reference to 'venues' category in database
                        self.venuesRef = self.myDataRef.child('venues');


                        // harvest persistent user from localStorage
                        if (typeof(Storage)) {
                            self.localStorageAvailable = true;
                            self.getLocalUser();
                        } else {
                            self.localStorageAvailable = false;
                        }
                        // set initial search setting to false
                        // user/app interaction is settled
                        self.initialSearch(false);

                    } else if (self.loggedIn()) {
                        self.importUserFavorites(self.loggedInUser);
                    }


                    // get additional yelp and flickr data for each venue
                    // loads async in the background since it is non-critical
                    var venue, phone, venues = self.venuesArray();
                    for (var i = 0, len = venues.length; i < len; i++) {
                        venue = venues[i];
                        phone = venue.contact.phone;
                        self.getPhotos(venue);
                        if (phone && phone.length === 10) {
                            self.getYelpData(venue);
                        }
                    }

                    // give user feel of completed loading
                    self.loading(false);

                }, 500);
            }).fail(function(err) {
                // toggle alert if the foursquare response fails
                self.constructAlert({
                    this: 'foursquare error',
                    details: 'There was an error with the Foursquare query. Please try again momentarily, or refine the query.'
                });
                self.toggleAlert('open');
            });
        };



        /**
         * Order the venues according to the ratings
         */
        this.orderVenues = function() {
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



        /**
         * Get additional Flickr photos if any
         */
        this.getPhotos = function(place) {
            var lat = place.location.lat;
            var lng = place.location.lng;

            // define url for Flickr query
            var url = self.Flickr.APIbaseURL +
                self.Flickr.key +
                self.Flickr.method +
                self.Flickr.mode +
                self.Flickr.sort +
                '&lat=' + lat +
                '&lon=' + lng +
                '&text=' + place.name;

            $.getJSON(url).done(function(data) {
                var photos = data.photos.photo;
                if (!photos.length) return;
                var imagePrefix, imageSuffix;

                // assign image objects to venue
                photos.forEach(function(photoData) {
                    // define prefix and suffix format
                    imagePrefix = 'https://farm' + photoData.farm + '.staticflickr.com/';
                    imageSuffix = photoData.server + '/' + photoData.id + '_' + photoData.secret + '.jpg';
                    // if no featuredPhotos property exists create one
                    if (!place.featuredPhotos) {
                        place.featuredPhotos = {
                            'items': []
                        };
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
                place.multiPhotos(place.featuredPhotos.items.length > 1);
            }).fail(function(err) {
                // if Flickr fails, display alert modal
                self.constructAlert({
                    title: 'flickr error',
                    details: 'There was a problem harvesting Flickr photos for the venues. Please try again later.',
                    delay: 3000
                });
                self.toggleAlert('open');
            });
        };


        /**
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

            if (place && place.categories && place.categories[0] && place.categories[0].icon) {
                // encapsulate icon properties
                this.icon = place.categories[0].icon;
                var bg = 'bg_';
                this.size = '32';
                var img = this.icon.prefix;
                var ext = this.icon.suffix;

                // use custom icon if defined or default marker icon as a fallback
                this.iconImage = (img + bg + this.size + ext);
            } else {
                this.iconImage = 'img/question.svg';
            }

            // create new Google Maps marker
            this.marker = new google.maps.Marker({
                map: app.map,
                position: this.pos,
                icon: this.iconImage,
                size: new google.maps.Size(5, 5),
                title: this.name,
                animation: google.maps.Animation.DROP
            });

            // encapsulate rating
            this.placeRating = place.rating || 'No rating';
            this.placePrice = new Array(place.price.tier + 1).join('$') || 'No price';

            // define placePhoto
            var placePhoto = place.infowindowPic || '';

            // encapsulate marker content
            this.marker.content = '<div class="infowindow">' +
                '<button class="infowindow-close-button"><i class="fa fa-close infowindow-close-icon"></i></button>' +
                (placePhoto
                    ? '<div class="infowindow-pic" style="background-image: url(' + placePhoto + '); height: 138px"></div>'
                    : '') +
                '<h3 class="infowindow-title">' + this.name +
                '</h3><div class="infowindow-info"><h4 class="infowindow-rating">Rating: ' + this.placeRating + '</h4><h4 class="infowindow-price">Price: ' + this.placePrice + '</h4></div></div>';

            // add click event to marker for opening infowindow
            google.maps.event.addListener(this.marker, 'click', (function(place){
                return function() {
                    self.toggleVenueExpand(place);
                };
            })(place));

            // extend map bounds to include coordinates
            app.mapBounds.extend(new google.maps.LatLng(that.lat, that.lng));
        };



        /**
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



        /**
         * Select and focus on venue from list or map
         */
        this.chooseVenue = function(data, event) {
            if (!this.placesExpanded()) {
                this.shouldScroll(true);
            } else {
                this.scrollToLocation(data.domID);
            }
            // deselect previous selected
            var prevSelected = this.selected();
            if (prevSelected) {
                prevSelected.venueExpanded(false);
                prevSelected.marker.marker.setAnimation(null);
            }
            // overwrite with new selected data
            this.selected(data);
            // set marker map property if undefined
            data.marker.marker.setMap(app.map);
            // define specific content of i`nfowindow
            app.infoWindow.setContent(data.marker.marker.content);
            // toggle marker animation
            this.toggleMarkerBounce(true, data.marker.marker);
            // open infowindow
            app.infoWindow.open(app.map, data.marker.marker);
            // zoom and pan
            app.map.setZoom(12);
            app.map.panTo(data.marker.marker.getPosition());
            app.map.panBy(0, -75);
        };



        /**
         * Toggles Marker animation
         */
        this.toggleMarkerBounce = function(state, marker) {
            // toggle specific marker to bounce
            if (state) {
                marker.setAnimation(google.maps.Animation.BOUNCE);
            } else {
                marker.setAnimation(null);
            }
        };


        /**
         * Show all venues
         */
        this.showAll = function(event) {
            this.closeInfoWindow();
            var len = this.venuesArray().length;
            var venue;
            for (var i = 0; i < len; i++) {
                venue = this.venuesArray()[i];
                venue.venueVisible(true);
                venue.marker.marker.setMap(app.map);
                venue.venueExpanded(false);
            }
            app.map.fitBounds(app.mapBounds);
        };



        /**
         * Show only user favorites, if any
         */
        this.showFavorites = function(event) {
            this.closeInfoWindow();
            var len = this.venuesArray().length;
            var venue;
            if (this.loggedIn()) {
                for (var i = 0; i < len; i++) {
                    venue = this.venuesArray()[i];
                    if (venue.favorited()) {
                        venue.marker.marker.setMap(app.map);
                    } else {
                        venue.venueVisible(false);
                        venue.marker.marker.setMap(null);
                    }
                    venue.venueExpanded(false);
                }
                app.map.fitBounds(app.mapBounds);
            } else {
                this.constructAlert({
                    title: 'no favorites yet',
                    details: 'You must create a new user profile or be logged in to use this feature.'
                });
                this.toggleAlert('open');
            }
        };



        /**
         * Convert geolocated coordinates to a text location
         */
        this.geoLocate = function(lat, lng) {
            var latlng;
            this.loading(true);
            // if coordinates have already been passed in, skip the geolocation
            if (typeof lat === 'number' && typeof lng === 'number') {
                latlng = new google.maps.LatLng(lat, lng);
                if (app.geocoder) {
                    app.geocoder.geocode({'latLng': latlng}, function(results, status) {
                        if (status == google.maps.GeocoderStatus.OK) {
                            self.getLocations(results);
                        } else {
                            self.constructAlert({
                                title: 'google maps error',
                                details: 'There was an issue while discovering the specified location. Please try again.'
                            });
                            self.toggleAlert('open');
                        }
                    });
                } else {
                    self.constructAlert({
                        title: 'google maps error',
                        details: 'There was an error with the map. Please refresh the page and try again.'
                    });
                    self.toggleAlert('open');
                }
            } else {
                navigator.geolocation.getCurrentPosition(function(position) {
                    latlng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
                    if (app.geocoder) {
                        app.geocoder.geocode({'latLng': latlng}, function(results, status) {
                            if (status == google.maps.GeocoderStatus.OK) {
                                self.poi(results[0].address_components[2].long_name);
                                self.coordinates({
                                    'lat': latlng.lat(),
                                    'lng': latlng.lng()
                                });
                                self.loading(true);
                                self.updateLatLng('', status);
                            } else {
                                self.constructAlert({
                                    title: 'google maps error',
                                    details: 'There was an issue while discovering the specified location. Please try again.'
                                });
                                self.toggleAlert('open');
                            }
                        });
                    }  else {
                        self.constructAlert({
                            title: 'google maps error',
                            details: 'There was an error with the map. Please refresh the page and try again.'
                        });
                        self.toggleAlert('open');
                    }
                }, self.handleLocationError);
            }
        };



        /**
         * Empty existing locations
         * Set current location
         * Fetch new venues data
         */
        this.getLocations = function(result) {
            this.hideMarkers();

            var lat = this.coordinates().lat;
            var lng = this.coordinates().lng;

            if (this.anchorMarker()) {
                this.anchorMarker().setMap(null);
                this.anchorMarker('');
            }

            this.anchorMarker(new google.maps.Marker({
                map: app.map,
                position: {
                    "lat": lat,
                    "lng": lng
                },
                icon: self.currentMode() === 'light' ? app.lightIcon : app.darkIcon,
                title: 'Showing locations near:',
                size: new google.maps.Size(5, 5),
            }));

            google.maps.event.addListener(this.anchorMarker(), 'click', (function(marker, infoWindow){
                return function() {
                    if (self.selected()) {
                        self.toggleVenueExpand(self.selected());
                    }
                    infoWindow.setContent('<div class="infowindow"><h3 class="infowindow-title">' + self.poi() + '</h3></div>');
                    infoWindow.open(app.map, this);
                    setTimeout(function() {
                        self.closeInfoWindow();
                    }, 3000)
                    app.map.panTo(marker.getPosition());
                    app.map.panBy(0, -75);
                    app.map.setZoom(12);
                };
            })(this.anchorMarker(), app.infoWindow));

            app.mapBounds = new google.maps.LatLngBounds();
            // extend map bounds to include coordinates
            app.mapBounds.extend(new google.maps.LatLng(lat, lng));
            this.poi(result[0].address_components[2].long_name);
            this.getVenuesData();
        };



        /**
         * Toggle dark/light mode of map
         */
        this.toggleMapMode = function() {
            if (this.currentMode() === 'light') {
                if (this.anchorMarker()) {
                    this.anchorMarker().setIcon(app.darkIcon);
                }
                app.map.mapTypes.set('map_style', app.lightMode);
                app.map.setMapTypeId('map_style');
                this.currentMode('');
            } else {
                if (this.anchorMarker()) {
                    this.anchorMarker().setIcon(app.lightIcon);
                }
                app.map.mapTypes.set('map_style', app.darkMode);
                app.map.setMapTypeId('map_style');
                this.currentMode('light');
            }
        };



        /**
         * Live filter of list of venues
         */
        this.filterVenues = function() {
            var venueName;
            var len = this.venuesArray().length;
            var search = this.filterQuery().toLowerCase();
            for (var i = 0; i < len; i++) {
                var venue = this.venuesArray()[i];
                venueName = venue.name.toLowerCase();
                if (venueName.indexOf(search) >= 0) {
                    venue.venueVisible(true);
                    venue.marker.marker.setMap(app.map);
                } else {
                    venue.venueVisible(false);
                    venue.marker.marker.setMap(null);
                }
            }
        };



        /**
         * Opens/closes chosen venue
         */
        this.toggleVenueExpand = function($data, event) {
            if (!$data.venueExpanded()) {
                if (self.selected()) self.selected().venueExpanded(false);
                self.chooseVenue($data, event);
            } else {
                self.closeInfoWindow();
                self.toggleMarkerBounce(false, $data.marker.marker);
                self.scrollToLocation();
                self.selected(null);
                self.shouldScroll(false);
            }
            $data.venueExpanded(!$data.venueExpanded());
        };


        /**
         * Scrolls to the selected venue's list item
         */
        this.scrollToLocation = function(id, speed) {
            var placesListEl = document.getElementById('places-list');
            var navOffset = 135;
            var scrollTo = id ? document.getElementById(id).offsetTop - navOffset : null;
            var scrollDuration = 500;
            if (scrollTo && scrollTo < 0) scrollTo = 0;
            smoothScrollTo(placesListEl, scrollTo, scrollDuration);
        };


        /**
            Smooth scrolling plugin courtesy of:
            https://coderwall.com/p/hujlhg/smooth-scrolling-without-jquery
            Smoothly scroll element to the given target (element.scrollTop)
            for the given duration

            Returns a promise that's fulfilled when done, or rejected if
            interrupted
         */
        var smoothScrollTo = function(element, target, duration) {
            if (target === null) return;
            target = Math.round(target);
            duration = Math.round(duration);
            if (duration < 0) return Promise.reject("bad duration");
            if (duration === 0) {
                element.scrollTop = target;
                return Promise.resolve();
            }

            var startTime = Date.now();
            var endTime = startTime + duration;

            var startTop = element.scrollTop;
            var distance = target - startTop;

            // based on http://en.wikipedia.org/wiki/Smoothstep
            var smoothStep = function(start, end, point) {
                if (point <= start) return 0;
                if (point >= end) return 1;
                var x = (point - start) / (end - start); // interpolation
                return x * x * (3 - (2 * x));
            }

            return new Promise(function(resolve, reject) {
                // This is to keep track of where the element's scrollTop is
                // supposed to be, based on what we're doing
                var previousTop = element.scrollTop;

                // This is like a think function from a game loop
                var scrollFrame = function() {
                    if (element.scrollTop != previousTop) {
                        reject({ el: element, target: target });
                        return;
                    }

                    // set the scrollTop for this frame
                    var now = Date.now();
                    var point = smoothStep(startTime, endTime, now);
                    var frameTop = Math.round(startTop + (distance * point));
                    element.scrollTop = frameTop;

                    // check if we're done!
                    if (now >= endTime) {
                        resolve();
                        return;
                    }

                    // If we were supposed to scroll but didn't, then we
                    // probably hit the limit, so consider it done; not
                    // interrupted.
                    if (element.scrollTop === previousTop
                        && element.scrollTop !== frameTop) {
                        resolve();
                        return;
                    }
                    previousTop = element.scrollTop;

                    // schedule next frame for execution
                    requestAnimationFrame(scrollFrame);
                }

                // boostrap the animation process
                requestAnimationFrame(scrollFrame);
            }).catch(function(result) {
                // scroll list straight to target
                result.el.scrollTop = result.target;
            });
        }


        /**
         * Toggle Login interface
         */
        this.toggleLogin = function() {
            this.loginExpanded(!this.loginExpanded());
        };



        /**
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


        /**
         * Log in the user via external app database
         */
        this.login = function() {
            var loginPath = 'users/' + this.user();
            var user = this.user();
            if (user && !this.contains(user, ' .#$[]')) {
                this.myDataRef.child(loginPath).once('value', function(snapshot) {

                    var result = snapshot.val();

                    if (result) {
                        // creates a welcome back alert if login successful
                        self.constructAlert({
                            title: 'welcome back, ' + user,
                            details: 'You are logged in. Feel free to explore and favorite any locations you find enjoyable.',
                            delay: 4000
                        });
                        self.toggleAlert('open');
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
                                self.constructAlert({
                                    title: 'login error',
                                    details: 'The user profile could not be created at this time. Please try again later.',
                                    delay: 4000
                                });
                                self.toggleAlert('open');
                            // else create a welcome alert
                            } else {
                                self.constructAlert({
                                    title: 'welcome, ' + user,
                                    details: 'The user profile was successfully created. Feel free to explore and favorite any locations around the world you find enjoyable.',
                                    delay: 4000
                                });
                                self.toggleAlert('open');
                            }
                        });

                    }

                    // set logged in status as true
                    self.loggedIn(true);
                    self.loggedInUser = self.user();

                    // if localStorage is available, persist user
                    if (self.localStorageAvailable) {
                        localStorage.user = user;
                    }
                }, function(err) {
                    if (err) {
                        self.constructAlert({
                            title: 'database error',
                            details: 'There was an error contacting the database. Please check the connection and try again.'
                        });
                        self.toggleAlert('open');
                    }
                });
            } else {
                // if login/signin invalid, create error alert
                self.constructAlert({
                    title: 'user error',
                    details: 'Please use a valid name. Paths must be non-empty strings, not containing the following characters: ". # $ [ ]".'
                });
                self.toggleAlert('open');
            }
        };



        /**
         * User initiates favoriting
         */
        this.toggleVenueFavorite = function(current) {
            if (self.loggedIn()) {
                // check if current item is already favorited
                self.checkUserFavorites(self.loggedInUser, current, 'favorite');
            } else {
                // if not logged in, alert user
                self.constructAlert({
                    title: 'login required',
                    details: 'Please login or create a user profile first, and try again.'
                });
                self.toggleAlert('open');
            }
        };



        /**
         * Add venue to user favorites in database
         */
        this.favoriteVenue = function(result, current) {
            var user = this.loggedInUser;
            if (!result) {
                var location = {};
                // save location id in database
                location.id = current.id;
                this.usersRef.child(user).push().update(location, function(error) {
                    // if update error, alert user
                    if (error) {
                        self.constructAlertTitle({
                            title: 'database error',
                            details: 'There was an error while handling user favorites. Please try again later.'
                        });
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



        /**
         * Check user favorites in database
         */
        this.checkUserFavorites = function(user, current, mode) {
            // check user's database favorites
            this.usersRef.child(user).once('value', function(snapshot) {
                var venueID = current.id;
                var favorite, storedVenueID, firebaseID, result;
                var userFavoritesLen = snapshot.numChildren();

                if (userFavoritesLen) {
                    // for each location id in the user favorites
                    // assign returned true match to result
                    result = snapshot.forEach(function(childSnapshot) {
                        favorite = childSnapshot.val();
                        firebaseID = childSnapshot.key();

                        storedVenueID = favorite.id;

                        // result is true if there is a match
                        var result = (storedVenueID === venueID);

                        // if there is a match, propagate user action accordingly
                        if (result) {
                            self.userAction(result,
                                        current,
                                        mode,
                                        firebaseID,
                                        userFavoritesLen);
                            return result;
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

            }, function(err) {
                if (err) {
                    self.constructAlert({
                        title: 'database error',
                        details: 'There was an error contacting the database. Please check the connection and try again.'
                    });
                    self.toggleAlert('open');
                }
            });
        };



        /**
         * User action for each location depending on mode and result
         */
        this.userAction = function(result, current, mode, fID, len) {
            // cache user
            var user = this.loggedInUser;
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
                            this.usersRef.child(node).remove(function(error) {
                                if (error) {
                                    self.constructAlert({
                                        title: 'database error',
                                        details: 'There was an error contacting the database. Please check the connection and try again.'
                                    });
                                    self.toggleAlert('open');
                                }
                            });
                            // unfavorite the location
                            current.favorited(false);
                        } else {
                            var users = {};
                            // set user favorites to placehodler string
                            users[user] = 'No favorites yet.';
                            self.usersRef.update(users, function(error) {
                                // if there is an error, alert user
                                if (error) {
                                    self.constructAlert({
                                        title: 'favorite error',
                                        details: 'There was an error in saving the user favorite. Please try again later.'
                                    });
                                    self.toggleAlert('open');
                                }
                            });
                        }
                        // unfavorite current location
                        current.favorited(false);
                    } else {
                        // otherwise favorite the venue
                        this.favoriteVenue(result, current);
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



        /**
         * Imports user favorites if any
         */
        this.importUserFavorites = function(user) {
            var venue, venues = this.venuesArray();
            // for each location in the current venue array
            for (var i = 0, len = venues.length; i < len; i++) {
                venue = venues[i];
                // import the locations
                this.checkUserFavorites(user, venue, 'import');
            }
        };


        this.closeInfoWindow = function() {
            $('.infoBox').toggleClass('entering leaving')
            app.infoWindow.close();
        };


        /**
         * Generates a random number and returns it as a string for OAuthentication
         * @return {string}
         */
        function nonceGenerate() {
          return (Math.floor(Math.random() * 1e12).toString());
        }


        // Initialize the view
        this.init();

    };

    // initialize knockout viewModel
    app.viewModel = new ViewModel();


    // apply knockout bindings
    ko.applyBindings(app.viewModel);
})();