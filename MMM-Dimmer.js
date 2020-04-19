// MMM-Dimmer.js

function daysIntoYear() {
  var date = new Date();
  var nowUTC = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  var yearStartUTC = Date.UTC(date.getFullYear(), 0, 0);

  return (nowUTC - yearStartUTC) / 24 / 60 / 60 / 1000;
}

function deg2rad(degrees) {
  return degrees * Math.PI / 180;
}

function rad2deg(radians) {
  return radians * 180 / Math.PI;
}

function normalize(degrees) {
  return (degrees + 1080) % 360;
}

function sindeg(degrees) {
  return Math.sin(deg2rad(degrees));
}

function asindeg(sin) {
  return rad2deg(Math.asin(sin));
}

function cosdeg(degrees) {
  return Math.cos(deg2rad(degrees));
}

function acosdeg(cos) {
  return rad2deg(Math.acos(cos));
}

function tandeg(degrees) {
  return Math.tan(deg2rad(degrees));
}

function atandeg(tan) {
  return rad2deg(Math.atan(tan));
}

Module.register("MMM-Dimmer", {
  // Default module config
  defaults: {
    longitude: -81.5812,
    latitude: 28.419411,
    maxDim: 0.9,
    minutesToFullyDim: 15,
  },

  start: function() {
    var self = this;

    var sunrise = self.getSunTime("sunrise");
    var sunset = self.getSunTime("sunset");
    console.log(`day length=${sunset - sunrise}`);

    //setInterval(function() { self.getData(); }, self.config.updateInterval);
  },

  notificationReceived: function(notification, payload, sender) {
    // Do nothing
  },

  socketNotificationReceived: function(notification, payload) {
    // Do nothing
  },

  getSunTime: function(which) {
    // From https://www.edwilliams.org/sunrise_sunset_algorithm.htm
    var zeniths = {
      "official": 90 + 50 / 60,
      "civil": 96,
      "nautical": 102,
      "astronomical": 108,
    };
    var zenith = zeniths[this.config.zenithType] || zeniths["official"];
    var latitude = this.config.latitude;
    var N = daysIntoYear();
    var lngHour = this.config.longitude / 15;
    var t = N + ((which === "sunrise" ? 6 : 18) - lngHour) / 24;
    var M = (0.9856 * t) - 3.289;
    var L = normalize(M + (1.916 * sindeg(M)) + (0.020 * sindeg(2 * M)) + 282.634);
    var RA = normalize(atandeg(0.91764 * tandeg(L)));
    var Lquadrant = Math.floor(L / 90) * 90;
    var RAquadrant = Math.floor(RA / 90) * 90;
    RA = (RA + Lquadrant - RAquadrant) / 15;
    var sinDec = 0.39782 * sindeg(L);
    var cosDec = cosdeg(asindeg(sinDec));
    var cosH = (cosdeg(zenith) - (sinDec * sindeg(latitude))) / (cosDec * cosdeg(latitude));
    var H = acosdeg(cosH);
    if (which === "sunrise") {
      if (cosH > 1) {
        return NaN;
      }
      H = 360 - H;
    } else {
      if (cosH < -1) {
        return NaN;
      }
    }
    H /= 15;
    var T = H + RA - (0.06571 * t) - 6.622;
    var UT = (T + 48 + 1) % 24;

    //*
    console.log("=============================================================");
    console.log(`Calculating ${which}`);
    console.log(`zenith=${zenith}`);
    console.log(`latitude=${latitude}`);
    console.log(`N=${N}`);
    console.log(`t=${t}`);
    console.log(`M=${M}`);
    console.log(`L=${L}`);
    console.log(`RA=${RA}`);
    console.log(`Lquadrant=${Lquadrant}`);
    console.log(`RAquadrant=${RAquadrant}`);
    console.log(`sinDec=${sinDec}`);
    console.log(`cosDec=${cosDec}`);
    console.log(`cosH=${cosH}`);
    console.log(`H=${H}`);
    console.log(`T=${T}`);
    console.log("=============================================================");
    // */
    console.log(`${which}=${Math.floor(UT)}:${Math.floor((UT - Math.floor(UT)) * 60)}`);

    return UT;
  },

  getDom: function() {
    var self = this;
    var wrapper = document.createElement("div");

		// Create overlay
		//var overlay = document.createElement("div");
		//overlay.id = "overlay";
		//overlay.innerHTML += "<div class=\"black_overlay\"></div>";
		//document.body.insertBefore(overlay, document.body.firstChild);

    return wrapper;
  },
});
