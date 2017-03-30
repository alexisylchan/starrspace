(function(global) {
    function tinyPopup(message, timeoutval) {
        if (typeof timeoutval === 'undefined') {
            timeoutval = 1000;
        }
        $("#tinyText").html(message)
        $("#tinyMessage").modal("show");

        if (timeoutval !== 'never') {
            setTimeout(function() {
                $("#tinyMessage").modal("hide");
            }, timeoutval)
        }
    }
    global.tinyPopup = tinyPopup;
})(window);