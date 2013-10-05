var SeptaRoute = function(textDiv, kml) {
  this.textDiv = textDiv;
  this.kml = kml;
  this.markers = [];
}

SeptaRoute.prototype.addMarker = function(marker) {
  this.markers.push(marker);
}

SeptaRoute.prototype.removeMarkers = function(marker) {
  for (var index in this.markers) {
    this.markers[index].setMap(null);
    delete this.markers[index];
  }
}