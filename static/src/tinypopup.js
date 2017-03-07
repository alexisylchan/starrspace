(function(global) {
    function tinyPopup(message) {
        $("#tinyText").html(message)
        $("#tinyMessage").modal("show");
        setTimeout(function() {
            $("#tinyMessage").modal("hide");
        }, 1000)
    }
    global.tinyPopup = tinyPopup;
})(window);