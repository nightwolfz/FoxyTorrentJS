document.addEventListener('DOMContentLoaded', function(){

    //-----------------------
    // Internationalization
    //-----------------------
    $("[for=pref_lang]").html(chrome.i18n.getMessage("pref_lang") + ":");
    $("[for=pref_site]").html(chrome.i18n.getMessage("pref_site") + ":");
    $("[for=show_hd]").html(chrome.i18n.getMessage("show_hd") + ":");
    
    //-----------------------
    // Helpers
    //-----------------------
    inArray = function(list, val){
        return list.indexOf(val) >= 0 ? true : false;
    };
    
    //-----------------------
    // Set options on load
    //-----------------------
    refreshOptions = function(){
        console.debug("Refreshing options");
        console.debug(localStorage['pref_sites']);
        
        $("#browser_lang").html(navigator.language);
    
        $("#pref_lang").find("option").each(function(){
            if ($(this).val() == localStorage['pref_lang']) {
                $(this).prop("selected", "selected");
            }
        });
    
        $('input[name=pref_sites]').each(function(){
            $(this).prop('checked', inArray(localStorage['pref_sites'].split(','), $(this).val()) ? 'checked' : null);
        }); 
        
        $("#show_vostfr").prop('checked', localStorage['show_vostfr']==1 ? 'checked' : null);
        $("#show_hd").prop('checked', localStorage['show_hd']==1 ? 'checked' : null);
    };

    //-----------------------
    // Options saving
    //-----------------------
    saveOptions = function(){
        //localStorage['pref_lang'] = $("#pref_lang").val());
        //localStorage['show_hd'] = $("#show_hd:checked").length;
        
        // Save prefered sites
        var pref_sites = [];
        $('input[name=pref_sites]:checked').map(function(k,v){
            pref_sites.push(v.value);
        });
        
        localStorage['pref_sites'] = (pref_sites.length == 0) ? 'thepiratebay.org' : pref_sites;
        localStorage['show_vostfr'] = $("#show_vostfr:checked").length;

        // Dim the button
        refreshOptions();
        $("#save_options").prop('disabled', 'disabled').text('Saved!');
        setTimeout(function(){
            $("#save_options").prop('disabled', null).text('Save');
        }, 1000);
    };

    //-------------------------
    // Event listeners
    //-------------------------
    $('#save_options').on('click', saveOptions);
    
    
    //-------------------------
    // Execute on load
    //-------------------------
    refreshOptions();
});
