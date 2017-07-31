var app = app || {};

(function() {
    /**
     * Asynchronous map callback function
     */
    app.initializeMap = function() {

        function loadMap(infoBoxLoaded) {
            // JSON for the 'day' style of the map
            var lightStyle = [{"featureType":"administrative.locality","elementType":"all","stylers":[{"hue":"#2c2e33"},{"saturation":7},{"lightness":19},{"visibility":"on"}]},{"featureType":"landscape","elementType":"all","stylers":[{"hue":"#ffffff"},{"saturation":-100},{"lightness":100},{"visibility":"simplified"}]},{"featureType":"poi","elementType":"all","stylers":[{"hue":"#ffffff"},{"saturation":-100},{"lightness":100},{"visibility":"off"}]},{"featureType":"road","elementType":"geometry","stylers":[{"hue":"#bbc0c4"},{"saturation":-93},{"lightness":31},{"visibility":"simplified"}]},{"featureType":"road","elementType":"labels","stylers":[{"hue":"#bbc0c4"},{"saturation":-93},{"lightness":31},{"visibility":"on"}]},{"featureType":"road.arterial","elementType":"labels","stylers":[{"hue":"#bbc0c4"},{"saturation":-93},{"lightness":-2},{"visibility":"simplified"}]},{"featureType":"road.local","elementType":"geometry","stylers":[{"hue":"#e9ebed"},{"saturation":-90},{"lightness":-8},{"visibility":"simplified"}]},{"featureType":"transit","elementType":"all","stylers":[{"hue":"#e9ebed"},{"saturation":10},{"lightness":69},{"visibility":"on"}]},{"featureType":"water","elementType":"all","stylers":[{"hue":"#e9ebed"},{"saturation":-78},{"lightness":67},{"visibility":"simplified"}]}];

            // JSON for the 'night' style of the map
            var darkStyle = [{featureType:"all",elementType:"labels",stylers:[{visibility:"on"}]},{featureType:"all",elementType:"labels.text.fill",stylers:[{saturation:36},{color:"#000000"},{lightness:40}]},{featureType:"all",elementType:"labels.text.stroke",stylers:[{visibility:"on"},{color:"#000000"},{lightness:16}]},{featureType:"all",elementType:"labels.icon",stylers:[{visibility:"off"}]},{featureType:"administrative",elementType:"geometry.fill",stylers:[{color:"#000000"},{lightness:20}]},{featureType:"administrative",elementType:"geometry.stroke",stylers:[{color:"#000000"},{lightness:17},{weight:1.2}]},{featureType:"administrative.country",elementType:"labels.text.fill",stylers:[{color:"#e5c163"}]},{featureType:"administrative.locality",elementType:"labels.text.fill",stylers:[{color:"#c4c4c4"}]},{featureType:"administrative.neighborhood",elementType:"labels.text.fill",stylers:[{color:"#e5c163"}]},{featureType:"landscape",elementType:"geometry",stylers:[{color:"#000000"},{lightness:20}]},{featureType:"poi",elementType:"geometry",stylers:[{color:"#000000"},{lightness:21},{visibility:"on"}]},{featureType:"poi.business",elementType:"geometry",stylers:[{visibility:"on"}]},{featureType:"road.highway",elementType:"geometry.fill",stylers:[{color:"#e5c163"},{lightness:"0"}]},{featureType:"road.highway",elementType:"geometry.stroke",stylers:[{visibility:"off"}]},{featureType:"road.highway",elementType:"labels.text.fill",stylers:[{color:"#ffffff"}]},{featureType:"road.highway",elementType:"labels.text.stroke",stylers:[{color:"#e5c163"}]},{featureType:"road.arterial",elementType:"geometry",stylers:[{color:"#000000"},{lightness:18}]},{featureType:"road.arterial",elementType:"geometry.fill",stylers:[{color:"#575757"}]},{featureType:"road.arterial",elementType:"labels.text.fill",stylers:[{color:"#ffffff"}]},{featureType:"road.arterial",elementType:"labels.text.stroke",stylers:[{color:"#2c2c2c"}]},{featureType:"road.local",elementType:"geometry",stylers:[{color:"#000000"},{lightness:16}]},{featureType:"road.local",elementType:"labels.text.fill",stylers:[{color:"#999999"}]},{featureType:"transit",elementType:"geometry",stylers:[{color:"#000000"},{lightness:19}]},{featureType:"water",elementType:"geometry",stylers:[{color:"#000000"},{lightness:17}]}];

            app.anchorInfowindowTimeout = '';

            // save the light and dark modes for switching
            app.lightMode = new google.maps.StyledMapType(lightStyle,
                {name: "Light Mode"});
            app.lightIcon = 'img/target_light.svg';
            app.darkMode = new google.maps.StyledMapType(darkStyle,
                {name: "Dark Mode"});
            app.darkIcon = 'img/target_dark.svg';

            // initialize Google Maps geocoder for reuse
            app.geocoder = new google.maps.Geocoder();

            // define the map options
            app.mapOptions = {
                center: {
                    lat: 41.90278349999999,
                    lng: 12.496365500000024
                },
                disableDefaultUI: true,
                mapTypeControlOptions: {
                    mapTypeIds: [
                    google.maps.MapTypeId.ROADMAP, 'map_style'
                ]}
            };

            // if browser has navigator geolocation
            if (navigator.geolocation) {
                // assign the current location
                navigator.geolocation.getCurrentPosition(function(position) {

                    // define coordinates object
                    var pos = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };

                    // binds the coordinates
                    app.viewModel.coordinates(pos);

                    // define the map options position
                    app.mapOptions.center = pos;

                    // map
                    app.map = new google.maps.Map(document.getElementById('mapDiv'), app.mapOptions);

                    google.maps.event.addListener(app.map, 'click', function() {
                        if (app.viewModel.loginExpanded()) {
                            app.viewModel.toggleLogin(false);
                        }
                    });

                    if (infoBoxLoaded) {
                        app.infoWindow = new InfoBox({
                            disableAutoPan: false,
                            pixelOffset: new google.maps.Size(-140, -24),
                            zIndex: null,
                            alignBottom: true,
                            boxStyle: {
                                background: 'white',
                                width: '280px',
                                'box-radius': '2px',
                                'box-shadow': '1px 2px 6px rgba(0, 0, 0, 0.3)',
                            },
                            closeBoxURL: '',
                            infoBoxClearance: new google.maps.Size(1, 1),
                            isHidden: false,
                            pane: 'floatPane',
                            enableEventPropagation: false
                        });

                        // animate infowindow opening
                        google.maps.event.addListener(app.infoWindow, 'domready', function(){
                            $('.infoBox').addClass('entering');
                            $('.infowindow-close-button').click(function() {
                                app.viewModel.toggleVenueExpand(app.viewModel.selected());
                            });
                        });
                    } else {
                        app.infoWindow = new google.maps.InfoWindow();
                    }

                    // listens for infowindow closing
                    google.maps.event.addListener(app.infoWindow, 'closeclick', function() {
                        $('.infoBox').toggleClass('entering leaving');
                        var selected = app.viewModel.selected();
                        app.viewModel.toggleVenueExpand(selected);
                    });

                    // resize and recenter map on window resize
                    google.maps.event.addDomListener(window, 'resize', function() {
                        var center = app.map.getCenter();
                        google.maps.event.trigger(app.map, 'resize');
                        app.map.setCenter(center);
                        if (app.mapBounds) {
                          app.map.fitBounds(app.mapBounds);
                        }
                    });

                    // define the time of day for the map style
                    app.viewModel.initializeTime();

                    // handles chromium bug
                    // if chrome geolocation does not work, please try
                    // again in a different tab or browser
                    if (pos.lat === pos.lng === 0) {
                        app.handleLocationError();
                    } else {
                        // enable the map using the geolocated coordinates
                        app.geoLocate(pos.lat, pos.lng);
                    }

                }, function() {
                    // handle the geolocation error
                    app.handleLocationError();
                }, {timeout: 7500});

            } else {
                // fallback in case browser doesn't support geolocation
                app.handleLocationError();
            }
            // initialize mapBounds
            app.mapBounds = new google.maps.LatLngBounds();
        }

        // load customizable infobox
        $.getScript('lib/infobox/infobox.js')
            .done(function() { loadMap(true); })
            .fail(function() { loadMap(false); })
        // load animated polyline plugins
        $.getScript('js/animation.js')
            .done(function() {
                $.getScript('js/filters.js')
                    .done(function() {
                        $.getScript('js/route.js')
                            .done(function() {
                                app.viewModel.animatedDirectionsAvailable(true);
                            });
                    })
            });
    };

    app.mapFallback = function() {
        app.viewModel.constructAlert({
            title: 'google maps error',
            details: 'There was an error loading the map. Please refresh the page and try again.'
        });
        app.viewModel.loading(false);
    };

    /**
     * Convert geolocated coordinates to a text location
     */
    app.geoLocate = function(lat, lng) {
        var latlng;
        app.viewModel.loading(true);
        // if coordinates have already been passed in, skip the geolocation
        if (typeof lat === 'number' && typeof lng === 'number') {
            latlng = new google.maps.LatLng(lat, lng);
            if (app.geocoder) {
                app.geocoder.geocode({'latLng': latlng}, function(results, status) {
                    if (status == google.maps.GeocoderStatus.OK) {
                        app.viewModel.getLocations(results);
                    } else {
                        app.viewModel.newAlert({
                            title: 'google maps error',
                            details: 'There was an issue while discovering the specified location. Please try again.'
                        });
                    }
                });
            } else {
                app.viewModel.newAlert({
                    title: 'google maps error',
                    details: 'There was an error with the map. Please refresh the page and try again.'
                });
            }
        } else {
            navigator.geolocation.getCurrentPosition(function(position) {
                latlng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
                if (app.geocoder) {
                    app.geocoder.geocode({'latLng': latlng}, function(results, status) {
                        if (status == google.maps.GeocoderStatus.OK) {
                            app.viewModel.poi(results[0].address_components[2].long_name);
                            app.viewModel.coordinates({
                                'lat': latlng.lat(),
                                'lng': latlng.lng()
                            });
                            app.viewModel.loading(true);
                            app.updateLatLng('', status);
                        } else {
                            app.viewModel.newAlert({
                                title: 'google maps error',
                                details: 'There was an issue while discovering the specified location. Please try again.'
                            });
                        }
                    });
                }  else {
                    app.viewModel.newAlert({
                        title: 'google maps error',
                        details: 'There was an error with the map. Please refresh the page and try again.'
                    });
                }
            }, app.viewModel.handleLocationError);
        }
    };

    /**
     * Handles geolocation error or absence
     */
    app.handleLocationError = function() {
        // use third-party geolocation api for approximate geolocation
        $.getJSON('https://freegeoip.net/json/')
            .done(function(result) {
                var pos = {
                    lat: result.latitude,
                    lng: result.longitude
                };

                app.viewModel.coordinates(pos);

                app.mapOptions.center = pos;

                app.map = new google.maps.Map(document.getElementById('mapDiv'), app.mapOptions);

                google.maps.event.addDomListener(window, 'resize', function() {
                    var center = app.map.getCenter();
                    google.maps.event.trigger(app.map, 'resize');
                    app.map.setCenter(center);
                });

                // define the time of day for the map style
                app.viewModel.initializeTime();

                app.geoLocate(pos.lat, pos.lng);

            }).fail(function(result) {
                // set default place to Rome
                app.viewModel.poi('Rome');
                // Rome hardcoded if all else fails
                app.viewModel.coordinates({
                    lat: 41.90278349999999,
                    lng: 12.496365500000024
                });

                app.mapOptions.pos = app.viewModel.coordinates();

                app.map = new google.maps.Map(document.getElementById('mapDiv'), app.mapOptions);

                app.viewModel.initializeTime();

                google.maps.event.addDomListener(window, 'resize', function() {
                    var center = app.map.getCenter();
                    google.maps.event.trigger(app.map, 'resize');
                    app.map.setCenter(center);
                });

                app.viewModel.newAlert({
                    title: 'geolocation failed',
                    details: 'All roads lead to Rome. But for a personalized experience please enable browser geolocation and try again, or attempt a new search.'
                });
                // default search
                app.viewModel.updateSearch();
            });
    };

    /**
     * Update current map coordinates
     */
    app.updateLatLng = function(results, status) {
        if (status == google.maps.places.PlacesServiceStatus.OK) {
            if (results) {
                // find coordinates of places service result
                var loc = results[0].geometry.location;
                // save the coordinates associated with new location
                app.viewModel.coordinates({
                    lat: loc.lat(),
                    lng: loc.lng()
                });
            }
        } else {
            app.viewModel.newAlert({
                title: 'google maps error',
                details: 'There was an issue while discovering the specified location. Please try again.'
            });
        }
        var lat = app.viewModel.coordinates().lat;
        var lng = app.viewModel.coordinates().lng;
        // hide markers
        app.viewModel.hideMarkersAndPaths();

        // define new map bounds
        app.mapBounds = new google.maps.LatLngBounds();

        // define new central anchor marker
        app.viewModel.anchorMarker(new google.maps.Marker({
            map: app.map,
            position: {
                "lat": lat,
                "lng": lng
            },
            icon: app.viewModel.currentMode() === 'dark' ? app.lightIcon : app.darkIcon,
            size: new google.maps.Size(5, 5),
            title: 'Showing locations near:',
            animation: google.maps.Animation.DROP
        }));

        google.maps.event.addListener(app.viewModel.anchorMarker(), 'click', (function(marker, infoWindow){
            return function() {
                if (app.anchorInfowindowTimeout) {
                    clearTimeout(app.anchorInfowindowTimeout);
                }
                if (app.viewModel.selected()) {
                    app.viewModel.toggleVenueExpand(app.viewModel.selected());
                }
                infoWindow.setContent('<div class="infowindow"><div class="infowindow-content"><h3 class="infowindow-title">' + app.viewModel.poi() + '</h3></div></div>');
                infoWindow.open(app.map, this);
                app.anchorInfowindowTimeout = setTimeout(function() {
                    app.viewModel.closeInfoWindow();
                }, 3000)
                app.map.panTo(marker.getPosition());
                app.map.panBy(0, -75);
                app.map.setZoom(12);
            };
        })(app.viewModel.anchorMarker(), app.infoWindow));
        // extend map bounds to include coordinates
        app.mapBounds.extend(new google.maps.LatLng(lat, lng));
        // get new venue data
        app.viewModel.getVenuesData();
    };
})();