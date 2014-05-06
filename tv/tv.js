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
    var logo = "logo.jpg";
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
        addChannel(page, 'youtube', '24 канал', '');
        addChannel(page, 'youtube', 'UBR', '');

        addChannel(page, 'hls:http://212.40.43.10:1935/inters/smil:inter.smil/playlist.m3u8',
            'Інтер',
            'http://inter.ua/images/logo.png');

        addChannel(page, 'http://31.43.120.162:8062',
            '100',
            'http://tv100.com.ua/templates/diablofx/images/100_logo.jpg');

        addChannel(page, 'hls:http://31.28.169.242/hls/live112.m3u8',
            '112',
            'http://112.ua/static/img/logo/112_ukr.png');

        addChannel(page, 'rtmp://media.tvi.com.ua/live/_definst_//HLS4',
            'ТВі',
            'http://tvi.ua/catalog/view/theme/new/image/logo.png');

        addChannel(page, 'http://31.43.120.162:8009',
            'Уніан',
            'http://images.unian.net/img/unian-logo.png');

        addChannel(page, 'http://31.43.120.162:8014',
            '24 News',
            'http://24tv.ua/img/24_logo_facebook.jpg');

        addChannel(page, 'http://31.43.120.162:8041',
            'ЧП.INFO',
            'http://www.tele-com.tv/img/icons/chp-info.png');

        addChannel(page, 'http://31.43.120.162:8035',
            'Euronews',
            'http://ua.euronews.com/media/logo_222.gif');

        addChannel(page, 'http://31.43.120.162:8066',
            'Ukrainian Fashion',
            '');

        addChannel(page, 'http://31.43.120.162:8013',
            'М2',
            'http://www.m2.tv/images/design/2009/m2_logo_2009.jpg');

        addChannel(page, 'http://31.43.120.162:8029',
            'Impact TV',
            'http://impacttv.tv/images/stories/logo.png');

        addChannel(page, 'http://31.43.120.162:8042',
            'ТК Черное море',
            'http://www.blacksea.net.ua/images/logo2.png');

        addChannel(page, 'http://31.43.120.162:8047',
            'УТР',
            'http://utr.tv/ru/templates/UTR/images/logo.png');

        addChannel(page, 'rtmp://gigaz.wi.com.ua/hallDemoHLS/LVIV',
            'ТРК Львів',
            'http://www.lodtrk.org.ua/inc/getfile.php?i=20111026133818.gif');

        addChannel(page, 'http://31.43.120.162:8048',
            'Львів ТВ',
            'http://www.lviv-tv.com/images/aTV/logo/LTB_FIN_END_6.png');

        addChannel(page, 'http://31.43.120.162:8030',
            'Трофей',
            'http://trofey.net/images/thumbnails/video/images/trofey-player-fill-200x130.png');

        addChannel(page, 'http://31.43.120.162:8118',
            'Футбол 1',
            'https://ru.viasat.ua/assets/logos/3513/exclusive_F1-yellow-PL.png');

        addChannel(page, 'hls:http://91.203.194.146:1935/liveedge/atr.stream/playlist.m3u8',
            'ATR',
            'http://atr.ua/assets/atr-logo-red/logo.png');

        page.appendItem("", "separator", {
            title: 'Music'
        });
        addChannel(page, 'hls:http://109.239.142.62:1935/live/hlsstream/playlist3.m3u8',
            '1HD (HLS)',
            '');
        addChannel(page, 'rtmp://109.239.142.62/live/livestream3',
            '1HD (RTMP)',
            '');
        addChannel(page, 'hls:http://vevoplaylist-live.hls.adaptive.level3.net/vevo/ch1/06/prog_index.m3u8',
            'Vevo 1',
            '');
        addChannel(page, 'hls:http://vevoplaylist-live.hls.adaptive.level3.net/vevo/ch2/06/prog_index.m3u8',
            'Vevo 2',
            '');

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
        addChannel(page, 'rtmp://online-record.ru//pervyj_middle',
            '1 канал',
            '');
        addChannel(page, 'hls:http://151.236.123.4/rr2/smil:rtp_r1_rr.smil/playlist.m3u8?auth=vh&cast_id=2961',
            'Россия 1',
            '');
        addChannel(page, 'rtmp://online-record.ru//rossiya2_middle',
            'Россия 2',
            '');
        addChannel(page, 'hls:http://testlivestream.rfn.ru/live/smil:r24.smil/playlist.m3u8?auth=vh&cast_id=21',
            'Россия 24',
            '');
        addChannel(page, 'hls:http://151.236.123.4/rr2/smil:rtp_rtrp_rr.smil/playlist.m3u8?auth=vh&cast_id=4941',
            'Россия РТР',
            '');
        addChannel(page, 'hls:http://testlivestream.rfn.ru/live/smil:m24.smil/playlist.m3u8?auth=vh&cast_id=1661',
            'Москва 24',
            '');
        addChannel(page, 'hls:http://testlivestream.rfn.ru/live/smil:mayak.smil/playlist.m3u8?auth=vh&cast_id=81',
            'Маяк FM',
            '');
        addChannel(page, 'hls:http://vniitr.cdnvideo.ru/vniitr-live/vniitr.sdp/playlist.m3u8',
            'RU TV',
            '');
        addChannel(page, 'hls:http://nano.teleservice.su:8080/hls/nano.m3u8',
            'Nano TV',
            '');
        addChannel(page, 'http://31.43.120.162:8076',
            'Eurosport 2',
            '');
        addChannel(page, 'http://31.43.120.162:8101',
            'Бойцовский клуб',
            '');
        addChannel(page, 'http://31.43.120.162:8130',
            'Спорт',
            '');
        addChannel(page, 'http://31.43.120.162:8110',
            'Спорт 1',
            '');
        addChannel(page, 'http://31.43.120.162:8119',
            'Animal Planet',
            '');
        addChannel(page, 'http://31.43.120.162:8089',
            'ZOOпарк',
            '');

        page.appendItem("", "separator", {
            title: 'Триколор ТВ'
        });
        addChannel(page, 'http://91.192.168.242:8001',
            '1 канал',
            '');
        addChannel(page, 'http://91.192.168.242:8002',
            'Россия 1',
            '');
        addChannel(page, 'http://91.192.168.242:8003',
            'HTB',
            '');
        addChannel(page, 'http://91.192.168.242:8004',
            'Россия Культура',
            '');
        addChannel(page, 'http://91.192.168.242:8005',
            'Россия 2',
            '');
        addChannel(page, 'http://91.192.168.242:8006',
            'ATH',
            '');
        addChannel(page, 'http://91.192.168.242:8007',
            'OTB',
            '');
        addChannel(page, 'http://91.192.168.242:8008',
            'Карусель',
            '');
        addChannel(page, 'http://91.192.168.242:8009',
            'THT',
            '');
        addChannel(page, 'http://91.192.168.242:8010',
            'СТС',
            '');
        addChannel(page, 'http://91.192.168.242:8011',
            'Перец',
            '');
        addChannel(page, 'http://91.192.168.242:8012',
            '41',
            '');
        addChannel(page, 'http://91.192.168.242:8013',
            'ТВЦ',
            '');
        addChannel(page, 'http://91.192.168.242:8014',
            'ОТР',
            '');
        addChannel(page, 'http://91.192.168.242:8015',
            '4 канал',
            '');
        addChannel(page, 'http://91.192.168.242:8016',
            'Спорт',
            '');
        addChannel(page, 'http://91.192.168.242:8017',
            'Наука 2.0',
            '');
        addChannel(page, 'http://91.192.168.242:8018',
            'Сарафан ТВ',
            '');
        addChannel(page, 'http://91.192.168.242:8019',
            'Europa Plus TV',
            '');
        addChannel(page, 'http://91.192.168.242:8020',
            'Русский роман',
            '');
        addChannel(page, 'http://91.192.168.242:8021',
            'ТНТ',
            '');
        addChannel(page, 'http://91.192.168.242:8022',
            'Рен ТВ',
            '');
        addChannel(page, 'http://91.192.168.242:8023',
            'ТВ3',
            '');
        addChannel(page, 'http://91.192.168.242:8024',
            'ТТС',
            '');
        addChannel(page, 'http://91.192.168.242:8025',
            'RU TV',
            '');
        addChannel(page, 'http://91.192.168.242:8026',
            'Teen TV',
            '');
        addChannel(page, 'http://91.192.168.242:8027',
            'Охотник и рыболов',
            '');
        addChannel(page, 'http://91.192.168.242:8028',
            'Телепутешествия',
            '');
        addChannel(page, 'http://91.192.168.242:8029',
            'Интер+',
            '');
        addChannel(page, 'http://91.192.168.242:8030',
            'Спорт Плюс',
            '');
        addChannel(page, 'http://91.192.168.242:8031',
            'Евроспорт 2',
            '');
        addChannel(page, 'http://91.192.168.242:8032',
            'National Geographic',
            '');
        addChannel(page, 'http://91.192.168.242:8033',
            'Моя планета',
            '');
        addChannel(page, 'http://91.192.168.242:8034',
            'Пятница!',
            '');
        addChannel(page, 'http://91.192.168.242:8035',
            '2x2',
            '');
        addChannel(page, 'http://91.192.168.242:8036',
            'РБК',
            '');
        addChannel(page, 'http://91.192.168.242:8037',
            'Cartoon Network',
            '');
        addChannel(page, 'http://91.192.168.242:8038',
            'Детский',
            '');
        addChannel(page, 'http://91.192.168.242:8039',
            'Мать и дитя',
            '');
        addChannel(page, 'http://91.192.168.242:8040',
            'Discovery Channel',
            '');
        addChannel(page, 'http://91.192.168.242:8041',
            'Animal Planet',
            '');
        addChannel(page, 'http://91.192.168.242:8042',
            'Русский бестселлер',
            '');
        addChannel(page, 'http://91.192.168.242:8043',
            '365',
            '');
        addChannel(page, 'http://91.192.168.242:8044',
            'Комедия',
            '');
        addChannel(page, 'http://91.192.168.242:8045',
            'Ля минор',
            '');
        addChannel(page, 'http://91.192.168.242:8046',
            'Много ТВ',
            '');
        addChannel(page, 'http://91.192.168.242:8047',
            'Бойцовский клуб',
            '');
        addChannel(page, 'http://91.192.168.242:8048',
            'ТНВ планета',
            '');
        addChannel(page, 'http://91.192.168.242:8049',
            'Живи!',
            '');
        addChannel(page, 'http://91.192.168.242:8050',
            'Телекафе',
            '');
        addChannel(page, 'http://91.192.168.242:8051',
            'Время',
            '');
        addChannel(page, 'http://91.192.168.242:8052',
            'Дом кино',
            '');
        addChannel(page, 'http://91.192.168.242:8053',
            '24',
            '');
        addChannel(page, 'http://91.192.168.242:8054',
            'Звезда',
            '');
        addChannel(page, 'http://91.192.168.242:8055',
            'Cartoon Network',
            '');
        addChannel(page, 'http://91.192.168.242:8056',
            'Кино ТВ',
            '');
        addChannel(page, 'http://91.192.168.242:8057',
            'Игровой',
            '');
        addChannel(page, 'http://91.192.168.242:8058',
            'Ретро',
            '');
        addChannel(page, 'http://91.192.168.242:8059',
            'Драйв',
            '');
        addChannel(page, 'http://91.192.168.242:8060',
            'Охота и рыбалка',
            '');
        addChannel(page, 'http://91.192.168.242:8061',
            'Усадьба',
            '');
        addChannel(page, 'http://91.192.168.242:8062',
            'Домашние животные',
            '');
        addChannel(page, 'http://91.192.168.242:8063',
            'Психология21',
            '');
        addChannel(page, 'http://91.192.168.242:8064',
            'Бойцовский клуб',
            '');
        addChannel(page, 'http://91.192.168.242:8065',
            'A One',
            '');
        addChannel(page, 'rtmp://europaplus.cdnvideo.ru/europaplus-live//mp4:eptv_main.sdp',
            'Europa Plus TV (RTMP)',
            'http://www.europaplustv.com/images/europa_tv.png');
        addChannel(page, 'hls:http://europaplus.cdnvideo.ru/europaplus-live/mp4:eptv_main.sdp/playlist.m3u8',
            'Europa Plus TV (HLS)',
            'http://www.europaplustv.com/images/europa_tv.png');

        page.appendItem("", "separator", {
            title: 'Planet Online'
        });
        addChannel(page, 'hls:http://80.93.53.88:1935/live/channel_4/playlist.m3u8',
            'Fresh.TV (HLS)',
            '');

        addChannel(page, 'rtmp://80.93.53.88/live/channel_4',
            'Fresh.TV (RTMP)',
            '');

        addChannel(page, 'rtmp://80.93.53.88/live/channel_2',
            'ТВТУР.TV',
            '');

        addChannel(page, 'rtmp://80.93.53.88/live/channel_3',
            'Релакс.TV',
            '');

        addChannel(page, 'rtmp://80.93.53.88/live/channel_5',
            'Премьера.TV',
            '');

        addChannel(page, 'rtmp://80.93.53.88/live/channel_6',
            'Любимое.TV',
            '');

        addChannel(page, 'rtmp://gb.orange.ether.tv/live/unikino/broadcast18',
            'Кино РФ',
            '');

        addChannel(page, 'rtmp://grey.ether.tv/live/rubin/broadcast4',
            'ФК Рубин',
            '');

        addChannel(page, 'rtmp://fms.pik-tv.com/live/piktv2pik2tv.flv',
            'PIK.TV',
            '');

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

/*
# EXTM3U
# EXTINF: -1, Eurosport 2
http://31.43.120.162:8076
# EXTINF: -1, Sport 1 ( Russia )
http://31.43.120.162:8110
# EXTINF: -1, Sports
http://31.43.120.162:8130
# EXTINF: -1, Fight Club
http://31.43.120.162:8101
# EXTINF: -1, Animal planet Russia
http://31.43.120.162:8119
# EXTINF: -1, ZooPark
http://31.43.120.162:8089
# EXTINF: -1, Pets
http://31.43.120.162:8098
# EXTINF: -1, National Geographic Russia
http://31.43.120.162:8115
# EXTINF: -1, My Planet
http://31.43.120.162:8080
# EXTINF: -1, Discovery Russia
http://31.43.120.162:8117
# EXTINF: -1,24 dock
http://31.43.120.162:8071
# EXTINF: -1, Fox Life Russia
http://31.43.120.162:8104
# EXTINF: -1, SET Russia
http://31.43.120.162:8112
# EXTINF: -1, Sony Sci-Fi Russia
http://31.43.120.162:8113
# EXTINF: -1, HCT
http://31.43.120.162:8070
# EXTINF: -1, TV XXI
http://31.43.120.162:8090
# EXTINF: -1, Evrokino
http://31.43.120.162:8092
# EXTINF: -1, Illusion +
http://31.43.120.162:8088
# EXTINF: -1, Russian Illusion
http://31.43.120.162:8087
# EXTINF: -1, Cinema House
http://31.43.120.162:8125
# EXTINF: -1, + Phoenix Cinema
http://31.43.120.162:8114
# EXTINF: -1, Russia 1
http://31.43.120.162:8105
# EXTINF: -1, Russia 2
http://31.43.120.162:8107
# EXTINF: -1, REN
http://31.43.120.162:8083
# EXTINF: -1, TV WORLD
http://31.43.120.162:8077
# EXTINF: -1,5 channel ( Russia )
http://31.43.120.162:8128
# EXTINF: -1, VTV
http://31.43.120.162:8044
# EXTINF: -1, Russia 24
http://31.43.120.162:8106
# EXTINF: -1, Euronews
http://31.43.120.162:8035
# EXTINF: -1, RBC
http://31.43.120.162:8082
# EXTINF: -1, Carousel
http://31.43.120.162:8068
# EXTINF: -1, Children
http://31.43.120.162:8085
# EXTINF: -1, Multimania
http://31.43.120.162:8084
# EXTINF: -1, Disney Channel
http://31.43.120.162:8111
# EXTINF: -1, Nickelodeon Russia
http://31.43.120.162:8086
# EXTINF: -1, Cartoon network
http://31.43.120.162:8120
# EXTINF: -1,2 x2
http://31.43.120.162:8073
# EXTINF: -1, Drive
http://31.43.120.162:8094
# EXTINF: -1, First Automobile
http://31.43.120.162:8052
# EXTINF: -1, Trophy
http://31.43.120.162:8030
# EXTINF: -1, Fishing and Hunting
http://31.43.120.162:8095
# EXTINF: -1, Psychology 21
http://31.43.120.162:8099
# EXTINF: -1, Questions and Answers
http://31.43.120.162:8100
# EXTINF: -1, Homesteads
http://31.43.120.162:8097
# EXTINF: -1, Telecafe
http://31.43.120.162:8123
# EXTINF: -1, Time
http://31.43.120.162:8124
# EXTINF: -1, Retro
http://31.43.120.162:8093
# EXTINF: -1, Friday
http://31.43.120.162:8081
# EXTINF: -1, Music
http://31.43.120.162:8109
# EXTINF: -1, M2
http://31.43.120.162:8013
# EXTINF: -1, Europa plus
http://31.43.120.162:8127
# EXTINF: -1, A-One
http://31.43.120.162:8072
# EXTINF: -1, A-One
http://31.43.120.162:8065
# EXTINF: -1, Vh1
http://31.43.120.162:8129
# EXTINF: -1, Culture
http://31.43.120.162:8108
# EXTINF: -1, Live
http://31.43.120.162:8121
# EXTINF: -1, Healthy TV
http://31.43.120.162:8096
# EXTINF: -1, Mother and Child
http://31.43.120.162:8074
# EXTINF: -1, Dobro
http://31.43.120.162:8067
# EXTINF: -1, right TV
http://31.43.120.162:8058
# EXTINF: -1, Comedy TV
http://31.43.120.162:8116
# EXTINF: -1, Fashion TV
http://31.43.120.162:8066
# EXTINF: -1, Shopping
http://31.43.120.162:8060
# EXTINF: -1, Shopping
http://31.43.120.162:8063

# EXTINF: -1, Kazakh TV
http://31.43.120.162:8040
# EXTINF: -1, VTV
http://31.43.120.162:8044
# EXTINF: -1, mornings
http://31.43.120.162:8047
# EXTINF: -1, lions tv
http://31.43.120.162:8048
# EXTINF: -1, 1 car
http://31.43.120.162:8052
# EXTINF: -1, the right TV
http://31.43.120.162:8058
# EXTINF: -1, boutique tv
http://31.43.120.162:8060
# EXTINF: -1, shopping tv
http://31.43.120.162:8063
# EXTINF: -1, A-One
http://31.43.120.162:8065
# EXTINF: -1, good
http://31.43.120.162:8067
# EXTINF: -1, carousel
http://31.43.120.162:8068
# EXTINF: -1, Sett
http://31.43.120.162:8070
# EXTINF: -1,24 dock
http://31.43.120.162:8071
# EXTINF: -1, A-One
http://31.43.120.162:8072
# EXTINF: -1, 2x2
http://31.43.120.162:8073
# EXTINF: -1, mother and child
http://31.43.120.162:8074
# EXTINF: -1, Eurosport2 (EN)
http://31.43.120.162:8076
# EXTINF: -1, world
http://31.43.120.162:8077
# EXTINF: -1, sts
http://31.43.120.162:8079
# EXTINF: -1, Th
http://31.43.120.162:8080
# EXTINF: -1, Friday
http://31.43.120.162:8081
# EXTINF: -1, RBC
http://31.43.120.162:8082
# EXTINF: -1, REN TV
http://31.43.120.162:8083
# EXTINF: -1, Multimania
http://31.43.120.162:8084
# EXTINF: -1, children
http://31.43.120.162:8085
# EXTINF: -1, Nickelodeon (EN)
http://31.43.120.162:8086
# EXTINF: -1, Russian Illusion
http://31.43.120.162:8087
# EXTINF: -1, + Illusion
http://31.43.120.162:8088
# EXTINF: -1, Zoo Park
http://31.43.120.162:8089
# EXTINF: -1, LTV (orig.
http://31.43.120.162:8090
# EXTINF: -1, Russian extreme
http://31.43.120.162:8091
# EXTINF: -1, Evrokino
http://31.43.120.162:8092
# EXTINF: -1, retro
http://31.43.120.162:8093
# EXTINF: -1, drive
http://31.43.120.162:8094
# EXTINF: -1, hunting and fishing stream tv
http://31.43.120.162:8095
# EXTINF: -1, Stream TV
http://31.43.120.162:8096
# EXTINF: -1, manor Stream TV
http://31.43.120.162:8097
# EXTINF: -1, pets Stream TV
http://31.43.120.162:8098
# EXTINF: -1, 21 psychology stream tv
http://31.43.120.162:8099
# EXTINF: -1, questions and answers Stream TV
http://31.43.120.162:8100
# EXTINF: -1, Fight Club
http://31.43.120.162:8101
# EXTINF: -1, Fox (EN)
http://31.43.120.162:8103
# EXTINF: -1, Fox Life (EN)
http://31.43.120.162:8104
# EXTINF: -1, Russia -1
http://31.43.120.162:8105
# EXTINF: -1, Russia -24
http://31.43.120.162:8106
# EXTINF: -1, Russia -2
http://31.43.120.162:8107
# EXTINF: -1, Russian Culture
http://31.43.120.162:8108
# EXTINF: -1, music
http://31.43.120.162:8109
# EXTINF: -1, 1 sport
http://31.43.120.162:8110
# EXTINF: -1, Disney Kanal
http://31.43.120.162:8111
# EXTINF: -1, SET (EN)
http://31.43.120.162:8112
# EXTINF: -1, Sony Sci-Fi
http://31.43.120.162:8113
# EXTINF: -1, TV Sale
http://31.43.120.162:8114
# EXTINF: -1, Nat Geo (EN)
http://31.43.120.162:8115
# EXTINF: -1, comedy tv
http://31.43.120.162:8116
# EXTINF: -1, Discovery Channel (EN)
http://31.43.120.162:8117
# EXTINF: -1, 1 soccer
http://31.43.120.162:8118
# EXTINF: -1, Animal Planet (EN)
http://31.43.120.162:8119
# EXTINF: -1, CN (EN)
http://31.43.120.162:8120
# EXTINF: -1, jv ----
http://31.43.120.162:8121
# EXTINF: -1, Telecafe
http://31.43.120.162:8123
# EXTINF: -1, time
http://31.43.120.162:8124
# EXTINF: -1, home cinema
http://31.43.120.162:8125
# EXTINF: -1, Europa Plus TV
http://31.43.120.162:8127
# EXTINF: -1, 5 channel spb
http://31.43.120.162:8128
# EXTINF: -1, Vh1
http://31.43.120.162:8129
# EXTINF: -1, sport
http://31.43.120.162:8130
# EXTINF: -1, 1 soccer
http://31.43.120.162:8118
# EXTINF: -1, 1 sport
http://31.43.120.162:8110
# EXTINF: -1, Eurosport2 (EN)
http://31.43.120.162:8076
# EXTINF: -1, Russia -2
http://31.43.120.162:8107
*/
