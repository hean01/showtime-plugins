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
    var logo = "logo.png";
    var slogan = "Online TV";

    plugin.createService(slogan, PREFIX + "start", "tv", true,
			 plugin.path + logo);


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

        page.appendItem(link, "video", {
            title: title,
            icon: icon
        });
    }

    // Start page
    plugin.addURI(PREFIX + "start", function(page) {
	page.type = "directory";
	page.contents = "items";
	page.metadata.logo = plugin.path + logo;
	page.metadata.title = slogan;
	page.loading = false;

        addChannel(page, 'youtube', 'Espreso TV', '');
        addChannel(page, 'youtube', 'Hromadske.tv', '');
        addChannel(page, 'youtube', '24 канал (HLS)', '');
        addChannel(page, 'http://31.43.120.162:8014', '24 канал (MPEG2)', 'http://24tv.ua/img/24_logo_facebook.jpg');
        addChannel(page, 'youtube', 'UBR', '');
        addChannel(page, 'hls:http://212.40.43.10:1935/inters/smil:inter.smil/playlist.m3u8', 'Інтер', 'http://inter.ua/images/logo.png');
        addChannel(page, 'http://91.192.168.242:8029', 'Інтер+', '');
        addChannel(page, 'http://31.43.120.162:8062', '100', 'http://tv100.com.ua/templates/diablofx/images/100_logo.jpg');
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
            title: 'Music'
        });
        addChannel(page, 'hls:http://109.239.142.62:1935/live/hlsstream/playlist3.m3u8', '1HD (HLS)', '');
        addChannel(page, 'rtmp://109.239.142.62/live/livestream3', '1HD (RTMP)', '');
        addChannel(page, 'hls:http://vevoplaylist-live.hls.adaptive.level3.net/vevo/ch1/06/prog_index.m3u8', 'Vevo 1', '');
        addChannel(page, 'hls:http://vevoplaylist-live.hls.adaptive.level3.net/vevo/ch2/06/prog_index.m3u8', 'Vevo 2', '');
        addChannel(page, 'hls:http://vevoplaylist-live.hls.adaptive.level3.net/vevo/ch3/06/prog_index.m3u8', 'Vevo 3', '');
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
        addChannel(page, 'http://212.79.96.134:8005', 'Musiq 1 TV', '');
        addChannel(page, 'http://212.79.96.134:8024', '1 Classic', '');
        addChannel(page, 'rtmp://stream.smcloud.net/live/eskatv', 'Eska TV', '');
        addChannel(page, 'rtmp://stream.smcloud.net/live2/eska_party/eska_party_360p', 'Eska Party TV', '');
        addChannel(page, 'rtmp://stream.smcloud.net/live2/eska_rock/eska_rock_360p', 'Eska Rock TV', '');
        addChannel(page, 'http://213.81.153.221:8080/nasa', 'Music Box', '');
        addChannel(page, 'rtmp://cdn-sov-2.musicradio.com:80/LiveVideo/Heart', 'Heartv', '');

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
        //addChannel(page, 'rtmp://online-record.ru//pervyj_middle', '1 канал', '');
        //addChannel(page, 'rtmp://online-record.ru//rossiya2_middle', 'Россия 2', '');
        addChannel(page, 'hls:http://nano.teleservice.su:8080/hls/nano.m3u8', 'Nano TV', '');

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
            title: 'VGTRK'
        });
        addChannel(page, 'hls:http://151.236.123.4/rr2/smil:rtp_r1_rr.smil/playlist.m3u8?auth=vh&cast_id=2961', 'Россия 1', '');
        addChannel(page, 'hls:http://testlivestream.rfn.ru/live/smil:r24.smil/playlist.m3u8?auth=vh&cast_id=21', 'Россия 24', '');
        addChannel(page, 'hls:http://151.236.123.4/rr2/smil:rtp_rtrp_rr.smil/playlist.m3u8?auth=vh&cast_id=4941', 'Россия РТР', '');
        addChannel(page, 'hls:http://testlivestream.rfn.ru/live/smil:m24.smil/playlist.m3u8?auth=vh&cast_id=1661', 'Москва 24', '');
        addChannel(page, 'hls:http://testlivestream.rfn.ru/live/smil:mayak.smil/playlist.m3u8?auth=vh&cast_id=81', 'Маяк FM', '');

        page.appendItem("", "separator", {
            title: 'Deutsch'
        });
        addChannel(page, 'hls:http://n24-live.hls.adaptive.level3.net/hls-live/n24-pssimn24live/_definst_/live/stream2.m3u8',
            'N24',
            'http://www.norcom.de/sites/default/files/N24.png');


        page.appendItem("", "separator", {
            title: 'XXX'
        });
        addChannel(page, 'rtmp://111.118.21.77/ptv3//phd499',
            'Playboy TV',
            '');
    });
})(this);
