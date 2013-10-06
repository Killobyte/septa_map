var WhereMySepta = function(availableRoutes) {
  this.DEFAULT_LAT = 39.952637;
  this.DEFAULT_LONG = -75.163565;
  this.DEFAULT_ZOOM = 13;
  this.SEPTA_LOCATION_URL_BASE = 'http://www3.septa.org/hackathon/TransitView/?route=';
  this.SEPTA_LOCATION_URL_TAIL = '&callback=?';

  this.availableRoutes = availableRoutes;
  this.addedRoutes = {};
  //this.locationForVehicle = {};

  this.routeSelect = document.getElementById('routeSelect');
  this.routeListDiv = document.getElementById('routeList');
  this.addRouteButton = document.getElementById('addRouteButton');
  this.addRouteButton.addEventListener('click', this.addSelectedRoute.bind(this));

  var mapOptions = {
      center: new google.maps.LatLng(this.DEFAULT_LAT, this.DEFAULT_LONG),
      zoom: this.DEFAULT_ZOOM,
      mapTypeId: google.maps.MapTypeId.ROADMAP
  };
  this.map = new google.maps.Map(document.getElementById("map-canvas"), mapOptions);

  this.setUpUI();
  setInterval(this.updateRoutes.bind(this), 5000);
};

WhereMySepta.prototype.setUpUI = function() {
  for (var index in this.availableRoutes) {
    var option = document.createElement('option');
    option.text = this.availableRoutes[index];
    option.value = option.text;
    this.routeSelect.options.add(option);
  }
};

WhereMySepta.prototype.addSelectedRoute = function() {
  if (this.routeSelect.value != '') {
    var overlay = new google.maps.KmlLayer({
      url: 'http://www3.septa.org/transitview/kml/' + this.routeSelect.value + '.kml'
    });
    overlay.setMap(this.map);
    var newRouteDiv = document.createElement('div');
    newRouteDiv.className = 'routeListItem';
    newRouteDiv.id = this.routeSelect.value;
    var newRouteTextDiv = document.createElement('div');
    var newRouteText = document.createTextNode(this.routeSelect.value);
    newRouteTextDiv.style.float = 'left';
    newRouteTextDiv.appendChild(newRouteText);
    newRouteDiv.appendChild(newRouteTextDiv);
    var removeLinkDiv = document.createElement('div');
    var removeLink = document.createTextNode('remove');
    removeLinkDiv.id = this.routeSelect.value;
    removeLinkDiv.className = 'removeLink';
    removeLinkDiv.appendChild(removeLink);
    removeLinkDiv.addEventListener('click', this.removeLinkClick.bind(this));
    newRouteDiv.appendChild(removeLinkDiv);
    this.routeListDiv.appendChild(newRouteDiv);
    this.addedRoutes[this.routeSelect.value] = new SeptaRoute(newRouteDiv, newRouteTextDiv, overlay);
    this.routeSelect.options[0].selected = true;
  }
};

WhereMySepta.prototype.removeLinkClick = function(event) {
  var route = event.target.id;
  for (index in this.routeListDiv.childNodes) {
    if (this.routeListDiv.childNodes[index].id == route) {
      this.routeListDiv.removeChild(this.routeListDiv.childNodes[index]);
    }
  }
  this.addedRoutes[route].kml.setMap(null);
  this.addedRoutes[route].removeMarkers();
  delete this.addedRoutes[route];
}

WhereMySepta.prototype.updateRoutes = function() {
  for (var route in this.addedRoutes) {
    this.addedRoutes[route].removeMarkers();
    this.getJSONP(this.SEPTA_LOCATION_URL_BASE + route + this.SEPTA_LOCATION_URL_TAIL,
        this.getRoutesCallback.bind(this, route));
  }
};

WhereMySepta.prototype.getRoutesCallback = function(route, locations) {
  for (transType in locations) {
    if (locations[transType].length == 0) {
      this.addedRoutes[route].setText(route + '*')
    } else {
      this.addedRoutes[route].setText(route)
      var lastLat;
      for (index in locations[transType]) {
        var loc = locations[transType][index];
        var latlng = new google.maps.LatLng(loc.lat, loc.lng);
        var marker = new google.maps.Marker({
          position: latlng,
          map: this.map,
          title: route + ' ' + loc.Direction + ' to ' + loc.destination,
          icon: 'septa_icon.png'
        });
        this.addedRoutes[route].addMarker(marker);
        lastLat = loc.lat;
        /*if (this.locationForVehicle[loc['VehicleID']] != loc.lat) {
          var now = new Date();
          console.log('Lat for vehicle ' + loc['VehicleID'] + ' updated from ' + 
              this.locationForVehicle[loc['VehicleID']] + ' to ' + loc.lat + 
              ' at ' + now.getHours() + ':' + now.getMinutes() + ':' + now.getSeconds());
        }
        this.locationForVehicle[loc['VehicleID']] = loc.lat;*/
      }
    }
  }
};

/* 
 * This is unapologetically stolen from James via 
 * http://stackoverflow.com/questions/2499567/how-to-make-a-json-call-to-a-url
 */
WhereMySepta.prototype.getJSONP = function(url, success) {
  var ud = '_' + +new Date,
      script = document.createElement('script'),
      head = document.getElementsByTagName('head')[0]  ||
          document.documentElement;

  window[ud] = function(data) {
      head.removeChild(script);
      success && success(data);
  };

  script.src = url.replace('callback=?', 'callback=' + ud);
  head.appendChild(script);
};