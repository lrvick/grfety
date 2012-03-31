#!/usr/bin/node

var http = require('http');
var fs = require('fs');
var sockjs = require('sockjs');
var node_static = require('node-static');
var Canvas = require('canvas')
//var grfety = require('./grfety.js')

var static_dir = new node_static.Server(__dirname);

var sockjs_opts = {sockjs_url: "http://cdn.sockjs.org/sockjs-0.2.min.js"};

var sockjs_server = sockjs.createServer(sockjs_opts);

var http_server = http.createServer();

var sockets = [];

var canvas = new Canvas(2056,1920);
var context = canvas.getContext('2d');

sockjs_server.on('connection', function(socket) {
    sockets.push(socket);
    socket.write(JSON.stringify({'snapshot':canvas.toDataURL()}));
    socket.on('data', function(message) {
        var path = JSON.parse(message);
        with(context){
          while(path.length > 1){
            beginPath();
            point = path.pop();
            moveTo(point.x, point.y);
            lineTo(
              path[path.length-1].x,
              path[path.length-1].y
            )
            strokeStyle = path[path.length-1].c;
            lineWidth = path[path.length-1].w;
            stroke();
            closePath();
          };
        };
        for (var i in sockets){
            if (sockets[i] == socket) continue;
            sockets[i].write(message);
        }
    });
    socket.on('end', function() {
        var i = sockets.indexOf(socket)
        sockets.splice(i,1)
    });
});

http_server.addListener('request', function(req, res) {
     static_dir.serve(req, res);
});

http_server.addListener('upgrade', function(req, res) {
     res.end();
});

sockjs_server.installHandlers(http_server, {prefix:'/sjs'});

http_server.listen(9999, '0.0.0.0');
