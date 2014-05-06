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
        page.loading = true;
        // search for the channel
        var resp = showtime.httpReq("https://www.youtube.com/results?search_query=" + title.replace(/\s/g, '+')).toString();
        page.loading = false;
        // looking for user's page
        var match = resp.match(/<a href="\/user\/([\S\s]*?)"/);
        var match2 = resp.match(/\/watch\?v=([\S\s]*?)"/);
        if (match) {
            page.loading = true;
            resp = showtime.httpReq("https://www.youtube.com/user/" + match[1]).toString();
            page.loading = false;
            // looking for the channel link
            var match = resp.match(/\/watch\?v=([\S\s]*?)"/);
            if (match) {
                page.loading = true;
                resp = showtime.httpReq("https://www.youtube.com/watch?v=" + match[1]).toString();
                page.loading = false;
                // getting the link
                match = resp.match(/"hlsvp": "([\S\s]*?)"/);
                if (!match) {
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
                }
            }
        }
    });

    function addChannel(page, url, title, icon) {
        var link = "videoparams:" + showtime.JSONEncode({
                        sources: [{
                            url: url
                        }],
                        title: title,
                        no_fs_scan: true
                   });

        if (url == 'youtube')
            link = PREFIX + "youtube:" + title;

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
	    var item =

    // Start page
    plugin.addURI(PREFIX + "start", function(page) {
        setPageHeader(page, slogan);
	page.appendItem(PREFIX + "favorites", "directory", {
	    title: "My Favorites"
	});

        page.appendItem("", "separator", {
            title: 'Deutsch'
        });
        addChannel(page, 'hls:http://n24-live.hls.adaptive.level3.net/hls-live/n24-pssimn24live/_definst_/live/stream2.m3u8',
            'N24',
            'http://www.norcom.de/sites/default/files/N24.png');

        page.appendItem("", "separator", {
            title: 'English'
        });
        addChannel(page, 'hls:http://livestation_hls-lh.akamaihd.net/i/bbcworld_en@105465/index_928_av-b.m3u8', 'BBC World News', '');
        addChannel(page, 'hls:http://dwtvios_europa-i.akamaihd.net/hls/live/200515/dwtveuropa/1/playlist1x.m3u8', 'DW Europe', '');

        page.appendItem("", "separator", {
            title: 'Music'
        });
        addChannel(page, 'hls:http://91.82.85.16:1935/relay15/nettv_channel_1/playlist.m3u8', 'Dance  TV', '');
        addChannel(page, 'hls:http://91.82.85.16:1935/relay15/nettv03_channel_1/playlist.m3u8', 'King TV', '');
        addChannel(page, 'hls:http://mox.tv/hls/moxtv-a6.m3u8', 'MOX', '');
        addChannel(page, 'hls:http://109.239.142.62:1935/live/hlsstream/playlist3.m3u8', '1HD (HLS)', '');
        addChannel(page, 'rtmp://109.239.142.62/live/livestream3', '1HD (RTMP)', '');
        addChannel(page, 'hls:http://vevoplaylist-live.hls.adaptive.level3.net/vevo/ch1/06/prog_index.m3u8', 'Vevo 1', '');
        addChannel(page, 'hls:http://vevoplaylist-live.hls.adaptive.level3.net/vevo/ch2/06/prog_index.m3u8', 'Vevo 2', '');
        addChannel(page, 'hls:http://vevoplaylist-live.hls.adaptive.level3.net/vevo/ch3/06/prog_index.m3u8', 'Vevo 3', '');
        addChannel(page, 'rtmp://rtmp.infomaniak.ch/livecast//ouitv', 'OUI TV', '');
        addChannel(page, 'rtmp://europaplus.cdnvideo.ru/europaplus-live//mp4:eptv_main.sdp', 'Europa Plus TV (RTMP)', 'http://www.europaplustv.com/images/europa_tv.png');
        addChannel(page, 'hls:http://europaplus.cdnvideo.ru/europaplus-live/mp4:eptv_main.sdp/playlist.m3u8', 'Europa Plus TV (HLS)', 'http://www.europaplustv.com/images/europa_tv.png');
        addChannel(page, 'http://31.43.120.162:8127', 'Europa Plus TV (MPEG2)', '');
        addChannel(page, 'http://91.192.168.242:8019', 'Europa Plus TV (MPEG2)', '');
        addChannel(page, 'http://31.43.120.162:8109', 'Музыка', '');
        addChannel(page, 'http://31.43.120.162:8129', 'Vh1', '');
        addChannel(page, 'http://31.43.120.162:8013', 'М2', 'http://www.m2.tv/images/design/2009/m2_logo_2009.jpg');
        addChannel(page, 'http://31.43.120.162:8065', 'A-One UA', '');
        addChannel(page, 'http://31.43.120.162:8072', 'A-One Hip-Hop', '');
        addChannel(page, 'http://91.192.168.242:8065', 'A-One Hip-Hop', '');
        addChannel(page, 'hls:http://vniitr.cdnvideo.ru/vniitr-live/vniitr.sdp/playlist.m3u8', 'RU TV (HLS)', '');
        addChannel(page, 'http://91.192.168.242:8025', 'RU TV (MPEG2)', '');
        addChannel(page, 'rtmp://149.11.34.6/live/partytv.stream', 'Party TV', '');
        addChannel(page, 'rtmp://rtmp.infomaniak.ch/livecast/rougetv', 'Rouge TV', '');
        addChannel(page, 'rtmp://wowza1.top-ix.org/quartaretetv1/formusicweb', 'For Music', '');
        addChannel(page, 'hls:http://194.79.52.79/ockoi/ockoHQ2/hasbahca.m3u8', 'Ocko', '');
        addChannel(page, 'rtmp://stream.smcloud.net/live/polotv', 'Polo TV', '');
        addChannel(page, 'rtmp://stream.smcloud.net/live/eskatv', 'Eska TV', '');
        addChannel(page, 'rtmp://stream.smcloud.net/live2/eska_party/eska_party_360p', 'Eska Party TV', '');
        addChannel(page, 'rtmp://stream.smcloud.net/live2/eska_rock/eska_rock_360p', 'Eska Rock TV', '');
        addChannel(page, 'http://213.81.153.221:8080/nasa', 'Music Box', '');
        addChannel(page, 'hls:http://musicbox.cdnvideo.ru/musicbox-live/musicbox.sdp/playlist.m3u8', 'Russian Musicbox', '');
        addChannel(page, 'hls:http://chanson.cdnvideo.ru:1935/chanson-live/shansontv.sdp/playlist.m3u8', 'Шансон ТВ', '');
        addChannel(page, 'rtmp://cdn-sov-2.musicradio.com:80/LiveVideo/Heart', 'Heartv', '');
        addChannel(page, 'hls:http://starstv-live.e91-jw.insyscd.net/starstv.isml/QualityLevels(960000)/manifest(format=m3u8-aapl).m3u8', 'Star TV', '');
        addChannel(page, 'http://212.79.96.134:8005', 'Musiq 1 TV', '');
        addChannel(page, 'http://212.79.96.134:8024', '1 Classic', '');

        page.appendItem("", "separator", {
            title: 'One HD'
        });
        addChannel(page, 'hls:http://91.201.78.3:1935/live/onehdhd/playlist.m3u8', 'Live Mix', '');
        addChannel(page, 'hls:http://91.201.78.3:1935/live/pophd/playlist.m3u8', 'Pop', '');
        addChannel(page, 'hls:http://91.201.78.3:1935/live/rockhd/playlist.m3u8', 'Rock', '');
        addChannel(page, 'hls:http://91.201.78.3:1935/live/jazzhd/playlist.m3u8', 'Jazz', '');
        addChannel(page, 'hls:http://91.201.78.3:1935/live/classicshd/playlist.m3u8', 'Classic', '');
        addChannel(page, 'hls:http://91.201.78.3:1935/live/dancehd/playlist.m3u8', 'Dance', '');

        page.appendItem("", "separator", {
            title: 'Ukrainian'
        });
        addChannel(page, 'youtube', 'Espreso TV', '');
        addChannel(page, 'youtube', 'Hromadske.tv', '');
        addChannel(page, 'youtube', '24 канал (HLS)', '');
        addChannel(page, 'http://31.43.120.162:8014', '24 канал (MPEG2)', 'http://24tv.ua/img/24_logo_facebook.jpg');
        addChannel(page, 'youtube', 'UBR', '');
        addChannel(page, 'hls:http://212.40.43.10:1935/inters/smil:inter.smil/playlist.m3u8', 'Інтер', 'http://inter.ua/images/logo.png');
        addChannel(page, 'http://91.192.168.242:8029', 'Інтер+', '');
        addChannel(page, 'http://31.43.120.162:8062', '100', 'http://tv100.com.ua/templates/diablofx/images/100_logo.jpg');
        //rtmp://31.28.169.242/live/live112
        addChannel(page, 'hls:http://31.28.169.242/hls/live112.m3u8', '112', 'http://112.ua/static/img/logo/112_ukr.png');
        addChannel(page, 'rtmp://media.tvi.com.ua/live/_definst_//HLS4', 'ТВі', 'http://tvi.ua/catalog/view/theme/new/image/logo.png');
        addChannel(page, 'rtmp://194.0.88.78/mytv//ictvz440', 'ICTV', '');
        addChannel(page, 'http://31.43.120.162:8009', 'Уніан', 'http://images.unian.net/img/unian-logo.png');
        addChannel(page, 'http://31.43.120.162:8041', 'ЧП.INFO', 'http://www.tele-com.tv/img/icons/chp-info.png');
        addChannel(page, 'http://31.43.120.162:8035', 'Euronews', 'http://ua.euronews.com/media/logo_222.gif');
        addChannel(page, 'http://31.43.120.162:8058', 'Право TV', '');
        addChannel(page, 'http://31.43.120.162:8067', 'Dobro', '');
        addChannel(page, 'http://31.43.120.162:8073', '2x2', '');
        addChannel(page, 'http://91.192.168.242:8035', '2x2', '');
        addChannel(page, 'http://31.43.120.162:8047', 'УТР', 'http://utr.tv/ru/templates/UTR/images/logo.png');
        addChannel(page, 'rtmp://gigaz.wi.com.ua/hallDemoHLS/LVIV', 'ТРК Львів', 'http://www.lodtrk.org.ua/inc/getfile.php?i=20111026133818.gif');
        addChannel(page, 'http://31.43.120.162:8048', 'Львів ТВ', 'http://www.lviv-tv.com/images/aTV/logo/LTB_FIN_END_6.png');
        addChannel(page, 'http://31.43.120.162:8042', 'ТК Черное море', 'http://www.blacksea.net.ua/images/logo2.png');
        addChannel(page, 'http://31.43.120.162:8029', 'Impact TV', 'http://impacttv.tv/images/stories/logo.png');
        addChannel(page, 'http://31.43.120.162:8030', 'Трофей', 'http://trofey.net/images/thumbnails/video/images/trofey-player-fill-200x130.png');
        addChannel(page, 'hls:http://91.203.194.146:1935/liveedge/atr.stream/playlist.m3u8', 'ATR', 'http://atr.ua/assets/atr-logo-red/logo.png');
        addChannel(page, 'rtmp://178.162.205.89/beta//pixel?st=de7a8a352cea90e3b634d5be6b052479', 'Піксель', '');
        addChannel(page, 'rtmp://217.20.164.182:80/live/zik392p.stream', 'ZIK', '');
        addChannel(page, 'http://31.43.120.162:8060', 'Boutique TV', '');
        addChannel(page, 'http://31.43.120.162:8063', 'Shopping TV', '');
        addChannel(page, 'http://31.43.120.162:8118', 'Футбол 1', 'https://ru.viasat.ua/assets/logos/3513/exclusive_F1-yellow-PL.png');
        addChannel(page, 'http://31.43.120.162:8052', '1 Авто', '');
        addChannel(page, 'http://31.43.120.162:8066', 'Ukrainian Fashion', '');
        addChannel(page, 'rtmp://213.174.8.15/live/live2', 'Тиса-1', '');

        page.appendItem("", "separator", {
            title: 'Russia'
        });
        addChannel(page, 'youtube', 'RTД', '');
        // http://tv.life.ru/index.m3u8
        addChannel(page, 'hls:http://tv.life.ru/lifetv/720p/index.m3u8',
            'Life News (720p)',
            'http://lifenews.ru/assets/logo-0a3a75be3dcc15b6c6afaef4adab52dd.png');
        addChannel(page, 'hls:http://tv.life.ru/lifetv/480p/index.m3u8',
            'Life News (480p)',
            'http://lifenews.ru/assets/logo-0a3a75be3dcc15b6c6afaef4adab52dd.png');
        addChannel(page, 'hls:http://tvrain-video.ngenix.net/mobile/TVRain_1m.stream/playlist.m3u8',
            'Дождь (720p)',
            'http://tvrain-st.cdn.ngenix.net/static/css/pub/images/logo-tvrain.png');
        addChannel(page, 'hls:http://rian.cdnvideo.ru/rr/stream20/chunklist.m3u8',
            'РИА Новости',
            '');
        addChannel(page, 'hls:http://testlivestream.rfn.ru/live/smil:r24.smil/playlist.m3u8?auth=vh&cast_id=21', 'Россия 24', '');
        addChannel(page, 'hls:http://testlivestream.rfn.ru/live/smil:m24.smil/playlist.m3u8?auth=vh&cast_id=1661', 'Москва 24', '');
        addChannel(page, 'hls:http://testlivestream.rfn.ru/live/smil:mayak.smil/playlist.m3u8?auth=vh&cast_id=81', 'Маяк FM', '');
        addChannel(page, 'hls:http://213.208.179.135/rr2/smil:rtp_r1_rr.smil/playlist.m3u8?auth=vh&cast_id=2961', 'Россия 1', '');
        addChannel(page, 'hls:http://213.208.179.135/rr2/smil:rtp_rtrp_rr.smil/playlist.m3u8?auth=vh&cast_id=4941', 'Россия РТР', '');
        addChannel(page, 'hls:http://nano.teleservice.su:8080/hls/nano.m3u8', 'Nano TV', '');
        addChannel(page, 'hls:http://nano.teleservice.su:8080/hls/luxury.m3u8', 'Luxury World', '');
        addChannel(page, 'hls:http://btv-net.mediacdn.ru/TVB4/stilimoda/playlist.m3u8', 'Стиль и мода', '');
        addChannel(page, 'hls:http://btv-net.mediacdn.ru/TVB/bst/track_1/playlist.m3u8', 'БСТ', '');
        addChannel(page, 'hls:http://ms1.autoru.tv:1935/live/360p/playlist.m3u8', 'Auto.ru TV', '');
        addChannel(page, 'hls:http://musicbox.cdnvideo.ru:1935/musicbox-live/humorbox.sdp/playlist.m3u8', 'Юмор Box', '');
        //rtmp://vkt.cdnvideo.ru/rtp/3
        addChannel(page, 'hls:http://vkt.cdnvideo.ru/rtp/3/playlist.m3u8', 'ВКТ', '');
        addChannel(page, 'hls:http://217.114.181.66/hls-live/livepkgr/_definst_/liveevent/tv3-1.m3u8', 'ТВ3', '');

        page.appendItem("", "separator", {
            title: 'Planet Online'
        });
        addChannel(page, 'hls:http://80.93.53.88:1935/live/channel_4/playlist.m3u8', 'Fresh.TV (HLS)', '');
        addChannel(page, 'rtmp://80.93.53.88/live/channel_4', 'Fresh.TV (RTMP)', '');
        addChannel(page, 'rtmp://80.93.53.88/live/channel_2', 'ТВТУР.TV', '');
        addChannel(page, 'rtmp://80.93.53.88/live/channel_3', 'Релакс.TV', '');
        addChannel(page, 'rtmp://80.93.53.88/live/channel_5', 'Премьера.TV', '');
        addChannel(page, 'rtmp://80.93.53.88/live/channel_6', 'Любимое.TV', '');
        addChannel(page, 'rtmp://gb.orange.ether.tv/live/unikino/broadcast18', 'Кино РФ', '');
        addChannel(page, 'rtmp://grey.ether.tv/live/rubin/broadcast4', 'ФК Рубин', '');
        addChannel(page, 'rtmp://fms.pik-tv.com/live/piktv2pik2tv.flv', 'PIK.TV', '');

        page.appendItem("", "separator", {
            title: 'НТВ'
        });
        addChannel(page, 'http://clients.cdnet.tv/h/17/1/1/MFFIQjkvdlFWbE5Lam9jbkJlNjAzdjEyTVhNWEZhYUdSN3REYXI3cFV0QW1CRzE0bVkwK2dPY0Q0OFg1Y25meg', 'НТВ', '');
        addChannel(page, 'http://clients.cdnet.tv/h/14/1/1/MHdHdGhQdlFWbE96Uk92cHhibzF4TlFzUDhmS0NNZ3IrQ2JENWU2c1h1blc2OE9OUi9JR0tXTDloU3EwQkNCMg', 'Первый канал', '');
        addChannel(page, 'http://clients.cdnet.tv/h/21/1/1/MkFIdVAvdlFWbE8vOWNwdzBrY3FEUHB5cDRvdTlMNkhIRW5yazJWUUlVUmVIajJzZmRDUkt2YVFnKzdFZGpWNw', 'ТНТ', '');
        addChannel(page, 'http://clients.cdnet.tv/h/4/1/1/MVFIQkZQdlFWbE9YbnFaUzB4elFhMGc1WVJraU9iUUFhYkNCb2lyZlhoL3N3Ymc4QjBJbjdiQlBhbmp5UnJrSQ', 'Россия 2', '');
        addChannel(page, 'http://clients.cdnet.tv/h/18/1/1/MXdGN0FQdlFWbFBRdWMxVHl0K0dBZWVHbTJGQkFzbVJ2elBPRzBaUzNjUUlWbkxaMTNsKzZwd2JJS0lmYU5GWg', 'Россия К', '');
        addChannel(page, 'http://clients.cdnet.tv/h/22/1/1/MEFGMUgvdlFWbE9ERUdyZzd5M29qOGZZQm53dmpoSVlmOXo3WFRESWN5S1ZSWWN5WVNOaUdNTUJhcjJoK3B5cQ', 'Домашний', '');

        addChannel(page, 'hls:http://178.49.132.73/streaming/1kanal/tvrec/playlist.m3u8', '1 канал', '');
        addChannel(page, 'hls:http://178.49.132.73/streaming/rossija/tvrec/playlist.m3u8', 'Russia', '');
        addChannel(page, 'hls:http://178.49.132.73/streaming/ntv/tvrec/playlist.m3u8', 'NTV', '');
        addChannel(page, 'hls:http://178.49.132.73/streaming/5kanal/tvrec/playlist.m3u8', '5 Channel', '');
        addChannel(page, 'hls:http://178.49.132.73/streaming/rentv/tvrec/playlist.m3u8', 'Rennes', '');
        addChannel(page, 'hls:http://178.49.132.73/streaming/ots/tvrec/playlist.m3u8', 'UTS', '');
        addChannel(page, 'hls:http://178.49.132.73/streaming/domashny/tvrec/playlist.m3u8', 'Home', '');
        addChannel(page, 'hls:http://178.49.132.73/streaming/tv3/tvrec/playlist.m3u8', 'TV-3', '');
        addChannel(page, 'hls:http://178.49.132.73/streaming/49kanal/tvrec/playlist.m3u8', '49 Channel (Novosibirsk)', '');
        addChannel(page, 'hls:http://178.49.132.73/streaming/kultura/tvrec/playlist.m3u8', 'Culture', '');
        addChannel(page, 'hls:http://178.49.132.73/streaming/tvc/tvrec/playlist.m3u8', 'TVC', '');
        addChannel(page, 'hls:http://178.49.132.73/streaming/perec/tvrec/playlist.m3u8', 'Pepper', '');
        addChannel(page, 'hls:http://178.49.132.73/streaming/perec/tnt/playlist.m3u8', 'TNT', '');
        addChannel(page, 'hls:http://178.49.132.73/streaming/disney/tvrec/playlist.m3u8', 'Disney', '');
        addChannel(page, 'hls:http://178.49.132.73/streaming/soyuz/tvrec/playlist.m3u8', 'Union', '');
        addChannel(page, 'hls:http://178.49.132.73/streaming/mir/tvrec/playlist.m3u8', 'World', '');
        addChannel(page, 'hls:http://178.49.132.73/streaming/otvrus/tvrec/playlist.m3u8', 'OTV', '');
        addChannel(page, 'hls:http://178.49.132.73/streaming/karusel/tvrec/playlist.m3u8', 'carousel', '');
        addChannel(page, 'hls:http://178.49.132.73/streaming/sts/tvrec/playlist.m3u8', 'STS', '');
        addChannel(page, 'hls:http://178.49.132.73/streaming/forkids/tvrec/playlist.m3u8', 'Children', '');
        addChannel(page, 'hls:http://178.49.132.73/streaming/detskij_mir/tvrec/playlist.m3u8', "Children's World", '');
        addChannel(page, 'hls:http://178.49.132.73/streaming/nickelodeon/tvrec/playlist.m3u8', 'Nickelodeon', '');
        addChannel(page, 'hls:http://178.49.132.73/streaming/tiji/tvrec/playlist.m3u8', 'Tiji', '');
        addChannel(page, 'hls:http://178.49.132.73/streaming/jim_jam/tvrec/playlist.m3u8', 'JimJam', '');
        addChannel(page, 'hls:http://178.49.132.73/streaming/motherchi/tvrec/playlist.m3u8', 'Mother and Child', '');
        addChannel(page, 'hls:http://178.49.132.73/streaming/tlc/tvrec/playlist.m3u8', 'TLC', '');
        addChannel(page, 'hls:http://178.49.132.73/streaming/fashion/tvrec/playlist.m3u8', 'Fashion', '');
        addChannel(page, 'hls:http://178.49.132.73/streaming/foxlife/tvrec/playlist.m3u8', 'FoxLife', '');
        addChannel(page, 'hls:http://178.49.132.73/streaming/diva_universal/tvrec/playlist.m3u8', 'Diva Universal', '');
        addChannel(page, 'hls:http://178.49.132.73/streaming/indiatv/tvrec/playlist.m3u8', 'India', '');
        addChannel(page, 'hls:http://178.49.132.73/streaming/russian_roman/tvrec/playlist.m3u8', 'Russian novel', '');
        addChannel(page, 'hls:http://178.49.132.73/streaming/discovery/tvrec/playlist.m3u8', 'Discovery Russia', '');
        addChannel(page, 'hls:http://178.49.132.73/streaming/discoveryworld/tvrec/playlist.m3u8', 'Discovery Word', '');
        addChannel(page, 'hls:http://178.49.132.73/streaming/discoveryscience/tvrec/playlist.m3u8', 'Discovery science', '');
        addChannel(page, 'hls:http://178.49.132.73/streaming/animalplanet/tvrec/playlist.m3u8', 'Animal Planet', '');
        addChannel(page, 'hls:http://178.49.132.73/streaming/natgeo/tvrec/playlist.m3u8', 'Natgeo', '');
        addChannel(page, 'hls:http://178.49.132.73/streaming/nat_geo_wild/tvrec/playlist.m3u8', 'Natgeo Wild', '');
        addChannel(page, 'hls:http://178.49.132.73/streaming/viasat_nature/tvrec/playlist.m3u8', 'Viasat Nature', '');
        addChannel(page, 'hls:http://178.49.132.73/streaming/viasat_history/tvrec/playlist.m3u8', 'Viasat History', '');
        addChannel(page, 'hls:http://178.49.132.73/streaming/viasat_explorer/tvrec/playlist.m3u8', 'Viasat Explorer', '');
        addChannel(page, 'hls:http://178.49.132.73/streaming/rustravel/tvrec/playlist.m3u8', 'Teleputeshestviya', '');
        addChannel(page, 'hls:http://178.49.132.73/streaming/my_planet/tvrec/playlist.m3u8', 'My Planet', '');
        addChannel(page, 'hls:http://178.49.132.73/streaming/traveladventure/tvrec/playlist.m3u8', 'Travel & Adventure', '');
        addChannel(page, 'hls:http://178.49.132.73/streaming/da_vinci/tvrec/playlist.m3u8', 'DaVinci', '');
        addChannel(page, 'hls:http://178.49.132.73/streaming/24techno/tvrec/playlist.m3u8', '24 Techno', '');
        addChannel(page, 'hls:http://178.49.132.73/streaming/nauka_20/tvrec/playlist.m3u8', 'Science 2.0', '');
        addChannel(page, 'hls:http://178.49.132.73/streaming/time/tvrec/playlist.m3u8','Time', '');
        addChannel(page, 'hls:http://178.49.132.73/streaming/1_obraz/tvrec/playlist.m3u8','First Education', '');
        addChannel(page, 'hls:http://178.49.132.73/streaming/amazing_life/tvrec/playlist.m3u8','Amazing Life', '');
        addChannel(page, 'hls:http://178.49.132.73/streaming/365_days/tvrec/playlist.m3u8','365 Days', '');
        addChannel(page, 'hls:http://178.49.132.73/streaming/interesnoe_tv/tvrec/playlist.m3u8','TV Browse', '');
        addChannel(page, 'hls:http://178.49.132.73/streaming/fox/tvrec/playlist.m3u8','Fox', '');
        addChannel(page, 'hls:http://178.49.132.73/streaming/set/tvrec/playlist.m3u8','Set', '');
        addChannel(page, 'hls:http://178.49.132.73/streaming/sonyscifi/tvrec/playlist.m3u8','Sony', '');
        addChannel(page, 'hls:http://178.49.132.73/streaming/tv21/tvrec/playlist.m3u8','21 TV', '');
        addChannel(page, 'hls:http://178.49.132.73/streaming/comedytv/tvrec/playlist.m3u8','Comedy', '');
        addChannel(page, 'hls:http://178.49.132.73/streaming/tv1000/tvrec/playlist.m3u8','TV 1000', '');
        addChannel(page, 'hls:http://178.49.132.73/streaming/tv1000_action/tvrec/playlist.m3u8','TV 1000 Action', '');
        addChannel(page, 'hls:http://178.49.132.73/streaming/tv_1000_rus_kino/tvrec/playlist.m3u8','TV 1000 Russian film', '');
        addChannel(page, 'hls:http://178.49.132.73/streaming/russian_illusion/tvrec/playlist.m3u8','Russian Illusion', '');
        addChannel(page, 'hls:http://178.49.132.73/streaming/dom_kino/tvrec/playlist.m3u8','Cinema House', '');
        addChannel(page, 'hls:http://178.49.132.73/streaming/universal_channel/tvrec/playlist.m3u8','Universal', '');
        addChannel(page, 'hls:http://178.49.132.73/streaming/kinolux/tvrec/playlist.m3u8','Kinolyuks ( NTV )', '');
        addChannel(page, 'hls:http://178.49.132.73/streaming/russia_best/tvrec/playlist.m3u8','Russian bestseller', '');
        addChannel(page, 'hls:http://178.49.132.73/streaming/nstv/tvrec/playlist.m3u8','Real Scary', '');
        addChannel(page, 'hls:http://178.49.132.73/streaming/vesti/tvrec/playlist.m3u8','Russia 24', '');
        addChannel(page, 'hls:http://178.49.132.73/streaming/rain/tvrec/playlist.m3u8','Rain', '');
        addChannel(page, 'hls:http://178.49.132.73/streaming/rbk/tvrec/playlist.m3u8','RBC', '');
        addChannel(page, 'hls:http://178.49.132.73/streaming/mir24/tvrec/playlist.m3u8','24, World', '');
        addChannel(page, 'hls:http://178.49.132.73/streaming/strana/tvrec/playlist.m3u8','Country', '');
        addChannel(page, 'hls:http://178.49.132.73/streaming/cnn/tvrec/playlist.m3u8','CNN', '');
        addChannel(page, 'hls:http://178.49.132.73/streaming/euronews/tvrec/playlist.m3u8','Euronews', '');
        addChannel(page, 'hls:http://178.49.132.73/streaming/russiatoday/tvrec/playlist.m3u8','Russiatoday', '');
        addChannel(page, 'hls:http://178.49.132.73/streaming/utv/tvrec/playlist.m3u8','S', '');
        addChannel(page, 'hls:http://178.49.132.73/streaming/friday/tvrec/playlist.m3u8','Friday', '');
        addChannel(page, 'hls:http://178.49.132.73/streaming/investigationdiscovery/tvrec/playlist.m3u8','Discovery ID', '');
        addChannel(page, 'hls:http://178.49.132.73/streaming/2x2tv/tvrec/playlist.m3u8','2x2', '');
        addChannel(page, 'hls:http://178.49.132.73/streaming/zvezda/tvrec/playlist.m3u8','Star', '');
        addChannel(page, 'hls:http://178.49.132.73/streaming/jv/tvrec/playlist.m3u8','Live', '');
        addChannel(page, 'hls:http://178.49.132.73/streaming/drive/tvrec/playlist.m3u8','Drive', '');
        addChannel(page, 'hls:http://178.49.132.73/streaming/hafi/tvrec/playlist.m3u8','Hunting and Fishing', '');
        addChannel(page, 'hls:http://178.49.132.73/streaming/usadba/tvrec/playlist.m3u8','Homesteads', '');
        addChannel(page, 'hls:http://178.49.132.73/streaming/nostalgy/tvrec/playlist.m3u8','Nostalgia', '');
        addChannel(page, 'hls:http://178.49.132.73/streaming/auto_plus/tvrec/playlist.m3u8','Auto Plus', '');
        addChannel(page, 'hls:http://178.49.132.73/streaming/oruzhie/tvrec/playlist.m3u8','Weapons', '');
        addChannel(page, 'hls:http://178.49.132.73/streaming/sarafan/tvrec/playlist.m3u8','Sundress', '');
        addChannel(page, 'hls:http://178.49.132.73/streaming/kitchentv/tvrec/playlist.m3u8','Kitchen TV', '');
        addChannel(page, 'hls:http://178.49.132.73/streaming/telekafe/tvrec/playlist.m3u8','Telecafe', '');
        addChannel(page, 'hls:http://178.49.132.73/streaming/psych_21/tvrec/playlist.m3u8','Psychology 21', '');
        addChannel(page, 'hls:http://178.49.132.73/streaming/uspex/tvrec/playlist.m3u8','Success', '');
        addChannel(page, 'hls:http://178.49.132.73/streaming/8_kanal/tvrec/playlist.m3u8','8 Channel', '');
        addChannel(page, 'hls:http://178.49.132.73/streaming/aone/tvrec/playlist.m3u8','A-One', '');
        addChannel(page, 'hls:http://178.49.132.73/streaming/o2tv/tvrec/playlist.m3u8','O2', '');
        addChannel(page, 'hls:http://178.49.132.73/streaming/rutv/tvrec/playlist.m3u8','Ru.TV', '');
        addChannel(page, 'hls:http://178.49.132.73/streaming/musboxru/tvrec/playlist.m3u8','Musicbox Ru', '');
        addChannel(page, 'hls:http://178.49.132.73/streaming/musboxtv/tvrec/playlist.m3u8', 'Musicbox', '');
        addChannel(page, 'hls:http://178.49.132.73/streaming/vh1/tvrec/playlist.m3u8', 'VH1', '');
        addChannel(page, 'hls:http://178.49.132.73/streaming/europaplustv/tvrec/playlist.m3u8', 'Europa +', '');
        addChannel(page, 'hls:http://178.49.132.73/streaming/mcmtop/tvrec/playlist.m3u8', 'MCM', '');
        addChannel(page, 'hls:http://178.49.132.73/streaming/brigge/tvrec/playlist.m3u8', 'Bridge TV', '');
        addChannel(page, 'hls:http://178.49.132.73/streaming/shanson/tvrec/playlist.m3u8', 'Chanson', '');
        addChannel(page, 'hls:http://178.49.132.73/streaming/la_minor/tvrec/playlist.m3u8', 'A -Minor', '');
        addChannel(page, 'hls:http://178.49.132.73/streaming/mezzo/tvrec/playlist.m3u8', 'Mezzo', '');
        addChannel(page, 'hls:http://178.49.132.73/streaming/muz_tvnew/tvrec/playlist.m3u8', 'Muz-TV', '');
        addChannel(page, 'hls:http://178.49.132.73/streaming/sport/tvrec/playlist.m3u8', 'Russia 2', '');
        addChannel(page, 'hls:http://178.49.132.73/streaming/eurosport/tvrec/playlist.m3u8', 'Eurosport', '');
        addChannel(page, 'hls:http://178.49.132.73/streaming/eurosport2/tvrec/playlist.m3u8', 'Eurosport 2', '');
        addChannel(page, 'hls:http://178.49.132.73/streaming/sport1/tvrec/playlist.m3u8', '1 Sport', '');
        addChannel(page, 'hls:http://178.49.132.73/streaming/sport_2/tvrec/playlist.m3u8', 'Sport', '');
        addChannel(page, 'hls:http://178.49.132.73/streaming/futbol/tvrec/playlist.m3u8', 'Football', '');
        addChannel(page, 'hls:http://178.49.132.73/streaming/khl/tvrec/playlist.m3u8', 'CHL', '');
        addChannel(page, 'hls:http://178.49.132.73/streaming/viasat_sport/tvrec/playlist.m3u8', 'Viasat Sport', '');
        addChannel(page, 'hls:http://178.49.132.73/streaming/fight_club/tvrec/playlist.m3u8', 'Fight Club', '');
        addChannel(page, 'hls:http://178.49.132.73/streaming/extreme_sports/tvrec/playlist.m3u8', 'Extreme Sports', '');

        page.appendItem("", "separator", {
            title: 'Триколор ТВ'
        });
        addChannel(page, 'http://31.43.120.162:8040', 'Kazakh TV', '');
        addChannel(page, 'http://31.43.120.162:8044', 'ВТВ', '');
        addChannel(page, 'http://31.43.120.162:8068', 'Карусель', '');
        addChannel(page, 'http://31.43.120.162:8070', 'HCT', '');
        addChannel(page, 'http://31.43.120.162:8071', '24_DOC', '');
        addChannel(page, 'http://31.43.120.162:8074', 'Мать и дитя', '');
        addChannel(page, 'http://31.43.120.162:8076', 'Eurosport 2', '');
        addChannel(page, 'http://31.43.120.162:8077', 'Мир', '');
        addChannel(page, 'http://31.43.120.162:8079', 'СТС', '');
        addChannel(page, 'http://31.43.120.162:8080', 'Моя планета', '');
        addChannel(page, 'http://31.43.120.162:8081', 'Пятница!', '');
        addChannel(page, 'http://31.43.120.162:8082', 'РБК', '');
        addChannel(page, 'http://31.43.120.162:8083', 'Рен ТВ', '');
        addChannel(page, 'http://31.43.120.162:8084', 'Мультимания', '');
        addChannel(page, 'http://31.43.120.162:8085', 'Детский', '');
        addChannel(page, 'http://31.43.120.162:8086', 'Nickelodeon', '');
        addChannel(page, 'http://31.43.120.162:8087', 'Русский иллюзион', '');
        addChannel(page, 'http://31.43.120.162:8088', 'Иллюзион+', '');
        addChannel(page, 'http://31.43.120.162:8089', 'ZOOПарк', '');
        addChannel(page, 'http://31.43.120.162:8090', 'XXI', '');
        addChannel(page, 'http://31.43.120.162:8091', 'Russian extreme', '');
        addChannel(page, 'http://31.43.120.162:8092', 'Еврокино', '');
        addChannel(page, 'http://31.43.120.162:8093', 'Ретро', '');
        addChannel(page, 'http://31.43.120.162:8094', 'Драйв', '');
        addChannel(page, 'http://31.43.120.162:8095', 'Охота и рыбалка', '');
        addChannel(page, 'http://31.43.120.162:8096', 'Здоровое ТВ', '');
        addChannel(page, 'http://31.43.120.162:8097', 'Усадьба', '');
        addChannel(page, 'http://31.43.120.162:8098', 'Домашние животные', '');
        addChannel(page, 'http://31.43.120.162:8099', 'Психология21', '');
        addChannel(page, 'http://31.43.120.162:8100', 'Вопросы и ответы', '');
        addChannel(page, 'http://31.43.120.162:8101', 'Бойцовский клуб', '');
        addChannel(page, 'http://31.43.120.162:8103', 'Fox', '');
        addChannel(page, 'http://31.43.120.162:8104', 'Fox Life', '');
        addChannel(page, 'http://31.43.120.162:8105', 'Россия 1', '');
        addChannel(page, 'http://31.43.120.162:8106', 'Россия 24', '');
        addChannel(page, 'http://31.43.120.162:8107', 'Россия 2', '');
        addChannel(page, 'http://31.43.120.162:8108', 'Россия К', '');
        addChannel(page, 'http://31.43.120.162:8110', 'Спорт 1', '');
        addChannel(page, 'http://31.43.120.162:8111', 'Disney канал', '');
        addChannel(page, 'http://31.43.120.162:8112', 'Sony Entertainment TV', '');
        addChannel(page, 'http://31.43.120.162:8113', 'Sony Sci-Fi', '');
        addChannel(page, 'http://31.43.120.162:8114', 'Феникс Плюс Кино', '');
        addChannel(page, 'http://31.43.120.162:8115', 'National Geographic', '');
        addChannel(page, 'http://31.43.120.162:8116', 'Comedy TV', '');
        addChannel(page, 'http://31.43.120.162:8117', 'Discovery Russia', '');
        addChannel(page, 'http://31.43.120.162:8119', 'Animal Planet', '');
        addChannel(page, 'http://31.43.120.162:8120', 'Cartoon Network', '');
        addChannel(page, 'http://31.43.120.162:8121', 'Живи!', '');
        addChannel(page, 'http://31.43.120.162:8123', 'Телекафе', '');
        addChannel(page, 'http://31.43.120.162:8124', 'Время', '');
        addChannel(page, 'http://31.43.120.162:8126', 'Дом кино', '');
        addChannel(page, 'http://31.43.120.162:8128', '5 канал', '');
        addChannel(page, 'http://31.43.120.162:8130', 'Спорт', '');

        addChannel(page, 'http://91.192.168.242:8001', 'Первый канал', '');
        addChannel(page, 'http://91.192.168.242:8002', 'Россия 1', '');
        addChannel(page, 'http://91.192.168.242:8003', 'HTB', '');
        addChannel(page, 'http://91.192.168.242:8004', 'Россия Культура', '');
        addChannel(page, 'http://91.192.168.242:8005', 'Euronews', '');
        addChannel(page, 'http://91.192.168.242:8006', 'ATH', '');
        addChannel(page, 'http://91.192.168.242:8007', 'OTB', '');
        addChannel(page, 'http://91.192.168.242:8008', 'Карусель', '');
        addChannel(page, 'http://91.192.168.242:8009', '5 канал', '');
        addChannel(page, 'http://91.192.168.242:8010', 'СТС', '');
        addChannel(page, 'http://91.192.168.242:8011', 'Перец', '');
        addChannel(page, 'http://91.192.168.242:8012', '41', '');
        addChannel(page, 'http://91.192.168.242:8013', 'ТВЦ', '');
        addChannel(page, 'http://91.192.168.242:8014', 'ОТР', '');
        addChannel(page, 'http://91.192.168.242:8015', '4 канал', '');
        addChannel(page, 'http://91.192.168.242:8016', 'Спорт', '');
        addChannel(page, 'http://91.192.168.242:8017', 'Наука 2.0', '');
        addChannel(page, 'http://91.192.168.242:8018', 'Сарафан ТВ', '');
        addChannel(page, 'http://91.192.168.242:8020', 'Русский роман', '');
        addChannel(page, 'http://91.192.168.242:8021', 'ТНТ', '');
        addChannel(page, 'http://91.192.168.242:8022', 'Рен ТВ', '');
        addChannel(page, 'http://91.192.168.242:8023', 'ТВ3', '');
        addChannel(page, 'http://91.192.168.242:8024', 'ТТС', '');
        addChannel(page, 'http://91.192.168.242:8026', 'Teen TV', '');
        addChannel(page, 'http://91.192.168.242:8027', 'Охотник и рыболов', '');
        addChannel(page, 'http://91.192.168.242:8028', 'Телепутешествия', '');
        addChannel(page, 'http://91.192.168.242:8030', 'Спорт Плюс', '');
        addChannel(page, 'http://91.192.168.242:8031', 'Евроспорт 2', '');
        addChannel(page, 'http://91.192.168.242:8032', 'National Geographic', '');
        addChannel(page, 'http://91.192.168.242:8033', 'Моя планета', '');
        addChannel(page, 'http://91.192.168.242:8034', 'Пятница!', '');
        addChannel(page, 'http://91.192.168.242:8036', 'РБК', '');
        addChannel(page, 'http://91.192.168.242:8037', 'Cartoon Network', '');
        addChannel(page, 'http://91.192.168.242:8038', 'Мультимания', '');
        addChannel(page, 'http://91.192.168.242:8039', 'Мать и дитя', '');
        addChannel(page, 'http://91.192.168.242:8040', 'Discovery Channel', '');
        addChannel(page, 'http://91.192.168.242:8041', 'Animal Planet', '');
        addChannel(page, 'http://91.192.168.242:8042', 'Русский бестселлер', '');
        addChannel(page, 'http://91.192.168.242:8043', '365', '');
        addChannel(page, 'http://91.192.168.242:8044', 'Комедия', '');
        addChannel(page, 'http://91.192.168.242:8045', 'Ля минор', '');
        addChannel(page, 'http://91.192.168.242:8046', 'Много ТВ', '');
        addChannel(page, 'http://91.192.168.242:8047', 'Бойцовский клуб', '');
        addChannel(page, 'http://91.192.168.242:8048', 'ТНВ планета', '');
        addChannel(page, 'http://91.192.168.242:8049', 'Живи!', '');
        addChannel(page, 'http://91.192.168.242:8050', 'Телекафе', '');
        addChannel(page, 'http://91.192.168.242:8051', 'Время', '');
        addChannel(page, 'http://91.192.168.242:8052', 'Дом кино', '');
        addChannel(page, 'http://91.192.168.242:8053', '24', '');
        addChannel(page, 'http://91.192.168.242:8054', 'Звезда', '');
        addChannel(page, 'http://91.192.168.242:8055', 'Детский мир', '');
        addChannel(page, 'http://91.192.168.242:8056', 'Кино ТВ', '');
        addChannel(page, 'http://91.192.168.242:8057', 'История', '');
        addChannel(page, 'http://91.192.168.242:8058', 'Ретро', '');
        addChannel(page, 'http://91.192.168.242:8059', 'Драйв', '');
        addChannel(page, 'http://91.192.168.242:8060', 'Охота и рыбалка', '');
        addChannel(page, 'http://91.192.168.242:8061', 'Усадьба', '');
        addChannel(page, 'http://91.192.168.242:8062', 'Домашние животные', '');
        addChannel(page, 'http://91.192.168.242:8063', 'Психология21', '');
        addChannel(page, 'http://91.192.168.242:8064', 'Бойцовский клуб', '');

        page.appendItem("", "separator", {
            title: 'XXX'
        });
        addChannel(page, 'rtmp://111.118.21.77/ptv3//phd499',
            'Playboy TV',
            '');
    });
})(this);
