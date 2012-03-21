window.onload = function(){
    var setXY = function(e,obj){
        if (e.targetTouches){
            obj.x = e.targetTouches[0].pageX;
            obj.y = e.targetTouches[0].pageY;
        } else {
            obj.x = e.pageX;
            obj.y = e.pageY;
        }
    }
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
    var start = function(e){
        this.down = true;
        this.path = [];
        setXY(e,this);
    }
    var end = function(e){
        this.down = false;
        sock.send(JSON.stringify(this.path))
    }
    var canvas = document.getElementById('canvas');
    var context = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
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
    function connect(){
        sock = new SockJS('http://'+document.domain+':9999/sjs');
        sock.onopen = function() {
            console.log('connected');
        };
        sock.onmessage = function(msg) {
            var data = JSON.parse(msg.data);
            if (data['snapshot']){
                canvas.style.background = 'url(\''+data.snapshot+'\') no-repeat'
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
    connect();
}
