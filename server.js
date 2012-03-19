var http = require('http');
var sockjs = require('sockjs');
var node_static = require('node-static');

var static_dir = new node_static.Server(__dirname);

var sockjs_opts = {sockjs_url: "http://cdn.sockjs.org/sockjs-0.2.min.js"};

var sockjs_server = sockjs.createServer(sockjs_opts);

var http_server = http.createServer();

var clients = []

sockjs_server.on('connection', function(conn) {
    clients.push(conn);
    conn.on('data', function(message) {
        console.log(message);
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
