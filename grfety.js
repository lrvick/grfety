(function(root){

    //set up namespace
    var grfety = typeof exports != 'undefined' ? exports : root.grfety = {}

    // set stored x/y position to current touch/cursor location
    function setXY(e){
        var headerheight = document.getElementsByTagName('header')[0].offsetHeight;
        if (e.targetTouches){
            grfety.x = e.targetTouches[0].pageX;
            grfety.y = e.targetTouches[0].pageY - headerheight;
        } else {
            grfety.x = e.pageX;
            grfety.y = e.pageY - headerheight;
        }
    }

    // draw line from last x/y to current x/y and add coords to path buffer
    function draw(e){
        with(grfety.context){
            if (grfety.down){
                setXY(e);
                if (e.button === 2) {
                    grfety.c = 'rgb(0,0,0)';
                }
                var line = {
                    'x':grfety.x,
                    'y':grfety.y,
                    'c':grfety.c,
                    'w':grfety.w,
                    'b':grfety.b
                };
                grfety.path.push(line);
                if (grfety.path.length > 1){
                    grfety.brushes[grfety.b].draw(line)
                }
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
        sock.send(JSON.stringify({'type':'path','path':grfety.path}))
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
        sock = new SockJS('http://'+document.domain+':'+location.port+'/sjs');
        sock.onopen = function() {
            console.log('connected');
        };
        sock.onmessage = function(msg) {
            var data = JSON.parse(msg.data);
            if (data.type == 'snapshot'){
                window.snapshot = new Image();
                window.snapshot.onload = function(){
                    grfety.context.drawImage(window.snapshot,0,0);
                }
                window.snapshot.src = data.snapshot;
            }
            if (data.type == 'path'){
                with(grfety.context){
                    grfety.path = []
                    while(data.path.length > 0){
                        var item = data.path.pop()
                        grfety.path.push(item);
                        if (grfety.path.length > 1){
                            grfety.brushes[item.b].draw(item)
                        }
                    };
                    grfety.path = []
                };
            }
            if (data.type == 'stats'){
                var usercount = document.getElementById('usercount');
                usercount.innerHTML= data.usercount;
            }
        };
        sock.onclose = function() {
            console.log('disconnected');
            setTimeout(function(){connect();},1000);
        };
    }


    //toggle active tool in sidebar
    function swapClass(e,cl){
        var buttons = document.getElementsByClassName(cl);
        Array.prototype.slice.call(buttons, 0).forEach(function(el){
            el.className = 'color';
        })
        e.toElement.className += " "+cl;
    }

    //main initialization routine
    function init(){

        // set up brush select box

        var select = document.getElementsByTagName('select')[0];
        Object.keys(grfety.brushes).forEach(function(brush){
            var option = new Option(brush,brush);
            select.options[select.options.length] = option;
        })


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
        with(document){
            getElementById('color1').style.background = grfety.color1;
            getElementById('color2').style.background = grfety.color2;
            getElementById('color3').style.background = grfety.color3;
            addEventListener("fullscreenchange", toggleaside, false);
            addEventListener("mozfullscreenchange", toggleaside, false);
            addEventListener("webkitfullscreenchange", toggleaside, false);
            getElementsByTagName('select')[0].addEventListener('change', function(e){
                grfety.b = e.target.value;
            });
            getElementById('save').addEventListener('click', function(e){
                e.preventDefault();
                save()
                return false;
            });
            getElementById('sizerange').addEventListener('change', function(e){
                grfety.w = e.target.value;
            });
            getElementById('alpharange').addEventListener('change', function(e){
                grfety.a = e.target.value;
                grfety.context.globalAlpha = e.target.value / 100;
            });
            getElementById('color1').addEventListener('click', function(e){
                swapClass(e,'activecolor');
                grfety.c = grfety.color1;
                grfety.colora = grfety.color1;
            });
            getElementById('color2').addEventListener('click', function(e){
                swapClass(e,'activecolor');
                grfety.c = grfety.color2;
                grfety.colora = grfety.color2;
            });
            getElementById('color3').addEventListener('click', function(e){
                swapClass(e,'activecolor');
                grfety.c = grfety.color3;
                grfety.colora = grfety.color3;
            });
        }

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

    // global exports

    grfety.init = init;
    grfety.w = 1;
    grfety.c = 'rgb(255,255,255)';
    grfety.b = 'pencil';
    grfety.color1 = 'rgb(180,0,0)';
    grfety.color2 = 'rgb(0,180,0)';
    grfety.color3 = 'rgb(0,0,180)';
    grfety.colora = grfety.color1;
    grfety.init = init;
    grfety.brushes = {};

    // brush modules

    grfety.brushes['pencil'] = {
        draw : function(line){
            with(grfety.context){
                strokeStyle = line.c;
                lineWidth = line.w;
                beginPath();
                moveTo(
                    grfety.path[grfety.path.length -1].x,
                    grfety.path[grfety.path.length -1].y
                );
                lineTo(
                    grfety.path[grfety.path.length -2].x,
                    grfety.path[grfety.path.length -2].y
                );
                stroke();
            }
        }
    }

    grfety.brushes['randlines'] = {
        rand : function(){
            return Math.random()*3-1.5;
        },
        draw : function(line){
            with(grfety.context){
                strokeStyle = line.c;
                lineWidth = 0.05;
                for (i=1;i<50;i++){
                    beginPath();
                    moveTo(
                        grfety.path[grfety.path.length -1].x + this.rand() * line.w,
                        grfety.path[grfety.path.length -1].y + this.rand() * line.w
                    );
                    lineTo(
                        grfety.path[grfety.path.length -2].x + this.rand() * line.w,
                        grfety.path[grfety.path.length -2].y + this.rand() * line.w
                    );
                    stroke();
                }
            }
        }
    }

    grfety.brushes['fishnet'] = {
        draw : function(line){
            with(grfety.context){
                strokeStyle = line.c;
                lineWidth = line.w / 100 * 5;
                if (grfety.path.length > 15){
                    for (i=1;i<15;i++){
                        beginPath();
                        moveTo(
                            grfety.path[grfety.path.length -1].x,
                            grfety.path[grfety.path.length -1].y
                        );
                        lineTo(
                            grfety.path[grfety.path.length -i].x,
                            grfety.path[grfety.path.length -i].y
                        );
                        stroke();
                    }
                }
            }
        }
    }

    grfety.brushes['furry'] = {
        draw : function(line){
            with(grfety.context){
                strokeStyle = line.c;
                lineWidth = line.w / 100 * 5;
                for (var i=1;i<grfety.path.length;i++){
                    var e = -Math.random()
                    var b = grfety.path[grfety.path.length -1].x - grfety.path[grfety.path.length -i].x
                    var a = grfety.path[grfety.path.length -1].y - grfety.path[grfety.path.length -i].y
                    var h = b * b + a * a;
                    if (h < (2000*line.w) && Math.random() > h / (2000*line.w)) {
                        beginPath();
                        moveTo(
                            grfety.path[grfety.path.length -2].x + (b * e),
                            grfety.path[grfety.path.length -2].y + (a * e)
                        );
                        lineTo(
                            grfety.path[grfety.path.length -1].x - (b * e) + e * 2,
                            grfety.path[grfety.path.length -1].y - (a * e) + e * 2
                        );
                        stroke();
                    }
                }
            }
        }
    }

})(this);
