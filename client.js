window.onload = function(){

    // set stored x/y position to current touch/cursor location
    var setXY = function(e,obj){
        var asidewidth = document.getElementsByTagName('aside')[0].offsetWidth;
        console.log(asidewidth)
        if (e.targetTouches){
            obj.x = e.targetTouches[0].pageX - asidewidth;
            obj.y = e.targetTouches[0].pageY;
        } else {
            obj.x = e.pageX - asidewidth;
            obj.y = e.pageY;
        }
    }

    // draw line from last x/y to current x/y and add coords to path buffer
    var draw = function(e){
        with(context){
            if (this.down){
                beginPath();
                moveTo(this.x, this.y);
                setXY(e,this);
                if (e.button === 2) {
                    this.c = 'rgb(0,0,0)';
                    this.w = 33;
                } else {
                    this.c = 'rgb(255,255,255)';
                    this.w = 1;
                }
                strokeStyle = this.c;
                lineWidth = this.w;
                lineTo(this.x, this.y)
                stroke();
                closePath();
                this.path.push({
                    'x':this.x,
                    'y':this.y,
                    'c':this.c,
                    'w':this.w
                });
            }
        }
    }

    // start a new path buffer
    var start = function(e){
        this.down = true;
        this.path = [];
        setXY(e,this);
    }

    // send current path buffer to server
    var end = function(e){
        this.down = false;
        sock.send(JSON.stringify(this.path))
        window.snapshot.src = canvas.toDataURL();
    }

    // save the canvas to a file
    var save = function(context){
        var buffer = context;
        var w = buffer.canvas.width;
        var h = buffer.canvas.height;
        with(buffer){
            globalCompositeOperation = "destination-over"
            fillStyle = 'black';
            fillRect(0,0,w,h);
            window.open(buffer.canvas.toDataURL("image/png"),'_blank');
        }
    }

    // connect to server, and re-connect if disconnected
    var connect = function(){
        sock = new SockJS('http://'+document.domain+':9999/sjs');
        sock.onopen = function() {
            console.log('connected');
        };
        sock.onmessage = function(msg) {
            var data = JSON.parse(msg.data);
            if (data['snapshot']){
                window.snapshot = new Image();
                window.snapshot.onload = function(){
                    context.drawImage(window.snapshot,0,0);
                }
                window.snapshot.src = data.snapshot;
            } else {
                with(context){
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

    // build canvas and set up events
    var canvas = document.getElementsByTagName('canvas')[0];
    var context = canvas.getContext('2d');
    canvas.style.position = 'fixed';
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    window.onresize = function(){
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        context.drawImage(window.snapshot,0,0);
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

    // set up toolbar events
    var saveButton = document.getElementById('save');
    saveButton.addEventListener('click', function(e){
        e.preventDefault();
        save(context)
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
