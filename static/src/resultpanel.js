(function(global) { 
    
    var resultDlg; 
    var styleImg;   
    var baseImg;   
    var resultImg;
    var resultSection;
    var submitButton;
    var progressBar;
    var removeStyleBtn;
    var uploadButton;

    function stop_progress() {        
        progressBar.attr("class", "seconds seconds-hidden");
    }
    function start_progress() {
        progressBar.attr("class", "seconds");
    }
    function enable_submit() {
        submitButton.attr('class', 'btn btn-primary');
    }
    function disable_submit() {
        submitButton.attr('class', 'btn disabled');
    }
    function display_result_image() {
        resultSection.attr('class', 'result-section visible');
    }
    function hide_result_image() {
        resultSection.attr('class', 'result-section hidden');
    }
    function show_upload_button() {
        uploadButtonDiv.attr('class', 'fileContainer');
    }
    function hide_upload_button() {
        uploadButtonDiv.attr('class', 'fileContainer hidden');
    }
    function set_upload_value(val) {
        uploadButton.val(val);
    }
    function hide_callback(evt) {
        set_upload_value('');
        resultImg.attr('src', '');
        resultImg.attr('data-img', '');
        baseImg.attr('src', '');
        baseImg.attr('class', 'small-preview');
        removeStyleBtn.attr('class', 'close-source hidden');
        styleImg.attr('src', '');
        styleImg.attr('data-title', '');
        styleImg.attr('class', 'small-preview');
        disable_submit();        
    }
    var ResultPanel = function () {    
    };
    ResultPanel.prototype = {
        init: function () {
            // ui elements
            resultDlg = $('#resultDlg'); 
            styleImg = $('#stylePostview');               
            baseImg = $('#preview');   
            resultImg = $(resultDlg.find('.style-image'));
            resultSection = $('.result-section');
            uploadButton = $("#uploadButton");
            uploadButtonDiv = $('#fileContainer');
            submitButton = $('#submitStyle');
            progressBar = $("#seconds");            
            removeStyleBtn = $('#closeSource');
            
            // event listeners
            removeStyleBtn.on('click', this.removeStyle.bind(this));
            resultDlg.on('hidden.bs.modal', hide_callback);
        },
        show: function (imgSrc, title, styleFile) {
            styleImg.attr('src', imgSrc);
            styleImg.attr('data-title', title);
            styleImg.attr('class', 'small-preview visible');
            resultDlg.attr('data-style-file', styleFile);
            hide_result_image();
            show_upload_button();
            resultDlg.modal('show');
        },
        setResult: function (resultSrc) {
            stop_progress();
            resultImg.attr('src', resultSrc);
            resultImg.attr('data-img', resultSrc);
            display_result_image();
            disable_submit();
        },
        hide: function () {
            stop_progress();
            resultDlg.modal("hide");            
        },
        startStyle: function () {            
            var styleFile = resultDlg.attr('data-style-file');
            disable_submit();
            start_progress();
            return styleFile;
        },        
        removeStyle: function () {
            this.clearUpload();
            // remove preview, display filecontainer                
            baseImg.attr('src', '');
            baseImg.attr('class', 'small-preview');
            removeStyleBtn.attr('class', 'close-source hidden');
            show_upload_button();
            disable_submit();
        },
        setBaseImg: function (imgSrc) {
            baseImg.attr('src', imgSrc);
            baseImg.attr('class', 'small-preview visible');
            removeStyleBtn.attr('class', 'close-source visible');
            hide_upload_button();
            enable_submit();
        },
        clearUpload: function () {
            set_upload_value('');
        }
    };  
    global.ResultPanel = ResultPanel;
    
})(window);