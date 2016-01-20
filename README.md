# Neighborhood Map Project

#### Find popular venues near a specified location

**Search** for *various types* of *venues* across the world in this **interactive map**. You can find places **near you** or **any place** you specify. Browse a **dynamic list** of locations *ranked by popularity*. Each venue comes with **relevant information**, **images**, as well as a brief **review excerpt**. The app contains rudimentary **user profile** functionality, which allows a user to **create a profile** with a unique handle & **favorite locations**.

## Live Site:

Coming soon!

## Installation:

1. Download repository.
2. Navigate to the dist/ folder.
3. Open command line.
4. Host a simple server.
  * execute `python.exe -m SimpleHTTPServer 8000` (or on any port of your choice)
5. Open index.html and enjoy!

## In-app Instructions:

1. Enable geolocation for optimal targeted results.
2. Or enter a unique search:
  - specify a valid type of desired venue in the first text box
  - specify the geographical location in the second text box
3. Find targeted venues near you with the navigation arrow.
4. Or find specific searches with the magnifying glass.
5. Browse an expanded list of locations via the list icon.
6. Filter the venues with the search bar above the list.
7. Create a user profile or sign in before favoriting locations.
8. You may access the login form via the bottom left corner option.
9. Toggle the bonus day/night mode for map view in the bottom right.


## Features:

- Interactive Google Map
  - with a bonus day/night mode
- Dynamic filter/list & map markers
- Venue information: photos, rating and review
- User login and 'favorite' option
- Persisting user data
- Responsiveness & friendly UI

## 3rd Party APIs & Services used:

1. [Google Maps Javascript API v3](https://developers.google.com/maps/documentation/javascript/) - with the Places Library
  * Geolocation and map updates
2. [Free Geo IP](http://freegeoip.net/)
  * Fallback geolocation
3. [Foursquare API](https://developer.foursquare.com/)
  * Import Popular Venues and link to more Foursquare info
4. [Yelp API](https://www.yelp.com/developers/documentation/v2/overview)
  * Import a Yelp Review and link to more Yelp info
5. [Flickr API](https://www.flickr.com/services/api/)
  * Import a set of user-submitted public photos relevant to the venue
6. [Firebase](https://www.firebase.com)
  * Import user profile and add/remove favorites

## To Do Options:

- a live touch-based/scrolling response of venues
- expand user functionality (add verification)
- add weather updates
- add twitter updates

## Contact:

udayan.shevade@gmail.com