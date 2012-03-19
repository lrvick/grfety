window.onload = function(){
    var canvas = document.getElementById('canvas');
    var context = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.addEventListener('mousedown', function(e){
        this.mousedown = true;
        this.path = [];
        this.x = e.pageX;
        this.y = e.pageY;
    },0);
    canvas.addEventListener('mouseup', function(e){
        this.mousedown = false;
        //this.snapshot = canvas.toDataURL('image/jpeg');
        sock.send(JSON.stringify(this.path))
    }),0;
    canvas.addEventListener('mousemove', function(e){
      with(context){
        if (this.mousedown){
          beginPath();
          moveTo(this.x, this.y);
          lineTo(e.pageX, e.pageY);
          if (e.button === 2) {
            this.c = 'rgb(0,0,0)';
            this.w = 33;
          } else {
            this.c = 'rgb(255,255,255)';
            this.w = 1;
          }
          strokeStyle = this.c;
          lineWidth = this.w;
          stroke();
          closePath();
          this.x = e.pageX;
          this.y = e.pageY;
          this.path.push({
              'x':this.x,
              'y':this.y,
              'c':this.c,
              'w':this.w
          })
        }
      }
    },0);
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
        var path = JSON.parse(msg.data);
        with(context){
          while(path.length > 1){
            beginPath();
            point = path.pop();
            moveTo(point.x, point.y);
            lineTo(
              path[path.length-1].x,
              path[path.length-1].y
            )
            lineWidth = path[path.length-1].w;
            strokeStyle = path[path.length-1].c;
            stroke();
            closePath();
          };
        };
      };
      sock.onclose = function() {
        console.log('disconnected');
        setTimeout(function(){connect();},1000);
      };
    }
    connect();
}
