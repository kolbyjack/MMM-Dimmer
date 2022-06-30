# Module: MMM-Dimmer
Allows you to dim your magic mirror at night.

## Installation

In your terminal, go to your MagicMirror's Module folder:
````
cd ~/MagicMirror/modules
````

Clone this repository:
````
git clone https://github.com/kolbyjack/MMM-Dimmer.git
````

Configure the module in your `config.js` file.

## Using the module

To use this module, add it to the modules array in the `config/config.js` file:
````javascript
modules: [
  {
    module: "MMM-Dimmer",
    position: "fullscreen_above",
    config: { // See "Configuration options" for more information.
      longitude: -81.5812,
      latitude: 28.419411,
      maxDim: 0.9,
      transitionDuration: 15 * 60 * 1000,
    }
  }
]
````

## Configuration options

The following properties can be configured:

|Option|Default|Description|
|---|---|---|
|`longitude`<br/>`latitude`|Cinderella's Castle at WDW|The coordinates to use when calculating sunrise and sunset times.|
|`maxDim`|`0.9`|How much to lower the opacity of the screen when fully dimmed (higher is dimmer, 1.0 will turn the screen completely black).|
|`transitionDuration`|`15 * 60 * 1000`|How long to take (in ms) to gradually dim the screen after sunset, and how long before sunrise to start brightening the screen.|
|`sunriseTransitionDuration`|`transitionDuration`|How long before sunrise (in ms) to start gradually brightening the screen.|
|`sunriseTransitionOffset`|`0`|How much (in ms) to offset the calculated sunrise time. Positive values will start brightening the screen earlier.|
|`sunriseTransitionDuration`|`transitionDuration`|How long to take (in ms) to gradually dim the screen after sunset.|
|`sunsetTransitionOffset`|`0`|How much (in ms) to offset the calculated sunset time. Positive values will start dimming the screen later.|

There are also additional settings for debugging:

|Option|Default|Description|
|---|---|---|
|`debugTiming`|`false`|Whether to enable debug mode for timing issues.|
|`debugTimeScale`|`720`|How to scale the passage of time during debugging.  720 = one day every two minutes.|
|`debugTimeOffset`|`0`|How much to offset the current time at module startup.|
