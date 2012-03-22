(function(root){

    //set up namespace
    var grfety = typeof exports != 'undefined' ? exports : root.grfety = {}

    // set stored x/y position to current touch/cursor location
    function setXY(e){
        var asidewidth = document.getElementsByTagName('aside')[0].offsetWidth;
        if (e.targetTouches){
            grfety.x = e.targetTouches[0].pageX - asidewidth;
            grfety.y = e.targetTouches[0].pageY;
        } else {
            grfety.x = e.pageX - asidewidth;
            grfety.y = e.pageY;
        }
    }

    // draw line from last x/y to current x/y and add coords to path buffer
    function draw(e){
        with(grfety.context){
            if (grfety.down){
                beginPath();
                moveTo(grfety.x, grfety.y);
                setXY(e);
                if (e.button === 2) {
                    grfety.c = 'rgb(0,0,0)';
                    grfety.w = 33;
                } else {
                    grfety.c = 'rgb(255,255,255)';
                    grfety.w = 1;
                }
                strokeStyle = grfety.c;
                lineWidth = grfety.w;
                lineTo(grfety.x, grfety.y)
                stroke();
                closePath();
                grfety.path.push({
                    'x':grfety.x,
                    'y':grfety.y,
                    'c':grfety.c,
                    'w':grfety.w
                });
            }
        }
    }

    // start a new path buffer
    function start(e){
        grfety.down = true;
        grfety.path = [];
        setXY(e);
    }

    // send current path buffer to server
    function end(e){
        grfety.down = false;
        sock.send(JSON.stringify(grfety.path))
        window.snapshot.src = grfety.canvas.toDataURL();
    }

    // save the canvas to a file
    function save(){
        var buffer = grfety.context;
        var w = buffer.canvas.width;
        var h = buffer.canvas.height;
        with(buffer){
            globalCompositeOperation = "destination-over"
            fillStyle = 'black';
            fillRect(0,0,w,h);
            window.open(buffer.canvas.toDataURL("image/png"),'_blank');
        }
    }

    //toggle sidebar visibility
    function toggleaside(e){
        var aside = document.getElementsByTagName('aside')[0];
        if (aside.style.display == 'none'){
            aside.style.display = 'block';
        } else {
            aside.style.display = 'none';
        }
        setXY(e);
    }

    // make browser fullscreen
    function fullscreen(){
        var doc = document.documentElement;
        if (doc.requestFullscreen) {
            doc.requestFullscreen();
        }
        else if (doc.mozRequestFullScreen) {
            doc.mozRequestFullScreen();
        }
        else if (doc.webkitRequestFullScreen) {
            doc.webkitRequestFullScreen();
        }
    }

    // connect to server, and re-connect if disconnected
    function connect(){
        sock = new SockJS('http://'+document.domain+':9999/sjs');
        sock.onopen = function() {
            console.log('connected');
        };
        sock.onmessage = function(msg) {
            var data = JSON.parse(msg.data);
            if (data['snapshot']){
                window.snapshot = new Image();
                window.snapshot.onload = function(){
                    grfety.context.drawImage(window.snapshot,0,0);
                }
                window.snapshot.src = data.snapshot;
            } else {
                with(grfety.context){
                    while(data.length > 1){
                        beginPath();
                        point = data.pop();
                        moveTo(point.x, point.y);
                        lineTo(
                                data[data.length-1].x,
                                data[data.length-1].y
                              )
                            lineWidth = data[data.length-1].w;
                        strokeStyle = data[data.length-1].c;
                        stroke();
                        closePath();
                    };
                };
            }
        };
        sock.onclose = function() {
            console.log('disconnected');
            setTimeout(function(){connect();},1000);
        };
    }

    //main initialization routine
    function init(){

        // build canvas and set up events
        grfety.canvas = document.getElementsByTagName('canvas')[0];
        grfety.context = grfety.canvas.getContext('2d');
        with(grfety.context){
            canvas.style.position = 'fixed';
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            window.onresize = function(){
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight;
                drawImage(window.snapshot,0,0);
            }
            canvas.addEventListener('mousedown', start);
            canvas.addEventListener('touchstart', start);
            canvas.addEventListener('touchend', end);
            canvas.addEventListener('mouseup', end);
            canvas.addEventListener('mousemove', draw);
            canvas.addEventListener('touchmove', draw);
            canvas.addEventListener('contextmenu', function(e){
                if (e.button === 2){
                    e.preventDefault();
                    return false;
                }
            },0)
        }

        // set up toolbar events
        var saveButton = document.getElementById('save');
        saveButton.addEventListener('click', function(e){
            e.preventDefault();
            save()
            return false;
        });

        // attach events to toggle sidebar on fullscreen
        document.addEventListener("fullscreenchange", toggleaside, false);
        document.addEventListener("mozfullscreenchange", toggleaside, false);
        document.addEventListener("webkitfullscreenchange", toggleaside, false);

        // set up toolbar events
        var fullscreenButton = document.getElementById('fullscreen');
        fullscreenButton.addEventListener('click', function(e){
            e.preventDefault();
            fullscreen();
            return false;
        });

        // hide address bar for Android
        if (window.navigator.userAgent.match('/Android/i')){
            setTimeout(function(){
                canvas.height = window.innerHeight + 60;
                window.scrollTo(0,1);
            }, 0);
        }

        // connect to server
        connect();
    }

    grfety.init = init;

})(this);

window.onload = function(){
    grfety.init();
}
