(function(global) {
    var debug = false;
    var debugNoStyle = debug && false; 
    var imgUtil = new global.ImgUtil();
    var resultImg = new global.ResultImage(imgUtil);
    var twapi = new global.TWAPI();
    var fbapi = new global.FBAPI();
    var resultPanel = new global.ResultPanel();
    var pinSource = new global.PinSource({
        debug: debug,
        resultPanel: resultPanel
    });
    function handle_results(data) {
        if (!data || data.error) {
            resultPanel.hide();
            global.tinyPopup('Sorry! An internal error has occurred.');
        } else {
            resultPanel.setResult(data.root + "/" + data.filename);
        }
    }
    function debug_handle_results() {
        handle_results({
            root: '/results',
            filename: '1_stylized.png'
        });
    }
    function stylize() {
        var styleName = resultPanel.startStyle();
        if (debugNoStyle) {
            debug_handle_results();
        } else {
            // start style-transfer in server
            $.get("/style?image=" + styleName, null, handle_results, 'json');
        }
    }
    
    function bind_upload() {
        var uploadBtn = $('#uploadButton');
        uploadBtn.on('change', function(evt) {
            var files = evt.target.files;
            if (files && files.length > 0) {
                if (files[0].type.indexOf('image/')< 0) {
                    global.tinyPopup('Please upload an image file. Thank you!', 2000);
                } else if (files[0].size > 5000000) {
                    global.tinyPopup('Please upload an image file less than 5MB. Thank you!', 2000);
                } else {

                    var reader = new FileReader();
                    reader.onload = function(e) {
                        // Display upload thumbnail
                        var baseImgSrc = e.target.result;
                        resultPanel.setBaseImg(baseImgSrc);

                        // Upload base image to server
                        var request = new XMLHttpRequest();
                        request.onload = function(requestResponse) {
                            var serverResponse = JSON.parse(requestResponse.currentTarget.response);
                            if (serverResponse.hasOwnProperty('error')) {
                                global.tinyPopup(serverResponse.error, 'never');                                
                            }
                            resultPanel.clearUpload();                
                        }
                        request.open("POST", "/upload", true);
                        var blob = imgUtil.dataURItoBlob(baseImgSrc);
                        var form = new FormData();
                        form.append('blob', blob);
                        request.send(form);
                    }
                    reader.readAsDataURL(files[0]);
                }
            }
        });
    }

    function get_image_caption(service) {
        var imgTitle = get_nasa_thumbnail_title();
        var apodhandle = (service === 'tw') ? '@apod' : '@nasa';
        var sharingText = "My @starrspaceapp photo inspired by "+ apodhandle +"'s '" + imgTitle + "'";
        return sharingText;
    }

    function get_nasa_thumbnail_title() {
        return $("#stylePostview").attr('data-title');
    }

    function facebook_upload() {
         fbapi.upload(resultImg.toBlob(), get_image_caption('fb'));
    }

    function twitter_upload() {
        twapi.upload(resultImg.toBase64(), get_image_caption('tw'));
    }

    function download_style_img() 
    {
        var downloadBtn = $("#download_styled");
        
        // Set download source to result url
        downloadBtn.attr("href", resultImg.toURL());
        
        // Use original image name to create download name
        var origImageURL = $("#stylePostview").attr('src');
        var re = new RegExp('((?:\\w+)\\.((?:jpg|gif|png|jpeg)))', 'gi');
        var matches = re.exec(origImageURL);
        if (matches.length >= 3) {
            // Remove original image extension and replace with png
            var lastIndex = matches[0].length - matches[2].length - 1;
            if (lastIndex >= 0) {
                // Append 'styled_' as prefix to download name
                var styleImgName = 'styled_' + matches[0].substr(0, lastIndex) + '.png';
                // Set download name
                downloadBtn.attr("download", styleImgName);
            }
        }
    }
    function bind_stylize() {
        // Bind submit button to trigger styling
        $('#submitStyle').on('click', function(evt) {
            stylize();
        });

        // Bind share buttons for sharing style result
        $("#share_styled_tw").on('click', twitter_upload);
        $("#share_styled_fb").on('click', facebook_upload);
        $("#download_styled").on("click", download_style_img)
    }


    function bind_img_dialog() {
        $('#resultDlg').on('hidden.bs.modal', function() {
            // Delete photo on server
            $.post('/deletetmp', function(response) {
            });
        });
        global.addEventListener("beforeunload", function (evt) {
            // Clear user data on browser close!
            $.post('/deletetmp', function(response) {
            });
        });
    }

    function get_nasa_expanded_img_link() {
        return $("#expandedImage").attr('data-url');
    }

    function bind_share_img() {
        $("#share_link_tw").on('click', function(evt) {
            twapi.update_status(get_nasa_expanded_img_link());
        });

        $("#share_link_fb").on('click', function(evt) {
            fbapi.share_link(get_nasa_expanded_img_link());
        });
    }

    // Introduction dialog
    function bind_intro() {
        $("#banner").on("click", function(evt) {
            $("#introDlg").modal("show");
        });
    }

    // Initialize dom elements and event listeners
    function init_page() {
        // Initialize OAuth.io key
        OAuth.initialize(myOAuthKey);
        // Initialize layout
        resultPanel.init();        
        global.init_layout(pinSource);        
        bind_intro();
        bind_upload();
        bind_stylize();
        bind_share_img();
        bind_img_dialog();  
        global.privacyAndTerms();      
    } 
    // App entry-point
    function start() {
        pinSource.init(init_page);
    }
    global.start = start;
})(window);