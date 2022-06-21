// MMM-Dimmer.js

function MOD(a, b) { return a % b; }
function RADIANS(degrees) { return degrees * Math.PI / 180; }
function DEGREES(radians) { return radians * 180 / Math.PI; }
function SIN(radians) { return Math.sin(radians); }
function ASIN(sin) { return Math.asin(sin); }
function COS(radians) { return Math.cos(radians); }
function ACOS(cos) { return Math.acos(cos); }
function TAN(radians) { return Math.tan(radians); }
function ATAN(tan) { return Math.atan(tan); }
function ATAN2(x, y) { return Math.atan2(y, x); }

function setSunTime(date, time) {
  var result = new Date(date.getTime());
  var h = time * 24;
  var m = (h % 1) * 60;
  var s = (m % 1) * 60;

  result.setUTCHours(Math.floor(h), Math.floor(m), Math.floor(s), 0);

  return result;
}

function getSunTimes(date, latitude, longitude) {
  // From https://www.esrl.noaa.gov/gmd/grad/solcalc/calcdetails.html
  // TODO: Handle cases where the sun never rises or never sets
  var B3 = latitude;
  var B4 = longitude;
  var B5 = 0; // UTC
  var F2 = date.getTime() / 86400000 + 2440587.5;
  var G2 = (F2 - 2451545) / 36525;
  var I2 = MOD(280.46646 + G2 * (36000.76983 + G2 * 0.0003032), 360);
  var J2 = 357.52911 + G2 * (35999.05029 - 0.0001537 * G2);
  var K2 = 0.016708634 - G2 * (0.000042037 + 0.0000001267 * G2);
  var L2 = SIN(RADIANS(J2)) * (1.914602 - G2 * (0.004817 + 0.000014 * G2)) + SIN(RADIANS(2 * J2)) * (0.019993 - 0.000101 * G2) + SIN(RADIANS(3 * J2)) * 0.000289;
  var M2 = I2 + L2;
  var N2 = J2 + L2;
  var O2 = (1.000001018 * (1 - K2 * K2)) / (1 + K2 * COS(RADIANS(N2)));
  var P2 = M2 - 0.00569 - 0.00478 * SIN(RADIANS(125.04 - 1934.136 * G2));
  var Q2 = 23 + (26 + ((21.448 - G2 * (46.815 + G2 * (0.00059 - G2 * 0.001813)))) / 60) / 60;
  var R2 = Q2 + 0.00256 * COS(RADIANS(125.04 - 1934.136 * G2));
  var S2 = DEGREES(ATAN2(COS(RADIANS(P2)), COS(RADIANS(R2)) * SIN(RADIANS(P2))));
  var T2 = DEGREES(ASIN(SIN(RADIANS(R2)) * SIN(RADIANS(P2))));
  var U2 = TAN(RADIANS(R2 / 2)) * TAN(RADIANS(R2 / 2));
  var V2 = 4 * DEGREES(U2 * SIN(2 * RADIANS(I2)) - 2 * K2 * SIN(RADIANS(J2)) + 4 * K2 * U2 * SIN(RADIANS(J2)) * COS(2 * RADIANS(I2)) - 0.5 * U2 * U2 * SIN(4 * RADIANS(I2)) - 1.25 * K2 * K2 * SIN(2 * RADIANS(J2)));
  var W2 = DEGREES(ACOS(COS(RADIANS(90.833)) / (COS(RADIANS(B3)) * COS(RADIANS(T2))) - TAN(RADIANS(B3)) * TAN(RADIANS(T2))));
  var X2 = (720 - 4 * B4 - V2 + B5 * 60) / 1440;
  var Y2 = X2 - W2 * 4 / 1440;
  var Z2 = X2 + W2 * 4 / 1440;

  var sunrise = setSunTime(date, Y2);
  var sunset = setSunTime(date, Z2);

  return {
    "sunrise": sunrise,
    "sunset": sunset
  }
}

Module.register("MMM-Dimmer", {
  // Default module config
  defaults: {
    longitude: -81.5812,
    latitude: 28.419411,
    maxDim: 0.9,
    transitionDuration: 15 * 60 * 1000,
    sunriseTransitionOffset: 0,
    sunsetTransitionOffset: 0,
  },

  start: function() {
    var self = this;

    self.debugTiming = false;
    self.debugTime = new Date();
    self.debugTimeScale = 100;
    self.debugTimeOffset = 17 * 60 * 60 * 1000;

    self.times = getSunTimes(new Date(), self.config.latitude, self.config.longitude);

    const state = self.getCurrentState();
    self.overlay = self.createOverlay(state.opacity);
    setTimeout(() => self.updateOverlay(), state.nextUpdate);
  },

  notificationReceived: function(notification, payload, sender) {
    // Do nothing
  },

  socketNotificationReceived: function(notification, payload) {
    // Do nothing
  },

  getCurrentState: function() {
    var self = this;
    var now = new Date();
    var opacity = self.config.maxDim;
    var sunrise = self.times.sunrise.getTime() - self.config.sunriseTransitionOffset;
    var startToBrighten = sunrise - (self.config.sunriseTransitionDuration || self.config.transitionDuration);
    var sunset = self.times.sunset.getTime() + self.config.sunsetTransitionOffset;
    var finishDimming = sunset + (self.config.sunsetTransitionDuration || self.config.transitionDuration);
    var nextUpdate;

    if (self.debugTiming) {
      now.setTime(self.debugTime.getTime() + self.debugTimeOffset + (now.getTime() - self.debugTime.getTime()) * self.debugTimeScale);
    }

    if (now.getTime() < startToBrighten) {
      // Night
      nextUpdate = startToBrighten - now.getTime();
    } else if (now.getTime() < sunrise) {
      // Pre-dawn
      nextUpdate = sunrise - now.getTime();
      opacity = 0;
    } else if (now.getTime() < sunset) {
      // Sunrise
      self.sendNotification("SUNRISE", { "time": sunrise });
      nextUpdate = sunset - now.getTime();
      opacity = 0;
    } else if (now.getTime() < finishDimming) {
      // Sunset
      self.sendNotification("SUNSET", { "time": sunset });
      nextUpdate = finishDimming - now.getTime();
    } else {
      // Twilight
      var tomorrow = new Date(now.getTime());

      do {
        self.times = getSunTimes(tomorrow, self.config.latitude, self.config.longitude);
        console.log(`tomorrow=${tomorrow}; now=${now}; sunrise=${self.times.sunrise}`);
        tomorrow.setDate(tomorrow.getDate() + 1);
      } while (now > self.times.sunrise);

      sunrise = self.times.sunrise.getTime() - self.config.sunriseTransitionOffset;
      startToBrighten = sunrise - self.config.transitionDuration;
      nextUpdate = startToBrighten - now.getTime();
    }

    if (self.debugTiming) {
      nextUpdate /= self.debugTimeScale;
    }

    if (self.debugTiming) {
      function z(n) { return (n < 10) ? `0${n}` : n; }
      function fd(d) { if (!(d instanceof Date)) { d = new Date(d); } return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())} ${z(d.getHours())}:${z(d.getMinutes())}:${z(d.getSeconds())}`; }
      console.log(`now=${fd(now)}; opacity=${opacity}; sunrise=${fd(sunrise)}; sunset=${fd(sunset)}; nextUpdate=${fd(now.getTime() + nextUpdate)}`);
    }

    return {
      opacity: opacity,
      nextUpdate: nextUpdate,
    };
  },

  createOverlay: function(opacity) {
    const overlay = document.createElement("div");

    overlay.style.background = "#000";
    overlay.style.position = "fixed";
    overlay.style.top = "0px";
    overlay.style.left = "0px";
    overlay.style.right = "0px";
    overlay.style.bottom = "0px";
    overlay.style.zIndex = 9999;
    overlay.style.transitionTimingFunction = "linear";
    overlay.style.opacity = opacity;

    return overlay;
  },

  updateOverlay: function() {
    var self = this;
    const state = self.getCurrentState();

    self.overlay.style.transitionDuration = `${state.nextUpdate}ms`;
    self.overlay.style.opacity = state.opacity;

    setTimeout(() => self.updateOverlay(), state.nextUpdate);
  },

  getDom: function() {
    return this.overlay;
  },
});
