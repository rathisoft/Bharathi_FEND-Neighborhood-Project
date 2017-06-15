var startApp = function() // callback function - being called by index.html
    {
        "use strict";

        // --------- MODEL ---------------

        var markersModel = [

            {
                id: "18224667",
                title: "Pindi",
                category: "restaurant", // category for search field
                address: "15, 13th Cross, 9th Main, Sector 6, HSR, Bangalore", // street address for use by Google Maps geocoder
                status: ko.observable("OK"), // change status if error message received
                marker: new google.maps.Marker({ // google maps marker object
                    position: new google.maps.LatLng(0, 0), // set initial position to (0,0)
                    icon: "img/pins/restaurant.png" // category icon for map pin
                })
            }, {
                id: "18305643",
                title: "Sector 7 Café",
                category: "cafe",
                address: "1136, Above Andhra Bank, 17th Cross Road, Muneswara Nagar, Sector 7, HSR, Bangalore",
                status: ko.observable("OK"),
                marker: new google.maps.Marker({
                    position: new google.maps.LatLng(0, 0),
                    icon: "img/pins/coffee.png"
                })
            },

            {
                id: "53782",
                title: "Mismash",
                category: "restaurant",
                address: "2321, 17th Cross, 27th Main, 1st Sector, HSR, Bangalore",
                status: ko.observable("OK"),
                marker: new google.maps.Marker({
                    position: new google.maps.LatLng(0, 0),
                    icon: "img/pins/restaurant.png"
                })
            }, {
                id: "51015",
                title: "The Punjabi Rasoi",
                category: "restaurant",
                address: "1082, 18th Cross, 3rd Sector, HSR, Bangalore",
                status: ko.observable("OK"),
                marker: new google.maps.Marker({
                    position: new google.maps.LatLng(0, 0),
                    icon: "img/pins/restaurant.png"
                })
            }, {
                id: "57099",
                title: "Empire Restaurant",
                category: "restaurant",
                address: "169/A/170, Opposite Shoba Super Market, Sector 6, HSR Layout, HSR, Bangalore",
                status: ko.observable("OK"),
                marker: new google.maps.Marker({
                    position: new google.maps.LatLng(0, 0),
                    icon: "img/pins/restaurant.png"
                })
            }

        ];
        // ---------------------------------- VIEWMODEL ------------------------------
        var zomatoApiKey = "817d8ffc0ff9124b1ce07c06be6f2a17";
        var resultMarkers = function(members) {
            var self = this;

            self.mapOptions = {
                center: new google.maps.LatLng(12.9138, 77.6373), //set map center in HSR Layout BDA Complex
                zoom: 13
            };

            var mapCont = document.getElementsByClassName('map-container');

            self.map = new google.maps.Map(mapCont[0], self.mapOptions);

            self.infowindow = new google.maps.InfoWindow({
                maxWidth: 250
            });

            self.searchReq = ko.observable(''); //user input to Search box

            // Filtered version of data model, based on Search input
            self.filteredMarkers = ko.computed(function() {
                //Remove all markers from map
                var membersLen = members.length;
                for (var i = 0; i < membersLen; i++) {
                    members[i].marker.setMap(null);
                    clearTimeout(members[i].timer);
                }
                //Place only the markers that match search request
                var arrayResults = [];
                arrayResults = $.grep(members, function(a) {
                    var titleSearch = a.title.toLowerCase().indexOf(self.searchReq().toLowerCase());
                    var catSearch = a.category.toLowerCase().indexOf(self.searchReq().toLowerCase());
                    return ((titleSearch > -1 || catSearch > -1) && a.status() === 'OK');
                });
                //Iterate thru results, set animation timeout for each
                var arrayLen = arrayResults.length;
                 //var myFunction = function(){};
                 //console.log('myFunction created ...');
                for (var j = 0; j < arrayLen; j++) {
                    arrayResults[j].marker.setMap(self.map);
                }
                //Return list of locations that match search request, for button list
                return arrayResults;
            });

            //Use address in model to find LatLng
            self.setPosition = function(location) {
                var geocoder = new google.maps.Geocoder();
                //using address to find LatLng with geocoder
                geocoder.geocode({
                    'address': location.address
                }, function(results, status) {
                    if (status === 'OK') {
                        location.marker.position = results[0].geometry.location;
                        /*          Commentting out Debug code
                        console.log('location.marker.position: ', location.marker.position, 'for Location:', location.title);
                        console.log('location.address: ', location.address, 'for Location:', location.title);
                        */
                        location.marker.setAnimation(google.maps.Animation.DROP);
                        //console.log('Status code: ', status, 'for Location:', location.title);
                    } else if (status === 'OVER_QUERY_LIMIT') {
                        // If status is OVER_QUERY_LIMIT, then wait and re-request
                        //console.log("in over limit");
                        setTimeout(function() {
                            geocoder.geocode({
                                'address': location.address
                            }, function(results, status) {
                                location.marker.position = results[0].geometry.location;
                                location.marker.setAnimation(google.maps.Animation.DROP);
                            });
                        }, 2000);
                        //console.log('Over limit Status code2: ', status, 'for Location:', location.title);
                    } else {
                        //If status is any other error code, then set status to Error, which will remove it from list and map
                        location.status('ERROR');
                        //Log error information to console
                        //console.log('Grrr!! Error code: ', status, 'for Location:', location.title);
                    }
                });
            };

            //Adds infowindows to each marker and populates them with Zomato API request data
            self.setBubble = function(index) {
                //console.log('Index data:', index);
                //Add event listener to each map marker to trigger the corresponding infowindow on click
                var zomatoMember = members[index];
                //console.log('Zomatoa Index data:', zomatoMember);
                google.maps.event.addListener(zomatoMember.marker, 'click', function() {
                    //Adding animation - when clicked on marker
                    if (zomatoMember.marker.getAnimation() !== null) {
                        zomatoMember.marker.setAnimation(null);
                    } else {
                        zomatoMember.marker.setAnimation(google.maps.Animation.BOUNCE);
                        setTimeout(function() {
                            zomatoMember.marker.setAnimation(null);
                        }, 1400); //Two bounces i.e 700*2
                    }

                    //console.log('Member Index before Zomato URL:', zomatoMember);
                    var zomatoURL = 'https://developers.zomato.com/api/v2.1/restaurant?res_id=' + zomatoMember.id + '&apikey=' + zomatoApiKey;
                    //console.log('Zomato URL data:', zomatoURL);
                    //console.log('zomatoMember.id before JSON:', zomatoMember.id);
                    $.getJSON(zomatoURL).done(function(data) {
                        /*          Commentting out Debug code
                                        console.log('zomatoMember.id iside JSON:', zomatoMember.id);
                                        console.log('Member Index after Zomato URL:', zomatoMember);
                                        console.log('Member Title after Zomato URL:', zomatoMember.title);
                                        console.log('Data info after Zomato URL:', data);
                                        console.log('data.restaurant.id :', data.id);
                                        console.log('Member Data Index after Zomato URL:', data.name);
                        */
                        var contentString = "<div id='zomatoWindow'>" +
                            "<p> <strong>" + data.name + "</strong> </p>" +
                            "<p>" + data.location.address + "</p>" +
                            "<p> <strong> Zomato Rating: </strong>" + data.user_rating.aggregate_rating + "<strong> Feel factor: </strong>" + data.user_rating.rating_text + "</p>" +
                            "<img src='" + data.thumb + "' alt = 'Image not loaded' style='width:50%'>" +
                            "<p> <a href='" + data.menu_url + "'>" + "Menu </a>|<a href='" + data.url + "'>" + "Read more...</a>" + "</p>";
                        /*          Commentting out Debug code
                                        console.log('restaurant name in content window :', data.name);
                                        console.log('restaurant rating in content window :', data.user_rating.aggregate_rating);
                                        console.log('restaurant url in content window :', data.url);
                                        console.log('restaurant order url in content window :', data.menu_url);
                        */
                        "</div>";
                        self.infowindow.setContent(contentString);
                    });

                    self.infowindow.open(self.map, zomatoMember.marker);
                    //console.log('Infowindow open - Member Index  for Location:', zomatoMember);
                });
            };

            //Iterate through data model, get LatLng location then set up infowindow
            self.initialize = function() {
                for (var current in members) {
                    self.setPosition(members[current]);
                    self.setBubble(current);
                }
            };

            //Toggle bounce animation for map marker on click of Location list button (via data-binding)

            self.toggleBounce = function(currentMarker) {
                google.maps.event.trigger(currentMarker.marker, 'click');
                self.map.setCenter(currentMarker.marker.position); //center map on bouncing marker
                currentMarker.marker.setAnimation(google.maps.Animation.BOUNCE);
                setTimeout(function() {
                currentMarker.marker.setAnimation(null);
                    }, 1400); ////Two bounces i.e 700*2
            };


        };

        var myMarkers = new resultMarkers(markersModel);
        ko.applyBindings(myMarkers);
        google.maps.event.addDomListener(window, 'load', myMarkers.initialize);
    };

      function errorHandling() {
            alert("Google Maps has failed to load. Please check your internet connection and try again.");
        }