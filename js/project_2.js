(function () {
  var canvas = document.getElementById("header-sim");
  Simulation.main(canvas);

  var lastX;
  var lastY;

  canvas.addEventListener(
    "touchmove",
    function (event) {
      var touches = event.changedTouches,
        first = touches[0];

      var bounds = canvas.getBoundingClientRect();
      var simulatedEvent = document.createEvent("MouseEvent");
      simulatedEvent.initMouseEvent(
        "mousemove",
        true,
        true,
        window,
        1,
        (first.screenX * 600) / bounds.width,
        (first.screenY * 600) / bounds.height,
        (first.clientX * 600) / bounds.width,
        (first.clientY * 600) / bounds.height,
        false,
        false,
        false,
        false,
        0,
        null
      );

      first.target.dispatchEvent(simulatedEvent);

      if (lastX && lastY) {
        var dx = lastX - first.screenX;
        var dy = lastY - first.screenY;
        if (Math.abs(dx) > Math.abs(dy)) {
          event.preventDefault();
        }
      }
      lastX = first.screenX;
      lastY = first.screenY;
    },
    true
  );
})();
