/*
 *  VK Videos plugin for Movian Media Center
 *
 *  Copyright (C) 2015 Buksa, lprot
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
    var API = 'https://api.vkontakte.ru/method',
        logo = plugin.path + 'logo.png',
        access_token = '2bdd2fc3bc43ed9d1a6d0c45fe22bc9c86a083d883406adc3f9d77403c85b8df4ba1e63d173ca764deb7c';

    var blue = "6699CC", orange = "FFA500";

    function colorStr(str, color) {
        return '<font color="' + color + '">(' + str + ')</font>';
    }

    function coloredStr(str, color) {
        return '<font color="' + color + '">' + str + '</font>';
    }

    var service = plugin.createService(plugin.getDescriptor().title, plugin.getDescriptor().id + ":start", "video", true, logo);

    var settings = plugin.createSettings(plugin.getDescriptor().title, logo, plugin.getDescriptor().synopsis);

    settings.createDivider('Settings:');
    var Resolution = [
        ['0', '720p', true],
        ['1', '480p'],
        ['2', '360p'],
        ['3', '240p'],
    ];
    settings.createMultiOpt("Resolution", "Resolution", Resolution, function(v) {
        service.Resolution = v;
    });
    settings.createBool("Safe_Search", "Adult Search", 0, function(v) {
        service.adult = v;
    });

    plugin.addURI(plugin.getDescriptor().id + ":start", function(page) {
        var search = showtime.textDialog('Search for Video:', true, true);
        if (search.rejected || !search.input) {
            page.error('Cannot search for empty input!');
            return;
        }
        page.redirect(plugin.getDescriptor().id + ":index:" + escape(search.input));
    });

    plugin.addURI(plugin.getDescriptor().id + ":index:(.*)", function(page, query) {
        page.metadata.title = unescape(query);
        scraper(page, unescape(query));
    });

    plugin.addURI(plugin.getDescriptor().id + ":moreFromTheOwner:(.*)", function(page, id) {
        page.contents = "items";
        page.type = "directory";
        page.metadata.logo = logo;
        page.entries = 0;

        function loader() {
            page.loading = true;
            var JSON = showtime.JSONDecode(showtime.httpReq(API + '/video.get', {
                args: {
                    uid: id,
                    count: 200,
                    offset: page.entries,
                    adult: service.adult,
                    access_token: access_token
                }
            }));
            page.loading = false;
            for (var i in JSON.response) {
                if (!JSON.response[i].vid)
                    continue;
                var item = page.appendItem(plugin.getDescriptor().id + ":play:" + escape(JSON.response[i].player) + ':' + encodeURIComponent(JSON.response[i].title), "video", {
                    title: showtime.entityDecode(unescape(JSON.response[i].title)),
                    icon: JSON.response[i].image_medium,
                    duration: JSON.response[i].duration,
                    timestamp: JSON.response[i].date,
                    description: new showtime.RichText(coloredStr('Title: ', orange) + showtime.entityDecode(unescape(JSON.response[i].title)) + (JSON.response[i].description ? '\n' + coloredStr('Description: ', orange) + JSON.response[i].description : ''))
                });
                page.entries++;
            }
            return JSON.response;
        };
        loader();
        page.paginator = loader;
        page.loading = false;
    });

    function scraper(page, query) {
        page.contents = "items";
        page.type = "directory";
        page.metadata.logo = logo;
        page.entries = 0;

        function loader() {
            page.loading = true;
            var JSON = showtime.JSONDecode(showtime.httpReq(API + '/video.search', {
                args: {
                    q: query,
                    sort: 0, // 0 - date, 1 - duration, 2 - relevance
                    count: 200,
                    offset: page.entries,
                    adult: service.adult,
                    access_token: access_token
                }
            }));
            page.loading = false;
            for (var i in JSON.response) {
                var item = page.appendItem(plugin.getDescriptor().id + ":play:" + escape(JSON.response[i].player) + ':' + encodeURIComponent(JSON.response[i].title), "video", {
                    title: showtime.entityDecode(unescape(JSON.response[i].title)),
                    icon: JSON.response[i].image_medium,
                    duration: JSON.response[i].duration,
                    timestamp: JSON.response[i].date,
                    description: new showtime.RichText(coloredStr('Title: ', orange) + showtime.entityDecode(unescape(JSON.response[i].title)) + (JSON.response[i].description ? '\n' + coloredStr('Description: ', orange) + JSON.response[i].description : ''))
                });

                item.owner_id = JSON.response[i].owner_id;
	        item.onEvent("moreFromTheOwner", function(item) {
		    page.redirect(plugin.getDescriptor().id + ":moreFromTheOwner:" + this.owner_id);
	        }.bind(item));
                item.addOptAction("More from this user", "moreFromTheOwner");
                page.entries++;
            }
            return JSON.response.length;
        };
        loader();
        page.paginator = loader;
        page.loading = false;
    }

    function getUrlArgs(url) {
        var link = url;

        var result = {
            url: link,
            args: {}
        };

        var args = {};

        if (link.indexOf('?') != -1) {
            var args_tmp = url.slice(url.indexOf('?') + 1);
            args_tmp = args_tmp.split('&');

            for (var i in args_tmp) {
                var arg = args_tmp[i];
                var arg_tmp = arg.split('=');
                args[arg_tmp[0]] = arg_tmp[1];
            }

            link = link.slice(0, link.indexOf('?'));
        }

        result.url = link;
        result.args = args;
        return result;
    }

    // Play links
    plugin.addURI(plugin.getDescriptor().id + ":play:(.*):(.*)", function(page, url, title) {
        page.loading = true;
        var video = null;
        var v = showtime.httpReq(unescape(url)).toString();
        showtime.print(unescape(url));

        //molodejj.tv
        if (v.match(/player.molodejj.tv[^']+/)) {
            url = (/player.molodejj.tv[^']+/.exec(v)).toString();
            v = showtime.httpReq('http://api.molodejj.tv/tv/pladform.php', {
                args: getUrlArgs(url).args
            })
            video = v.match(/videoURL=([^&]+)/)[1];
        } else if (v.match(/rutube.ru\/(?:.*\/)?([a-f0-9]+)/)) { //rutube.ru
            var id = (/rutube.ru\/(?:.*\/)?([a-f0-9]+)/.exec(v)[1]);
            url = 'http://rutube.ru/api/play/options/' + id + '/?format=json';
            JSON = showtime.JSONDecode(showtime.httpReq(url));
            video = 'hls:' + JSON.video_balancer.m3u8;
        } else if (v.match(/megogo.net\/b\/embedplayer\/[^']+/)) { // megogo
            url = (/megogo.net\/b\/embedplayer\/[^']+/.exec(v)).toString()
            v = showtime.httpReq('http://' + url + '?_stV=', {
                noFollow: 1,
                headers: {
                    Referer: 'http://vk.com/video_ext.php?oid=118750968&id=165357066&hash=99b536bd4342f55f'
                }
            })

            v = showtime.httpReq('http://megogo.net/b/info/', {
                postdata: {
                     m: 0,
                     h: 'http://vk.com/',
                     s: 0,
                     i: 96781,
                     t: 0,
                     //rnd: 9 % 2E09621031023562,
                     e: 0,
                     p: 0,
                     l: ''
                }
            })
            video = 'hls:' + v.match(/<src>(.+?)manifest.f4m<\/src>/)[1] + 'playlist.m3u8'
        } else if (v.match(/var vars = (.+)/)) {
            var JSON = showtime.JSONDecode(v.match(/var vars = (.+)/)[1]);
            switch (service.Resolution) {
                case '0':
                    video = JSON.url720;
                    if (!video)
                        video = JSON.url480;
                    if (video == undefined)
                        video = JSON.url360;
                    if (video == undefined)
                        video = JSON.url240;
                    break;
                case '1':
                    video = JSON.url480;
                    if (!video)
                        video = JSON.url360;
                    if (video == undefined)
                        video = JSON.url240;
                    break;
                case '2':
                    video = JSON.url360;
                    if (!video)
                        video = JSON.url240;
                    break;
                case '3':
                    video = JSON.url240;
                    break;
            }
        } else if (v.match(/<iframe id="video_player"([\s\S]*?)<\/iframe>/)) {
            var link = v.match(/<iframe id="video_player"([\s\S]*?)<\/iframe>/)[1].match(/src="([\s\S]*?)"/)[1];
            page.redirect('youtube:video:' + escape(link));
            //video = 'youtube:video:'+escape(link);
        }

        if (video) {
            page.type = "video";
            page.source = "videoparams:" + showtime.JSONEncode({
                title: decodeURIComponent(title),
                no_fs_scan: true,
                canonicalUrl: plugin.getDescriptor().id + ":play:" + url + ":" + title,
                sources: [{
                    url: video
                }]
            });
        } else {
            var error = v.match(/<div class="light_cry_dog"><\/div>([\s\S]*?)<\/div>/);
            if (error)
                page.error(showtime.entityDecode(error[1].replace(/(<([^>]+)>)/ig, '').replace(/(?:(?:^|\n)\s+|\s+(?:$|\n))/g,'').replace(/\s+/g,' ')));
            else
                page.error("Can't get the link. Sorry :(");
        }

        page.metadata.logo = logo;
        page.loading = false;
    });

    plugin.addSearcher(plugin.getDescriptor().title + " - Videos", logo, function(page, query) {
        scraper(page, query);
    });
})(this);