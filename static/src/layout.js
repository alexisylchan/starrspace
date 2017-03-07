(function(global) { 
    var bLoadMoreEntries = true;
    var windowDim;   
    var resizeTimeout;
    var pSource;

    var loadIcon;

    // Calculate number of columns to display based on window width    
    function calculate_num_cols() {
        var numCols = 2;
        if (windowDim.width > 960) {
            numCols = 3;
        } else if (windowDim.width <= 400) {
            numCols = 1;
        }
        return numCols;
    }
    // Calculate number of pins to display based on window height and width
    function calculate_num_pins() {
        if (windowDim) {
            var numCols = calculate_num_cols();
            var numRows = (windowDim.height * 3 / 350);
            if (numRows < 1) {
                numRows = 1;
            }
            pSource.set_num_pins(Math.ceil(numCols * numRows));
        }
        return pSource.get_num_pins();
    }
    // Display new images when window gets bigger
    function actualResizeHandler() {
        var currWidth = global.innerWidth;
        var currHeight = global.innerHeight;
        var bChanged = ((currWidth !== windowDim.width) || (currHeight !== windowDim.height));
        if (bChanged) {
            windowDim.width = currWidth;
            windowDim.height = currHeight;
            var prevNumPins = pSource.get_num_pins();
            var newNumPins = calculate_num_pins();
            if (newNumPins > prevNumPins) {
                if (bChanged) { 
                    var numToFetch = newNumPins - prevNumPins;
                    pSource.create_photos_entries(numToFetch);                    
                    // todo: set bLoadMoreEntries flag only when all requests complete :(
                    bLoadMoreEntries = true;
                    loadIcon.hide();
                }
            }
        }
    }
    // Throttle window resize event listener
    function resizeThrottler() {
        if (!resizeTimeout) {
            resizeTimeout = setTimeout(function() {
                resizeTimeout = null;
                actualResizeHandler();
            }, 66);
        }
    }
    // Enable infinite-scroll 
    function bind_scroll() {
        $(global).scroll(function() {
            if ($(global).scrollTop() + $(global).height() == $(document).height()) {
                if (bLoadMoreEntries) {
                    bLoadMoreEntries = false;
                    loadIcon.show();   
                    pSource.create_photos_entries(calculate_num_cols());                      
                    // todo: set bLoadMoreEntries flag only when all requests complete :(
                    bLoadMoreEntries = true;
                    loadIcon.hide();               
                }
            }
        });
    }
    // Enable layout change on resize
    function bind_resize() {
        global.addEventListener('resize', resizeThrottler, false);      
    }

    function init_layout(pinSource) {
        loadIcon = $('#loader');
        pSource = pinSource;
        windowDim = {
            width: global.innerWidth,
            height: global.innerHeight
        };        
        bind_scroll();          
        bind_resize();            
        calculate_num_pins();
        pSource.create_photos_entries();
    }; 
    global.init_layout = init_layout;
})(window);