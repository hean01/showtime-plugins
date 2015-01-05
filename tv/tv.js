/*
 *  Online TV
 *
 *  Copyright (C) 2015 lprot
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */


(function(plugin) {
    var logo = plugin.path + "logo.png";
    var slogan = "Online TV";

    function setPageHeader(page, title) {
	page.type = "directory";
	page.contents = "items";
	page.metadata.logo = logo;
	page.metadata.title = title;
	page.loading = false;
    }

    function base64_decode(data) {
        // http://kevin.vanzonneveld.net
        // +   original by: Tyler Akins (http://rumkin.com)
        // +   improved by: Thunder.m
        // +      input by: Aman Gupta
        // +   improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
        // +   bugfixed by: Onno Marsman
        // +   bugfixed by: Pellentesque Malesuada
        // +   improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
        // +      input by: Brett Zamir (http://brett-zamir.me)
        // +   bugfixed by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
        // *     example 1: base64_decode('S2V2aW4gdmFuIFpvbm5ldmVsZA==');
        // *     returns 1: 'Kevin van Zonneveld'
        // mozilla has this native
        // - but breaks in 2.0.0.12!
        //if (typeof this.window['atob'] == 'function') {
        //    return atob(data);
        //}
        var b64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
        var o1, o2, o3, h1, h2, h3, h4, bits, i = 0,
            ac = 0,
            dec = "",
            tmp_arr = [];

        if (!data) {
            return data;
        }

        data += '';

        do { // unpack four hexets into three octets using index points in b64
            h1 = b64.indexOf(data.charAt(i++));
            h2 = b64.indexOf(data.charAt(i++));
            h3 = b64.indexOf(data.charAt(i++));
            h4 = b64.indexOf(data.charAt(i++));

            bits = h1 << 18 | h2 << 12 | h3 << 6 | h4;

            o1 = bits >> 16 & 0xff;
            o2 = bits >> 8 & 0xff;
            o3 = bits & 0xff;

            if (h3 == 64) {
                tmp_arr[ac++] = String.fromCharCode(o1);
            } else if (h4 == 64) {
                tmp_arr[ac++] = String.fromCharCode(o1, o2);
            } else {
                tmp_arr[ac++] = String.fromCharCode(o1, o2, o3);
            }
        } while (i < data.length);

        dec = tmp_arr.join('');

        return dec;
    }

    function unhash(hash) {
        var hash1 = "2YdkpV7mUNLB8vzMWwI5Z40uc=";
        var hash2 = "lnxg6eGyXbQ3sJD9Rafo1iHTtq";
        for (var i = 0; i < hash1.length; i++) {
            hash = hash.split(hash1[i]).join('--');
            hash = hash.split(hash2[i]).join(hash1[i]);
            hash = hash.split('--').join(hash2[i]);
        }
        return base64_decode(hash);
    }

    plugin.createService(slogan, plugin.getDescriptor().id + ":start", "tv", true, logo);

    var settings = plugin.createSettings(slogan, logo, slogan);

    settings.createAction("cleanFavorites", "Clean My Favorites", function () {
        store.list = "[]";
        showtime.notify('Favorites has been cleaned successfully', 2);
    });

    var store = plugin.createStore('favorites', true)
    if (!store.list) {
        store.version = "1";
        store.background = "";
        store.title = "tv » My Favorites";
        store.list = "[]";
    }

    plugin.addURI(plugin.getDescriptor().id + ":youtube:(.*)", function(page, title) {
        var resp, match, match2, match3;

        // get videolink by id
        function playVideo(page, id) {
            page.loading = true;
            resp = showtime.httpReq("https://www.youtube.com/watch?v=" + id[1]).toString();
            page.loading = false;
            // get the link
            match = resp.match(/"hlsvp": "([\S\s]*?)"/);
            if (!match) { // try to get the link from the main search results
                page.loading = true;
                resp = showtime.httpReq("https://www.youtube.com/watch?v=" + match2[1]).toString();
                page.loading = false;
                // getting the link
                match = resp.match(/"hlsvp": "([\S\s]*?)"/);
            }
            if (match) {
                page.type = "video";
                page.source = "videoparams:" + showtime.JSONEncode({
                    title: unescape(title),
                    canonicalUrl: plugin.getDescriptor().id + ':youtube:' + title,
                    sources: [{
                        url: "hls:" + match[1].replace(/\\\//g, '/')
                    }]
                });
            } else page.error("Sorry, can't get channel's link :(");
        }

        // search for the channel
        page.loading = true;
        resp = showtime.httpReq("https://www.youtube.com/results?search_query=" + unescape(title).replace(/\s/g, '+')).toString();
        page.loading = false;
        // looking for user's page
        match = resp.match(/<a href="\/user\/([\S\s]*?)"/);
        match2 = resp.match(/\/watch\?v=([\S\s]*?)"/); // scraping direct link
        match3 = resp.match(/<a href="\/channel\/([\S\s]*?)"/);
        if (match) { // try to get the link via user's page
            page.loading = true;
            resp = showtime.httpReq("https://www.youtube.com/user/" + match[1]).toString();
            page.loading = false;
            var match = resp.match(/\/watch\?v=([\S\s]*?)"/);
            if (match) {
                //showtime.print("Got link via user's page");
                playVideo(page, match);
            }
        } else {
            if (match3) { // try to get the link via channel's page
                page.loading = true;
                resp = showtime.httpReq("https://www.youtube.com/channel/" + match3[1]).toString();
                page.loading = false;
                var match = resp.match(/\/watch\?v=([\S\s]*?)"/);
                if (match) {
                   //showtime.print("Got the link via channel's page");
                   playVideo(page, match);
                }
            } else {
                if (match2) // try to play direct link
                    playVideo(page, match2);
              }
        }
    });

    plugin.addURI(plugin.getDescriptor().id + ":sputniktv:(.*):(.*)", function(page, url, title) {
        page.loading = true;
        var resp = showtime.httpReq(unescape(url)).toString();
        page.loading = false;
        var match = resp.match(/file=([\S\s]*?)"/);
        if (match) {
            page.type = "video";
            page.source = "videoparams:" + showtime.JSONEncode({
                title: unescape(title),
                canonicalUrl: plugin.getDescriptor().id + ':sputniktv:' + url + ':' + title,
                sources: [{
                    url: 'hls:' + match[1]
                }]
            });
        } else page.error("Sorry, can't get the link :(");
    });

    plugin.addURI(plugin.getDescriptor().id + ":uatoday:(.*):(.*)", function(page, url, title) {
        page.loading = true;
        var resp = showtime.httpReq(unescape(url)).toString();
        page.loading = false;
        var match = resp.match(/player.online[\S\s]*?http[\S\s]*?http([\S\s]*?)'/);
        if (match) {
            page.type = "video";
            page.source = "videoparams:" + showtime.JSONEncode({
                title: unescape(title),
                canonicalUrl: plugin.getDescriptor().id + ':uatoday:' + url + ':' + title,
                sources: [{
                    url: 'hls:http' + match[1]
                }]
            });
        } else page.error("Sorry, can't get the link :(");
    });

    plugin.addURI(plugin.getDescriptor().id + ":seetv:(.*):(.*)", function(page, url, title) {
        page.loading = true;
        var resp = showtime.httpReq("http://seetv.tv/see/" + unescape(url)).toString();
        page.loading = false;
        var match = resp.match(/file=([\S\s]*?)\&/);
        if (match) {
            page.type = "video";
            page.source = "videoparams:" + showtime.JSONEncode({
                title: unescape(title),
                canonicalUrl: plugin.getDescriptor().id + ':seetv:' + url + ':' + title,
                sources: [{
                    url: match[1].match(/m3u8/) ? 'hls:' + match[1] : match[1]
                }]
            });
        } else page.error("Sorry, can't get the link :(");
    });

    plugin.addURI(plugin.getDescriptor().id + ":1hd:(.*):(.*)", function(page, url, title) {
        page.loading = true;
        var resp = showtime.httpReq(unescape(url)).toString();
        page.loading = false;
        var match = resp.match(/file:"([\S\s]*?)"/);
        if (match) {
             page.type = "video";
            page.source = "videoparams:" + showtime.JSONEncode({
                title: unescape(title),
                canonicalUrl: plugin.getDescriptor().id + ':1hd:' + url + ':' + title,
                sources: [{
                    url: match[1]
                }]
            });
        } else page.error("Sorry, can't get the link :(");
    });

    plugin.addURI(plugin.getDescriptor().id + ":jampo:(.*):(.*)", function(page, url, title) {
        page.loading = true;
        var resp = showtime.httpReq("http://tv.jampo.tv/play/channel/" + unescape(url)).toString();
        page.loading = false;
        var match = resp.match(/"st=([\S\s]*?)\&/);
        if (match) {
            page.type = "video";
            page.source = "videoparams:" + showtime.JSONEncode({
                title: unescape(title),
                canonicalUrl: plugin.getDescriptor().id + ':jampo:' + url + ':' + title,
                sources: [{
                    url: 'hls:' + showtime.JSONDecode(unhash(match[1])).file
                }]
            });
        } else page.error("Sorry, can't get the link :(");
    });

    plugin.addURI(plugin.getDescriptor().id + ":glaz:(.*):(.*)", function(page, url, title) {
        page.loading = true;
        var resp = showtime.httpReq("http://www.glaz.tv/online-tv/" + unescape(url)).toString();
        page.loading = false;
        var match = resp.match(/file=([\S\s]*?)\"/);
        if (match) {
            page.type = "video";
            page.source = "videoparams:" + showtime.JSONEncode({
                title: unescape(title),
                canonicalUrl: plugin.getDescriptor().id + ':glaz:' + url + ':' + title,
                sources: [{
                    url: match[1].match(/m3u8/) ? 'hls:' + match[1] : match[1]
                }]
            });
       } else page.error("Sorry, can't get the link :(");
    });

    plugin.addURI(plugin.getDescriptor().id + ":livestation:(.*):(.*)", function(page, url, title) {
        page.loading = true;
        var resp = showtime.httpReq("http://www.livestation.com" + unescape(url)).toString();
        page.loading = false;
        var match = resp.match(/property="og:video:type"[\S\s]*?http([\S\s]*?)"/);
        if (match) {
            page.type = "video";
            page.source = "videoparams:" + showtime.JSONEncode({
                title: unescape(title),
                canonicalUrl: plugin.getDescriptor().id + ':livestantion:' + url + ':' + title,
                sources: [{
                    url: 'hls:http' + match[1]
                }]
            });
       } else page.error("Sorry, can't get the link :(");
    });

    plugin.addURI(plugin.getDescriptor().id + ":trk:(.*)", function(page, title) {
        page.loading = true;
        var resp = showtime.httpReq("http://kanalukraina.tv/online/").toString();
        page.loading = false;
        var match = resp.match(/source: '([\S\s]*?)'/);
            if (match) {
                page.type = "video";
                page.source = "videoparams:" + showtime.JSONEncode({
                    title: unescape(title),
                    canonicalUrl: plugin.getDescriptor().id + ':trk:' + title,
                    sources: [{
                        url: 'hls:' + match[1]
                    }]
                });
            } else page.error("Sorry, can't get the link :(");
    });

    plugin.addURI(plugin.getDescriptor().id + ":gamax:(.*):(.*)", function(page, url, title) {
        page.loading = true;
        var resp = showtime.httpReq(unescape(url)).toString();
        page.loading = false;
        var match = resp.match(/'file': '([\S\s]*?)' \}/);
            if (match) {
                page.type = "video";
                page.source = "videoparams:" + showtime.JSONEncode({
                    title: unescape(title),
                    canonicalUrl: plugin.getDescriptor().id + ':gamax:' + url + ':' + title,
                    sources: [{
                        url: match[1].match(/m3u8/) ? 'hls:' + match[1] : match[1]
                    }]
                });
            } else page.error("Sorry, can't get the link :(");
    });

    plugin.addURI(plugin.getDescriptor().id + ":euronews:(.*):(.*)", function(page, country, title) {
        page.loading = true;
        var resp = showtime.httpReq('http://www.euronews.com/news/streaming-live/', {
            postdata: {
                action: 'getHexaglobeUrl'
            }
        }).toString();
        var json = showtime.JSONDecode(showtime.httpReq(resp));
        page.loading = false;
        if (json.status && json.status == 'ok') {
            page.type = "video";
            page.source = "videoparams:" + showtime.JSONEncode({
                title: unescape(title),
                canonicalUrl: plugin.getDescriptor().id + ':euronews:' + country + ':' + title,
                sources: [{
                    url: 'hls:' + json.primary[country].hls
                }]
            });
        } else
             page.error("Sorry, can't get the link :(");
    });

    plugin.addURI(plugin.getDescriptor().id + ":vgtrk:(.*):(.*)", function(page, url, title) {
        page.loading = true;
        var resp = showtime.httpReq(unescape(url)).toString();
        page.loading = false;
        var match = resp.match(/"auto":"([\S\s]*?)"\}/);
            if (match) {
                page.type = "video";
                page.source = "videoparams:" + showtime.JSONEncode({
                    title: unescape(title),
                    canonicalUrl: plugin.getDescriptor().id + ':vgtrk:' + url + ':' + title,
                    sources: [{
                        url: 'hls:' + match[1].replace(/\\/g, '')
                    }]
                });
            } else
                 page.error("Sorry, can't get the link :(");
    });

    plugin.addURI(plugin.getDescriptor().id + ":ts:(.*):(.*)", function(page, url, title) {
        var link = "videoparams:" + showtime.JSONEncode({
            title: unescape(title),
            no_fs_scan: true,
            canonicalUrl: plugin.getDescriptor().id + ':ts:' + url + ':' + title,
            sources: [{
                url: unescape(url),
                mimetype: 'video/mp2t'
            }]
        });
        page.type = 'video'
        page.source = link;
    });

    function addChannel(page, title, route, url, icon) {
        var link = plugin.getDescriptor().id + ':' + route + ":" + (url ? escape(url) + ':' : '') + escape(title);
        if (route == 'direct') {
            link = "videoparams:" + showtime.JSONEncode({
                title: title,
                no_fs_scan: true,
                sources: [{
                    url: url
                }]
            });
        }

        var item = page.appendItem(link, "video", {
            title: title,
            icon: icon
        });

        item.link = link;
        item.title = title;
        item.icon = icon;

        if (typeof Duktape != 'undefined') {
            item.onEvent("addFavorite", function(item) {
                var entry = showtime.JSONEncode({
	            link: this.link,
                    title: this.title,
                    icon: this.icon
	        });
                store.list = showtime.JSONEncode([entry].concat(eval(store.list)));
	        showtime.notify("'" + this.title + "' has been added to My Favorites.", 2);
	    }.bind(item));
        } else {
            item.onEvent("addFavorite", function(item) {
                var entry = showtime.JSONEncode({
	            link: this.link,
                    title: this.title,
                    icon: this.icon
	        });
                store.list = showtime.JSONEncode([entry].concat(eval(store.list)));
	        showtime.notify("'" + this.title + "' has been added to My Favorites.", 2);
	    });
        }
	item.addOptAction("Add '" + title + "' to My Favorites", "addFavorite");
    }

    function fill_fav(page) {
	var list = eval(store.list);

        if (!list || !list.toString()) {
           page.error("My Favorites list is empty");
           return;
        }
        var pos = 0;
	for (var i in list) {
	    var itemmd = showtime.JSONDecode(list[i]);
	    var item = page.appendItem(itemmd.link, "video", {
       		title: itemmd.title,
		icon: itemmd.icon
	    });
	    item.addOptAction("Remove '" + itemmd.title + "' from My Favorites", pos);

	    item.onEvent(pos, function(item) {
		var list = eval(store.list);
		showtime.notify("'" + showtime.JSONDecode(list[item]).title + "' has been removed from My Favorites.", 2);
	        list.splice(item, 1);
		store.list = showtime.JSONEncode(list);
                page.flush();
                fill_fav(page);
	    });
            pos++;
	}
    }

    // Favorites
    plugin.addURI(plugin.getDescriptor().id + ":favorites", function(page) {
        setPageHeader(page, "My Favorites");
        fill_fav(page);
    });

    // Categories
    plugin.addURI(plugin.getDescriptor().id + ":category:(.*)", function(page, category) {
      setPageHeader(page, category);
      if (category == "News" || category == "All") {
        page.appendItem("", "separator", {
            title: 'English'
        });
        addChannel(page, 'Euronews', 'euronews', 'en', 'http://ua.euronews.com/media/logo_222.gif');
        addChannel(page, 'Ukraine Today', 'uatoday', 'http://uatoday.tv/live', 'http://uatoday.tv/static/images/logo_ut.png');
        addChannel(page, 'Russia Today', 'direct', 'hls:http://rt.ashttp14.visionip.tv/live/rt-global-live-HD/playlist.m3u8', 'http://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/Russia-today-logo.svg/200px-Russia-today-logo.svg.png');
        addChannel(page, 'Russia Today Documentary', 'direct', 'hls:http://rt.ashttp14.visionip.tv/live/rt-doc-live-HD/playlist.m3u8', 'http://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/Russia-today-logo.svg/200px-Russia-today-logo.svg.png');
        addChannel(page, 'BBC World News', 'livestation', '/en/bbc-world', 'http://upload.wikimedia.org/wikipedia/commons/6/6c/BBC_World_News_red.svg');
        addChannel(page, 'DW Europe', 'direct', 'hls:http://www.metafilegenerator.de/DWelle/tv-europa/ios/master.m3u8', 'https://lh5.googleusercontent.com/-9Ir29NdKHLU/AAAAAAAAAAI/AAAAAAAAIiY/TF5J4A4ZdP8/s120-c/photo.jpg');
        addChannel(page, 'France 24', 'direct', 'hls:http://vipwowza.yacast.net/f24_hlslive_en/smil:iphone.fr24en.smil/playlist.m3u8', 'http://upload.wikimedia.org/wikipedia/en/thumb/6/65/FRANCE_24_logo.svg/200px-FRANCE_24_logo.svg.png');
        //addChannel(page, 'CNN', 'direct', 'rtmp://hd1.lsops.net/live/ playpath=cnn_en_584 swfUrl="http://static.ls-cdn.com/player/5.10/livestation-player.swf" swfVfy=true live=true', 'http://upload.wikimedia.org/wikipedia/commons/8/8b/Cnn.svg');
        addChannel(page, 'CNN', 'livestation', '/en/cnni', 'http://upload.wikimedia.org/wikipedia/commons/8/8b/Cnn.svg');
        addChannel(page, 'CNBC', 'livestation', '/en/cnbc', 'http://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/CNBC_logo.svg/200px-CNBC_logo.svg.png');
        //addChannel(page, 'Bloomberg', 'direct', 'hls:http://hd4.lsops.net/live/bloomber_en_hls.smil/playlist.m3u8', 'http://upload.wikimedia.org/wikipedia/commons/thumb/5/56/Bloomberg_logo.svg/200px-Bloomberg_logo.svg.png');
        addChannel(page, 'Bloomberg', 'livestation', '/en/bloomberg', 'http://upload.wikimedia.org/wikipedia/commons/thumb/5/56/Bloomberg_logo.svg/200px-Bloomberg_logo.svg.png');
        //http://live.bltvios.com.edgesuite.net/oza2w6q8gX9WSkRx13bskffWIuyf/BnazlkNDpCIcD-QkfyZCQKlRiiFnVa5I/master.m3u8?geo_country=US
        addChannel(page, 'Sky News', 'youtube', '', 'http://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/Sky_News.svg/200px-Sky_News.svg.png');
        addChannel(page, 'Press TV', 'livestation', '/en/press-tv', 'http://upload.wikimedia.org/wikipedia/en/2/23/PressTV.png');
        addChannel(page, 'i24 News', 'direct', 'hls:http://bcoveliveios-i.akamaihd.net/hls/live/215102/master_english/398/master.m3u8', '');
        //http://aya02.livem3u8.me.totiptv.com/live/ea4c9d2666bc411d8e6777e8a1d2b747.m3u8?pt=1&code=4d4549b2c1f6926f8698e13c0123177a
        addChannel(page, 'Reuters', 'direct', 'hls:http://37.58.85.156/rlo001/ngrp:rlo001.stream_all/playlist.m3u8', 'http://upload.wikimedia.org/wikipedia/ru/a/a0/Reuters_2008_logo.svg');
        addChannel(page, 'AlJazeera', 'livestation', '/en/aljazeera-english', 'http://upload.wikimedia.org/wikipedia/en/7/71/Aljazeera.svg');
        addChannel(page, 'Arirang', 'direct', 'http://worldlive-ios.arirang.co.kr/arirang/arirangtvworldios.mp4.m3u8', 'http://upload.wikimedia.org/wikipedia/commons/thumb/9/94/Arirang.svg/200px-Arirang.svg.png');
        //addChannel(page, 'NHK World', 'direct', 'hls:http://nhkworldlive-lh.akamaihd.net/i/nhkworld_w@145835/master.m3u8', 'http://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/NHK_World.svg/200px-NHK_World.svg.png');
        addChannel(page, 'CCTV News', 'livestation', '/en/cctv');
        addChannel(page, 'Nasa TV (public)', 'direct', 'hls:http://public.infozen.cshls.lldns.net/infozen/public/public.m3u8', '');
        addChannel(page, 'Nasa TV (education)', 'direct', 'hls:http://edu.infozen.cshls.lldns.net/infozen/edu/edu.m3u8', '');
        addChannel(page, 'Nasa TV (media)', 'direct', 'hls:http://media.infozen.cshls.lldns.net/infozen/media/media.m3u8', '');
        addChannel(page, 'Twit TV', 'direct', 'hls:http://iphone-streaming.ustream.tv/ustreamVideo/1524/streams/live/playlist.m3u8', '');
        addChannel(page, 'myZen.tv', 'glaz', 'myzen-tv');
        addChannel(page, 'Fashion', 'direct', 'hls:http://178.49.132.73/streaming/fashion/tvrec/playlist.m3u8', '');
        addChannel(page, 'Trace Sports', 'direct', 'hls:http://46.249.213.87/iPhone/broadcast/tracetvsports-tablet.3gp.m3u8', '');
        addChannel(page, 'Redbull TV', 'direct', 'hls:http://live.iphone.redbull.de.edgesuite.net/webtvHD.m3u8', '');
        addChannel(page, 'Sporttime.tv HDTV 1', 'direct', 'rtmp://streamer.a1.net:1935/rtmplive/redundant/channels/Sporttime/SporttimeTV/mp4:channel1_1200', '');
        addChannel(page, 'Sporttime.tv HDTV 2', 'direct', 'rtmp://streamer.a1.net:1935/rtmplive/redundant/channels/Sporttime/SporttimeTV/mp4:channel2_1200', '');
        addChannel(page, 'Sporttime.tv HDTV 3', 'direct', 'rtmp://streamer.a1.net:1935/rtmplive/redundant/channels/Sporttime/SporttimeTV/mp4:channel3_1200', '');
        addChannel(page, 'Sporttime.tv HDTV 4', 'direct', 'rtmp://streamer.a1.net:1935/rtmplive/redundant/channels/Sporttime/SporttimeTV/mp4:channel4_1200', '');
        addChannel(page, 'Sporttime.tv HDTV 5', 'direct', 'rtmp://streamer.a1.net:1935/rtmplive/redundant/channels/Sporttime/SporttimeTV/mp4:channel5_1200', '');
        addChannel(page, 'Sporttime.tv HDTV 6', 'direct', 'rtmp://streamer.a1.net:1935/rtmplive/redundant/channels/Sporttime/SporttimeTV/mp4:channel6_1200', '');
        addChannel(page, 'Sporttime.tv HDTV 7', 'direct', 'rtmp://streamer.a1.net:1935/rtmplive/redundant/channels/Sporttime/SporttimeTV/mp4:channel7_1200', '');

        page.appendItem("", "separator", {
            title: 'Deutsch'
        });
        addChannel(page, 'N24', 'direct', 'hls:http://n24-live.hls.adaptive.level3.net/hls-live/n24-pssimn24live/_definst_/live/stream2.m3u8', 'http://upload.wikimedia.org/wikipedia/de/2/20/N24_logo.svg');
        addChannel(page, 'ZDF', 'direct', 'hls:http://88.212.11.206:5000/live/28/28.m3u8', 'http://upload.wikimedia.org/wikipedia/commons/0/02/ZDF.svg');
        addChannel(page, 'NDR HD', 'direct', 'hls:http://ndr_fs-lh.akamaihd.net/i/ndrfs_nds@119224/master.m3u8', 'http://upload.wikimedia.org/wikipedia/commons/thumb/0/08/NDR_Dachmarke.svg/200px-NDR_Dachmarke.svg.png');
        addChannel(page, 'WDR HD', 'direct', 'hls:http://www.metafilegenerator.de/WDR/WDR_FS/m3u8/wdrfernsehen.m3u8', 'http://upload.wikimedia.org/wikipedia/commons/thumb/b/bc/WDR_Re-Branding_2012_Logo.svg/200px-WDR_Re-Branding_2012_Logo.svg.png');
        addChannel(page, 'RBB', 'direct', 'hls:http://88.212.11.206:5000/live/13/13.m3u8', 'http://upload.wikimedia.org/wikipedia/commons/thumb/9/98/Rundfunk_Berlin-Brandenburg_logo.svg/200px-Rundfunk_Berlin-Brandenburg_logo.svg.png');
        addChannel(page, 'Okto', 'direct', 'hls:http://atwse.lbs.atusmedia.cc:1935/oktolive/okto-low.stream/hasbahca.m3u8', 'http://upload.wikimedia.org/wikipedia/de/thumb/7/7b/Okto.svg/200px-Okto.svg.png');

        page.appendItem("", "separator", {
            title: 'Danish'
        });
        addChannel(page, 'Kanal Sport', 'direct', 'hls:http://lswb-de-08.servers.octoshape.net:1935/live/kanalsport_2000k/hasbahca.m3u8', 'http://kanalsport.dk/img/layout/logo_top.png');
        addChannel(page, 'Folketinget', 'direct', 'rtmp://ftflash.arkena.dk/webtvftlivefl/ playpath=mp4:live.mp4 pageUrl=http://www.ft.dk/webTV/TV_kanalen_folketinget.aspx live=1', '');

      }

      if (category == "Children" || category == "All") {
        if (category == "All") {
            page.appendItem("", "separator", {
                title: 'Children'
            });
        }
        addChannel(page, 'Disney Channel', 'glaz', 'disney-channel');
        addChannel(page, 'Cartoon Network', 'glaz', 'cartoon-network');
        addChannel(page, 'Boomerang', 'glaz', 'boomerang');
        addChannel(page, 'Nick Jr', 'glaz', 'nick-jr');
        addChannel(page, 'Nickelodeon', 'glaz', 'nickelodeon');
        addChannel(page, 'Карусель', 'jampo', 'karusel');
        addChannel(page, 'Мультимания', 'glaz', 'multimaniya');
        addChannel(page, 'Детский мир/Телеклуб', 'glaz', 'detskiy-mir-teleklub');
        addChannel(page, 'Мать и дитя', 'glaz', 'mama-tv');
        addChannel(page, 'Піксель', 'glaz', 'piksel-tv');
        addChannel(page, 'Плюс Плюс', 'jampo', 'plusplus');
        addChannel(page, 'Любимое.TV', 'direct', 'rtmp://80.93.53.88/live/channel_6');
      }

      if (category == "Music" || category == "All") {
        if (category == "All") {
            page.appendItem("", "separator", {
                title: 'Music'
            });
        }
        //addChannel(page, 'PIK.TV', 'direct', 'rtmp://fms.pik-tv.com/live/piktv2pik2tv.flv', '');
        addChannel(page, 'Dance  TV', 'direct', 'hls:http://91.82.85.16:1935/relay15/nettv_channel_1/playlist.m3u8', 'http://www.dancetv.hu/index_htm_files/9.png');
        addChannel(page, 'King TV', 'direct', 'hls:http://91.82.85.16:1935/relay15/nettv03_channel_1/playlist.m3u8', 'http://www.dancetv.hu/index_htm_files/141.png');
        addChannel(page, '1HD', '1hd', 'http://1hd.ru', 'http://cs614626.vk.me/v614626983/4712/Ae-m7Qoz364.jpg');
        //addChannel(page, '1HD (RTMP)', 'direct', 'rtmp://109.239.142.62/live/livestream3', '');
        addChannel(page, 'PIK TV', 'direct', 'hls:http://fms.pik-tv.com:1935/live/piktv3pik3tv/playlist.m3u8', '');
        //addChannel(page, '360 Tune Box', 'direct', 'hls:http://spi-live.ercdn.net/spi/360tuneboxhd_0_1/playlist.m3u8', '');
        addChannel(page, 'MTV Live HD', 'jampo', 'mtvlivehd', '');
        addChannel(page, 'Vevo 1', 'direct', 'hls:http://vevoplaylist-live.hls.adaptive.level3.net/vevo/ch1/06/prog_index.m3u8', '');
        addChannel(page, 'Vevo 2', 'direct', 'hls:http://vevoplaylist-live.hls.adaptive.level3.net/vevo/ch2/06/prog_index.m3u8', '');
        addChannel(page, 'Vevo 3', 'direct', 'hls:http://vevoplaylist-live.hls.adaptive.level3.net/vevo/ch3/06/prog_index.m3u8', '');
        addChannel(page, 'LiveHD - Live Mix', 'direct', 'rtmp://91.201.78.3:1935/live/onehdhd', '');
        addChannel(page, 'LiveHD - Dance', 'direct', 'rtmp://91.201.78.3:1935/live/dancehd', '');
        addChannel(page, 'LiveHD - Pop', 'direct', 'rtmp://91.201.78.3:1935/live/pophd', '');
        addChannel(page, 'LiveHD - Rock', 'direct', 'rtmp://91.201.78.3:1935/live/rockhd', '');
        addChannel(page, 'LiveHD - Jazz', 'direct', 'rtmp://91.201.78.3:1935/live/jazzhd', '');
        addChannel(page, 'LiveHD - Classic', 'direct', 'rtmp://91.201.78.3:1935/live/classicshd', '');
        addChannel(page, 'Lobas TV', 'direct', 'rtmp://149.11.34.78/live/lobas.stream', '');
        addChannel(page, 'Party TV', 'direct', 'rtmp://149.11.34.6/live/partytv.stream', '');
        //addChannel(page, 'Rouge TV', 'direct', 'rtmp://rtmp.infomaniak.ch/livecast/rougetv', '');
        addChannel(page, 'Rouge TV', 'direct', 'hls:http://rtmp.infomaniak.ch/livecast/rougetv/playlist.m3u8', '');
        addChannel(page, 'TVM3', 'direct', 'hls:http://rtmp.infomaniak.ch:1935/livecast/tvm3/playlist.m3u8', '');
        addChannel(page, 'Capital TV', 'direct', 'hls:http://cdn-sov-2.musicradio.com:80/LiveVideo/Capital/playlist.m3u8', '');
        addChannel(page, 'Heart TV', 'direct', 'hls:http://cdn-sov-2.musicradio.com:80/LiveVideo/Heart/playlist.m3u8', '');
        addChannel(page, '538TV', 'direct', 'http://538-hls.lswcdn.triple-it.nl/content/538tv/538tv.m3u8', '');
        addChannel(page, 'Slam TV', 'direct', 'hls:http://538-hls.lswcdn.triple-it.nl/content/slamtv/slamtv.m3u8', '');
        addChannel(page, 'Beatz TV', 'direct', 'rtmp://rtmp.infomaniak.ch:1935/livecast/beats_2', '');
        addChannel(page, 'Clubbing TV', 'direct', 'rtmp://204.107.26.252:8086/live/691.high.stream', '');
        addChannel(page, 'OUI TV', 'direct', 'hls:http://rtmp.infomaniak.ch:1935/livecast/ouitv/playlist.m3u8', '');
        addChannel(page, 'RTL 105.2', 'direct', 'hls:http://origin-rtl-radio-stream.4mecloud.it/live-video/radiovisione/ngrp:radiovisione/chunklist-b1164000.m3u8', '');
        //addChannel(page, 'Europa Plus TV (RTMP)', 'direct', 'rtmp://europaplus.cdnvideo.ru/europaplus-live//mp4:eptv_main.sdp', 'http://www.europaplustv.com/images/europa_tv.png');
        addChannel(page, 'Europa Plus TV', 'direct', 'hls:http://europaplus.cdnvideo.ru/europaplus-live/mp4:eptv_main.sdp/playlist.m3u8', 'http://www.europaplustv.com/images/europa_tv.png');
        addChannel(page, 'OTV', 'jampo', 'otv');
        //rtmp://212.26.132.86/live/mb_ua
        addChannel(page, 'Music Box UA', 'direct', 'hls:http://212.26.132.86/hls/mb_ua.m3u8', '');
        addChannel(page, 'Stars TV', 'direct', 'hls:http://starstv-live.e91-jw.insyscd.net/starstv.isml/QualityLevels(960000)/manifest(format=m3u8-aapl).m3u8', '');
        addChannel(page, 'RU TV', 'glaz', 'ru-tv');
        //addChannel(page, 'Fresh TV', 'direct', 'hls:http://80.93.53.88:1935/live/channel_4/playlist.m3u8', '');
        addChannel(page, 'Fresh TV', 'direct', 'rtmp://80.93.53.88/live/channel_4', '');
        addChannel(page, 'For Music', 'direct', 'rtmp://wowza1.top-ix.org/quartaretetv1/formusicweb', '');
        addChannel(page, 'Ocko', 'direct', 'rtmp://194.79.52.79/ockoi/ockoHQ1', '');
        addChannel(page, 'Ocko Gold', 'direct', 'rtmp://194.79.52.79:1935/goldi/goldHQ1', '');
        addChannel(page, 'Ocko Express', 'direct', 'rtmp://194.79.52.79:1935/expresi/expresHQ1', '');
        addChannel(page, 'Eska Best Music TV', 'direct', 'hls:http://stream.smcloud.net:1935/live2/best/best_360p/playlist.m3u8', '');
        addChannel(page, 'Eska Party TV', 'direct', 'hls:http://stream.smcloud.net:1935/live2/eska_party/eska_party_360p/playlist.m3u8', '');
        //rtmp://stream.smcloud.net/live2/eskatv/eskatv_360p
        addChannel(page, 'Eska TV', 'direct', 'hls:http://stream.smcloud.net:1935/live2/eskatv/eskatv_360p/playlist.m3u8', '');
        addChannel(page, 'Eska Rock TV', 'direct', 'hls:http://stream.smcloud.net:1935/live2/eska_rock/eska_rock_360p/playlist.m3u8', '');
        addChannel(page, 'Eska Wawa TV', 'direct', 'hls:http://stream.smcloud.net:1935/live2/wawa/wawa_360p/playlist.m3u8', '');
        addChannel(page, 'Eska Vox TV', 'direct', 'hls:http://stream.smcloud.net:1935/live2/vox/vox_360p/playlist.m3u8', '');
        addChannel(page, 'Eska Polo TV', 'direct', 'hls:http://stream.smcloud.net:1935/live/polotv/playlist.m3u8', '');
        addChannel(page, 'IbizaOnTV', 'direct', 'hls:http://46.249.213.87/iPhone/broadcast/ibizaontv-tablet.3gp.m3u8', '');
        addChannel(page, 'Trace Urban', 'direct', 'hls:http://46.249.213.87/iPhone/broadcast/tracetvurban-tablet.3gp.m3u8', '');
        addChannel(page, 'MTV', 'glaz', 'mtv-russia');
        addChannel(page, 'Vitamine', 'direct', 'rtmp://rtmp.infomaniak.ch/livecast/vitatv', '');
        addChannel(page, 'Rusong TV', 'direct', 'hls:http://rusong.cdnvideo.ru:443/rtp/rusong2/chunklist.m3u8', '');
        addChannel(page, 'Russian Musicbox', 'direct', 'hls:http://musicbox.cdnvideo.ru/musicbox-live/musicbox.sdp/playlist.m3u8', '');
        addChannel(page, '1 music', 'direct', 'rtmp://80.232.172.37/rtplive/vlc.sdp', '');
        addChannel(page, 'BIM TV', 'direct', 'hls:http://goo.gl/glJV3o');
        //rtmp://rtmp.infomaniak.ch/livecast//ouitv
        addChannel(page, 'Musiq 1 TV', 'ts', 'http://212.79.96.134:8005');
        addChannel(page, '1 Classic', 'ts', 'http://212.79.96.134:8024');
      }
      if (category == "Ukrainian" || category == "All") {
        if (category == "All") {
            page.appendItem("", "separator", {
                title: 'Ukrainian'
            });
        }
        addChannel(page, 'Euronews', 'euronews', 'ua', 'http://ua.euronews.com/media/logo_222.gif');
        addChannel(page, 'Espreso TV', 'youtube', '', 'https://yt3.ggpht.com/-bVnYWgZunWc/AAAAAAAAAAI/AAAAAAAAAAA/lscLbX2rp2A/s88-c-k-no/photo.jpg');
        addChannel(page, 'Hromadske.tv', 'youtube', '', 'https://yt3.ggpht.com/-p31Ot-UmPks/AAAAAAAAAAI/AAAAAAAAAAA/4bKlgSnfyOs/s88-c-k-no/photo.jpg');
        addChannel(page, '5 канал', 'youtube', '', 'http://upload.wikimedia.org/wikipedia/commons/3/3e/5logo.jpg');
        addChannel(page, '5 канал', 'jampo', '5tv', 'http://upload.wikimedia.org/wikipedia/commons/3/3e/5logo.jpg');
        addChannel(page, '24 канал', 'youtube', '', 'http://24tv.ua/img/24_logo_facebook.jpg');
        addChannel(page, 'UBR', 'youtube', '', 'https://yt3.ggpht.com/-7jc3b3Xttfg/AAAAAAAAAAI/AAAAAAAAAAA/MXEE_WKxzLM/s88-c-k-no/photo.jpg');
        addChannel(page, 'Перший', 'jampo', 'ut1', 'http://upload.wikimedia.org/wikipedia/commons/6/69/%D0%9F%D0%B5%D1%80%D0%B2%D1%8B%D0%B9_%D0%BD%D0%B0%D1%86%D0%B8%D0%BE%D0%BD%D0%B0%D0%BB%D1%8C%D0%BD%D1%8B%D0%B9_%D1%82%D0%B5%D0%BB%D0%B5%D0%BA%D0%B0%D0%BD%D0%B0%D0%BB_%28%D0%A3%D0%BA%D1%80%D0%B0%D0%B8%D0%BD%D0%B0%29.png');
        addChannel(page, 'Інтер', 'glaz', 'inter', 'http://inter.ua/images/logo.png');
        addChannel(page, 'Інтер+', 'sputniktv', 'http://sputniktv.in.ua/interplus.html');
        //rtmp://31.28.169.242/live/live112
        addChannel(page, '112', 'direct', 'hls:http://31.28.169.242/hls/live112.m3u8', 'http://112.ua/static/img/logo/112_ukr.png');
        addChannel(page, 'TET', 'jampo', 'tet', 'http://upload.wikimedia.org/wikipedia/ru/7/72/%D0%9B%D0%BE%D0%B3%D0%BE%D1%82%D0%B8%D0%BF_%D1%82%D0%B5%D0%BB%D0%B5%D0%BA%D0%BE%D0%BC%D0%BF%D0%B0%D0%BD%D0%B8%D0%B8_%D0%A2%D0%95%D0%A2.jpg');
        addChannel(page, '1+1', 'jampo', '1plus1', 'http://upload.wikimedia.org/wikipedia/commons/thumb/0/07/1_plus_1_logo.svg/200px-1_plus_1_logo.svg.png');
        addChannel(page, '2+2', 'seetv', '2plus2', 'http://2plus2.ua/img/header/logo.png');
        addChannel(page, 'НТН', 'jampo', 'ntn', 'http://upload.wikimedia.org/wikipedia/ru/6/61/Telekanal_ntn.png');
        //addChannel(page, 'ТВі', 'direct', 'rtmp://media.tvi.com.ua/live/_definst_//HLS4', 'http://tvi.ua/catalog/view/theme/new/image/logo.png');
        addChannel(page, 'ТВі', 'jampo', 'tvi', 'http://upload.wikimedia.org/wikipedia/uk/b/b0/TVI_logo.png');
        addChannel(page, 'ICTV', 'sputniktv', 'http://sputniktv.in.ua/ictv.html', 'http://upload.wikimedia.org/wikipedia/uk/4/44/Telekanal_ictv.png');
        addChannel(page, 'СТБ', 'sputniktv', 'http://sputniktv.in.ua/stb.html', 'http://upload.wikimedia.org/wikipedia/ru/2/2a/Telekanal_stb.png');
        addChannel(page, 'Новий канал', 'sputniktv', 'http://sputniktv.in.ua/novyj-kanal.html', 'http://ru.novy.tv/images/layouts/front/logo.png');
        addChannel(page, 'Украина', 'trk', '', 'http://upload.wikimedia.org/wikipedia/commons/c/cc/Ua_white.jpg');
        addChannel(page, 'History', 'sputniktv', 'http://sputniktv.in.ua/history.html');
        addChannel(page, 'Travel Channel', 'sputniktv', 'http://sputniktv.in.ua/travel-channel.html');
        addChannel(page, 'Discovery Channel', 'jampo', 'discovery', 'http://upload.wikimedia.org/wikipedia/ru/thumb/4/46/Discovery_Channel_International.svg/200px-Discovery_Channel_International.svg.png');
        addChannel(page, 'National Geographic', 'jampo', 'ngrus');
        addChannel(page, 'Animal Planet', 'jampo', 'animalplanet');
        addChannel(page, 'НЛО TV', 'sputniktv', 'http://sputniktv.in.ua/nlotv.html');
        addChannel(page, 'MEGA', 'sputniktv', 'http://sputniktv.in.ua/mega.html', 'http://upload.wikimedia.org/wikipedia/uk/7/77/Logo_Mega.png');
        addChannel(page, 'K1', 'jampo', 'k1', 'http://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/Logo_k1.png/244px-Logo_k1.png');
        addChannel(page, 'K2', 'jampo', 'k2', 'http://upload.wikimedia.org/wikipedia/ru/7/7e/Telekanal_k2.png');
        addChannel(page, 'QTV', 'sputniktv', 'http://sputniktv.in.ua/qtv.html', 'http://qtv.ua/images/default/logo.png');
        addChannel(page, 'Первый автомобильный', 'youtube', '', 'http://upload.wikimedia.org/wikipedia/ru/8/80/1auto_TV.jpg');
        addChannel(page, 'XSport', 'jampo', 'xsport', 'http://xsport.ua/bitrix/templates/xsport/images/logo.png');
        //addChannel(page, 'Гумор ТВ', 'ts', 'http://85.25.43.30:8232', '');
        //addChannel(page, 'Гумор ТВ', 'direct', 'rtmp://212.26.132.86/live/gumor_babai', '');
        addChannel(page, 'Гумор ТВ', 'direct', 'hls:http://212.26.132.86/hls/gumor_babai.m3u8', 'http://upload.wikimedia.org/wikipedia/uk/b/b1/Humor_logo.jpg');
        addChannel(page, 'Вікка', 'ts', 'http://193.254.196.179:8080', 'http://vikka.ua/img/logo.png');
        addChannel(page, 'ZIK', 'direct', 'rtmp://217.20.164.182:80/live/zik392p.stream', '');
        addChannel(page, 'ТВ Голд', 'direct', 'rtmp://77.88.210.226/tvgold.com.ua_live/livestream', 'https://yt3.ggpht.com/-WBTeSleTH8M/AAAAAAAAAAI/AAAAAAAAAAA/3ZWvOO3Pl8I/s100-c-k-no/photo.jpg');
        addChannel(page, 'ТРК Львів', 'direct', 'rtmp://gigaz.wi.com.ua/hallDemoHLS/LVIV', 'http://www.lodtrk.org.ua/inc/getfile.php?i=20111026133818.gif');
        addChannel(page, 'ATR', 'direct', 'hls:http://edge1.atr.ua:1935/liveedge/atr.stream/playlist.m3u8', 'http://atr.ua/assets/atr-logo-red/logo.png');
        addChannel(page, 'News One', 'direct', 'rtmp://newsonelivefs.fplive.net:443/newsonelive-live/_definst_/streamukr', '');
        addChannel(page, 'Тиса-1', 'direct', 'rtmp://213.174.8.15/live/live2', 'http://tysa1.tv/templates/jdwebsite/images/style1/logo.jpg');
        addChannel(page, 'БТБ', 'direct', 'rtmp://94.45.140.4/live/livestream', 'http://btbtv.com.ua/images/logo.png');
      }

      if (category == "Hungarian" || category == "All") {
       if (category == "All") {
        page.appendItem("", "separator", {
            title: 'Hungarian'
        });
       }
        addChannel(page, 'Euronews', 'euronews', 'hu', 'http://ua.euronews.com/media/logo_222.gif');
        addChannel(page, 'Fix', 'direct', 'rtmp://video.fixhd.tv/fix/hd.stream', 'http://dtvnews.hu/sites/default/files/images/fix_large.w160.jpg');
        addChannel(page, 'm1', 'gamax', 'http://admin.gamaxmedia.hu/player-inside-full?streamid=mtv1live&userid=mtva', '');
        addChannel(page, 'm2', 'gamax', 'http://admin.gamaxmedia.hu/player-inside-full?streamid=mtv2live&userid=mtva', '');
        addChannel(page, 'Duna TV', 'gamax', 'http://admin.gamaxmedia.hu/player-inside-full?streamid=dunalive&userid=mtva', '');
        addChannel(page, 'Duna World', 'gamax', 'http://admin.gamaxmedia.hu/player-inside-full?streamid=dunaworldlive&userid=mtva', '');
        addChannel(page, 'Konyha TV', 'direct', 'hls:http://91.82.85.44:1935/live/konyhatv/playlist.m3u8', '');
        addChannel(page, 'ATV', 'direct', 'rtmp://195.228.75.100/atvliveedge/_definst_/atvstream_2_aac', '');
        addChannel(page, 'Hir TV', 'direct', 'hls:http://streamserver.mno.netrix.hu/hls_delayed/live_ep_512k.m3u8', '');
        addChannel(page, 'NY TV', 'direct', 'rtmp://193.138.125.14/live/nytv.stream', '');
        addChannel(page, 'Debrecen TV', 'direct', 'rtmp://91.82.85.44:1935/relay2/DTV', '');
        addChannel(page, 'Pannon RTV', 'ts', 'http://212.200.235.242:8080/', '');

      }

      if (category == "Russian" || category == "All") {
       if (category == "All") {
        page.appendItem("", "separator", {
            title: 'Russian'
        });
       }
        addChannel(page, 'Euronews', 'euronews', 'ru', 'http://ua.euronews.com/media/logo_222.gif');
        //http://tv.life.ru/index.m3u8
        addChannel(page, 'Life News', 'direct', 'hls:http://tv.life.ru/index.m3u8', 'http://lifenews.ru/assets/logo-0a3a75be3dcc15b6c6afaef4adab52dd.png');
        //addChannel(page, 'Россия 24', 'direct', 'hls:http://testlivestream.rfn.ru/live/smil:r24.smil/playlist.m3u8?auth=vh&cast_id=21', '');
        addChannel(page, 'Россия 24', 'vgtrk', 'http://player.rutv.ru/iframe/datalive/id/21/sid/r24', '');
        //addChannel(page, 'Россия 1', 'direct', 'hls:http://213.208.179.135/rr2/smil:rtp_r1_rr.smil/playlist.m3u8?auth=vh&cast_id=2961', '');
        addChannel(page, 'Россия 1', 'vgtrk', 'http://player.rutv.ru/iframe/datalive/id/2961/sid/rutv', '');
        addChannel(page, 'Россия 2', 'vgtrk', 'http://player.rutv.ru/iframe/datalive/id/3465/sid/russia2', '');
        //addChannel(page, 'Россия РТР', 'direct', 'hls:http://151.236.123.4/rr2/smil:rtp_rtrp_rr.smil/playlist.m3u8?auth=vh&cast_id=4941', '');
        addChannel(page, 'Россия РТР', 'vgtrk', 'http://player.rutv.ru/iframe/datalive/id/4941/sid/rtrplaneta', '');
        addChannel(page, 'Россия К', 'glaz', 'rossiya-k');
        //addChannel(page, 'Москва 24', 'direct', 'hls:http://testlivestream.rfn.ru/live/smil:m24.smil/playlist.m3u8?auth=vh&cast_id=1661', '');
        addChannel(page, 'Москва 24', 'vgtrk', 'http://player.rutv.ru/iframe/datalive/id/1661/sid/m24', '');
        addChannel(page, 'РИА Новости', 'direct', 'hls:http://rian.cdnvideo.ru:1935/rr/stream20/index.m3u8', '');
        addChannel(page, 'RBC', 'direct', 'hls:http://online.video.rbc.ru/online/rbctv_480p/index.m3u8');
        addChannel(page, 'RTД', 'direct', 'hls:http://62.213.85.137/rtdru/rtdru.m3u8', '');
        addChannel(page, 'Дождь', 'direct', 'hls:http://prosmotra.net/StreamList/Dozhd.m3u8', 'http://tvrain-st.cdn.ngenix.net/static/css/pub/images/logo-tvrain.png');
        addChannel(page, 'HD Media', 'direct', 'hls:http://serv02.vintera.tv:1935/push/hdmedia.stream/playlist.m3u8', '');
        addChannel(page, 'HD Media 3D', 'direct', 'hls:http://hdmedia3d.vintera.tv:1935/hdmedia3d/hdmedia3d.stream/playlist.m3u8', '');
        addChannel(page, 'Brodilo.TV', 'ts', 'http://brodilo.tv/channel.php');
        addChannel(page, 'ЛДПР live', 'direct', 'hls:http://213.247.198.250:1935/live/ldpr.stream/playlist.m3u8', 'http://ldpr.tv/img/header/logo.png');
        addChannel(page, 'Hello TV', 'direct', 'rtmp://live.tvhello.ru/live//Stream1');
        addChannel(page, 'НТВ', 'sputniktv', 'http://sputniktv.in.ua/ntv.html');
        addChannel(page, 'Первый', 'jampo', 'ort');
        addChannel(page, 'THT Comedy', 'sputniktv', 'http://sputniktv.in.ua/comedy-club-tv.html');
        addChannel(page, 'THT', 'jampo', 'tnt');
        addChannel(page, 'CTC', 'glaz', 'sts');
        addChannel(page, 'Рен ТВ', 'glaz', 'ren-tv');
        addChannel(page, 'ТВ3', 'jampo', 'tv3');
        addChannel(page, '2x2', 'jampo', '2x2');
        addChannel(page, 'Перец', 'glaz', 'perec');
        addChannel(page, 'ТВЦ', 'glaz', 'tv-centr');
        addChannel(page, 'Домашний', 'glaz', 'domashniy');
        addChannel(page, 'Звезда', 'glaz', 'zvezda');
        addChannel(page, 'Юмор ТВ', 'sputniktv', 'http://sputniktv.in.ua/jumor-tv.html');
        addChannel(page, 'Ростов ТВ', 'direct', 'hls:http://rostovlife.vintera.tv:1935/mediapark/rostov_tv1.stream/playlist.m3u8', '');
        addChannel(page, 'Маяк FM', 'direct', 'hls:http://testlivestream.rfn.ru/live/smil:mayak.smil/playlist.m3u8?auth=vh&cast_id=81', '');
        addChannel(page, 'World Fashion', 'jampo', 'wf', '');
        addChannel(page, 'Luxury World', 'direct', 'hls:http://nano.teleservice.su:8080/hls/luxury.m3u8', '');
        addChannel(page, 'Стиль и мода', 'direct', 'hls:http://btv-net.mediacdn.ru/TVB4/stilimoda/playlist.m3u8', '');
        addChannel(page, 'КПРФ', 'direct', 'rtmp://kprf-live.cdn.ngenix.net/live/mp4:stream_700.mp4', '');
        addChannel(page, 'KZN', 'direct', 'hls:http://rtmp.tatinf.ru:1935/live/fullkzntv/playlist.m3u8', '');
        addChannel(page, 'БСТ', 'direct', 'hls:http://btv-net.mediacdn.ru/TVB4/bst/track_1/playlist.m3u8', '');
        addChannel(page, 'ВКТ', 'direct', 'hls:http://vkt.cdnvideo.ru/rtp/3/playlist.m3u8', '');
        addChannel(page, 'Nano TV', 'direct', 'hls:http://nano.teleservice.su:8080/hls/nano.m3u8', '');
        addChannel(page, 'ТВТУР.TV', 'direct', 'rtmp://80.93.53.88/live/channel_2', '');
        addChannel(page, 'Релакс.TV', 'direct', 'rtmp://80.93.53.88/live/channel_3', '');
        addChannel(page, 'Премьера.TV', 'direct', 'rtmp://80.93.53.88/live/channel_5', '');
        addChannel(page, 'Кино РФ', 'direct', 'rtmp://gb.orange.ether.tv/live/unikino/broadcast18', '');
        addChannel(page, 'ФК Рубин', 'direct', 'rtmp://grey.ether.tv/live/rubin/broadcast4', '');
        addChannel(page, '5 канал', 'direct', 'hls:http://178.49.132.73/streaming/5kanal/tvrec/playlist.m3u8', '');
        addChannel(page, 'ОТС', 'direct', 'hls:http://178.49.132.73/streaming/ots/tvrec/playlist.m3u8', '');
        addChannel(page, '49 канал (Новосибирск)', 'direct', 'hls:http://178.49.132.73/streaming/49kanal/tvrec/playlist.m3u8', '');
        addChannel(page, 'Auto.ru TV', 'direct', 'hls:http://ms1.autoru.tv:1935/live/360p/playlist.m3u8', '');
      }
    });

    // Start page
    plugin.addURI(plugin.getDescriptor().id + ":start", function(page) {
        setPageHeader(page, slogan);
	page.appendItem(plugin.getDescriptor().id + ":favorites", "directory", {
	    title: "My Favorites"
	});
	page.appendItem(plugin.getDescriptor().id + ":category:All", "directory", {
	    title: "All"
	});
	page.appendItem(plugin.getDescriptor().id + ":category:News", "directory", {
	    title: "News"
	});
	page.appendItem(plugin.getDescriptor().id + ":category:Children", "directory", {
	    title: "Children"
	});
	page.appendItem(plugin.getDescriptor().id + ":category:Music", "directory", {
	    title: "Music"
	});
	page.appendItem(plugin.getDescriptor().id + ":category:Ukrainian", "directory", {
	    title: "Ukrainian"
	});
	page.appendItem(plugin.getDescriptor().id + ":category:Russian", "directory", {
	    title: "Russian"
	});
	page.appendItem(plugin.getDescriptor().id + ":category:Hungarian", "directory", {
	    title: "Hungarian"
	});
    });
})(this);
