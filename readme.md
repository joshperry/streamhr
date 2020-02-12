# BLE Heartrate Visualizer

This is a small project that will connect to a bluetooth low energy (BLE) heartrate monitor and allow visualization of the data.

The main purpose of this project is to use a Browser source in [OBS Studio](https://obsproject.com/) (or other similar software) in order to allow display of realtime heartrate on a stream.

A version of [node.js](https://nodejs.org) must be installed that supports experimental modules (dev'd on 13.8).
[noble](https://www.npmjs.com/package/noble) is used for handling communication with the BLE devices, be sure your BT adapter is configured properly.

To view the visualization, run `node index.js`, and then connect to http://localhost:8080 with your browser.
The code in the browser connects via a websocket to the server and streams the data in realtime.

The current visualization shows a graph of the heartrate for the last 60 samples using the well documented [plotly.js](https://plot.ly/javascript/) graphing library.
The visualization can be changed by modifying the client source files in the `public` directory.

Multiple simultaneous connections are supported, but the server defaults to only listen for connections on the local computer.
