(function(global) { 
    function dataURItoBinary(dataURI) {
        var byteString = atob(dataURI.split(',')[1]);
        var ab = new ArrayBuffer(byteString.length);
        var ia = new Uint8Array(ab);
        for (var i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
        }
        return ab;
    }

    var ImgUtil = function(){};
    ImgUtil.prototype = {
        dataURItoBlob: function (dataURI) {
            var ab = dataURItoBinary(dataURI);
            var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
            var bb = new Blob([ab], {
                "type": mimeString
            });
            return bb;
        },
        getImgUrl: function (img) {
            // Create an empty canvas element
            var canvas = document.createElement("canvas");
            canvas.width = img.width;
            canvas.height = img.height;

            // Copy the image contents to the canvas
            var ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            // Get the data-URL formatted image
            // Firefox supports PNG and JPEG. You could check img.src to
            // guess the original format, but be aware the using "image/jpg"
            // will re-encode the image.
            var dataURL = canvas.toDataURL("image/png");
            return dataURL;
        },
        getBase64Image: function (img) {
            var dataURL = this.getImgUrl(img);
            return dataURL.replace(/^data:image\/(png|jpg);base64,/, "");
        }
    };  
    global.ImgUtil = ImgUtil;
})(window);