window.foxySettings = {};


chrome.extension.sendRequest({method: "getLocalStorage", key: "pref_site"}, function(response) {
    localStorage['pref_sites'] = response.data.pref_sites;
    localStorage['show_vostfr'] = response.data.show_vostfr;
    localStorage['runtimeId'] = response.runtimeId;
    
    debug(response.runtimeId);
    espada = new FoxyTorrent($);
    espada.execute();
});


// Private methods
function debug(str){
    try {console.debug(str);} catch(e) {}
}

function warning(str){
    try {console.warn(str);} catch(e) {}
}

String.prototype.ucfirst = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
}

FoxyTorrent = function($){
    // Private variables 
    var _apiUrl   = '//api.foxytorrent.com/v3/movie/search';
    var _apiSites = localStorage['pref_sites'] ? localStorage['pref_sites']  : "thepiratebay.org";
    var _apiLang  = localStorage['show_vostfr']==1 ? 'FRENCH'  : '';

    // Where to inject the results
    var resultsDiv = 'body';
    var resultsDivQuery = '.torrent_div';
    var defaultWebsite = 'www.imdb.com';
    var foxyData = window.foxyData['websites'];
    var movieTitleQuery;

    function getMovieTitle(){
        movieTitleQuery = typeof foxyData[location.hostname] != 'undefined'
                        ? foxyData[location.hostname]['title_query']
                        : foxyData[defaultWebsite]['title_query'];
        movieName = $(movieTitleQuery).text().replace(/\r\n/g, '').replace(/^\s+|\s+$/g, '');
    }
    
    function listPerQuality(resultsByQuality) {
        
        if(typeof resultsByQuality.high != "undefined")
        $.each(resultsByQuality.high, function(movieQuality, item){
            appendToTable(tableName, item.name.replace('Details for ', ''), item);
        });
        
        if(typeof resultsByQuality.medium != "undefined")
        $.each(resultsByQuality.medium, function(movieQuality, item){
            appendToTable(tableName, item.name.replace('Details for ', ''), item);
        });
        
        if(typeof resultsByQuality.low != "undefined")
        $.each(resultsByQuality.low, function(movieQuality, item){
            appendToTable(tableName, item.name.replace('Details for ', ''), item);
        });
    }

    // Create links for each result
    function listTorrents(data){
        $.each(data.results, function(websiteName, resultsByQuality){
            tableName = websiteName.replace(/\W/,'')
            $(resultsDivQuery).append('<h3>'+websiteName.ucfirst()+' results</h3>');
            $(resultsDivQuery).append('<table id="'+tableName+'" class="foxyResults"></table>');
            listPerQuality(resultsByQuality);
        });
    }

    function appendToTable(tableName, torrentName, item){
        var trusted = item.trusted 
        ? ('src="'+chrome.extension.getURL("images/trusted.gif")+'" title="Trusted uploader"') 
        : ('src="'+chrome.extension.getURL("images/magnet.gif")+'"');

        
        // Create table rows for each result
        var str = '<tr>';
            str += '<td style="padding-right:5px">';
                str += '<img ' + trusted + '>&nbsp;';
                str += '<a href="' + item.magnet + '">' + torrentName + '</a>';
            str += '</td>';
            str += '<td width="70">';
                str += '<small>' + item.size + '</small>';
            str += '</td>';
            str += '<td width="52">';
                str += '<img src="' + chrome.extension.getURL("images/up.gif") + '"><small>' + item.seeders + '</small>';
            str += '</td>';
            str += '<td width="52">';
                str += '<img src="' + chrome.extension.getURL("images/down.gif") + '"><small>' + item.leechers + '</small>';
            str += '</td>';
        str += '</tr>';

        $('#'+tableName).append(str);
    }

    function createButtonsAndDivs(){

        // Dark overlay
        $('body').first().append('<div class="torrent_overlay">&nbsp;</div>');

        // Results popin
        $(resultsDiv).first().append('<div class="torrent_div">Loading...</div>');
        $(resultsDiv).first().append('<div class="torrent_bottom"></div>');
        $(resultsDivQuery).html('<a class="foxyClosePopin">&#9660;</a>');

        // Bottom bar
        $('.torrent_bottom').append('<img class="foxyLogoSmall" src="' + chrome.extension.getURL("images/logo_small.png") + '">');
        $('.torrent_bottom').append('<a class="foxyOpenPopin">Search torrent</a>');

        // Add event listener to open the popin
        $('.foxyOpenPopin').on('click', function(){
            $('.torrent_div, .torrent_overlay').show(); 
            $('.torrent_bottom').hide();
        });

        // Add event listener to close the popin
        $('.foxyClosePopin').on('click', function(){
            $('.torrent_div, .torrent_overlay').hide(); 
            $('.torrent_bottom').show();
        });
    }

    function sendRequest(){
        debug('Searching for movie: ' + movieName);
        
        var _apiRequest = {
            'query'    : movieName,
            //'orderBy': 'SE',
            //'sortBy' : 'DESC',
            'site'     : _apiSites,
            'lang'     : _apiLang,
            'runtimeId': localStorage['runtimeId']
        };
        
        debug(_apiRequest);

        $.ajax({
            type       : 'GET',
            url        : _apiUrl,
            data       : _apiRequest,
            dataType   : 'json',
            timeout    : 15000,
            tryCount   : 0,
            retryLimit : 3,
            
            beforeSend: function(xhr, settings){
                
            },
            success   : function(data){
                // Create links for each result
                listTorrents(data);

                //$(resultsDivQuery).append('<a class="foxySearchMore">Show more torrents</a>');
                //$(resultsDivQuery).append('<h3>Searching for '+movieName+'</h3>');
            },
            error     : function(xhr, type){
                $(resultsDivQuery).text('Ajax error! ' + type);
                warning('Ajax error! ' + type);
                
                if (type == 'timeout') {
                    $.ajax({
                        type    : 'GET',
                        url     : 'http://error.foxytorrent.com/',
                        data    : {'q': _apiRequest, 'type': 'Ajax error: '+type, 'runtimeId': localStorage['runtimeId']},
                        timeout : 5000,
                        success : function(data){ warning('Logged ajax error: '+type); },
                        error : function(xhr){ warning('Failed logging ajax error'); }
                    });
                    
                    this.tryCount++;
                    if (this.tryCount <= this.retryLimit) {
                        $.ajax(this); // try again
                        warning('Trying again ... ' + this.tryCount);
                        return;
                    }
                }
                return;
            }
        });
    }

    function sendMessageToPlugin(){
        chrome.extension.sendRequest({}, function(response){
        });
    }

    // Expose to public
    return {
        execute: function(){
            createButtonsAndDivs();
            getMovieTitle();
            sendMessageToPlugin();
            sendRequest();
        }
    };
}; 


//--------------------------
// Include Google Analytics
//--------------------------
var _gaq = _gaq || [];
_gaq.push(['_setAccount', 'UA-43021920-2']);
_gaq.push(['_trackPageview']);

(function(){
    var ga = document.createElement('script');
    ga.type = 'text/javascript';
    ga.async = true;
    ga.src = 'https://ssl.google-analytics.com/ga.js';
    var s = document.getElementsByTagName('script')[0];
    s.parentNode.insertBefore(ga, s);
})();

// Track every page view
_gaq.push(['_trackPageview']);