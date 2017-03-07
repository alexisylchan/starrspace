(function(global) { 

    var ResultImage = function (imgUtil) {
        this.imgUtil = imgUtil;
    };

    ResultImage.prototype = {
        dom: function ()
        {
            return $(".style-image")[0];
        },
        toURL: function ()
        {
            return this.imgUtil.getImgUrl(this.dom());
        },
        toBlob: function()
        {
            return this.imgUtil.dataURItoBlob(this.toURL());
        },
        toBase64: function() 
        {
            return this.imgUtil.getBase64Image(this.dom());
        }
    };  
    global.ResultImage = ResultImage;
})(window);