(function(global) { 
    function facebook_ajax(apiURL, formData) {
        try {
            $.ajax({
                url: apiURL,
                type: "POST",
                data: formData,
                processData: false,
                contentType: false,
                cache: false,
                success: function(data) {},
                error: function(error) {},
                complete: function() {}
            });                   
        } catch (error) {
        }
    }

    function upload_photo(imgBlob, caption, response)
    {
        if (response.authResponse) {                
            // Create form data 
            var formData = new FormData();
            formData.append("source", imgBlob);
            formData.append("message", caption);
            var access_token = FB.getAuthResponse()['accessToken'];
            formData.append("access_token", access_token);
            // Upload API url
            var uploadURL = "https://graph.facebook.com/me/photos?access_token=" + access_token;                                
            // Upload photo to Facebook via ajax
            facebook_ajax(uploadURL, formData);                
        }
    }
    var FBAPI = function () {
    };

    FBAPI.prototype = {
        share_link: function(link) {
            FB.ui({
                method: 'share',
                href: link
            });
        },
        upload: function(imgBlob, caption) {
            var loginScope = { scope: 'user_posts'};
            FB.login(function(response) {
                upload_photo(imgBlob, caption, response);
            }, 
            loginScope);
        }
    };  
    global.FBAPI = FBAPI;
})(window);