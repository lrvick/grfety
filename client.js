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
        sock.send(JSON.stringify(this.path))
    }),0;
    canvas.addEventListener('mousemove', function(e){
        with(context){
        if (this.mousedown){
          beginPath();
          moveTo(this.x, this.y);
          lineTo(e.pageX, e.pageY);
          strokeStyle = 'rgb(255,255,255)';
          stroke();
          closePath();
          this.x = e.pageX;
          this.y = e.pageY;
          this.path.push({'x':this.x,'y':this.y})
        }
      }
    },0);
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
            strokeStyle = 'rgb(255,255,255)';
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
