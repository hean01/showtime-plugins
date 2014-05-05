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

    // Start page
    plugin.addURI(PREFIX + "start", function(page) {
	page.type = "directory";
	page.contents = "items";
	page.metadata.logo = plugin.path + logo;
	page.metadata.title = slogan;
	page.loading = false;

        page.appendItem("", "separator", {
            title: 'Украинские каналы'
        });



        page.appendItem("hls:http://212.40.43.10:1935/inters/smil:inter.smil/playlist.m3u8", "video", {
            title: 'Интер',
            icon: ''
        });

        page.appendItem("http://31.43.120.162:8062", "video", {
            title: '100',
            icon: ''
        });

        page.appendItem("hls:http://31.28.169.242/hls/live112.m3u8", "video", {
            title: '112',
            icon: 'http://112.ua/static/img/logo/112_ukr.png'
        });
        page.appendItem("rtmp://media.tvi.com.ua/live/_definst_//HLS4", "video", {
            title: 'ТВі',
            icon: 'http://tvi.ua/catalog/view/theme/new/image/logo.png'
        });

        page.appendItem("http://31.43.120.162:8009", "video", {
            title: 'Униан',
            icon: ''
        });
        page.appendItem("http://31.43.120.162:8013", "video", {
            title: 'М2',
            icon: ''
        });
        page.appendItem("http://31.43.120.162:8014", "video", {
            title: '24 News',
            icon: ''
        });
        page.appendItem("http://31.43.120.162:8029", "video", {
            title: 'Impact',
            icon: ''
        });
        page.appendItem("http://31.43.120.162:8030", "video", {
            title: 'Трофей',
            icon: ''
        });
        page.appendItem("http://31.43.120.162:8035", "video", {
            title: 'Euronews',
            icon: ''
        });

        page.appendItem("http://31.43.120.162:8118", "video", {
            title: 'Футбол 1',
            icon: ''
        });

        page.appendItem("hls:http://91.203.194.146:1935/liveedge/atr.stream/playlist.m3u8", "video", {
            title: 'ATR',
            icon: ''
        });

        page.appendItem("", "separator", {
            title: 'Российские каналы'
        });

        page.appendItem("hls:http://tv.life.ru/lifetv/720p/index.m3u8", "video", {
            title: 'Life News (720p)',
            icon: 'http://lifenews.ru/assets/logo-0a3a75be3dcc15b6c6afaef4adab52dd.png'
        });
        page.appendItem("hls:http://tv.life.ru/lifetv/480p/index.m3u8", "video", {
            title: 'Life News (480p)',
            icon: 'http://lifenews.ru/assets/logo-0a3a75be3dcc15b6c6afaef4adab52dd.png'
        });
        page.appendItem("hls:http://tvrain-video.ngenix.net/mobile/TVRain_1m.stream/playlist.m3u8", "video", {
            title: 'Дождь (720p)',
            icon: 'http://tvrain-st.cdn.ngenix.net/static/css/pub/images/logo-tvrain.png'
        });
        page.appendItem("hls:http://rian.cdnvideo.ru/rr/stream20/chunklist.m3u8", "video", {
            title: 'РИА Новости',
            icon: ''
        });
        page.appendItem("hls:http://vevoplaylist-live.hls.adaptive.level3.net/vevo/ch2/06/prog_index.m3u8", "video", {
            title: 'Vevo',
            icon: ''
        });
        page.appendItem("hls:http://vniitr.cdnvideo.ru/vniitr-live/vniitr.sdp/playlist.m3u8", "video", {
            title: 'RU TV',
            icon: ''
        });
        page.appendItem("hls:http://nano.teleservice.su:8080/hls/nano.m3u8", "video", {
            title: 'Nano TV',
            icon: ''
        });

        page.appendItem("http://31.43.120.162:8076", "video", {
            title: 'Eurosport 2',
            icon: ''
        });

        page.appendItem("http://31.43.120.162:8101", "video", {
            title: 'Бойцовский клуб',
            icon: ''
        });

        page.appendItem("http://31.43.120.162:8130", "video", {
            title: 'Спорт',
            icon: ''
        });

        page.appendItem("http://31.43.120.162:8110", "video", {
            title: 'Спорт 1',
            icon: ''
        });

        page.appendItem("http://31.43.120.162:8119", "video", {
            title: 'Animal Planet',
            icon: ''
        });

        page.appendItem("http://31.43.120.162:8089", "video", {
            title: 'ZOOпарк',
            icon: ''
        });

        page.appendItem("", "separator", {
            title: 'Триколор ТВ'
        });

        page.appendItem("http://91.192.168.242:8001", "video", {
            title: '1 канал',
            icon: ''
        });

        page.appendItem("http://91.192.168.242:8002", "video", {
            title: 'Россия 1',
            icon: ''
        });

        page.appendItem("http://91.192.168.242:8003", "video", {
            title: 'HTB',
            icon: ''
        });
        page.appendItem("http://91.192.168.242:8004", "video", {
            title: 'Россия Культура',
            icon: ''
        });
        page.appendItem("http://91.192.168.242:8005", "video", {
            title: 'Россия 2',
            icon: ''
        });
        page.appendItem("http://91.192.168.242:8006", "video", {
            title: 'ATH',
            icon: ''
        });
        page.appendItem("http://91.192.168.242:8007", "video", {
            title: 'OTB',
            icon: ''
        });
        page.appendItem("http://91.192.168.242:8008", "video", {
            title: 'Карусель',
            icon: ''
        });
        page.appendItem("http://91.192.168.242:8009", "video", {
            title: 'THT',
            icon: ''
        });
        page.appendItem("http://91.192.168.242:8010", "video", {
            title: 'СТС',
            icon: ''
        });
        page.appendItem("http://91.192.168.242:8011", "video", {
            title: 'Перец',
            icon: ''
        });
        page.appendItem("http://91.192.168.242:8012", "video", {
            title: '41',
            icon: ''
        });
        page.appendItem("http://91.192.168.242:8013", "video", {
            title: 'ТВЦ',
            icon: ''
        });
        page.appendItem("http://91.192.168.242:8014", "video", {
            title: 'ОТР',
            icon: ''
        });
        page.appendItem("http://91.192.168.242:8015", "video", {
            title: '4 канал',
            icon: ''
        });
        page.appendItem("http://91.192.168.242:8016", "video", {
            title: 'Спорт',
            icon: ''
        });

        page.appendItem("http://91.192.168.242:8017", "video", {
            title: 'Наука 2.0',
            icon: ''
        });
        page.appendItem("http://91.192.168.242:8018", "video", {
            title: 'Сарафан ТВ',
            icon: ''
        });
        page.appendItem("http://91.192.168.242:8019", "video", {
            title: 'Europa Plus TV',
            icon: ''
        });
        page.appendItem("http://91.192.168.242:8020", "video", {
            title: 'Русский роман',
            icon: ''
        });
        page.appendItem("http://91.192.168.242:8021", "video", {
            title: 'ТНТ',
            icon: ''
        });
        page.appendItem("http://91.192.168.242:8022", "video", {
            title: 'Рен ТВ',
            icon: ''
        });
        page.appendItem("http://91.192.168.242:8023", "video", {
            title: 'ТВ3',
            icon: ''
        });
        page.appendItem("http://91.192.168.242:8024", "video", {
            title: 'ТТС',
            icon: ''
        });
        page.appendItem("http://91.192.168.242:8025", "video", {
            title: 'RU TV',
            icon: ''
        });
        page.appendItem("http://91.192.168.242:8026", "video", {
            title: 'Teen TV',
            icon: ''
        });
        page.appendItem("http://91.192.168.242:8027", "video", {
            title: 'Охотник и рыболов',
            icon: ''
        });
        page.appendItem("http://91.192.168.242:8028", "video", {
            title: 'Телепутешествия',
            icon: ''
        });
        page.appendItem("http://91.192.168.242:8029", "video", {
            title: 'Интер+',
            icon: ''
        });
        page.appendItem("http://91.192.168.242:8030", "video", {
            title: 'Спорт Плюс',
            icon: ''
        });
        page.appendItem("http://91.192.168.242:8031", "video", {
            title: 'Евроспорт 2',
            icon: ''
        });
        page.appendItem("http://91.192.168.242:8032", "video", {
            title: 'National Geographic',
            icon: ''
        });
        page.appendItem("http://91.192.168.242:8033", "video", {
            title: 'Моя планета',
            icon: ''
        });
        page.appendItem("http://91.192.168.242:8034", "video", {
            title: 'Пятница!',
            icon: ''
        });
        page.appendItem("http://91.192.168.242:8035", "video", {
            title: '2x2',
            icon: ''
        });
        page.appendItem("http://91.192.168.242:8036", "video", {
            title: 'РБК',
            icon: ''
        });
        page.appendItem("http://91.192.168.242:8037", "video", {
            title: 'Cartoon Network',
            icon: ''
        });
        page.appendItem("http://91.192.168.242:8038", "video", {
            title: 'Детский',
            icon: ''
        });
        page.appendItem("http://91.192.168.242:8039", "video", {
            title: 'Мать и дитя',
            icon: ''
        });
        page.appendItem("http://91.192.168.242:8040", "video", {
            title: 'Discovery Channel',
            icon: ''
        });
        page.appendItem("http://91.192.168.242:8041", "video", {
            title: 'Animal Planet',
            icon: ''
        });
        page.appendItem("http://91.192.168.242:8042", "video", {
            title: 'Русский бестселлер',
            icon: ''
        });
        page.appendItem("http://91.192.168.242:8043", "video", {
            title: '365',
            icon: ''
        });
        page.appendItem("http://91.192.168.242:8044", "video", {
            title: 'Комедия',
            icon: ''
        });
        page.appendItem("http://91.192.168.242:8045", "video", {
            title: 'Ля минор',
            icon: ''
        });
        page.appendItem("http://91.192.168.242:8046", "video", {
            title: 'Много ТВ',
            icon: ''
        });
        page.appendItem("http://91.192.168.242:8047", "video", {
            title: 'Бойцовский клуб',
            icon: ''
        });
        page.appendItem("http://91.192.168.242:8048", "video", {
            title: 'ТНВ планета',
            icon: ''
        });
        page.appendItem("http://91.192.168.242:8049", "video", {
            title: 'Живи!',
            icon: ''
        });
        page.appendItem("http://91.192.168.242:8050", "video", {
            title: 'Телекафе',
            icon: ''
        });
        page.appendItem("http://91.192.168.242:8051", "video", {
            title: 'Время',
            icon: ''
        });
        page.appendItem("http://91.192.168.242:8052", "video", {
            title: 'Дом кино',
            icon: ''
        });
        page.appendItem("http://91.192.168.242:8053", "video", {
            title: '24',
            icon: ''
        });
        page.appendItem("http://91.192.168.242:8054", "video", {
            title: 'Звезда',
            icon: ''
        });
        page.appendItem("http://91.192.168.242:8055", "video", {
            title: 'Cartoon Network',
            icon: 'Детский мир'
        });
        page.appendItem("http://91.192.168.242:8056", "video", {
            title: 'Кино ТВ',
            icon: ''
        });
        page.appendItem("http://91.192.168.242:8057", "video", {
            title: 'Игровой',
            icon: ''
        });
        page.appendItem("http://91.192.168.242:8058", "video", {
            title: 'Ретро',
            icon: ''
        });
        page.appendItem("http://91.192.168.242:8059", "video", {
            title: 'Драйв',
            icon: ''
        });
        page.appendItem("http://91.192.168.242:8060", "video", {
            title: 'Охота и рыбалка',
            icon: ''
        });
        page.appendItem("http://91.192.168.242:8061", "video", {
            title: 'Усадьба',
            icon: ''
        });
        page.appendItem("http://91.192.168.242:8062", "video", {
            title: 'Домашние животные',
            icon: ''
        });
        page.appendItem("http://91.192.168.242:8063", "video", {
            title: 'Психология21',
            icon: ''
        });
        page.appendItem("http://91.192.168.242:8064", "video", {
            title: 'Бойцовский клуб',
            icon: ''
        });
        page.appendItem("http://91.192.168.242:8065", "video", {
            title: 'A One',
            icon: ''
        });
        page.appendItem("rtmp://online-record.ru//pervyj_middle", "video", {
            title: '1 канал',
            icon: ''
        });
        page.appendItem("hls:http://151.236.123.4/rr2/smil:rtp_r1_rr.smil/playlist.m3u8?auth=vh&cast_id=2961", "video", {
            title: 'Россия 1',
            icon: ''
        });
        page.appendItem("rtmp://online-record.ru//rossiya2_middle", "video", {
            title: 'Россия 2',
            icon: ''
        });
        page.appendItem("hls:http://testlivestream.rfn.ru/live/smil:r24.smil/playlist.m3u8?auth=vh&cast_id=21", "video", {
            title: 'Россия 24',
            icon: ''
        });
        page.appendItem("hls:http://151.236.123.4/rr2/smil:rtp_rtrp_rr.smil/playlist.m3u8?auth=vh&cast_id=4941", "video", {
            title: 'Россия РТР',
            icon: ''
        });
        page.appendItem("hls:http://testlivestream.rfn.ru/live/smil:m24.smil/playlist.m3u8?auth=vh&cast_id=1661", "video", {
            title: 'Москва 24',
            icon: ''
        });
        page.appendItem("hls:http://testlivestream.rfn.ru/live/smil:mayak.smil/playlist.m3u8?auth=vh&cast_id=81", "video", {
            title: 'Маяк FM',
            icon: ''
        });
        page.appendItem("rtmp://europaplus.cdnvideo.ru/europaplus-live//mp4:eptv_main.sdp", "video", {
            title: 'Europa Plus TV (RTMP)',
            icon: 'http://www.europaplustv.com/images/europa_tv.png'
        });
        page.appendItem("hls:http://europaplus.cdnvideo.ru/europaplus-live/mp4:eptv_main.sdp/playlist.m3u8", "video", {
            title: 'Europa Plus TV (HLS)',
            icon: 'http://www.europaplustv.com/images/europa_tv.png'
        });
        page.appendItem("", "separator", {
            title: 'Планета Онлайн'
        });
        page.appendItem("rtmp://109.239.142.62/live/livestream3", "video", {
            title: 'Первый HD',
            icon: ''
        });
        page.appendItem("hls:http://80.93.53.88:1935/live/channel_4/playlist.m3u8", "video", {
            title: 'Fresh.TV (HLS)',
            icon: ''
        });
        page.appendItem("rtmp://80.93.53.88/live/channel_4", "video", {
            title: 'Fresh.TV (RTMP)',
            icon: ''
        });
        page.appendItem("rtmp://80.93.53.88/live/channel_2", "video", {
            title: 'ТВТУР.TV',
            icon: ''
        });
        page.appendItem("rtmp://80.93.53.88/live/channel_3", "video", {
            title: 'Релакс.TV',
            icon: ''
        });
        page.appendItem("rtmp://80.93.53.88/live/channel_5", "video", {
            title: 'Премьера.TV',
            icon: ''
        });
        page.appendItem("rtmp://80.93.53.88/live/channel_6", "video", {
            title: 'Любимое.TV',
            icon: ''
        });
        page.appendItem("rtmp://gb.orange.ether.tv/live/unikino/broadcast18", "video", {
            title: 'Кино РФ',
            icon: ''
        });
        page.appendItem("rtmp://grey.ether.tv/live/rubin/broadcast4", "video", {
            title: 'ФК Рубин',
            icon: ''
        });
        page.appendItem("rtmp://80.93.53.88/live/pik.stream", "video", {
            title: 'PIK.TV',
            icon: ''
        });

        page.appendItem("", "separator", {
            title: 'XXX'
        });

        page.appendItem("rtmp://111.118.21.77/ptv3//phd499", "video", {
            title: 'Playboy TV',
            icon: ''
        });
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
# EXTINF: -1, Lviv TV
http://31.43.120.162:8048
# EXTINF: -1, TRK Black Sea
http://31.43.120.162:8042
# EXTINF: -1, UTR
http://31.43.120.162:8047
# EXTINF: -1, channel 100
http://31.43.120.162:8062
# EXTINF: -1, UNIAN TV
http://31.43.120.162:8009
# EXTINF: -1, News 24
http://31.43.120.162:8014
# EXTINF: -1, Russia 24
http://31.43.120.162:8106
# EXTINF: -1, Euronews
http://31.43.120.162:8035
# EXTINF: -1, RBC
http://31.43.120.162:8082
# EXTINF: -1, ChP.Info
http://31.43.120.162:8041
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
# EXTINF: -1, Impact
http://31.43.120.162:8029
# EXTINF: -1, Comedy TV
http://31.43.120.162:8116
# EXTINF: -1, Kazakh TV
http://31.43.120.162:8040
# EXTINF: -1, Fashion TV
http://31.43.120.162:8066
# EXTINF: -1, Shopping
http://31.43.120.162:8060
# EXTINF: -1, Shopping
http://31.43.120.162:8063

# EXTINF: -1, Kazakh TV
http://31.43.120.162:8040
# EXTINF: -1, chp info
http://31.43.120.162:8041
# EXTINF: -1, TRK Black Sea
http://31.43.120.162:8042
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
# EXTINF: -1, Ukrainian Fashion
http://31.43.120.162:8066
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
