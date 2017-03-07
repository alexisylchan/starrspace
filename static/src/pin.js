(function(global) {
    var useIndexDb = true;
    var db;
    var pDebug = false;
    var dayCounter = new global.DayCounter();
    var numPins = 0;
    var rPanel;

    // Initialize IndexedDb for caching {date:Image url} to reduce API calls
    function init_db(initFn) {
        global.indexedDB = global.indexedDB || global.mozIndexedDB || global.webkitIndexedDB || global.msIndexedDB;
        global.IDBTransaction = global.IDBTransaction || global.webkitIDBTransaction || global.msIDBTransaction;
        global.IDBKeyRange = global.IDBKeyRange || global.webkitIDBKeyRange || global.msIDBKeyRange;
        if (!global.indexedDB) {
            useIndexDb = false;
        }
        var dbrequest = global.indexedDB.open("apod");
        dbrequest.onerror = function(event) {
            useIndexDb = false;
        };
        dbrequest.onsuccess = function(event) {
            var database = event.target.result;
            var version = parseInt(database.version);
            database.close();
            var secondRequest = indexedDB.open("apod", version + 1);
            secondRequest.onupgradeneeded = function(evt) {
                db = evt.target.result;
                if (!db.objectStoreNames.contains('apod')) {
                    var apodStore = db.createObjectStore("apod", {
                        keyPath: "id"
                    });
                }
            };
            secondRequest.onsuccess = function(evt) {
                setTimeout(initFn, 1);
            }
        };
    };

    function bind_pin_icon_action(enableStyling, idPrefix, elemID, elemTitle) {
        if (enableStyling) {
            $('#' + idPrefix + elemID).on('click', function() {
                var imgSrc = $(this).attr("data-img");
                var styleName = pDebug ? elemID + '.ckpt' : styleRepo[elemID];
                rPanel.show(imgSrc, elemTitle, styleName)
            });
        } else {
            $('#' + idPrefix + elemID).on('click', function() {
                var imgname = $(this).attr("data-img");
                if (useIndexDb) {
                    // save to database
                    var entry = {
                        imgSrc: imgname,
                        date: elemID
                    };
                    if (!pDebug) {
                        $.post('/nominate', entry)
                            .done(function(success) {
                                // TODO: popup
                                var vote = success.numNoms > 1 ? ' votes ' : ' vote ';
                                global.tinyPopup('Thank you! ' + success.numNoms + vote + 'so far.');
                            }).fail(function(error) {
                                //console.log(error);
                            });
                    } else {
                        //console.log('nominating', entry);
                    }
                }
            });
        }
    }

    function get_formatted_date(imgDate) {
        var formattedDate = imgDate;
        var tokens = formattedDate.split('-');
        if (tokens.length === 3) {
            if (tokens[0].length === 4) {
                tokens[0] = tokens[0].substr(2);
                if (tokens[1].length < 2) {
                    tokens[1] = '0' + tokens[1];
                }
                if (tokens[2].length < 2) {
                    tokens[2] = '0' + tokens[2];
                }
                formattedDate = tokens[0] + tokens[1] + tokens[2];
            }
        }
        //console.log(formattedDate);
        return formattedDate;
    }

    function get_nasa_link(date) {
        var formattedDate = get_formatted_date(date);
        var sharedUrl = 'https://apod.nasa.gov/apod/ap' + formattedDate + '.html'
        return sharedUrl;
    }
    
    function bind_pin(elemID, description) {
        $('#' + elemID + ' > img').on('click', function(evt) {
            var imgSrc = $(this).attr("src"); // Display style image in thumbnail
            var modal = $('#expandModal');

            // Display result in main section
            var imgelem = $("#expandedImage");
            $(imgelem).attr('src', imgSrc);
            $(imgelem).attr('title', description);
            $(imgelem).attr('data-img', imgSrc);
            var origUrl = get_nasa_link(elemID.substr(4));
            $(imgelem).attr('data-url', origUrl);
            $('#go_to_nasa').attr('href', origUrl);
            modal.modal('show');
        });
    }
    // Create entry dom elements and event listener
    function create_entry(entry) {
        var imgurl = entry.url;
        var enableStyling = styleRepo.hasOwnProperty(entry.id) || (pDebug && entry.debugPin);
        var idPrefix, iconUnicode, cssClass, alt;
        if (enableStyling) {
            idPrefix = 'style-';
            iconUnicode = '&#127912;';
            cssClass = 'palette';
            alt = " alt='Stylize Icon' title='Style Your Photo!' ";
        } else {
            idPrefix = 'nom-';
            iconUnicode = '&#10084;';
            cssClass = 'heart';
            alt = " alt='Heart Icon' title='Add to Wish List!' ";
        }

        var t = $("<div class='pin' id='pin-" + entry.id + "' title=\"" + entry.explanation + "\" ><img src='" + imgurl + "' /><div class='stylizeIcon " + cssClass + alt + "' id='" + idPrefix + entry.id + "' data-img='" + imgurl + "'>" + iconUnicode + "</div><p>" + entry.title + "</p></div>");
        $("#columns").append(t);

        bind_pin_icon_action(enableStyling, idPrefix, entry.id, entry.title);
        bind_pin('pin-' + entry.id, entry.explanation);
    }

    // Cache image url to reduce NASA APOD API calls
    function cache_img_url(entry) {
        var request = db.transaction(["apod"], "readwrite")
            .objectStore("apod")
            .add(entry);
        request.onsuccess = function(event) {};
        request.onerror = function(event) {}
    }

    // Construct NASA API url using image date
    function apiurl_from_date(imgDate) {
        var urlbase = "https://api.nasa.gov/planetary/apod?api_key=" + myNASAKey;
        var apiurl = urlbase + '&date=' + imgDate;
        return apiurl;
    }

    // Get image url from NASA via API url
    // Then get image from NASA via image url
    function get_img_url(imgDate) {
        var apiurl = apiurl_from_date(imgDate);
        $.ajax({
            url: apiurl,
            success: function(result) {
                result.id = imgDate;
                if (useIndexDb) {
                    // Cache image url in IndexedDB for future retrievals
                    cache_img_url(result);
                }
                if (result.media_type != "video") {
                    create_entry(result);
                }
            }
        });
        return false;
    }

    // Get image from NASA
    // - via image url if it is stored in IndexedDB
    // - via API url, then image url otherwise
    function request_img(imgDate) {
        if (useIndexDb) {
            var transaction = db.transaction(["apod"]);
            var objectStore = transaction.objectStore("apod");
            var dbrequest = objectStore.get(imgDate);

            dbrequest.onerror = function(event) {
                get_img_url(imgDate);
            };

            dbrequest.onsuccess = function(event) {
                if (dbrequest.result) {
                    if (dbrequest.result.media_type != "video") {
                        create_entry(dbrequest.result);
                    }
                } else {
                    get_img_url(imgDate);
                }
            };
        } else {
            get_img_url(imgDate);
        }
    }
    // Create photo entries using debugging photos
    function create_photos_debug_entries(numToFetch) {
        var bAddPhotos = (typeof numToFetch !== 'undefined');
        if (!bAddPhotos) {
            numToFetch = (numPins < 15) ? numPins : 15;
        }
        var lastFetched = $('.pin').length;
        if (lastFetched < 15) {
            var lastIndex = lastFetched + numToFetch;
            if (lastIndex > 15) {
                lastIndex = 15;
            }
            var nextFetch = lastFetched + 1;
            for (var i = nextFetch; i <= lastIndex; ++i) {
                create_entry({
                    id: '' + i,
                    debugPin: (i % 2) === 0,
                    url: 'images/' + i + '.jpg',
                    explanation: "Hello NASA!"
                });
            }
        }
    }
    // Create photo entries based on dates
    function create_photos_real_entries(numToFetch) {
        var bAddPhotos = (typeof numToFetch !== 'undefined');
        var count = bAddPhotos ? numToFetch : numPins;

        for (var i = 0; i < count; ++i) {
            dayCounter.next();
            var nextDate = dayCounter.get_date();
            if (nextDate) {
                request_img(nextDate);
            } else {
                break;
            }
        }
    }
    var PinSource = function(options) 
    {
        pDebug = options.debug || pDebug;
        rPanel = options.resultPanel;
    };
    PinSource.prototype = {
        init: function (initFn) {            
            if (useIndexDb) {
                init_db(initFn);
            } else {
                initFn();
            }
        },
        set_num_pins: function(num) {
            numPins = num;
        },
        get_num_pins: function() {
            return numPins;
        },
        create_photos_entries: function(numToFetch) {
            if (pDebug) {
                create_photos_debug_entries(numToFetch);
            } else {
                create_photos_real_entries(numToFetch);
            }
        }
    };
    global.PinSource = PinSource;
})(window);