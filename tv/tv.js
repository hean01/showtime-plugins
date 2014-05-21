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
        var resp, match, match2;

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
                 page.error("Sorry, can't get the link :(");
        }

        page.loading = true;
        // search for the channel
        resp = showtime.httpReq("https://www.youtube.com/results?search_query=" + title.replace(/\s/g, '+')).toString();
        page.loading = false;
        // looking for user's page
        match = resp.match(/<a href="\/user\/([\S\s]*?)"/);
        match2 = resp.match(/\/watch\?v=([\S\s]*?)"/); // scraping direct link
        if (match) {
            page.loading = true;
            resp = showtime.httpReq("https://www.youtube.com/user/" + match[1]).toString();
            page.loading = false;
            // looking for the channel link
            var match = resp.match(/\/watch\?v=([\S\s]*?)"/);
            if (match)
                playVideo(page, match);
        } else
            if (match2)
                playVideo(page, match2);
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
        var match = resp.match(/<video[\S\s]*?src="([\S\s]*?)"/);
            if (match) {
                page.type = "video";
                page.source = "videoparams:" + showtime.JSONEncode({
                    title: unescape(title),
                    sources: [{
                        url: 'hls:' + match[1]
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
            title: 'Deutsch'
        });
        addChannel(page, 'N24', 'hls:http://n24-live.hls.adaptive.level3.net/hls-live/n24-pssimn24live/_definst_/live/stream2.m3u8', 'http://upload.wikimedia.org/wikipedia/de/2/20/N24_logo.svg');
        addChannel(page, 'ZDF', 'hls:http://88.212.11.206:5000/live/28/28.m3u8', 'http://upload.wikimedia.org/wikipedia/commons/0/02/ZDF.svg');
        addChannel(page, 'NDR HD', 'hls:http://ndr_fs-lh.akamaihd.net/i/ndrfs_nds@119224/master.m3u8', 'http://upload.wikimedia.org/wikipedia/commons/thumb/0/08/NDR_Dachmarke.svg/200px-NDR_Dachmarke.svg.png');
        addChannel(page, 'WDR HD', 'hls:http://www.metafilegenerator.de/WDR/WDR_FS/m3u8/wdrfernsehen.m3u8', 'http://upload.wikimedia.org/wikipedia/commons/thumb/b/bc/WDR_Re-Branding_2012_Logo.svg/200px-WDR_Re-Branding_2012_Logo.svg.png');
        addChannel(page, 'RBB', 'hls:http://88.212.11.206:5000/live/13/13.m3u8', 'http://upload.wikimedia.org/wikipedia/commons/thumb/9/98/Rundfunk_Berlin-Brandenburg_logo.svg/200px-Rundfunk_Berlin-Brandenburg_logo.svg.png');
        addChannel(page, 'Okto', 'hls:http://atwse.lbs.atusmedia.cc:1935/oktolive/okto-low.stream/hasbahca.m3u8', 'http://upload.wikimedia.org/wikipedia/de/thumb/7/7b/Okto.svg/200px-Okto.svg.png');

        page.appendItem("", "separator", {
            title: 'English'
        });
        addChannel(page, 'JN1', 'hls:http://jn1-live.hls.adaptive.level3.net/apple/jn1/stream001/ENGhi.m3u8', '');
        addChannel(page, 'Russia Today', 'hls:http://rt.ashttp14.visionip.tv/live/rt-global-live-HD/playlist.m3u8', 'http://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/Russia-today-logo.svg/200px-Russia-today-logo.svg.png');
        addChannel(page, 'Russia Today Documentary', 'hls:http://rt.ashttp14.visionip.tv/live/rt-doc-live-HD/playlist.m3u8', 'http://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/Russia-today-logo.svg/200px-Russia-today-logo.svg.png');
        addChannel(page, 'Euronews', 'hls:http://hd1.lsops.net/live/euronews_en.smil/playlist.m3u8', 'http://upload.wikimedia.org/wikipedia/commons/thumb/9/93/Euronews_logo.svg/200px-Euronews_logo.svg.png');
        addChannel(page, 'BBC World News', 'hls:http://livestation_hls-lh.akamaihd.net/i/bbcworld_en@105465/index_928_av-b.m3u8', 'http://upload.wikimedia.org/wikipedia/commons/6/6c/BBC_World_News_red.svg');
        addChannel(page, 'DW Europe', 'hls:http://dwtvios_europa-i.akamaihd.net/hls/live/200515/dwtveuropa/1/playlist1x.m3u8', 'https://lh5.googleusercontent.com/-9Ir29NdKHLU/AAAAAAAAAAI/AAAAAAAAIiY/TF5J4A4ZdP8/s120-c/photo.jpg');
        addChannel(page, 'France 24', 'hls:http://vipwowza.yacast.net/f24_hlslive_en/_definst_/mp4:fr24_en_748.stream/playlist.m3u8', 'http://upload.wikimedia.org/wikipedia/en/thumb/6/65/FRANCE_24_logo.svg/200px-FRANCE_24_logo.svg.png');
        //addChannel(page, 'CNN', 'rtmp://hd1.lsops.net/live/ playpath=cnn_en_584 swfUrl="http://static.ls-cdn.com/player/5.10/livestation-player.swf" swfVfy=true live=true', 'http://upload.wikimedia.org/wikipedia/commons/8/8b/Cnn.svg');
        addChannel(page, 'CNN', 'hls:http://livestation_hls-lh.akamaihd.net/i/cnn_en@105455/master.m3u8', 'http://upload.wikimedia.org/wikipedia/commons/8/8b/Cnn.svg');
        addChannel(page, 'CNBC', 'hls:http://livestation_hls-lh.akamaihd.net/i/cnbc_en@106428/master.m3u8', 'http://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/CNBC_logo.svg/200px-CNBC_logo.svg.png');
        addChannel(page, 'Bloomberg', 'hls:http://hd4.lsops.net/live/bloomber_en_hls.smil/playlist.m3u8', 'http://upload.wikimedia.org/wikipedia/commons/thumb/5/56/Bloomberg_logo.svg/200px-Bloomberg_logo.svg.png');
        //http://live.bltvios.com.edgesuite.net/oza2w6q8gX9WSkRx13bskffWIuyf/BnazlkNDpCIcD-QkfyZCQKlRiiFnVa5I/master.m3u8?geo_country=US
        addChannel(page, 'Sky News', 'hls:http://hd2.lsops.net/live/skynewsi_en_372/playlist.m3u8', 'http://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/Sky_News.svg/200px-Sky_News.svg.png');
        addChannel(page, 'Press TV', 'hls:http://media23.lsops.net/live/presstv_en_hls.smil/playlist.m3u8', 'http://upload.wikimedia.org/wikipedia/en/2/23/PressTV.png');
        //http://aya02.livem3u8.me.totiptv.com/live/ea4c9d2666bc411d8e6777e8a1d2b747.m3u8?pt=1&code=4d4549b2c1f6926f8698e13c0123177a
        addChannel(page, 'Reuters', 'hls:http://37.58.85.156/rlo001/ngrp:rlo001.stream_all/playlist.m3u8', 'http://upload.wikimedia.org/wikipedia/ru/a/a0/Reuters_2008_logo.svg');
        addChannel(page, 'AlJazeera', 'rtmp://hd2.lsops.net/live playpath=aljazeer_en_838 swfUrl="http://static.ls-cdn.com/player/5.10/livestation-player.swf" swfVfy=true live=true', 'http://upload.wikimedia.org/wikipedia/en/7/71/Aljazeera.svg');
        addChannel(page, 'Arirang', 'http://worldlive-ios.arirang.co.kr/arirang/arirangtvworldios.mp4.m3u8', 'http://upload.wikimedia.org/wikipedia/commons/thumb/9/94/Arirang.svg/200px-Arirang.svg.png');
        //addChannel(page, 'NHK World', 'hls:http://plslive-w.nhk.or.jp/nhkworld/app/live.m3u8', '');
        addChannel(page, 'NHK World', 'hls:http://nhkworldlive-lh.akamaihd.net/i/nhkworld_w@145835/master.m3u8', 'http://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/NHK_World.svg/200px-NHK_World.svg.png');
        addChannel(page, 'CCTV News', 'hls:http://88.212.11.206:5000/live/22/22.m3u8', '');
        addChannel(page, 'Redbull TV', 'hls:http://live.iphone.redbull.de.edgesuite.net/webtvHD.m3u8', '');
        addChannel(page, 'Docu Box HD', 'hls:http://spi-live.ercdn.net/spi/smil:docuboxhd_0.smil/playlist.m3u8', '');
        addChannel(page, 'Fast & Fun Box HD', 'hls:http://spi-live.ercdn.net/spi/smil:fastnfunhd_0.smil/playlist.m3u8', '');
        addChannel(page, 'Fashion Box HD', 'hls:http://spi-live.ercdn.net/spi/smil:fashionboxhd_0.smil/playlist.m3u8', '');
        addChannel(page, 'World Fashion', 'jampo:wf', '');
        addChannel(page, 'Sporttime.tv HDTV 1', 'rtmp://streamer.a1.net:1935/rtmplive/redundant/channels/Sporttime/SporttimeTV/mp4:channel1_1200', '');
        addChannel(page, 'Sporttime.tv HDTV 2', 'rtmp://streamer.a1.net:1935/rtmplive/redundant/channels/Sporttime/SporttimeTV/mp4:channel2_1200', '');
        addChannel(page, 'Sporttime.tv HDTV 3', 'rtmp://streamer.a1.net:1935/rtmplive/redundant/channels/Sporttime/SporttimeTV/mp4:channel3_1200', '');
        addChannel(page, 'Sporttime.tv HDTV 4', 'rtmp://streamer.a1.net:1935/rtmplive/redundant/channels/Sporttime/SporttimeTV/mp4:channel4_1200', '');
        addChannel(page, 'Sporttime.tv HDTV 5', 'rtmp://streamer.a1.net:1935/rtmplive/redundant/channels/Sporttime/SporttimeTV/mp4:channel5_1200', '');
        addChannel(page, 'Sporttime.tv HDTV 6', 'rtmp://streamer.a1.net:1935/rtmplive/redundant/channels/Sporttime/SporttimeTV/mp4:channel6_1200', '');
        addChannel(page, 'Sporttime.tv HDTV 7', 'rtmp://streamer.a1.net:1935/rtmplive/redundant/channels/Sporttime/SporttimeTV/mp4:channel7_1200', '');

        page.appendItem("", "separator", {
            title: 'Danish'
        });
        addChannel(page, 'Kanal Sport', 'hls:http://lswb-de-08.servers.octoshape.net:1935/live/kanalsport_2000k/hasbahca.m3u8', 'http://kanalsport.dk/img/layout/logo_top.png');
        addChannel(page, 'Folketinget', 'rtmp://ftflash.arkena.dk/webtvftlivefl/ playpath=mp4:live.mp4 pageUrl=http://www.ft.dk/webTV/TV_kanalen_folketinget.aspx live=1', '');

      }
      if (category == "Music" || category == "All") {
        if (category == "All") {
            page.appendItem("", "separator", {
                title: 'Music'
            });
        }
        //addChannel(page, 'PIK.TV', 'rtmp://fms.pik-tv.com/live/piktv2pik2tv.flv', '');
        addChannel(page, 'Dance  TV', 'hls:http://91.82.85.16:1935/relay15/nettv_channel_1/playlist.m3u8', '');
        addChannel(page, 'King TV', 'hls:http://91.82.85.16:1935/relay15/nettv03_channel_1/playlist.m3u8', '');
        addChannel(page, '1HD', 'hls:http://109.239.142.62:1935/live/hlsstream/playlist3.m3u8', '');
        //addChannel(page, '1HD (RTMP)', 'rtmp://109.239.142.62/live/livestream3', '');
        addChannel(page, 'PIK TV', 'hls:http://fms.pik-tv.com:1935/live/piktv3pik3tv/playlist.m3u8', '');
        addChannel(page, '360 Tune Box', 'hls:http://spi-live.ercdn.net/spi/360tuneboxhd_0_1/playlist.m3u8', '');
        addChannel(page, 'MOX', 'hls:http://mox.tv/hls/moxtv-a6.m3u8', '');
        addChannel(page, 'Vevo 1', 'hls:http://vevoplaylist-live.hls.adaptive.level3.net/vevo/ch1/06/prog_index.m3u8', '');
        addChannel(page, 'Vevo 2', 'hls:http://vevoplaylist-live.hls.adaptive.level3.net/vevo/ch2/06/prog_index.m3u8', '');
        addChannel(page, 'Vevo 3', 'hls:http://vevoplaylist-live.hls.adaptive.level3.net/vevo/ch3/06/prog_index.m3u8', '');
        addChannel(page, 'Ocko Express HD', 'hls:http://194.79.52.78:1935/expresi/ExpresHD2/playlist.m3u8', '');
        addChannel(page, 'Planeta TV', 'hls:http://w1.drundoo.com:1935/DrundooDVR/_definst_/smil:405f1996-77f1-47e9-9646-0c6bfa5e18aa.smil/stream.m3u8', '');
        addChannel(page, 'Balkanika', 'hls:http://74.122.193.194:1935/DrundooDVR/_definst_/smil:776c511d-aee0-4e33-a44e-265e464c0a28.smil/stream.m3u8', '');
        addChannel(page, 'Fen TV', 'hls:http://74.122.193.194:1935/DrundooDVR/_definst_/smil:90e18283-cdb3-4c13-8c4f-b80897497858.smil/stream.m3u8', '');
        addChannel(page, 'City TV', 'hls:http://74.122.193.194:1935/DrundooDVR/_definst_/smil:e0820ba7-2c1a-4286-ac1b-f00bb9dcbe61.smil/stream.m3u8', '');
        addChannel(page, 'Lobas TV', 'rtmp://149.11.34.78/live/lobas.stream', '');
        addChannel(page, 'Beatz TV', 'rtmp://rtmp.infomaniak.ch:1935/livecast/beats_2', '');
        addChannel(page, 'Clubbing TV', 'rtmp://204.107.26.252:8086/live/691.high.stream', '');
        //addChannel(page, 'Europa Plus TV (RTMP)', 'rtmp://europaplus.cdnvideo.ru/europaplus-live//mp4:eptv_main.sdp', 'http://www.europaplustv.com/images/europa_tv.png');
        addChannel(page, 'Europa Plus TV', 'hls:http://europaplus.cdnvideo.ru/europaplus-live/mp4:eptv_main.sdp/playlist.m3u8', 'http://www.europaplustv.com/images/europa_tv.png');
        addChannel(page, 'Europa Plus TV (MPEG2)', 'ts:http://31.43.120.162:8127', '');
        addChannel(page, 'Europa Plus TV (MPEG2)', 'ts:http://91.192.168.242:8019', '');
        addChannel(page, 'Музыка', 'ts:http://31.43.120.162:8109', '');
        addChannel(page, 'Vh1', 'ts:http://31.43.120.162:8129', '');
        addChannel(page, 'Kino Polska Muzyka', 'hls:http://spi-live.ercdn.net/spi/smil:kinopolskamuzikasd_international_0.smil/playlist.m3u8', '');
        addChannel(page, 'М2', 'ts:http://31.43.120.162:8013', 'http://www.m2.tv/images/design/2009/m2_logo_2009.jpg');
        addChannel(page, 'OTV', 'jampo:otv', '');
        addChannel(page, 'MTV', 'glaz:mtv-russia', '');
        addChannel(page, 'MTV Live HD', 'hls:http://202.75.23.37:8800/live/ch50/01.m3u8', '');
        addChannel(page, 'A-One UA', 'ts:http://31.43.120.162:8065', '');
        addChannel(page, 'A-One Hip-Hop', 'ts:http://31.43.120.162:8072', '');
        addChannel(page, 'A-One Hip-Hop', 'ts:http://91.192.168.242:8065', '');
        addChannel(page, 'RU TV (HLS)', 'hls:http://vniitr.cdnvideo.ru/vniitr-live/vniitr.sdp/playlist.m3u8', '');
        addChannel(page, 'RU TV (MPEG2)', 'ts:http://91.192.168.242:8025', '');
        //addChannel(page, 'Fresh TV', 'hls:http://80.93.53.88:1935/live/channel_4/playlist.m3u8', '');
        addChannel(page, 'Fresh TV', 'rtmp://80.93.53.88/live/channel_4', '');
        addChannel(page, 'Party TV', 'rtmp://149.11.34.6/live/partytv.stream', '');
        //addChannel(page, 'Rouge TV', 'rtmp://rtmp.infomaniak.ch/livecast/rougetv', '');
        addChannel(page, 'Rouge TV', 'hls:http://rtmp.infomaniak.ch/livecast/rougetv/playlist.m3u8', '');
        addChannel(page, 'TVM3', 'hls:http://rtmp.infomaniak.ch:1935/livecast/tvm3/playlist.m3u8', '');
        addChannel(page, 'For Music', 'rtmp://wowza1.top-ix.org/quartaretetv1/formusicweb', '');
        //addChannel(page, 'Ocko (RTMP)', 'rtmp://194.79.52.79/ockoi/ockoHQ1', '');
        addChannel(page, 'Ocko', 'hls:http://194.79.52.79/ockoi/ockoHQ1/hasbahca.m3u8', '');
        addChannel(page, 'Ocko Gold', 'hls:http://194.79.52.79:1935/goldi/goldHQ1/playlist.m3u8', '');
        addChannel(page, 'Ocko Express', 'hls:http://194.79.52.79:1935/expresi/expresHQ1/playlist.m3u8', '');
        //rtmp://stream.smcloud.net/live2/eskatv/eskatv_360p
        addChannel(page, 'Eska TV', 'hls:http://stream.smcloud.net:1935/live2/eskatv/eskatv_360p/playlist.m3u8', '');
        addChannel(page, 'Eska Rock TV', 'hls:http://stream.smcloud.net:1935/live2/eska_rock/eska_rock_360p/playlist.m3u8', '');
        addChannel(page, 'Eska Party TV', 'hls:http://stream.smcloud.net:1935/live2/eska_party/eska_party_360p/playlist.m3u8', '');
        addChannel(page, 'Eska Wawa TV', 'hls:http://stream.smcloud.net:1935/live2/wawa/wawa_360p/playlist.m3u8', '');
        addChannel(page, 'Eska Best Music TV', 'hls:http://stream.smcloud.net:1935/live2/best/best_360p/playlist.m3u8', '');
        addChannel(page, 'Eska Vox TV', 'hls:http://stream.smcloud.net:1935/live2/vox/vox_360p/playlist.m3u8', '');
        addChannel(page, 'Eska Polo TV', 'hls:http://stream.smcloud.net:1935/live/polotv/playlist.m3u8', '');
        addChannel(page, 'Heart TV', 'hls:http://cdn-sov-2.musicradio.com:80/LiveVideo/Heart/playlist.m3u8', '');
        addChannel(page, 'Capital TV', 'hls:http://cdn-sov-2.musicradio.com:80/LiveVideo/Capital/playlist.m3u8', '');
        addChannel(page, '538TV', 'hls:http://82.201.53.52:80/livestream/tv538/playlist.m3u8', '');
        addChannel(page, 'Slam TV', 'hls:http://82.201.53.52:80/livestream/slamtv/playlist.m3u8', '');
        addChannel(page, 'Stars TV', 'hls:http://starstv-live.e91-jw.insyscd.net/starstv.isml/QualityLevels(960000)/manifest(format=m3u8-aapl).m3u8', '');
        addChannel(page, 'Cat Music', 'rtmp://91.82.85.71:1935/relay8/fstv_channel_1', '');
        addChannel(page, 'JuCe TV', 'hls:http://hls.cn.ru/streaming/juce/tvrec/playlist.m3u8', '');
        addChannel(page, 'RTL 105.2', 'hls:http://origin-rtl-radio-stream.4mecloud.it/live-video/radiovisione/ngrp:radiovisione/chunklist-b1164000.m3u8', '');
        addChannel(page, 'Streetclip.TV', 'rtmp://stream.streetclip.tv:1935/live/high-stream', '');
        addChannel(page, 'Vitamine', 'rtmp://rtmp.infomaniak.ch/livecast/vitatv', '');
        addChannel(page, 'Getback.im', 'rtmp://stream.getback.im:1935/live/getback', '');
        addChannel(page, 'Rusong TV', 'hls:http://rusong.cdnvideo.ru:443/rtp/rusong2/chunklist.m3u8', '');
        addChannel(page, 'Russian Musicbox', 'hls:http://musicbox.cdnvideo.ru/musicbox-live/musicbox.sdp/playlist.m3u8', '');
        addChannel(page, 'Шансон ТВ', 'hls:http://chanson.cdnvideo.ru:1935/chanson-live/shansontv.sdp/playlist.m3u8', '');
        addChannel(page, 'Music Box', 'hls:http://hls.cn.ru/streaming/musboxtv/tvrec/playlist.m3u8', '');
        addChannel(page, '9 волна', 'rtmp://176.9.127.102/live/myStream_1', '');
        addChannel(page, '1 music', 'rtmp://80.232.172.37/rtplive/vlc.sdp', '');
        addChannel(page, 'BIM TV', 'hls:http://goo.gl/glJV3o', '');
        //rtmp://212.26.132.86/live/mb_ua
        addChannel(page, 'Music Box UA', 'hls:http://212.26.132.86/hls/mb_ua.m3u8', '');
        //rtmp://rtmp.infomaniak.ch/livecast//ouitv
        addChannel(page, 'OUI TV', 'hls:http://rtmp.infomaniak.ch:1935/livecast/ouitv/playlist.m3u8', '');
        addChannel(page, 'Musiq 1 TV', 'ts:http://212.79.96.134:8005', '');
        addChannel(page, '1 Classic', 'ts:http://212.79.96.134:8024', '');

        page.appendItem("", "separator", {
            title: 'One HD'
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
        addChannel(page, 'Euronews', 'ts:http://31.43.120.162:8035', 'http://ua.euronews.com/media/logo_222.gif');
        addChannel(page, 'Espreso TV', 'youtube', '');
        addChannel(page, 'Hromadske.tv', 'youtube', '');
        addChannel(page, '5 канал', 'youtube', '');
        addChannel(page, '5 канал', 'jampo:5tv', '');
        addChannel(page, '24 канал', 'youtube', '');
        addChannel(page, '24 канал', 'ts:http://31.43.120.162:8014', 'http://24tv.ua/img/24_logo_facebook.jpg');
        addChannel(page, 'UBR', 'youtube', '');
        addChannel(page, 'Перший', 'hls:http://mp4.firstua.com/tv/_definst_/1ua-512k/playlist.m3u8', 'http://inter.ua/images/logo.png');
        addChannel(page, 'Інтер', 'seetv:inter', 'http://inter.ua/images/logo.png');
        addChannel(page, 'Інтер', 'hls:http://212.40.43.10:1935/inters/smil:inter.smil/playlist.m3u8', 'http://inter.ua/images/logo.png');
        addChannel(page, 'Інтер+', 'ts:http://91.192.168.242:8029', '');
        addChannel(page, '100', 'ts:http://31.43.120.162:8062', 'http://tv100.com.ua/templates/diablofx/images/100_logo.jpg');
        //rtmp://31.28.169.242/live/live112
        addChannel(page, '112', 'hls:http://31.28.169.242/hls/live112.m3u8', 'http://112.ua/static/img/logo/112_ukr.png');
        addChannel(page, 'TET', 'jampo:tet', '');
        addChannel(page, '1+1', 'jampo:1plus1', '');
        addChannel(page, 'НТН', 'jampo:ntn', '');
        addChannel(page, 'Рада', 'ts:http://85.25.43.30:8194', '');
        //addChannel(page, 'ТВі', 'rtmp://media.tvi.com.ua/live/_definst_//HLS4', 'http://tvi.ua/catalog/view/theme/new/image/logo.png');
        addChannel(page, 'ТВі', 'jampo:tvi', '');
        addChannel(page, 'ICTV', 'seetv:ictv', '');
        addChannel(page, 'СТБ', 'seetv:stb', '');
        addChannel(page, 'Новий канал', 'seetv:novy', '');
        addChannel(page, 'ТРК Україна', 'hls:http://kanalukraina.tv/index.m3u8?token=93f2ada7b6ed50c919bf059efb8252b5bea278c4', '');
        addChannel(page, 'MEGA', 'seetv:mega', '');
        addChannel(page, 'K1', 'jampo:k1', '');
        addChannel(page, 'K2', 'jampo:k2', '');
        addChannel(page, 'QTV', 'seetv:qtv', '');
        addChannel(page, 'Уніан', 'ts:http://31.43.120.162:8009', 'http://images.unian.net/img/unian-logo.png');
        addChannel(page, 'ЧП.INFO', 'ts:http://31.43.120.162:8041', 'http://www.tele-com.tv/img/icons/chp-info.png');
        addChannel(page, 'Discovery Channel', 'seetv:discovery-channel', '');
        addChannel(page, 'Право TV', 'ts:http://31.43.120.162:8058', '');
        addChannel(page, 'Dobro', 'ts:http://31.43.120.162:8067', '');
        addChannel(page, 'Первый автомобильный', 'ts:http://31.43.120.162:8052', '');
        addChannel(page, 'Первый автомобильный', 'youtube', '');
        addChannel(page, 'XSport', 'ts:http://85.25.43.30:8247', '');
        addChannel(page, 'НЛО ТВ', 'ts:http://85.25.43.30:8234', '');
        //addChannel(page, 'Гумор ТВ', 'ts:http://85.25.43.30:8232', '');
        //addChannel(page, 'Гумор ТВ', 'rtmp://212.26.132.86/live/gumor_babai', '');
        addChannel(page, 'Гумор ТВ', 'hls:http://212.26.132.86/hls/gumor_babai.m3u8', '');
        addChannel(page, 'Футбол 1', 'ts:http://31.43.120.162:8118', 'https://ru.viasat.ua/assets/logos/3513/exclusive_F1-yellow-PL.png');
        addChannel(page, '2x2', 'ts:http://31.43.120.162:8073', '');
        //addChannel(page, '2x2', 'ts:http://91.192.168.242:8035', '');
        addChannel(page, 'Enter film', 'ts:http://85.25.43.30:8208', '');
        addChannel(page, 'Піксель', 'glaz:piksel-tv', '');
        //addChannel(page, 'ZIK', 'rtmp://217.20.164.182:80/live/zik392p.stream', '');
        addChannel(page, 'ZIK', 'glaz:zik', '');
        addChannel(page, 'УТР', 'ts:http://31.43.120.162:8047', 'http://utr.tv/ru/templates/UTR/images/logo.png');
        addChannel(page, 'ТВ Голд', 'rtmp://77.88.210.226/tvgold.com.ua_live/livestream', 'https://yt3.ggpht.com/-WBTeSleTH8M/AAAAAAAAAAI/AAAAAAAAAAA/3ZWvOO3Pl8I/s100-c-k-no/photo.jpg');
        addChannel(page, 'ТРК Львів', 'rtmp://gigaz.wi.com.ua/hallDemoHLS/LVIV', 'http://www.lodtrk.org.ua/inc/getfile.php?i=20111026133818.gif');
        addChannel(page, 'Львів ТВ', 'ts:http://31.43.120.162:8048', 'http://www.lviv-tv.com/images/aTV/logo/LTB_FIN_END_6.png');
        addChannel(page, 'ТК Черное море', 'ts:http://31.43.120.162:8042', 'http://www.blacksea.net.ua/images/logo2.png');
        addChannel(page, 'Impact TV', 'ts:http://31.43.120.162:8029', 'http://impacttv.tv/images/stories/logo.png');
        addChannel(page, 'Трофей', 'ts:http://31.43.120.162:8030', 'http://trofey.net/images/thumbnails/video/images/trofey-player-fill-200x130.png');
        addChannel(page, 'ATR', 'hls:http://91.203.194.146:1935/liveedge/atr.stream/playlist.m3u8', 'http://atr.ua/assets/atr-logo-red/logo.png');
        addChannel(page, 'Boutique TV', 'ts:http://31.43.120.162:8060', '');
        addChannel(page, 'Shopping TV', 'ts:http://31.43.120.162:8063', '');
        addChannel(page, 'News One', 'rtmp://newsonelivefs.fplive.net:443/newsonelive-live/_definst_/streamukr', '');
        addChannel(page, 'Тиса-1', 'rtmp://213.174.8.15/live/live2', '');
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
        // http://tv.life.ru/index.m3u8
        addChannel(page, 'Life News (720p)', 'hls:http://tv.life.ru/lifetv/720p/index.m3u8', 'http://lifenews.ru/assets/logo-0a3a75be3dcc15b6c6afaef4adab52dd.png');
        addChannel(page, 'Life News (480p)', 'hls:http://tv.life.ru/lifetv/480p/index.m3u8', 'http://lifenews.ru/assets/logo-0a3a75be3dcc15b6c6afaef4adab52dd.png');
        addChannel(page, 'Россия 24', 'hls:http://testlivestream.rfn.ru/live/smil:r24.smil/playlist.m3u8?auth=vh&cast_id=21', '');
        addChannel(page, 'Euronews', 'hls:http://hls.cn.ru/streaming/euronews/tvrec/playlist.m3u8', '');
        addChannel(page, 'JN1', 'hls:http://serv03.vintera.tv:1935/restream/jno.stream/playlist.m3u8', '');
        addChannel(page, 'Дождь', 'hls:http://tvrain-video.ngenix.net/mobile/TVRain_1m.stream/playlist.m3u8', 'http://tvrain-st.cdn.ngenix.net/static/css/pub/images/logo-tvrain.png');
        addChannel(page, 'RTД', 'youtube', '');
        addChannel(page, 'ТНТ', 'seetv:tnt', '');
        //rtmp://rian.cdnvideo.ru/rr//stream20
        addChannel(page, 'РИА Новости', 'hls:http://rian.cdnvideo.ru:1935/rr/stream20/index.m3u8', '');
        addChannel(page, 'Brodilo.TV', 'ts:http://brodilo.tv/channel.php', '');
        addChannel(page, 'HD Media', 'hls:http://serv02.vintera.tv:1935/push/hdmedia.stream/playlist.m3u8', '');
        addChannel(page, 'HD Media 3D', 'hls:http://hdmedia3d.vintera.tv:1935/hdmedia3d/hdmedia3d.stream/playlist.m3u8', '');
        addChannel(page, 'ЕДАI', 'youtube', '');
        addChannel(page, 'myZen.tv', 'glaz:myzen-tv', '');
        //http://hls.novotelecom.ru/streaming/nickelodeon/tvrec/playlist.m3u8
        addChannel(page, 'Nick Jr', 'glaz:nick-jr', '');
        addChannel(page, 'Nickelodeon', 'hls:http://hls.cn.ru/streaming/nickelodeon/tvrec/playlist.m3u8', '');
        addChannel(page, 'Comedy TV', 'seetv:comedy-club', '');
        addChannel(page, 'Ростов ТВ', 'hls:http://rostovlife.vintera.tv:1935/mediapark/rostov_tv1.stream/playlist.m3u8', '');
        addChannel(page, 'Москва 24', 'hls:http://testlivestream.rfn.ru/live/smil:m24.smil/playlist.m3u8?auth=vh&cast_id=1661', '');
        addChannel(page, 'Маяк FM', 'hls:http://testlivestream.rfn.ru/live/smil:mayak.smil/playlist.m3u8?auth=vh&cast_id=81', '');
        addChannel(page, 'Россия 1', 'hls:http://213.208.179.135/rr2/smil:rtp_r1_rr.smil/playlist.m3u8?auth=vh&cast_id=2961', '');
        addChannel(page, 'Россия РТР', 'hls:http://213.208.179.135/rr2/smil:rtp_rtrp_rr.smil/playlist.m3u8?auth=vh&cast_id=4941', '');
        addChannel(page, 'Nano TV', 'hls:http://nano.teleservice.su:8080/hls/nano.m3u8', '');
        addChannel(page, 'Luxury World', 'hls:http://nano.teleservice.su:8080/hls/luxury.m3u8', '');
        addChannel(page, 'Стиль и мода', 'hls:http://btv-net.mediacdn.ru/TVB4/stilimoda/playlist.m3u8', '');
        addChannel(page, 'Auto.ru TV', 'hls:http://ms1.autoru.tv:1935/live/360p/playlist.m3u8', '');
        addChannel(page, 'Юмор Box', 'hls:http://musicbox.cdnvideo.ru:1935/musicbox-live/humorbox.sdp/playlist.m3u8', '');
        //rtmp://vkt.cdnvideo.ru/rtp/3
        addChannel(page, 'ВКТ', 'hls:http://vkt.cdnvideo.ru/rtp/3/playlist.m3u8', '');
        addChannel(page, 'ТВ3', 'hls:http://hls.cn.ru/streaming/tv3/tvrec/playlist.m3u8', '');
        addChannel(page, 'НТВ', 'hls:http://195.46.176.109/hls-live/live_a/_definst_/liveevent/livestream02.m3u8', '');
        //addChannel(page, 'НТВ', 'hls:http://195.189.238.83/streaming/ntv/tvrec/playlist.m3u8', '');
        //addChannel(page, 'BTB', 'http://85.25.43.30:8233', '');
        addChannel(page, 'Звезда', 'hls:http://webtv.tatar-inform.ru:1935/live/kzntv/playlist.m3u8', '');
        addChannel(page, 'Рен ТВ', 'hls:http://ren.cdnvideo.ru:1935/rtp/ren2/playlist.m3u8', '');
        addChannel(page, 'КПРФ', 'rtmp://kprf-live.cdn.ngenix.net/live/mp4:stream_700.mp4', '');
        addChannel(page, 'БСТ', 'hls:http://btv-net.mediacdn.ru/TVB4/bst/track_1/playlist.m3u8', '');

        page.appendItem("", "separator", {
            title: 'Planet Online'
        });
        addChannel(page, 'ТВТУР.TV', 'rtmp://80.93.53.88/live/channel_2', '');
        addChannel(page, 'Релакс.TV', 'rtmp://80.93.53.88/live/channel_3', '');
        addChannel(page, 'Премьера.TV', 'rtmp://80.93.53.88/live/channel_5', '');
        addChannel(page, 'Любимое.TV', 'rtmp://80.93.53.88/live/channel_6', '');
        addChannel(page, 'Кино РФ', 'rtmp://gb.orange.ether.tv/live/unikino/broadcast18', '');
        addChannel(page, 'ФК Рубин', 'rtmp://grey.ether.tv/live/rubin/broadcast4', '');

        page.appendItem("", "separator", {
            title: 'НТВ'
        });
        addChannel(page, 'НТВ', 'ts:http://clients.cdnet.tv/h/17/1/1/MFFIQjkvdlFWbE5Lam9jbkJlNjAzdjEyTVhNWEZhYUdSN3REYXI3cFV0QW1CRzE0bVkwK2dPY0Q0OFg1Y25meg', '');
        addChannel(page, 'Первый канал', 'ts:http://clients.cdnet.tv/h/14/1/1/MHdHdGhQdlFWbE96Uk92cHhibzF4TlFzUDhmS0NNZ3IrQ2JENWU2c1h1blc2OE9OUi9JR0tXTDloU3EwQkNCMg', '');
        addChannel(page, 'ТНТ', 'ts:http://clients.cdnet.tv/h/21/1/1/MkFIdVAvdlFWbE8vOWNwdzBrY3FEUHB5cDRvdTlMNkhIRW5yazJWUUlVUmVIajJzZmRDUkt2YVFnKzdFZGpWNw', '');
        addChannel(page, 'Россия 2', 'ts:http://clients.cdnet.tv/h/4/1/1/MVFIQkZQdlFWbE9YbnFaUzB4elFhMGc1WVJraU9iUUFhYkNCb2lyZlhoL3N3Ymc4QjBJbjdiQlBhbmp5UnJrSQ', '');
        addChannel(page, 'Россия К', 'ts:http://clients.cdnet.tv/h/18/1/1/MXdGN0FQdlFWbFBRdWMxVHl0K0dBZWVHbTJGQkFzbVJ2elBPRzBaUzNjUUlWbkxaMTNsKzZwd2JJS0lmYU5GWg', '');
        addChannel(page, 'Домашний', 'ts:http://clients.cdnet.tv/h/22/1/1/MEFGMUgvdlFWbE9ERUdyZzd5M29qOGZZQm53dmpoSVlmOXo3WFRESWN5S1ZSWWN5WVNOaUdNTUJhcjJoK3B5cQ', '');
        addChannel(page, '1 канал', 'hls:http://178.49.132.73/streaming/1kanal/tvrec/playlist.m3u8', '');
        addChannel(page, 'Russia', 'hls:http://178.49.132.73/streaming/rossija/tvrec/playlist.m3u8', '');
        addChannel(page, 'NTV', 'hls:http://178.49.132.73/streaming/ntv/tvrec/playlist.m3u8', '');
        addChannel(page, '5 Channel', 'hls:http://178.49.132.73/streaming/5kanal/tvrec/playlist.m3u8', '');
        addChannel(page, 'Rennes', 'hls:http://178.49.132.73/streaming/rentv/tvrec/playlist.m3u8', '');
        addChannel(page, 'UTS', 'hls:http://178.49.132.73/streaming/ots/tvrec/playlist.m3u8', '');
        addChannel(page, 'Home', 'hls:http://178.49.132.73/streaming/domashny/tvrec/playlist.m3u8', '');
        addChannel(page, 'TV-3', 'hls:http://178.49.132.73/streaming/tv3/tvrec/playlist.m3u8', '');
        addChannel(page, '49 Channel (Novosibirsk)', 'hls:http://178.49.132.73/streaming/49kanal/tvrec/playlist.m3u8', '');
        addChannel(page, 'Culture', 'hls:http://178.49.132.73/streaming/kultura/tvrec/playlist.m3u8', '');
        addChannel(page, 'TVC', 'hls:http://178.49.132.73/streaming/tvc/tvrec/playlist.m3u8', '');
        addChannel(page, 'Pepper', 'hls:http://178.49.132.73/streaming/perec/tvrec/playlist.m3u8', '');
        //addChannel(page, 'TNT', 'hls:http://178.49.132.73/streaming/perec/tnt/playlist.m3u8', '');
        //addChannel(page, 'Disney', 'hls:http://178.49.132.73/streaming/disney/tvrec/playlist.m3u8', '');
        //addChannel(page, 'Union', 'hls:http://178.49.132.73/streaming/soyuz/tvrec/playlist.m3u8', '');
        //addChannel(page, 'World', 'hls:http://178.49.132.73/streaming/mir/tvrec/playlist.m3u8', '');
        //addChannel(page, 'OTV', 'hls:http://178.49.132.73/streaming/otvrus/tvrec/playlist.m3u8', '');
        addChannel(page, 'carousel', 'hls:http://178.49.132.73/streaming/karusel/tvrec/playlist.m3u8', '');
        addChannel(page, 'STS', 'hls:http://178.49.132.73/streaming/sts/tvrec/playlist.m3u8', '');
        addChannel(page, 'Children', 'hls:http://178.49.132.73/streaming/forkids/tvrec/playlist.m3u8', '');
        //addChannel(page, 'Children World', 'hls:http://178.49.132.73/streaming/detskij_mir/tvrec/playlist.m3u8', '');
        addChannel(page, 'Nickelodeon', 'hls:http://178.49.132.73/streaming/nickelodeon/tvrec/playlist.m3u8', '');
        //addChannel(page, 'Tiji', 'hls:http://178.49.132.73/streaming/tiji/tvrec/playlist.m3u8', '');
        //addChannel(page, 'JimJam', 'hls:http://178.49.132.73/streaming/jim_jam/tvrec/playlist.m3u8', '');
        addChannel(page, 'Mother and Child', 'hls:http://178.49.132.73/streaming/motherchi/tvrec/playlist.m3u8', '');
        //addChannel(page, 'TLC', 'hls:http://178.49.132.73/streaming/tlc/tvrec/playlist.m3u8', '');
        addChannel(page, 'Fashion', 'hls:http://178.49.132.73/streaming/fashion/tvrec/playlist.m3u8', '');
        //addChannel(page, 'FoxLife', 'hls:http://178.49.132.73/streaming/foxlife/tvrec/playlist.m3u8', '');
        //addChannel(page, 'Diva Universal', 'hls:http://178.49.132.73/streaming/diva_universal/tvrec/playlist.m3u8', '');
        //addChannel(page, 'India', 'hls:http://178.49.132.73/streaming/indiatv/tvrec/playlist.m3u8', '');
        //addChannel(page, 'Russian novel', 'hls:http://178.49.132.73/streaming/russian_roman/tvrec/playlist.m3u8', '');
        //addChannel(page, 'Discovery Russia', 'hls:http://178.49.132.73/streaming/discovery/tvrec/playlist.m3u8', '');
        //addChannel(page, 'Discovery Word', 'hls:http://178.49.132.73/streaming/discoveryworld/tvrec/playlist.m3u8', '');
        //addChannel(page, 'Discovery science', 'hls:http://178.49.132.73/streaming/discoveryscience/tvrec/playlist.m3u8', '');
        //addChannel(page, 'Animal Planet', 'hls:http://178.49.132.73/streaming/animalplanet/tvrec/playlist.m3u8', '');
        //addChannel(page, 'Natgeo', 'hls:http://178.49.132.73/streaming/natgeo/tvrec/playlist.m3u8', '');
        //addChannel(page, 'Natgeo Wild', 'hls:http://178.49.132.73/streaming/nat_geo_wild/tvrec/playlist.m3u8', '');
        //addChannel(page, 'Viasat Nature', 'hls:http://178.49.132.73/streaming/viasat_nature/tvrec/playlist.m3u8', '');
        //addChannel(page, 'Viasat History', 'hls:http://178.49.132.73/streaming/viasat_history/tvrec/playlist.m3u8', '');
        //addChannel(page, 'Viasat Explorer', 'hls:http://178.49.132.73/streaming/viasat_explorer/tvrec/playlist.m3u8', '');
        //addChannel(page, 'Teleputeshestviya', 'hls:http://178.49.132.73/streaming/rustravel/tvrec/playlist.m3u8', '');
        //addChannel(page, 'My Planet', 'hls:http://178.49.132.73/streaming/my_planet/tvrec/playlist.m3u8', '');
        //addChannel(page, 'Travel & Adventure', 'hls:http://178.49.132.73/streaming/traveladventure/tvrec/playlist.m3u8', '');
        //addChannel(page, 'DaVinci', 'hls:http://178.49.132.73/streaming/da_vinci/tvrec/playlist.m3u8', '');
        addChannel(page, '24 Techno', 'hls:http://178.49.132.73/streaming/24techno/tvrec/playlist.m3u8', '');
        //addChannel(page, 'Science 2.0', 'hls:http://178.49.132.73/streaming/nauka_20/tvrec/playlist.m3u8', '');
        //addChannel(page, 'Time', 'hls:http://178.49.132.73/streaming/time/tvrec/playlist.m3u8', '');
        addChannel(page, 'First Education', 'hls:http://178.49.132.73/streaming/1_obraz/tvrec/playlist.m3u8', '');
        //addChannel(page, 'Amazing Life', 'hls:http://178.49.132.73/streaming/amazing_life/tvrec/playlist.m3u8', '');
        //addChannel(page, '365 Days', 'hls:http://178.49.132.73/streaming/365_days/tvrec/playlist.m3u8', '');
        //addChannel(page, 'TV Browse', 'hls:http://178.49.132.73/streaming/interesnoe_tv/tvrec/playlist.m3u8', '');
        //addChannel(page, 'Fox', 'hls:http://178.49.132.73/streaming/fox/tvrec/playlist.m3u8', '');
        //addChannel(page, 'Set', 'hls:http://178.49.132.73/streaming/set/tvrec/playlist.m3u8', '');
        //addChannel(page, 'Sony', 'hls:http://178.49.132.73/streaming/sonyscifi/tvrec/playlist.m3u8', '');
        addChannel(page, '21 TV', 'hls:http://178.49.132.73/streaming/tv21/tvrec/playlist.m3u8', '');
        //addChannel(page, 'Comedy', 'hls:http://178.49.132.73/streaming/comedytv/tvrec/playlist.m3u8', '');
        //addChannel(page, 'TV 1000', 'hls:http://178.49.132.73/streaming/tv1000/tvrec/playlist.m3u8', '');
        //addChannel(page, 'TV 1000 Action', 'hls:http://178.49.132.73/streaming/tv1000_action/tvrec/playlist.m3u8', '');
        //addChannel(page, 'TV 1000 Russian film', 'hls:http://178.49.132.73/streaming/tv_1000_rus_kino/tvrec/playlist.m3u8', '');
        //addChannel(page, 'Russian Illusion', 'hls:http://178.49.132.73/streaming/russian_illusion/tvrec/playlist.m3u8', '');
        //addChannel(page, 'Cinema House', 'hls:http://178.49.132.73/streaming/dom_kino/tvrec/playlist.m3u8', '');
        //addChannel(page, 'Universal', 'hls:http://178.49.132.73/streaming/universal_channel/tvrec/playlist.m3u8', '');
        //addChannel(page, 'Kinolyuks ( NTV )', 'hls:http://178.49.132.73/streaming/kinolux/tvrec/playlist.m3u8', '');
        //addChannel(page, 'Russian bestseller', 'hls:http://178.49.132.73/streaming/russia_best/tvrec/playlist.m3u8', '');
        addChannel(page, 'Real Scary', 'hls:http://178.49.132.73/streaming/nstv/tvrec/playlist.m3u8', '');
        addChannel(page, 'Russia 24', 'hls:http://178.49.132.73/streaming/vesti/tvrec/playlist.m3u8', '');
        addChannel(page, 'Rain', 'hls:http://178.49.132.73/streaming/rain/tvrec/playlist.m3u8', '');
        addChannel(page, 'RBC', 'hls:http://178.49.132.73/streaming/rbk/tvrec/playlist.m3u8', '');
        addChannel(page, '24, World', 'hls:http://178.49.132.73/streaming/mir24/tvrec/playlist.m3u8', '');
        //addChannel(page, 'Country', 'hls:http://178.49.132.73/streaming/strana/tvrec/playlist.m3u8', '');
        addChannel(page, 'CNN', 'hls:http://178.49.132.73/streaming/cnn/tvrec/playlist.m3u8', '');
        addChannel(page, 'Euronews', 'hls:http://178.49.132.73/streaming/euronews/tvrec/playlist.m3u8', '');
        addChannel(page, 'Russiatoday', 'hls:http://178.49.132.73/streaming/russiatoday/tvrec/playlist.m3u8', '');
        addChannel(page, 'S', 'hls:http://178.49.132.73/streaming/utv/tvrec/playlist.m3u8', '');
        addChannel(page, 'Friday', 'hls:http://178.49.132.73/streaming/friday/tvrec/playlist.m3u8', '');
        //addChannel(page, 'Discovery ID', 'hls:http://178.49.132.73/streaming/investigationdiscovery/tvrec/playlist.m3u8', '');
        addChannel(page, '2x2', 'hls:http://178.49.132.73/streaming/2x2tv/tvrec/playlist.m3u8', '');
        addChannel(page, 'Star', 'hls:http://178.49.132.73/streaming/zvezda/tvrec/playlist.m3u8', '');
        addChannel(page, 'Live', 'hls:http://178.49.132.73/streaming/jv/tvrec/playlist.m3u8', '');
        //addChannel(page, 'Drive', 'hls:http://178.49.132.73/streaming/drive/tvrec/playlist.m3u8', '');
        //addChannel(page, 'Hunting and Fishing', 'hls:http://178.49.132.73/streaming/hafi/tvrec/playlist.m3u8', '');
        //addChannel(page, 'Homesteads', 'hls:http://178.49.132.73/streaming/usadba/tvrec/playlist.m3u8', '');
        //addChannel(page, 'Nostalgia', 'hls:http://178.49.132.73/streaming/nostalgy/tvrec/playlist.m3u8', '');
        //addChannel(page, 'Auto Plus', 'hls:http://178.49.132.73/streaming/auto_plus/tvrec/playlist.m3u8', '');
        //addChannel(page, 'Weapons', 'hls:http://178.49.132.73/streaming/oruzhie/tvrec/playlist.m3u8', '');
        //addChannel(page, 'Sundress', 'hls:http://178.49.132.73/streaming/sarafan/tvrec/playlist.m3u8', '');
        //addChannel(page, 'Kitchen TV', 'hls:http://178.49.132.73/streaming/kitchentv/tvrec/playlist.m3u8', '');
        //addChannel(page, 'Telecafe', 'hls:http://178.49.132.73/streaming/telekafe/tvrec/playlist.m3u8', '');
        //addChannel(page, 'Psychology 21', 'hls:http://178.49.132.73/streaming/psych_21/tvrec/playlist.m3u8', '');
        //addChannel(page, 'Success', 'hls:http://178.49.132.73/streaming/uspex/tvrec/playlist.m3u8', '');
        //addChannel(page, '8 Channel', 'hls:http://178.49.132.73/streaming/8_kanal/tvrec/playlist.m3u8', '');
        addChannel(page, 'A-One', 'hls:http://178.49.132.73/streaming/aone/tvrec/playlist.m3u8', '');
        addChannel(page, 'O2', 'hls:http://178.49.132.73/streaming/o2tv/tvrec/playlist.m3u8', '');
        //addChannel(page, 'Ru.TV', 'hls:http://178.49.132.73/streaming/rutv/tvrec/playlist.m3u8', '');
        addChannel(page, 'Musicbox Ru', 'hls:http://178.49.132.73/streaming/musboxru/tvrec/playlist.m3u8', '');
        addChannel(page, 'Musicbox', 'hls:http://178.49.132.73/streaming/musboxtv/tvrec/playlist.m3u8', '');
        //addChannel(page, 'VH1', 'hls:http://178.49.132.73/streaming/vh1/tvrec/playlist.m3u8', '');
        //addChannel(page, 'Europa +', 'hls:http://178.49.132.73/streaming/europaplustv/tvrec/playlist.m3u8', '');
        //addChannel(page, 'MCM', 'hls:http://178.49.132.73/streaming/mcmtop/tvrec/playlist.m3u8', '');
        //addChannel(page, 'Bridge TV', 'hls:http://178.49.132.73/streaming/brigge/tvrec/playlist.m3u8', '');
        //addChannel(page, 'Chanson', 'hls:http://178.49.132.73/streaming/shanson/tvrec/playlist.m3u8', '');
        //addChannel(page, 'A -Minor', 'hls:http://178.49.132.73/streaming/la_minor/tvrec/playlist.m3u8', '');
        //addChannel(page, 'Mezzo', 'hls:http://178.49.132.73/streaming/mezzo/tvrec/playlist.m3u8', '');
        //addChannel(page, 'Muz-TV', 'hls:http://178.49.132.73/streaming/muz_tvnew/tvrec/playlist.m3u8', '');
        addChannel(page, 'Russia 2', 'hls:http://178.49.132.73/streaming/sport/tvrec/playlist.m3u8', '');
        //addChannel(page, 'Eurosport', 'hls:http://178.49.132.73/streaming/eurosport/tvrec/playlist.m3u8', '');
        //addChannel(page, 'Eurosport 2', 'hls:http://178.49.132.73/streaming/eurosport2/tvrec/playlist.m3u8', '');
        addChannel(page, '1 Sport', 'hls:http://178.49.132.73/streaming/sport1/tvrec/playlist.m3u8', '');
        //addChannel(page, 'Sport', 'hls:http://178.49.132.73/streaming/sport_2/tvrec/playlist.m3u8', '');
        addChannel(page, 'Football', 'hls:http://178.49.132.73/streaming/futbol/tvrec/playlist.m3u8', '');
        //addChannel(page, 'CHL', 'hls:http://178.49.132.73/streaming/khl/tvrec/playlist.m3u8', '');
        //addChannel(page, 'Viasat Sport', 'hls:http://178.49.132.73/streaming/viasat_sport/tvrec/playlist.m3u8', '');
        //addChannel(page, 'Fight Club', 'hls:http://178.49.132.73/streaming/fight_club/tvrec/playlist.m3u8', '');
        //addChannel(page, 'Extreme Sports', 'hls:http://178.49.132.73/streaming/extreme_sports/tvrec/playlist.m3u8', '');

        page.appendItem("", "separator", {
            title: 'Tricolor'
        });
        addChannel(page, 'Kazakh TV', 'ts:http://31.43.120.162:8040', '');
        addChannel(page, 'ВТВ', 'ts:http://31.43.120.162:8044', '');
        addChannel(page, 'Карусель', 'ts:http://31.43.120.162:8068', '');
        addChannel(page, 'HCT', 'ts:http://31.43.120.162:8070', '');
        addChannel(page, '24_DOC', 'ts:http://31.43.120.162:8071', '');
        addChannel(page, 'Мать и дитя', 'ts:http://31.43.120.162:8074', '');
        addChannel(page, 'Eurosport 2', 'ts:http://31.43.120.162:8076', '');
        addChannel(page, 'Мир', 'ts:http://31.43.120.162:8077', '');
        addChannel(page, 'СТС', 'ts:http://31.43.120.162:8079', '');
        addChannel(page, 'Моя планета', 'ts:http://31.43.120.162:8080', '');
        addChannel(page, 'Пятница!', 'ts:http://31.43.120.162:8081', '');
        addChannel(page, 'РБК', 'ts:http://31.43.120.162:8082', '');
        addChannel(page, 'Рен ТВ', 'ts:http://31.43.120.162:8083', '');
        addChannel(page, 'Мультимания', 'ts:http://31.43.120.162:8084', '');
        addChannel(page, 'Детский', 'ts:http://31.43.120.162:8085', '');
        addChannel(page, 'Nickelodeon', 'ts:http://31.43.120.162:8086', '');
        addChannel(page, 'Русский иллюзион', 'ts:http://31.43.120.162:8087', '');
        addChannel(page, 'Иллюзион+', 'ts:http://31.43.120.162:8088', '');
        addChannel(page, 'ZOOПарк', 'ts:http://31.43.120.162:8089', '');
        addChannel(page, 'XXI', 'ts:http://31.43.120.162:8090', '');
        addChannel(page, 'Russian extreme', 'ts:http://31.43.120.162:8091', '');
        addChannel(page, 'Еврокино', 'ts:http://31.43.120.162:8092', '');
        addChannel(page, 'Ретро', 'ts:http://31.43.120.162:8093', '');
        addChannel(page, 'Драйв', 'ts:http://31.43.120.162:8094', '');
        addChannel(page, 'Охота и рыбалка', 'ts:http://31.43.120.162:8095', '');
        addChannel(page, 'Здоровое ТВ', 'ts:http://31.43.120.162:8096', '');
        addChannel(page, 'Усадьба', 'ts:http://31.43.120.162:8097', '');
        addChannel(page, 'Домашние животные', 'ts:http://31.43.120.162:8098', '');
        addChannel(page, 'Психология21', 'ts:http://31.43.120.162:8099', '');
        addChannel(page, 'Вопросы и ответы', 'ts:http://31.43.120.162:8100', '');
        addChannel(page, 'Бойцовский клуб', 'ts:http://31.43.120.162:8101', '');
        addChannel(page, 'Fox', 'ts:http://31.43.120.162:8103', '');
        addChannel(page, 'Fox Life', 'ts:http://31.43.120.162:8104', '');
        addChannel(page, 'Россия 1', 'ts:http://31.43.120.162:8105', '');
        addChannel(page, 'Россия 24', 'ts:http://31.43.120.162:8106', '');
        addChannel(page, 'Россия 2', 'ts:http://31.43.120.162:8107', '');
        addChannel(page, 'Россия К', 'ts:http://31.43.120.162:8108', '');
        addChannel(page, 'Спорт 1', 'ts:http://31.43.120.162:8110', '');
        addChannel(page, 'Disney канал', 'ts:http://31.43.120.162:8111', '');
        addChannel(page, 'Sony Entertainment TV', 'ts:http://31.43.120.162:8112', '');
        addChannel(page, 'Sony Sci-Fi', 'ts:http://31.43.120.162:8113', '');
        addChannel(page, 'Феникс Плюс Кино', 'ts:http://31.43.120.162:8114', '');
        addChannel(page, 'National Geographic', 'ts:http://31.43.120.162:8115', '');
        addChannel(page, 'Comedy TV', 'ts:http://31.43.120.162:8116', '');
        addChannel(page, 'Discovery Russia', 'ts:http://31.43.120.162:8117', '');
        addChannel(page, 'Animal Planet', 'ts:http://31.43.120.162:8119', '');
        addChannel(page, 'Cartoon Network', 'ts:http://31.43.120.162:8120', '');
        addChannel(page, 'Живи!', 'ts:http://31.43.120.162:8121', '');
        addChannel(page, 'Телекафе', 'ts:http://31.43.120.162:8123', '');
        addChannel(page, 'Время', 'ts:http://31.43.120.162:8124', '');
        addChannel(page, 'Дом кино', 'ts:http://31.43.120.162:8126', '');
        addChannel(page, '5 канал', 'ts:http://31.43.120.162:8128', '');
        addChannel(page, 'Спорт', 'ts:http://31.43.120.162:8130', '');

        addChannel(page, 'Первый канал', 'ts:http://91.192.168.242:8001', '');
        addChannel(page, 'Россия 1', 'ts:http://91.192.168.242:8002', '');
        addChannel(page, 'HTB', 'ts:http://91.192.168.242:8003', '');
        addChannel(page, 'Россия Культура', 'ts:http://91.192.168.242:8004', '');
        addChannel(page, 'Euronews', 'ts:http://91.192.168.242:8005', '');
        addChannel(page, 'ATH', 'ts:http://91.192.168.242:8006', '');
        addChannel(page, 'OTB', 'ts:http://91.192.168.242:8007', '');
        addChannel(page, 'Карусель', 'ts:http://91.192.168.242:8008', '');
        addChannel(page, '5 канал', 'ts:http://91.192.168.242:8009', '');
        addChannel(page, 'СТС', 'ts:http://91.192.168.242:8010', '');
        addChannel(page, 'Перец', 'ts:http://91.192.168.242:8011', '');
        addChannel(page, '41', 'ts:http://91.192.168.242:8012', '');
        addChannel(page, 'ТВЦ', 'ts:http://91.192.168.242:8013', '');
        addChannel(page, 'ОТР', 'ts:http://91.192.168.242:8014', '');
        addChannel(page, '4 канал', 'ts:http://91.192.168.242:8015', '');
        addChannel(page, 'Спорт', 'ts:http://91.192.168.242:8016', '');
        addChannel(page, 'Наука 2.0', 'ts:http://91.192.168.242:8017', '');
        addChannel(page, 'Сарафан ТВ', 'ts:http://91.192.168.242:8018', '');
        addChannel(page, 'Русский роман', 'ts:http://91.192.168.242:8020', '');
        addChannel(page, 'ТНТ', 'ts:http://91.192.168.242:8021', '');
        addChannel(page, 'Рен ТВ', 'ts:http://91.192.168.242:8022', '');
        addChannel(page, 'ТВ3', 'ts:http://91.192.168.242:8023', '');
        addChannel(page, 'ТТС', 'ts:http://91.192.168.242:8024', '');
        addChannel(page, 'Teen TV', 'ts:http://91.192.168.242:8026', '');
        addChannel(page, 'Охотник и рыболов', 'ts:http://91.192.168.242:8027', '');
        addChannel(page, 'Телепутешествия', 'ts:http://91.192.168.242:8028', '');
        addChannel(page, 'Спорт Плюс', 'ts:http://91.192.168.242:8030', '');
        addChannel(page, 'Евроспорт 2', 'ts:http://91.192.168.242:8031', '');
        addChannel(page, 'National Geographic', 'ts:http://91.192.168.242:8032', '');
        addChannel(page, 'Моя планета', 'ts:http://91.192.168.242:8033', '');
        addChannel(page, 'Пятница!', 'ts:http://91.192.168.242:8034', '');
        addChannel(page, 'РБК', 'ts:http://91.192.168.242:8036', '');
        addChannel(page, 'Cartoon Network', 'ts:http://91.192.168.242:8037', '');
        addChannel(page, 'Мультимания', 'ts:http://91.192.168.242:8038', '');
        addChannel(page, 'Мать и дитя', 'ts:http://91.192.168.242:8039', '');
        addChannel(page, 'Discovery Channel', 'ts:http://91.192.168.242:8040', '');
        addChannel(page, 'Animal Planet', 'ts:http://91.192.168.242:8041', '');
        addChannel(page, 'Русский бестселлер', 'ts:http://91.192.168.242:8042', '');
        addChannel(page, '365', 'ts:http://91.192.168.242:8043', '');
        addChannel(page, 'Комедия', 'ts:http://91.192.168.242:8044', '');
        addChannel(page, 'Ля минор', 'ts:http://91.192.168.242:8045', '');
        addChannel(page, 'Много ТВ', 'ts:http://91.192.168.242:8046', '');
        addChannel(page, 'Бойцовский клуб', 'ts:http://91.192.168.242:8047', '');
        addChannel(page, 'ТНВ планета', 'ts:http://91.192.168.242:8048', '');
        addChannel(page, 'Живи!', 'ts:http://91.192.168.242:8049', '');
        addChannel(page, 'Телекафе', 'ts:http://91.192.168.242:8050', '');
        addChannel(page, 'Время', 'ts:http://91.192.168.242:8051', '');
        addChannel(page, 'Дом кино', 'ts:http://91.192.168.242:8052', '');
        addChannel(page, '24', 'ts:http://91.192.168.242:8053', '');
        addChannel(page, 'Звезда', 'ts:http://91.192.168.242:8054', '');
        addChannel(page, 'Детский мир', 'ts:http://91.192.168.242:8055', '');
        addChannel(page, 'Кино ТВ', 'ts:http://91.192.168.242:8056', '');
        addChannel(page, 'История', 'ts:http://91.192.168.242:8057', '');
        addChannel(page, 'Ретро', 'ts:http://91.192.168.242:8058', '');
        addChannel(page, 'Драйв', 'ts:http://91.192.168.242:8059', '');
        addChannel(page, 'Охота и рыбалка', 'ts:http://91.192.168.242:8060', '');
        addChannel(page, 'Усадьба', 'ts:http://91.192.168.242:8061', '');
        addChannel(page, 'Домашние животные', 'ts:http://91.192.168.242:8062', '');
        addChannel(page, 'Психология21', 'ts:http://91.192.168.242:8063', '');
        addChannel(page, 'Бойцовский клуб', 'ts:http://91.192.168.242:8064', '');
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
