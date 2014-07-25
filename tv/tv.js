/*
 *  Online TV
 *
 *  Copyright (C) 2014 lprot
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
    var PREFIX = "tv:";
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

    plugin.createService(slogan, PREFIX + "start", "tv", true, logo);

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

    plugin.addURI(PREFIX + "youtube:(.*)", function(page, title) {
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
                    sources: [{
                        url: "hls:" + match[1].replace(/\\\//g, '/')
                    }]
                });
            } else
                 page.error("Sorry, can't get channel's link :(");
        }

        // search for the channel
        page.loading = true;
        resp = showtime.httpReq("https://www.youtube.com/results?search_query=" + title.replace(/\s/g, '+')).toString();
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

    plugin.addURI(PREFIX + "seetv:(.*):(.*)", function(page, url, title) {
        page.loading = true;
        var resp = showtime.httpReq("http://seetv.tv/see/" + url).toString();
        page.loading = false;
        var match = resp.match(/file=([\S\s]*?)\&/);
            if (match) {
                page.type = "video";
                page.source = "videoparams:" + showtime.JSONEncode({
                    title: unescape(title),
                    sources: [{
                        url: match[1]
                    }]
                });
            } else
                 page.error("Sorry, can't get the link :(");
    });

    plugin.addURI(PREFIX + "jampo:(.*):(.*)", function(page, url, title) {
        page.loading = true;
        var resp = showtime.httpReq("http://tv.jampo.tv/play/channel/" + url).toString();
        page.loading = false;
        var match = resp.match(/"st=([\S\s]*?)\&/);
        if (match) {
            page.type = "video";
            page.source = "videoparams:" + showtime.JSONEncode({
                title: unescape(title),
                sources: [{
                    url: 'hls:' + showtime.JSONDecode(unhash(match[1])).file
                }]
            });
        } else
            page.error("Sorry, can't get the link :(");
    });

    plugin.addURI(PREFIX + "glaz:(.*):(.*)", function(page, url, title) {
        page.loading = true;
        var resp = showtime.httpReq("http://www.glaz.tv/online-tv/" + url).toString();
        page.loading = false;
        var match = resp.match(/file=([\S\s]*?)\&/);
            if (match) {
                page.type = "video";
                page.source = "videoparams:" + showtime.JSONEncode({
                    title: unescape(title),
                    sources: [{
                        url: match[1]
                    }]
                });
            } else
                 page.error("Sorry, can't get the link :(");
    });

    plugin.addURI(PREFIX + "trk:(.*)", function(page, title) {
        page.loading = true;
        var resp = showtime.httpReq("http://kanalukraina.tv/online/").toString();
        page.loading = false;
        var match = resp.match(/"trku"[\S\s]*?\[[\S\s]*?"([\S\s]*?)"/);
            if (match) {
                page.type = "video";
                page.source = "videoparams:" + showtime.JSONEncode({
                    title: unescape(title),
                    sources: [{
                        url: "hls:" + match[1]
                    }]
                });
            } else
                 page.error("Sorry, can't get the link :(");
    });

    function addChannel(page, title, url, icon) {
        var mimetype = '';
        if (url.substr(0, 3) == 'ts:') {
            mimetype = 'video/mp2t';
            url = url.substr(3, url.length - 3);
        }
        var link = "videoparams:" + showtime.JSONEncode({
                        sources: [{
                            url: url,
                            mimetype: mimetype
                        }],
                        title: title,
                        no_fs_scan: true
                   });

        if (url == 'youtube')
            link = PREFIX + "youtube:" + title;

        if (url.substr(0, 5)  == 'seetv')
            link = PREFIX + url + ":" + escape(title);

        if (url.substr(0, 5)  == 'jampo')
            link = PREFIX + url + ":" + escape(title);

        if (url.substr(0, 4)  == 'glaz')
            link = PREFIX + url + ":" + escape(title);

        if (url.substr(0, 3)  == 'trk')
            link = PREFIX + "trk:" + escape(title);

        var item = page.appendItem(link, "video", {
            title: title,
            icon: icon
        });

        item.onEvent("addFavorite", function(item) {
     	    var entry = {
	        link: link,
                title: title,
                icon: icon
	    };
	    var list = eval(store.list);
            var array = [showtime.JSONEncode(entry)].concat(list);
            store.list = showtime.JSONEncode(array);
	    showtime.notify("'" + title + "' has been added to My Favorites.", 2);
	});
	item.addOptAction("Add '" + title + "' to My Favorites", "addFavorite");
    }

    function fill_fav(page) {
	var list = eval(store.list);

        if (!list || !list.toString()) {
           page.error("My Favorites list is empty");
           return;
        }
        var pos = 0;
	for each (item in list) {
	    var itemmd = showtime.JSONDecode(item);
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
    plugin.addURI(PREFIX + "favorites", function(page) {
        setPageHeader(page, "My Favorites");
        fill_fav(page);
    });

    // Categories
    plugin.addURI(PREFIX + "category:(.*)", function(page, category) {
      setPageHeader(page, category);
      if (category == "News" || category == "All") {
        page.appendItem("", "separator", {
            title: 'English'
        });
        //rtsp://media2.lsops.net/live/euronews_ru_high.sdp
        //hls:http://hd1.lsops.net/live/euronews_en.smil/playlist.m3u8
        addChannel(page, 'Euronews', 'rtmp://fr-par-10-stream-relay.hexaglobe.net/rtpeuronewslive/en_video750_rtp.sdp swfUrl=http://www.euronews.com/media/player_live_1_14.swf swfVfy=true live=true', 'http://upload.wikimedia.org/wikipedia/commons/thumb/9/93/Euronews_logo.svg/200px-Euronews_logo.svg.png');
        //addChannel(page, 'Russia Today', 'hls:http://178.49.132.73/streaming/russiatoday/tvrec/playlist.m3u8', '');
        addChannel(page, 'Russia Today', 'hls:http://rt.ashttp14.visionip.tv/live/rt-global-live-HD/playlist.m3u8', 'http://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/Russia-today-logo.svg/200px-Russia-today-logo.svg.png');
        addChannel(page, 'Russia Today Documentary', 'hls:http://rt.ashttp14.visionip.tv/live/rt-doc-live-HD/playlist.m3u8', 'http://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/Russia-today-logo.svg/200px-Russia-today-logo.svg.png');
        addChannel(page, 'BBC World News', 'hls:http://livestation_hls-lh.akamaihd.net/i/bbcworld_en@105465/index_928_av-b.m3u8', 'http://upload.wikimedia.org/wikipedia/commons/6/6c/BBC_World_News_red.svg');
        addChannel(page, 'DW Europe', 'hls:http://dwtvios_europa-i.akamaihd.net/hls/live/200515/dwtveuropa/1/playlist1x.m3u8', 'https://lh5.googleusercontent.com/-9Ir29NdKHLU/AAAAAAAAAAI/AAAAAAAAIiY/TF5J4A4ZdP8/s120-c/photo.jpg');
        addChannel(page, 'France 24', 'hls:http://vipwowza.yacast.net/f24_hlslive_en/_definst_/mp4:fr24_en_748.stream/playlist.m3u8', 'http://upload.wikimedia.org/wikipedia/en/thumb/6/65/FRANCE_24_logo.svg/200px-FRANCE_24_logo.svg.png');
        //addChannel(page, 'CNN', 'rtmp://hd1.lsops.net/live/ playpath=cnn_en_584 swfUrl="http://static.ls-cdn.com/player/5.10/livestation-player.swf" swfVfy=true live=true', 'http://upload.wikimedia.org/wikipedia/commons/8/8b/Cnn.svg');
        //addChannel(page, 'CNN', 'hls:http://livestation_hls-lh.akamaihd.net/i/cnn_en@105455/master.m3u8', 'http://upload.wikimedia.org/wikipedia/commons/8/8b/Cnn.svg');
        addChannel(page, 'CNN', 'hls:http://178.49.132.73/streaming/cnn/tvrec/playlist.m3u8', '');
        addChannel(page, 'CNBC', 'hls:http://livestation_hls-lh.akamaihd.net/i/cnbc_en@106428/master.m3u8', 'http://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/CNBC_logo.svg/200px-CNBC_logo.svg.png');
        addChannel(page, 'Bloomberg', 'hls:http://hd4.lsops.net/live/bloomber_en_hls.smil/playlist.m3u8', 'http://upload.wikimedia.org/wikipedia/commons/thumb/5/56/Bloomberg_logo.svg/200px-Bloomberg_logo.svg.png');
        //http://live.bltvios.com.edgesuite.net/oza2w6q8gX9WSkRx13bskffWIuyf/BnazlkNDpCIcD-QkfyZCQKlRiiFnVa5I/master.m3u8?geo_country=US
        addChannel(page, 'Sky News', 'hls:http://hd2.lsops.net/live/skynewsi_en_372/playlist.m3u8', 'http://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/Sky_News.svg/200px-Sky_News.svg.png');
        addChannel(page, 'Press TV', 'hls:http://media23.lsops.net/live/presstv_en_hls.smil/playlist.m3u8', 'http://upload.wikimedia.org/wikipedia/en/2/23/PressTV.png');
        addChannel(page, 'i24 News', 'hls:http://bcoveliveios-i.akamaihd.net/hls/live/215102/master_english/398/master.m3u8', '');
        //http://aya02.livem3u8.me.totiptv.com/live/ea4c9d2666bc411d8e6777e8a1d2b747.m3u8?pt=1&code=4d4549b2c1f6926f8698e13c0123177a
        addChannel(page, 'Reuters', 'hls:http://37.58.85.156/rlo001/ngrp:rlo001.stream_all/playlist.m3u8', 'http://upload.wikimedia.org/wikipedia/ru/a/a0/Reuters_2008_logo.svg');
        addChannel(page, 'AlJazeera', 'rtmp://hd2.lsops.net/live playpath=aljazeer_en_838 swfUrl="http://static.ls-cdn.com/player/5.10/livestation-player.swf" swfVfy=true live=true', 'http://upload.wikimedia.org/wikipedia/en/7/71/Aljazeera.svg');
        addChannel(page, 'Arirang', 'http://worldlive-ios.arirang.co.kr/arirang/arirangtvworldios.mp4.m3u8', 'http://upload.wikimedia.org/wikipedia/commons/thumb/9/94/Arirang.svg/200px-Arirang.svg.png');
        //addChannel(page, 'NHK World', 'hls:http://plslive-w.nhk.or.jp/nhkworld/app/live.m3u8', '');
        addChannel(page, 'NHK World', 'hls:http://nhkworldlive-lh.akamaihd.net/i/nhkworld_w@145835/master.m3u8', 'http://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/NHK_World.svg/200px-NHK_World.svg.png');
        addChannel(page, 'CCTV News', 'hls:http://88.212.11.206:5000/live/22/22.m3u8', '');
        addChannel(page, 'Nasa TV (public)', 'hls:http://public.infozen.cshls.lldns.net/infozen/public/public.m3u8', '');
        addChannel(page, 'Nasa TV (education)', 'hls:http://edu.infozen.cshls.lldns.net/infozen/edu/edu.m3u8', '');
        addChannel(page, 'Nasa TV (media)', 'hls:http://media.infozen.cshls.lldns.net/infozen/media/media.m3u8', '');
        addChannel(page, 'Twit TV', 'hls:http://iphone-streaming.ustream.tv/ustreamVideo/1524/streams/live/playlist.m3u8', '');
        addChannel(page, 'Redbull TV', 'hls:http://live.iphone.redbull.de.edgesuite.net/webtvHD.m3u8', '');
        addChannel(page, 'Docu Box HD', 'hls:http://spi-live.ercdn.net/spi/smil:docuboxhd_0.smil/playlist.m3u8', '');
        addChannel(page, 'Fast & Fun Box HD', 'hls:http://spi-live.ercdn.net/spi/smil:fastnfunhd_0.smil/playlist.m3u8', '');
        addChannel(page, 'Fashion Box HD', 'hls:http://spi-live.ercdn.net/spi/smil:fashionboxhd_0.smil/playlist.m3u8', '');
        addChannel(page, 'Fashion', 'hls:http://178.49.132.73/streaming/fashion/tvrec/playlist.m3u8', '');
        addChannel(page, 'Trace Sports', 'hls:http://46.249.213.87/iPhone/broadcast/tracetvsports-tablet.3gp.m3u8', '');
        addChannel(page, 'Sporttime.tv HDTV 1', 'rtmp://streamer.a1.net:1935/rtmplive/redundant/channels/Sporttime/SporttimeTV/mp4:channel1_1200', '');
        addChannel(page, 'Sporttime.tv HDTV 2', 'rtmp://streamer.a1.net:1935/rtmplive/redundant/channels/Sporttime/SporttimeTV/mp4:channel2_1200', '');
        addChannel(page, 'Sporttime.tv HDTV 3', 'rtmp://streamer.a1.net:1935/rtmplive/redundant/channels/Sporttime/SporttimeTV/mp4:channel3_1200', '');
        addChannel(page, 'Sporttime.tv HDTV 4', 'rtmp://streamer.a1.net:1935/rtmplive/redundant/channels/Sporttime/SporttimeTV/mp4:channel4_1200', '');
        addChannel(page, 'Sporttime.tv HDTV 5', 'rtmp://streamer.a1.net:1935/rtmplive/redundant/channels/Sporttime/SporttimeTV/mp4:channel5_1200', '');
        addChannel(page, 'Sporttime.tv HDTV 6', 'rtmp://streamer.a1.net:1935/rtmplive/redundant/channels/Sporttime/SporttimeTV/mp4:channel6_1200', '');
        addChannel(page, 'Sporttime.tv HDTV 7', 'rtmp://streamer.a1.net:1935/rtmplive/redundant/channels/Sporttime/SporttimeTV/mp4:channel7_1200', '');
        addChannel(page, 'myZen.tv', 'glaz:myzen-tv', '');

        page.appendItem("", "separator", {
            title: 'Deutsch'
        });
        addChannel(page, 'N24', 'hls:http://n24-live.hls.adaptive.level3.net/hls-live/n24-pssimn24live/_definst_/live/stream2.m3u8', 'http://upload.wikimedia.org/wikipedia/de/2/20/N24_logo.svg');
        addChannel(page, 'ZDF', 'hls:http://88.212.11.206:5000/live/28/28.m3u8', 'http://upload.wikimedia.org/wikipedia/commons/0/02/ZDF.svg');
        addChannel(page, 'NDR HD', 'hls:http://ndr_fs-lh.akamaihd.net/i/ndrfs_nds@119224/master.m3u8', 'http://upload.wikimedia.org/wikipedia/commons/thumb/0/08/NDR_Dachmarke.svg/200px-NDR_Dachmarke.svg.png');
        addChannel(page, 'WDR HD', 'hls:http://www.metafilegenerator.de/WDR/WDR_FS/m3u8/wdrfernsehen.m3u8', 'http://upload.wikimedia.org/wikipedia/commons/thumb/b/bc/WDR_Re-Branding_2012_Logo.svg/200px-WDR_Re-Branding_2012_Logo.svg.png');
        addChannel(page, 'RBB', 'hls:http://88.212.11.206:5000/live/13/13.m3u8', 'http://upload.wikimedia.org/wikipedia/commons/thumb/9/98/Rundfunk_Berlin-Brandenburg_logo.svg/200px-Rundfunk_Berlin-Brandenburg_logo.svg.png');
        addChannel(page, 'Okto', 'hls:http://atwse.lbs.atusmedia.cc:1935/oktolive/okto-low.stream/hasbahca.m3u8', 'http://upload.wikimedia.org/wikipedia/de/thumb/7/7b/Okto.svg/200px-Okto.svg.png');

        page.appendItem("", "separator", {
            title: 'Danish'
        });
        addChannel(page, 'Kanal Sport', 'hls:http://lswb-de-08.servers.octoshape.net:1935/live/kanalsport_2000k/hasbahca.m3u8', 'http://kanalsport.dk/img/layout/logo_top.png');
        addChannel(page, 'Folketinget', 'rtmp://ftflash.arkena.dk/webtvftlivefl/ playpath=mp4:live.mp4 pageUrl=http://www.ft.dk/webTV/TV_kanalen_folketinget.aspx live=1', '');

      }

      if (category == "Children" || category == "All") {
        if (category == "All") {
            page.appendItem("", "separator", {
                title: 'Children'
            });
        }
        //addChannel(page, 'Nickelodeon', 'hls:http://hls.cn.ru/streaming/nickelodeon/tvrec/playlist.m3u8', '');
        addChannel(page, 'Nickelodeon', 'hls:http://178.49.132.73/streaming/nickelodeon/tvrec/playlist.m3u8', '');
        addChannel(page, 'Карусель', 'hls:http://178.49.132.73/streaming/karusel/tvrec/playlist.m3u8', '');
        addChannel(page, 'Детский', 'hls:http://178.49.132.73/streaming/forkids/tvrec/playlist.m3u8', '');
        addChannel(page, 'Мать и дитя', 'hls:http://178.49.132.73/streaming/motherchi/tvrec/playlist.m3u8', '');
        addChannel(page, 'Піксель', 'glaz:piksel-tv', '');
        addChannel(page, 'Плюс Плюс', 'jampo:plusplus', '');
      }

      if (category == "Music" || category == "All") {
        if (category == "All") {
            page.appendItem("", "separator", {
                title: 'Music'
            });
        }
        //addChannel(page, 'PIK.TV', 'rtmp://fms.pik-tv.com/live/piktv2pik2tv.flv', '');
        addChannel(page, 'Dance  TV', 'hls:http://91.82.85.16:1935/relay15/nettv_channel_1/playlist.m3u8', 'http://www.dancetv.hu/index_htm_files/9.png');
        addChannel(page, 'King TV', 'hls:http://91.82.85.16:1935/relay15/nettv03_channel_1/playlist.m3u8', 'http://www.dancetv.hu/index_htm_files/141.png');
        addChannel(page, '1HD', 'hls:http://109.239.142.62:1935/live/hlsstream/playlist3.m3u8', 'http://cs614626.vk.me/v614626983/4712/Ae-m7Qoz364.jpg');
        //addChannel(page, '1HD (RTMP)', 'rtmp://109.239.142.62/live/livestream3', '');
        addChannel(page, 'PIK TV', 'hls:http://fms.pik-tv.com:1935/live/piktv3pik3tv/playlist.m3u8', '');
        addChannel(page, '360 Tune Box', 'hls:http://spi-live.ercdn.net/spi/360tuneboxhd_0_1/playlist.m3u8', '');
        addChannel(page, 'MOX', 'hls:http://mox.tv/hls/moxtv-a6.m3u8', '');
        addChannel(page, 'Vevo 1', 'hls:http://vevoplaylist-live.hls.adaptive.level3.net/vevo/ch1/06/prog_index.m3u8', '');
        addChannel(page, 'Vevo 2', 'hls:http://vevoplaylist-live.hls.adaptive.level3.net/vevo/ch2/06/prog_index.m3u8', '');
        addChannel(page, 'Vevo 3', 'hls:http://vevoplaylist-live.hls.adaptive.level3.net/vevo/ch3/06/prog_index.m3u8', '');
        addChannel(page, 'Ocko Express HD', 'hls:http://194.79.52.78:1935/expresi/ExpresHD2/playlist.m3u8', '');
        addChannel(page, 'Lobas TV', 'rtmp://149.11.34.78/live/lobas.stream', '');
        addChannel(page, 'Beatz TV', 'rtmp://rtmp.infomaniak.ch:1935/livecast/beats_2', '');
        addChannel(page, 'Clubbing TV', 'rtmp://204.107.26.252:8086/live/691.high.stream', '');
        addChannel(page, 'Streetclip.TV', 'rtmp://stream.streetclip.tv:1935/live/high-stream', '');
        addChannel(page, 'Cat Music', 'rtmp://91.82.85.71:1935/relay8/fstv_channel_1', '');
        addChannel(page, 'Getback.im', 'rtmp://stream.getback.im:1935/live/getback', '');
        addChannel(page, '538TV', 'hls:http://82.201.53.52:80/livestream/tv538/playlist.m3u8', '');
        addChannel(page, 'Slam TV', 'hls:http://82.201.53.52:80/livestream/slamtv/playlist.m3u8', '');
        addChannel(page, 'Party TV', 'rtmp://149.11.34.6/live/partytv.stream', '');
        //addChannel(page, 'Rouge TV', 'rtmp://rtmp.infomaniak.ch/livecast/rougetv', '');
        addChannel(page, 'Rouge TV', 'hls:http://rtmp.infomaniak.ch/livecast/rougetv/playlist.m3u8', '');
        addChannel(page, 'TVM3', 'hls:http://rtmp.infomaniak.ch:1935/livecast/tvm3/playlist.m3u8', '');
        addChannel(page, 'Capital TV', 'hls:http://cdn-sov-2.musicradio.com:80/LiveVideo/Capital/playlist.m3u8', '');
        addChannel(page, 'Heart TV', 'hls:http://cdn-sov-2.musicradio.com:80/LiveVideo/Heart/playlist.m3u8', '');
        addChannel(page, 'OUI TV', 'hls:http://rtmp.infomaniak.ch:1935/livecast/ouitv/playlist.m3u8', '');
        addChannel(page, 'RTL 105.2', 'hls:http://origin-rtl-radio-stream.4mecloud.it/live-video/radiovisione/ngrp:radiovisione/chunklist-b1164000.m3u8', '');
        //addChannel(page, 'Europa Plus TV (RTMP)', 'rtmp://europaplus.cdnvideo.ru/europaplus-live//mp4:eptv_main.sdp', 'http://www.europaplustv.com/images/europa_tv.png');
        addChannel(page, 'Europa Plus TV', 'hls:http://europaplus.cdnvideo.ru/europaplus-live/mp4:eptv_main.sdp/playlist.m3u8', 'http://www.europaplustv.com/images/europa_tv.png');
        addChannel(page, 'A-One', 'hls:http://178.49.132.73/streaming/aone/tvrec/playlist.m3u8', '');
        addChannel(page, 'OTV', 'jampo:otv', '');
        //rtmp://212.26.132.86/live/mb_ua
        addChannel(page, 'Music Box UA', 'hls:http://212.26.132.86/hls/mb_ua.m3u8', '');
        addChannel(page, 'Planeta TV', 'hls:http://w1.drundoo.com:1935/DrundooDVR/_definst_/smil:405f1996-77f1-47e9-9646-0c6bfa5e18aa.smil/stream.m3u8', '');
        addChannel(page, 'Balkanika', 'hls:http://74.122.193.194:1935/DrundooDVR/_definst_/smil:776c511d-aee0-4e33-a44e-265e464c0a28.smil/stream.m3u8', '');
        addChannel(page, 'Fen TV', 'hls:http://74.122.193.194:1935/DrundooDVR/_definst_/smil:90e18283-cdb3-4c13-8c4f-b80897497858.smil/stream.m3u8', '');
        addChannel(page, 'City TV', 'hls:http://74.122.193.194:1935/DrundooDVR/_definst_/smil:e0820ba7-2c1a-4286-ac1b-f00bb9dcbe61.smil/stream.m3u8', '');
        addChannel(page, 'Stars TV', 'hls:http://starstv-live.e91-jw.insyscd.net/starstv.isml/QualityLevels(960000)/manifest(format=m3u8-aapl).m3u8', '');
        addChannel(page, 'RU TV', 'hls:http://vniitr.cdnvideo.ru/vniitr-live/vniitr.sdp/playlist.m3u8', '');
        //addChannel(page, 'Fresh TV', 'hls:http://80.93.53.88:1935/live/channel_4/playlist.m3u8', '');
        addChannel(page, 'Fresh TV', 'rtmp://80.93.53.88/live/channel_4', '');
        addChannel(page, 'For Music', 'rtmp://wowza1.top-ix.org/quartaretetv1/formusicweb', '');
        //addChannel(page, 'Ocko (RTMP)', 'rtmp://194.79.52.79/ockoi/ockoHQ1', '');
        addChannel(page, 'Ocko', 'hls:http://194.79.52.79/ockoi/ockoHQ1/hasbahca.m3u8', '');
        addChannel(page, 'Ocko Gold', 'hls:http://194.79.52.79:1935/goldi/goldHQ1/playlist.m3u8', '');
        addChannel(page, 'Ocko Express', 'hls:http://194.79.52.79:1935/expresi/expresHQ1/playlist.m3u8', '');
        addChannel(page, 'Kino Polska Muzyka', 'hls:http://spi-live.ercdn.net/spi/smil:kinopolskamuzikasd_international_0.smil/playlist.m3u8', '');
        addChannel(page, 'Eska Best Music TV', 'hls:http://stream.smcloud.net:1935/live2/best/best_360p/playlist.m3u8', '');
        addChannel(page, 'Eska Party TV', 'hls:http://stream.smcloud.net:1935/live2/eska_party/eska_party_360p/playlist.m3u8', '');
        //rtmp://stream.smcloud.net/live2/eskatv/eskatv_360p
        addChannel(page, 'Eska TV', 'hls:http://stream.smcloud.net:1935/live2/eskatv/eskatv_360p/playlist.m3u8', '');
        addChannel(page, 'Eska Rock TV', 'hls:http://stream.smcloud.net:1935/live2/eska_rock/eska_rock_360p/playlist.m3u8', '');
        addChannel(page, 'Eska Wawa TV', 'hls:http://stream.smcloud.net:1935/live2/wawa/wawa_360p/playlist.m3u8', '');
        addChannel(page, 'Eska Vox TV', 'hls:http://stream.smcloud.net:1935/live2/vox/vox_360p/playlist.m3u8', '');
        addChannel(page, 'Eska Polo TV', 'hls:http://stream.smcloud.net:1935/live/polotv/playlist.m3u8', '');
        addChannel(page, 'IbizaOnTV', 'hls:http://46.249.213.87/iPhone/broadcast/ibizaontv-tablet.3gp.m3u8', '');
        addChannel(page, 'Trace Urban', 'hls:http://46.249.213.87/iPhone/broadcast/tracetvurban-tablet.3gp.m3u8', '');
        addChannel(page, 'MTV', 'glaz:mtv-russia', '');
        addChannel(page, 'MTV Live HD', 'hls:http://202.75.23.37:8800/live/ch50/01.m3u8', '');
        addChannel(page, 'JuCe TV', 'hls:http://hls.cn.ru/streaming/juce/tvrec/playlist.m3u8', '');
        addChannel(page, 'Vitamine', 'rtmp://rtmp.infomaniak.ch/livecast/vitatv', '');
        addChannel(page, 'Rusong TV', 'hls:http://rusong.cdnvideo.ru:443/rtp/rusong2/chunklist.m3u8', '');
        addChannel(page, 'Russian Musicbox', 'hls:http://musicbox.cdnvideo.ru/musicbox-live/musicbox.sdp/playlist.m3u8', '');
        addChannel(page, 'Шансон ТВ', 'hls:http://chanson.cdnvideo.ru:1935/chanson-live/shansontv.sdp/playlist.m3u8', '');
        addChannel(page, 'Music Box', 'hls:http://hls.cn.ru/streaming/musboxtv/tvrec/playlist.m3u8', '');
        addChannel(page, 'MusicBox Ru', 'hls:http://178.49.132.73/streaming/musboxru/tvrec/playlist.m3u8', '');
        addChannel(page, 'MusicBox', 'hls:http://178.49.132.73/streaming/musboxtv/tvrec/playlist.m3u8', '');
        addChannel(page, 'O2', 'hls:http://178.49.132.73/streaming/o2tv/tvrec/playlist.m3u8', '');
        addChannel(page, '9 волна', 'rtmp://176.9.127.102/live/myStream_1', '');
        addChannel(page, '1 music', 'rtmp://80.232.172.37/rtplive/vlc.sdp', '');
        addChannel(page, 'BIM TV', 'hls:http://goo.gl/glJV3o', '');
        //rtmp://rtmp.infomaniak.ch/livecast//ouitv
        addChannel(page, 'Musiq 1 TV', 'ts:http://212.79.96.134:8005', '');
        addChannel(page, '1 Classic', 'ts:http://212.79.96.134:8024', '');

        page.appendItem("", "separator", {
            title: 'LiveHD'
        });
        addChannel(page, 'Live Mix', 'hls:http://91.201.78.3:1935/live/onehdhd/playlist.m3u8', '');
        addChannel(page, 'Pop', 'hls:http://91.201.78.3:1935/live/pophd/playlist.m3u8', '');
        addChannel(page, 'Rock', 'hls:http://91.201.78.3:1935/live/rockhd/playlist.m3u8', '');
        addChannel(page, 'Jazz', 'hls:http://91.201.78.3:1935/live/jazzhd/playlist.m3u8', '');
        addChannel(page, 'Classic', 'hls:http://91.201.78.3:1935/live/classicshd/playlist.m3u8', '');
        addChannel(page, 'Dance', 'hls:http://91.201.78.3:1935/live/dancehd/playlist.m3u8', '');
      }
      if (category == "Ukrainian" || category == "All") {
        if (category == "All") {
            page.appendItem("", "separator", {
                title: 'Ukrainian'
            });
        }
        //addChannel(page, 'Euronews', 'rtmp://fr-par-10-stream-relay.hexaglobe.net/rtpeuronewslive/ua_video750_rtp.sdp swfUrl=http://www.euronews.com/media/player_live_1_14.swf swfVfy=true live=true', 'http://ua.euronews.com/media/logo_222.gif');
        addChannel(page, 'Euronews', 'jampo:euronews-ukr', 'http://ua.euronews.com/media/logo_222.gif');
        addChannel(page, 'Espreso TV', 'youtube', 'https://yt3.ggpht.com/-bVnYWgZunWc/AAAAAAAAAAI/AAAAAAAAAAA/lscLbX2rp2A/s88-c-k-no/photo.jpg');
        addChannel(page, 'Hromadske.tv', 'youtube', 'https://yt3.ggpht.com/-p31Ot-UmPks/AAAAAAAAAAI/AAAAAAAAAAA/4bKlgSnfyOs/s88-c-k-no/photo.jpg');
        addChannel(page, '5 канал', 'youtube', 'http://upload.wikimedia.org/wikipedia/commons/3/3e/5logo.jpg');
        addChannel(page, '5 канал', 'jampo:5tv', 'http://upload.wikimedia.org/wikipedia/commons/3/3e/5logo.jpg');
        addChannel(page, '24 канал', 'youtube', 'http://24tv.ua/img/24_logo_facebook.jpg');
        addChannel(page, 'UBR', 'youtube', 'https://yt3.ggpht.com/-7jc3b3Xttfg/AAAAAAAAAAI/AAAAAAAAAAA/MXEE_WKxzLM/s88-c-k-no/photo.jpg');
        addChannel(page, 'Перший', 'hls:http://mp4.firstua.com/tv/_definst_/1ua-512k/playlist.m3u8', 'http://upload.wikimedia.org/wikipedia/commons/6/69/%D0%9F%D0%B5%D1%80%D0%B2%D1%8B%D0%B9_%D0%BD%D0%B0%D1%86%D0%B8%D0%BE%D0%BD%D0%B0%D0%BB%D1%8C%D0%BD%D1%8B%D0%B9_%D1%82%D0%B5%D0%BB%D0%B5%D0%BA%D0%B0%D0%BD%D0%B0%D0%BB_%28%D0%A3%D0%BA%D1%80%D0%B0%D0%B8%D0%BD%D0%B0%29.png');
        addChannel(page, 'Інтер', 'seetv:inter', 'http://inter.ua/images/logo.png');
        addChannel(page, 'Інтер', 'hls:http://212.40.43.10:1935/inters/smil:inter.smil/playlist.m3u8', 'http://inter.ua/images/logo.png');
        //rtmp://31.28.169.242/live/live112
        addChannel(page, '112', 'hls:http://31.28.169.242/hls/live112.m3u8', 'http://112.ua/static/img/logo/112_ukr.png');
        addChannel(page, 'TET', 'jampo:tet', 'http://upload.wikimedia.org/wikipedia/ru/7/72/%D0%9B%D0%BE%D0%B3%D0%BE%D1%82%D0%B8%D0%BF_%D1%82%D0%B5%D0%BB%D0%B5%D0%BA%D0%BE%D0%BC%D0%BF%D0%B0%D0%BD%D0%B8%D0%B8_%D0%A2%D0%95%D0%A2.jpg');
        addChannel(page, '1+1', 'jampo:1plus1', 'http://upload.wikimedia.org/wikipedia/commons/thumb/0/07/1_plus_1_logo.svg/200px-1_plus_1_logo.svg.png');
        addChannel(page, '2+2', 'seetv:2plus2', 'http://2plus2.ua/img/header/logo.png');
        addChannel(page, 'НТН', 'jampo:ntn', 'http://upload.wikimedia.org/wikipedia/ru/6/61/Telekanal_ntn.png');
        addChannel(page, 'Рада', 'ts:http://85.25.43.30:8194', 'http://upload.wikimedia.org/wikipedia/ru/a/ae/Logotype_rada.jpg');
        //addChannel(page, 'ТВі', 'rtmp://media.tvi.com.ua/live/_definst_//HLS4', 'http://tvi.ua/catalog/view/theme/new/image/logo.png');
        addChannel(page, 'ТВі', 'jampo:tvi', 'http://upload.wikimedia.org/wikipedia/uk/b/b0/TVI_logo.png');
        addChannel(page, 'ICTV', 'seetv:ictv', 'http://upload.wikimedia.org/wikipedia/uk/4/44/Telekanal_ictv.png');
        addChannel(page, 'СТБ', 'seetv:stb', 'http://upload.wikimedia.org/wikipedia/ru/2/2a/Telekanal_stb.png');
        addChannel(page, 'Новий канал', 'seetv:novy', 'http://ru.novy.tv/images/layouts/front/logo.png');
        addChannel(page, 'Украина', 'trk', 'http://upload.wikimedia.org/wikipedia/commons/c/cc/Ua_white.jpg');
        addChannel(page, 'MEGA', 'seetv:mega', 'http://upload.wikimedia.org/wikipedia/uk/7/77/Logo_Mega.png');
        addChannel(page, 'K1', 'jampo:k1', 'http://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/Logo_k1.png/244px-Logo_k1.png');
        addChannel(page, 'K2', 'jampo:k2', 'http://upload.wikimedia.org/wikipedia/ru/7/7e/Telekanal_k2.png');
        addChannel(page, 'QTV', 'seetv:qtv', 'http://qtv.ua/images/default/logo.png');
        addChannel(page, 'Discovery Channel', 'seetv:discovery-channel', 'http://upload.wikimedia.org/wikipedia/ru/thumb/4/46/Discovery_Channel_International.svg/200px-Discovery_Channel_International.svg.png');
        addChannel(page, 'Первый автомобильный', 'youtube', 'http://upload.wikimedia.org/wikipedia/ru/8/80/1auto_TV.jpg');
        addChannel(page, 'НЛО ТВ', 'ts:http://85.25.43.30:8234', 'http://upload.wikimedia.org/wikipedia/uk/6/67/LogoNLOTV.jpg');
        addChannel(page, 'XSport', 'jampo:xsport', 'http://xsport.ua/bitrix/templates/xsport/images/logo.png');
        //addChannel(page, 'Гумор ТВ', 'ts:http://85.25.43.30:8232', '');
        //addChannel(page, 'Гумор ТВ', 'rtmp://212.26.132.86/live/gumor_babai', '');
        addChannel(page, 'Гумор ТВ', 'hls:http://212.26.132.86/hls/gumor_babai.m3u8', 'http://upload.wikimedia.org/wikipedia/uk/b/b1/Humor_logo.jpg');
        addChannel(page, 'Вікка', 'ts:http://193.254.196.179:8080', 'http://vikka.ua/img/logo.png');
        addChannel(page, 'Enter film', 'ts:http://85.25.43.30:8208', '');
        //addChannel(page, 'ZIK', 'rtmp://217.20.164.182:80/live/zik392p.stream', '');
        addChannel(page, 'ZIK', 'glaz:zik', '');
        addChannel(page, 'ТВ Голд', 'rtmp://77.88.210.226/tvgold.com.ua_live/livestream', 'https://yt3.ggpht.com/-WBTeSleTH8M/AAAAAAAAAAI/AAAAAAAAAAA/3ZWvOO3Pl8I/s100-c-k-no/photo.jpg');
        addChannel(page, 'ТРК Львів', 'rtmp://gigaz.wi.com.ua/hallDemoHLS/LVIV', 'http://www.lodtrk.org.ua/inc/getfile.php?i=20111026133818.gif');
        addChannel(page, 'ATR', 'hls:http://91.203.194.146:1935/liveedge/atr.stream/playlist.m3u8', 'http://atr.ua/assets/atr-logo-red/logo.png');
        addChannel(page, 'News One', 'rtmp://newsonelivefs.fplive.net:443/newsonelive-live/_definst_/streamukr', '');
        addChannel(page, 'Тиса-1', 'rtmp://213.174.8.15/live/live2', 'http://tysa1.tv/templates/jdwebsite/images/style1/logo.jpg');
        addChannel(page, 'БТБ', 'rtmp://94.45.140.4/live/livestream', 'http://btbtv.com.ua/images/logo.png');
      }

      if (category == "Polish" || category == "All") {
       if (category == "All") {
        page.appendItem("", "separator", {
            title: 'Polish'
        });
       }
        addChannel(page, 'Fight Box HD', 'hls:http://spi-live.ercdn.net/spi/smil:fightboxhd_0.smil/playlist.m3u8', '');
        addChannel(page, 'Arthouse Box', 'hls:http://spi-live.ercdn.net/spi/smil:fbarthousehd_0.smil/playlist.m3u8', '');
        addChannel(page, 'Kino Polska', 'hls:http://spi-live.ercdn.net/spi/smil:kinopolskahd_international_0.smil/playlist.m3u8', '');
        addChannel(page, 'Filmbox Basic', 'hls:http://spi-live.ercdn.net/spi/smil:filmboxbasicsd_pl_0.smil/playlist.m3u8', '');
        addChannel(page, 'Filmbox Extra', 'hls:http://spi-live.ercdn.net/spi/smil:filmboxextrasd_pl_0.smil/playlist.m3u8', '');
      }

      if (category == "Hungarian" || category == "All") {
       if (category == "All") {
        page.appendItem("", "separator", {
            title: 'Hungarian'
        });
       }
        addChannel(page, 'Fix', 'rtmp://video.fixhd.tv/fix/hd.stream', 'http://dtvnews.hu/sites/default/files/images/fix_large.w160.jpg');
      }

      if (category == "Russian" || category == "All") {
       if (category == "All") {
        page.appendItem("", "separator", {
            title: 'Russian'
        });
       }
        //hls:http://hd1.lsops.net/live/euronews_ru.smil/playlist.m3u8
        //addChannel(page, 'Euronews', 'hls:http://178.49.132.73/streaming/euronews/tvrec/playlist.m3u8', '');
        //rtmp://fr-par-10-stream-relay.hexaglobe.net/rtpeuronewslive/ru_video750_rtp.sdp swfUrl=http://www.euronews.com/media/player_live_1_14.swf swfVfy=true live=true
        addChannel(page, 'Euronews', 'hls:http://hls.cn.ru/streaming/euronews/tvrec/playlist.m3u8', '');
        // http://tv.life.ru/index.m3u8
        addChannel(page, 'Life News', 'hls:http://tv.life.ru/lifetv/720p/index.m3u8', 'http://lifenews.ru/assets/logo-0a3a75be3dcc15b6c6afaef4adab52dd.png');
        addChannel(page, 'Россия 24', 'hls:http://testlivestream.rfn.ru/live/smil:r24.smil/playlist.m3u8?auth=vh&cast_id=21', '');
        addChannel(page, 'РИА Новости', 'hls:http://rian.cdnvideo.ru:1935/rr/stream20/index.m3u8', '');
        addChannel(page, 'RTД', 'hls:http://62.213.85.137/rtdru/rtdru.m3u8', '');
        //addChannel(page, 'Дождь', 'hls:http://178.49.132.73/streaming/rain/tvrec/playlist.m3u8', '');
        addChannel(page, 'Дождь', 'hls:http://tvrain-video.ngenix.net/mobile/TVRain_1m.stream/playlist.m3u8', 'http://tvrain-st.cdn.ngenix.net/static/css/pub/images/logo-tvrain.png');
        addChannel(page, 'HD Media', 'hls:http://serv02.vintera.tv:1935/push/hdmedia.stream/playlist.m3u8', '');
        addChannel(page, 'HD Media 3D', 'hls:http://hdmedia3d.vintera.tv:1935/hdmedia3d/hdmedia3d.stream/playlist.m3u8', '');
        addChannel(page, 'Brodilo.TV', 'ts:http://brodilo.tv/channel.php', '');
        addChannel(page, 'ЕДАI', 'youtube', '');
        addChannel(page, 'ЛДПР live', 'hls:http://109.239.142.90:1935/live/mcstream_1080p/playlist.m3u8', 'http://ldpr.tv/img/header/logo.png');
        addChannel(page, 'Россия 24', 'hls:http://178.49.132.73/streaming/vesti/tvrec/playlist.m3u8', '');
        addChannel(page, 'Россия 1', 'hls:http://178.49.132.73/streaming/rossija/tvrec/playlist.m3u8', '');
        addChannel(page, 'Россия 2', 'hls:http://178.49.132.73/streaming/sport/tvrec/playlist.m3u8', '');
        addChannel(page, 'HTB', 'hls:http://178.49.132.73/streaming/ntv/tvrec/playlist.m3u8', '');
        addChannel(page, 'Первый', 'jampo:ort', '');
        addChannel(page, 'Первый', 'hls:http://178.49.132.73/streaming/1kanal/tvrec/playlist.m3u8', '');
        addChannel(page, 'СТС мир', 'hls:http://178.49.132.73/streaming/sts/tvrec/playlist.m3u8', '');
        addChannel(page, 'Рен ТВ', 'hls:http://ren.cdnvideo.ru:1935/rtp/ren2/playlist.m3u8', '');
        addChannel(page, 'Рен ТВ Новосибирск', 'hls:http://178.49.132.73/streaming/rentv/tvrec/playlist.m3u8', '');
        addChannel(page, 'ТВ3', 'hls:http://hls.cn.ru/streaming/tv3/tvrec/playlist.m3u8', '');
        addChannel(page, 'ТВ3', 'hls:http://178.49.132.73/streaming/tv3/tvrec/playlist.m3u8', '');
        addChannel(page, '2x2', 'hls:http://178.49.132.73/streaming/2x2tv/tvrec/playlist.m3u8', '');
        addChannel(page, 'Юмор Box', 'hls:http://musicbox.cdnvideo.ru:1935/musicbox-live/humorbox.sdp/playlist.m3u8', '');
        addChannel(page, 'Ростов ТВ', 'hls:http://rostovlife.vintera.tv:1935/mediapark/rostov_tv1.stream/playlist.m3u8', '');
        addChannel(page, 'Москва 24', 'hls:http://testlivestream.rfn.ru/live/smil:m24.smil/playlist.m3u8?auth=vh&cast_id=1661', '');
        addChannel(page, 'Маяк FM', 'hls:http://testlivestream.rfn.ru/live/smil:mayak.smil/playlist.m3u8?auth=vh&cast_id=81', '');
        addChannel(page, 'Россия 1', 'hls:http://213.208.179.135/rr2/smil:rtp_r1_rr.smil/playlist.m3u8?auth=vh&cast_id=2961', '');
        addChannel(page, 'World Fashion', 'jampo:wf', '');
        addChannel(page, 'Luxury World', 'hls:http://nano.teleservice.su:8080/hls/luxury.m3u8', '');
        addChannel(page, 'Стиль и мода', 'hls:http://btv-net.mediacdn.ru/TVB4/stilimoda/playlist.m3u8', '');
        addChannel(page, 'Auto.ru TV', 'hls:http://ms1.autoru.tv:1935/live/360p/playlist.m3u8', '');
        addChannel(page, 'КПРФ', 'rtmp://kprf-live.cdn.ngenix.net/live/mp4:stream_700.mp4', '');
        addChannel(page, 'KZN', 'hls:http://rtmp.tatinf.ru:1935/live/fullkzntv/playlist.m3u8', '');
        addChannel(page, 'БСТ', 'hls:http://btv-net.mediacdn.ru/TVB4/bst/track_1/playlist.m3u8', '');
        addChannel(page, 'BTB', 'ts:http://85.25.43.30:8233', '');
        addChannel(page, 'ВКТ', 'hls:http://vkt.cdnvideo.ru/rtp/3/playlist.m3u8', '');
        addChannel(page, 'Nano TV', 'hls:http://nano.teleservice.su:8080/hls/nano.m3u8', '');

        page.appendItem("", "separator", {
            title: 'Planet Online'
        });
        addChannel(page, 'ТВТУР.TV', 'rtmp://80.93.53.88/live/channel_2', '');
        addChannel(page, 'Релакс.TV', 'rtmp://80.93.53.88/live/channel_3', '');
        addChannel(page, 'Премьера.TV', 'rtmp://80.93.53.88/live/channel_5', '');
        addChannel(page, 'Любимое.TV', 'rtmp://80.93.53.88/live/channel_6', '');
        addChannel(page, 'Кино РФ', 'rtmp://gb.orange.ether.tv/live/unikino/broadcast18', '');
        addChannel(page, 'ФК Рубин', 'rtmp://grey.ether.tv/live/rubin/broadcast4', '');

        addChannel(page, '5 Channel', 'hls:http://178.49.132.73/streaming/5kanal/tvrec/playlist.m3u8', '');
        addChannel(page, 'UTS', 'hls:http://178.49.132.73/streaming/ots/tvrec/playlist.m3u8', '');
        addChannel(page, 'Home', 'hls:http://178.49.132.73/streaming/domashny/tvrec/playlist.m3u8', '');
        addChannel(page, '49 Channel (Novosibirsk)', 'hls:http://178.49.132.73/streaming/49kanal/tvrec/playlist.m3u8', '');
        addChannel(page, 'Culture', 'hls:http://178.49.132.73/streaming/kultura/tvrec/playlist.m3u8', '');
        addChannel(page, 'TVC', 'hls:http://178.49.132.73/streaming/tvc/tvrec/playlist.m3u8', '');
        addChannel(page, 'Pepper', 'hls:http://178.49.132.73/streaming/perec/tvrec/playlist.m3u8', '');
        addChannel(page, '24 Techno', 'hls:http://178.49.132.73/streaming/24techno/tvrec/playlist.m3u8', '');
        addChannel(page, 'First Education', 'hls:http://178.49.132.73/streaming/1_obraz/tvrec/playlist.m3u8', '');
        addChannel(page, '21 TV', 'hls:http://178.49.132.73/streaming/tv21/tvrec/playlist.m3u8', '');
        addChannel(page, 'Real Scary', 'hls:http://178.49.132.73/streaming/nstv/tvrec/playlist.m3u8', '');
        addChannel(page, '24', 'hls:http://178.49.132.73/streaming/mir24/tvrec/playlist.m3u8', '');
        addChannel(page, 'S', 'hls:http://178.49.132.73/streaming/utv/tvrec/playlist.m3u8', '');
        addChannel(page, 'Friday', 'hls:http://178.49.132.73/streaming/friday/tvrec/playlist.m3u8', '');
        addChannel(page, 'Star', 'hls:http://178.49.132.73/streaming/zvezda/tvrec/playlist.m3u8', '');
        addChannel(page, 'Live', 'hls:http://178.49.132.73/streaming/jv/tvrec/playlist.m3u8', '');
        addChannel(page, '1 Sport', 'hls:http://178.49.132.73/streaming/sport1/tvrec/playlist.m3u8', '');
        addChannel(page, 'Football', 'hls:http://178.49.132.73/streaming/futbol/tvrec/playlist.m3u8', '');
      }
      if (category == "XXX" || category == "All") {
          if (category == "All") {
              page.appendItem("", "separator", {
                  title: 'XXX'
              });
          }
          addChannel(page, 'Erox HD', 'hls:http://spi-live.ercdn.net/spi/eroxhd_0_1/playlist.m3u8', 'http://www.lyngsat-logo.com/hires/ee/erox_box_hd.png');
          addChannel(page, 'Eroxxx HD', 'hls:http://spi-live.ercdn.net/spi/eroxxhd_0_1/playlist.m3u8', 'http://www.lyngsat-logo.com/hires/ee/eroxxx_box_hd.png');
          addChannel(page, 'Hallo TV', 'hls:http://83.169.58.38:1935/live/HalloTV1/playlist.m3u8', 'http://www.lyngsat-logo.com/logo/tv/hh/hallo_tv_at.jpg');
          addChannel(page, 'Playboy TV', 'rtmp://111.118.21.77/ptv3/phd499', 'http://www.playboy.tv/assets/Playboy/PlayboyTv/Tour/assets/common/img/main-logo.png');
          addChannel(page, 'Playboy Spice TV HD', 'rtmp://111.118.21.77/ptv3/phd497', '');
          addChannel(page, 'Delight Empire HD', 'rtmp://111.118.21.75/ptv2/phd63', '');
          addChannel(page, 'Girls TV', 'rtmp://111.118.21.76:1935/ptv/phd501', '');
          addChannel(page, 'The O', 'rtmp://111.118.21.77:1935/ptv3/phd771', '');
          addChannel(page, 'Playy 19+', 'rtmp://111.118.21.77:1935/ptv3/phd769', '');
          addChannel(page, 'Midnight HD', 'rtmp://lm02.everyon.tv/ptv2/phd766', '');
          addChannel(page, 'Pink TV', 'rtmp://111.118.21.75/ptv2/phd62', '');
          addChannel(page, 'Korean West', 'rtmp://111.118.21.77/ptv3/phd61', '');
          addChannel(page, 'Viki Enjoy Premium', 'rtmp://lm03.everyon.tv/ptv3/phd765', '');
          addChannel(page, 'Butgo TV', 'rtmp://lm01.everyon.tv/ptv/phd772', '');
          addChannel(page, 'Asia ON', 'rtmp://lm02.everyon.tv/ptv2/phd60', '');
          addChannel(page, 'LiveTing TV', 'rtmp://lm02.everyon.tv/ptv2/tv/phd64', '');
          addChannel(page, 'Hot Girl TV', 'rtmp://lm02.everyon.tv/ptv2/tv/phd59', '');
          addChannel(page, 'Visit-X', 'rtmp://194.116.150.47/live//visitx.stream1', 'https://pbs.twimg.com/profile_images/1625623578/social_logo.jpg');
          //addChannel(page, 'Visit-X', 'rtmp://194.116.150.47/live//visitx.stream2', 'https://pbs.twimg.com/profile_images/1625623578/social_logo.jpg');
      }
    });

    // Start page
    plugin.addURI(PREFIX + "start", function(page) {
        setPageHeader(page, slogan);
	page.appendItem(PREFIX + "favorites", "directory", {
	    title: "My Favorites"
	});
	page.appendItem(PREFIX + "category:All", "directory", {
	    title: "All"
	});
	page.appendItem(PREFIX + "category:News", "directory", {
	    title: "News"
	});
	page.appendItem(PREFIX + "category:Children", "directory", {
	    title: "Children"
	});
	page.appendItem(PREFIX + "category:Music", "directory", {
	    title: "Music"
	});
	page.appendItem(PREFIX + "category:Ukrainian", "directory", {
	    title: "Ukrainian"
	});
	page.appendItem(PREFIX + "category:Russian", "directory", {
	    title: "Russian"
	});
	page.appendItem(PREFIX + "category:Polish", "directory", {
	    title: "Polish"
	});
	page.appendItem(PREFIX + "category:Hungarian", "directory", {
	    title: "Hungarian"
	});
	page.appendItem(PREFIX + "category:XXX", "directory", {
	    title: "XXX"
	});
    });
})(this);
