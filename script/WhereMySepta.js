var WhereMySepta = function(availableRoutes) {
  this.DEFAULT_LAT = 39.952637;
  this.DEFAULT_LONG = -75.163565;
  this.DEFAULT_ZOOM = 13;
  this.SEPTA_LOCATION_URL_BASE = 'http://www3.septa.org/hackathon/TransitView/?route=';
  this.SEPTA_URL_TAIL = '&callback=?';
  this.IMAGE_BASE = 'res/img/';

  this.availableRoutes = availableRoutes;
  this.addedRoutes = {};
  window['scriptCounter'] = 0;

  this.routeSelect = document.getElementById('routeSelect');
  this.routeListDiv = document.getElementById('routeList');
  this.addRouteButton = document.getElementById('addRouteButton');
  this.addRouteButton.addEventListener('click', this.addSelectedRoute.bind(this));
  this.recenterButton = document.getElementById('recenterButton');
  this.recenterButton.addEventListener('click', this.recenterMap.bind(this));

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
  var route = this.routeSelect.value;
  if (route != '' && !(route in this.addedRoutes)) {
    // Add overlay for route
    var overlay = new google.maps.KmlLayer({
      url: 'http://www3.septa.org/transitview/kml/' + route + '.kml'
    });
    overlay.setMap(this.map);
    // Add route to list
    var newRouteDiv = document.createElement('div');
    newRouteDiv.className = 'routeListItem';
    newRouteDiv.id = route;
    var newRouteTextDiv = document.createElement('div');
    var newRouteText = document.createTextNode(route);
    newRouteTextDiv.style.float = 'left';
    newRouteTextDiv.appendChild(newRouteText);
    newRouteDiv.appendChild(newRouteTextDiv);
    var removeLinkDiv = document.createElement('div');
    var removeLink = document.createTextNode('remove');
    removeLinkDiv.id = route;
    removeLinkDiv.className = 'removeLink';
    removeLinkDiv.appendChild(removeLink);
    removeLinkDiv.addEventListener('click', this.removeLinkClick.bind(this));
    newRouteDiv.appendChild(removeLinkDiv);
    this.routeListDiv.appendChild(newRouteDiv);
    this.addedRoutes[route] = new SeptaRoute(newRouteDiv, newRouteTextDiv, overlay);
    this.routeSelect.options[0].selected = true;

  }
};

WhereMySepta.prototype.removeLinkClick = function(event) {
  var route = event.target.id;
  // Remove vehicle markers
  for (index in this.routeListDiv.childNodes) {
    if (this.routeListDiv.childNodes[index].id == route) {
      this.routeListDiv.removeChild(this.routeListDiv.childNodes[index]);
    }
  }
  //Remove route overlay
  this.addedRoutes[route].kml.setMap(null);
  this.addedRoutes[route].removeMarkers();
  delete this.addedRoutes[route];
}

WhereMySepta.prototype.updateRoutes = function() {
  for (var route in this.addedRoutes) {
    this.getJSONP(this.SEPTA_LOCATION_URL_BASE + route + this.SEPTA_URL_TAIL,
        this.getRoutesCallback.bind(this, route));
  }
};

WhereMySepta.prototype.getRoutesCallback = function(route, locations) {
  this.addedRoutes[route].removeMarkers();
  for (transType in locations) {
    if (locations[transType].length == 0) {
      this.addedRoutes[route].setText(route + '*')
    } else {
      this.addedRoutes[route].setText(route)
      for (index in locations[transType]) {
        var loc = locations[transType][index];
        var iconName = loc.Direction;
        if (iconName == ' ') {
          iconName = 'undefined';
        }
        var latlng = new google.maps.LatLng(loc.lat, loc.lng);
        var marker = new google.maps.Marker({
          position: latlng,
          map: this.map,
          title: route + ' ' + loc.Direction + ' to ' + loc.destination,
          icon: this.IMAGE_BASE + iconName + '.gif'
        });
        this.addedRoutes[route].addMarker(marker);
      }
    }
  }
};

WhereMySepta.prototype.recenterMap = function() {
  this.map.panTo(new google.maps.LatLng(this.DEFAULT_LAT, this.DEFAULT_LONG));
  this.map.setZoom(this.DEFAULT_ZOOM);
}

/* 
 * This is unapologetically stolen from James via 
 * http://stackoverflow.com/questions/2499567/how-to-make-a-json-call-to-a-url
 */
WhereMySepta.prototype.getJSONP = function(url, success) {
  var ud = '_' + +new Date,
      script = document.createElement('script'),
      head = document.getElementsByTagName('head')[0]  ||
          document.documentElement;

  window.console.log('ud = ' + ud);

  window[ud] = function(data) {
      if (script.parentNode == head) {
        head.removeChild(script);
      }
      success && success(data);
  };

  script.src = url.replace('callback=?', 'callback=' + ud);
  head.appendChild(script);
};