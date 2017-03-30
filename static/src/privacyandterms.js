(function(global) {
    function privacyAndTerms() {


        $("#privacyAndTermsAck").on('shown.bs.modal',function(){
            $("body").removeClass('modal-open');
            $(".modal-backdrop").css('display', 'none');
        });
        $("#privacyAndTermsAck").on('hide.bs.modal',function(){
            $(".modal-backdrop").css('display', '');
        });
        $("#privacyAndTermsAck").modal({backdrop: false});
        $("#privacyAndTermsAck").modal("show");        
    }
    global.privacyAndTerms = privacyAndTerms;
})(window);