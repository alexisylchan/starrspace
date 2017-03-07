(function(global) { 

    var TWAPI = function () {
    };

    TWAPI.prototype = {
        post: function(apiURL, data, successFn) {
            if (typeof successFn === 'undefined') {
                successFn = function(result) {}
            }
            OAuth.popup('twitter', {
                cache: true
            }, function(error, oauthresult) {
                // todo: server-side logging
                if (!error) {
                    oauthresult.post(apiURL, {
                        data: data
                    })
                    .done(successFn)
                    .fail(function(error2) {});
                }
            });
        },
        update: function (data) {
            this.post('https://api.twitter.com/1.1/statuses/update.json', data);
        },
        update_status: function (status) {
            this.update({
                status: status
            });
        },
        upload: function(base64Img, caption) {
            var apiURL = 'https://upload.twitter.com/1.1/media/upload.json';
            var data = {
                media_data: base64Img
            };
            var successFn = function(response) {
                this.update({
                    status: caption,
                    media_ids: response.media_id_string
                });
            };
            this.post(apiURL, data, successFn.bind(this));   
        }
    };  
    global.TWAPI = TWAPI;
})(window);