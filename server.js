#!/usr/bin/node

var http = require('http');
var fs = require('fs');
var sockjs = require('sockjs');
var node_static = require('node-static');
var Canvas = require('canvas')

var static_dir = new node_static.Server(__dirname);

var sockjs_opts = {sockjs_url: "http://cdn.sockjs.org/sockjs-0.2.min.js"};

var sockjs_server = sockjs.createServer(sockjs_opts);

var http_server = http.createServer();

var clients = [];

var canvas = new Canvas(2056,1920);
var context = canvas.getContext('2d');

sockjs_server.on('connection', function(conn) {
    clients.push(conn);
    conn.write(JSON.stringify({'snapshot':canvas.toDataURL()}));
    conn.on('data', function(message) {
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
        //console.log(message);
        for (var i in clients){
            clients[i].write(message);
        }
    });
    conn.on('close', function() {});
});

http_server.addListener('request', function(req, res) {
     static_dir.serve(req, res);
});

http_server.addListener('upgrade', function(req, res) {
     res.end();
});

sockjs_server.installHandlers(http_server, {prefix:'/sjs'});

http_server.listen(9999, '0.0.0.0');
