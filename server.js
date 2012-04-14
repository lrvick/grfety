#!/usr/bin/node

var http = require('http');
var fs = require('fs');
var sockjs = require('sockjs');
var node_static = require('node-static');
var Canvas = require('canvas')
var grfety = require('./grfety.js')

var static_dir = new node_static.Server(__dirname);

var sockjs_opts = {sockjs_url: "http://cdn.sockjs.org/sockjs-0.2.min.js"};

var sockjs_server = sockjs.createServer(sockjs_opts);

var http_server = http.createServer();

var port = process.argv[2] || 9999;

var host = '0.0.0.0';

var sockets = [];

var canvas = new Canvas(2056,1920);

grfety.context = canvas.getContext('2d');

sockjs_server.on('connection', function(socket) {
    sockets.push(socket);
    socket.write(JSON.stringify({'type':'snapshot','snapshot':canvas.toDataURL()}));
    socket.write(JSON.stringify({'type':'stats','usercount':sockets.length}));
    socket.on('data', function(message) {
        var data = JSON.parse(message);
        grfety.path = []
        if (data.type == 'path'){
            while(data.path.length > 0){
                var item = data.path.pop()
                grfety.path.push(item);
                if (grfety.path.length > 1){
                    grfety.brushes[item.b].draw(item)
                }
            };
            for (var i in sockets){
                if (sockets[i] == socket) continue;
                sockets[i].write(message);
            }
        }
    });
    socket.on('end', function() {
        var i = sockets.indexOf(socket)
        sockets.splice(i,1)
    });
});

setInterval(function(){
    var message = JSON.stringify({'type':'stats','usercount':sockets.length});
    for (var i in sockets){
        sockets[i].write(message);
    }
},10000)

http_server.addListener('request', function(req, res) {
     static_dir.serve(req, res);
});

http_server.addListener('upgrade', function(req, res) {
     res.end();
});

sockjs_server.installHandlers(http_server, {prefix:'/sjs'});

http_server.listen(port, host);

console.log('grfety is listening on '+host+':'+port)
