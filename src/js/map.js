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
                        app.viewModel.toggleLogin(false);
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
                        app.viewModel.handleLocationError();
                    } else {
                        // enable the map using the geolocated coordinates
                        app.viewModel.geoLocate(pos.lat, pos.lng);
                    }

                }, function() {
                    // handle the geolocation error
                    app.viewModel.handleLocationError();
                }, {timeout: 7500});

            } else {
                // fallback in case browser doesn't support geolocation
                app.viewModel.handleLocationError();
            }
            // initialize mapBounds
            app.mapBounds = new google.maps.LatLngBounds();
        }

        $.getScript('lib/infobox/infobox.js').done(function() {
            loadMap(true);
        }).fail(function() {
            loadMap(false);
        });
    };

    app.mapFallback = function() {
        app.viewModel.constructAlert({
            title: 'google maps error',
            details: 'There was an error loading the map. Please refresh the page and try again.'
        });
        app.viewModel.loading(false);
    };
})();