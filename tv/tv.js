/*
 *  Online TV plugin for Movian Media Center
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

    function setPageHeader(page, title) {
	page.type = "directory";
	page.contents = "items";
	page.metadata.logo = logo;
	page.metadata.title = new showtime.RichText(title);
    }

    var blue = '6699CC', orange = 'FFA500', red = 'EE0000', green = '008B45';

    function colorStr(str, color) {
        return '<font color="' + color + '"> (' + str + ')</font>';
    }

    function coloredStr(str, color) {
        return '<font color="' + color + '">' + str + '</font>';
    }

    function base64_decode(data) { // http://kevin.vanzonneveld.net
        var b64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
        var o1, o2, o3, h1, h2, h3, h4, bits, i = 0, ac = 0, dec = "", tmp_arr = [];
        if (!data)
            return data;
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
            if (h3 == 64)
                tmp_arr[ac++] = String.fromCharCode(o1);
            else if (h4 == 64)
                    tmp_arr[ac++] = String.fromCharCode(o1, o2);
                 else
                    tmp_arr[ac++] = String.fromCharCode(o1, o2, o3);
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

    var service = plugin.createService(plugin.getDescriptor().title, plugin.getDescriptor().id + ":start", "tv", true, logo);

    var settings = plugin.createSettings(plugin.getDescriptor().title, logo, plugin.getDescriptor().title);

    settings.createBool('disableSampleList', "Don't show Sample M3U list", false, function(v) {
        service.disableSampleList = v;
    });

    settings.createBool('disableSampleXMLList', "Don't show Sample XML list", true, function(v) {
        service.disableSampleXMLList = v;
    });

    settings.createAction("cleanFavorites", "Clean My Favorites", function () {
        store.list = "[]";
        showtime.notify('Favorites has been cleaned successfully', 2);
    });

    var store = plugin.createStore('favorites', true);
    if (!store.list)
        store.list = "[]";

    var playlists = plugin.createStore('playlists', true);
    if (!playlists.list)
        playlists.list = "[]";

    var yoooo = plugin.createStore('yoooo', true);


    function addToFavoritesOption(item, link, title, icon) {
        item.link = link;
        item.title = title;
        item.icon = icon;
        item.onEvent("addFavorite", function(item) {
            var entry = showtime.JSONEncode({
                link: encodeURIComponent(this.link),
                title: encodeURIComponent(this.title),
                icon: encodeURIComponent(this.icon)
            });
            store.list = showtime.JSONEncode([entry].concat(eval(store.list)));
            showtime.notify("'" + this.title + "' has been added to My Favorites.", 2);
        }.bind(item));
	item.addOptAction("Add '" + title + "' to My Favorites", "addFavorite");
    }

    var API = 'https://www.googleapis.com/youtube/v3',
        key = "AIzaSyCSDI9_w8ROa1UoE2CNIUdDQnUhNbp9XR4"

    plugin.addURI(plugin.getDescriptor().id + ":youtube:(.*)", function(page, title) {
        // search for the channel
        page.loading = true;
        try {
            doc = showtime.httpReq(API + '/search', {
                args: {
                    part: 'snippet',
                    type: 'video',
                    q: unescape(title),
                    maxResults: 1,
                    eventType: 'live',
                    key: key
                }
            }).toString();
            page.redirect('youtube:video:' + showtime.JSONDecode(doc).items[0].id.videoId);
        } catch(err) {
            page.error("Sorry, can't get channel's link :(");
        }
        page.loading = false;
    });

    plugin.addURI(plugin.getDescriptor().id + ":sputniktv:(.*):(.*)", function(page, url, title) {
        page.loading = true;
        var resp = showtime.httpReq(unescape(url)).toString();
        var match = resp.match(/stream: "([\S\s]*?)"/);
        if (!match)
           match = resp.match(/file=([\S\s]*?)&/);
        if (!match)
           match = resp.match(/"src=([\S\s]*?)&/);
        if (!match)
           match = resp.match(/value="src=([\S\s]*?)"/)
        if (match && showtime.probe(match[1]).result)
           match = resp.match(/file=([\S\s]*?)"/);
        page.loading = false;
        if (match) {
            var link = match[1].toString().replace(/&st=\/online\/video.txt/, '').replace('manifest.f4m', 'playlist.m3u8');
            if (link.match(/m3u8/)) link = 'hls:' + link;
            page.type = "video";
            page.source = "videoparams:" + showtime.JSONEncode({
                title: unescape(title),
                canonicalUrl: plugin.getDescriptor().id + ':sputniktv:' + url + ':' + title,
                sources: [{
                    url: link
                }],
                no_subtitle_scan: true
            });
        } else page.error("Sorry, can't get the link :(");
    });

    plugin.addURI(plugin.getDescriptor().id + ":ntv:(.*):(.*)", function(page, url, title) {
        page.loading = true;
        var resp = showtime.httpReq(unescape(url)).toString();
        page.loading = false;
        var match = resp.match(/hlsURL = '([\S\s]*?)'/);
        if (match) {
            page.type = "video";
            page.source = "videoparams:" + showtime.JSONEncode({
                title: unescape(title),
                canonicalUrl: plugin.getDescriptor().id + ':ntv:' + url + ':' + title,
                sources: [{
                    url: 'hls:' + match[1]
                }],
                no_subtitle_scan: true
            });
        } else page.error("Sorry, can't get the link :(");
    });

    function roughSizeOfObject(object) {
        var objectList = [];
        var recurse = function(value) {
            var bytes = 0;
            if (typeof value === 'boolean')
                bytes = 4;
            else if (typeof value === 'string')
                bytes = value.length * 2;
            else if (typeof value === 'number')
                bytes = 8;
            else if (typeof value === 'object' && objectList.indexOf(value) === -1) {
                objectList[ objectList.length ] = value;
                for (i in value) {
                    bytes += 8; // assumed existence overhead
                    bytes += recurse(value[i])
                }
            }
            return bytes;
        }
        return recurse(object);
    }

    plugin.addURI(plugin.getDescriptor().id + ":divan:(.*):(.*)", function(page, url, title) {
        page.loading = true;
        var resp = showtime.httpReq(unescape(url).match(/http/) ? unescape(url) : 'http://divan.tv' + unescape(url)).toString();
        var match = resp.match(/file: "([\S\s]*?)"/);
        if (match) {
            var n = 0;
            while (n < 5)
                try {
                    //var size = roughSizeOfObject(showtime.httpReq(match[1]));
                    //showtime.print(unescape(title) + ': Got ' + size + ' bytes');
                    showtime.httpReq(match[1])
                    break;
                } catch(err) {
                    showtime.print('Retry #' + (n + 1));
                    showtime.sleep(1);
                    n++;
                }
            page.type = "video";
            page.source = "videoparams:" + showtime.JSONEncode({
                title: unescape(title),
                canonicalUrl: plugin.getDescriptor().id + ':divan:' + url + ':' + title,
                sources: [{
                    url: 'hls:' + match[1]
                }],
                no_subtitle_scan: true
            });
        } else page.error("Sorry, can't get the link :(");
        page.loading = false;
    });

    plugin.addURI(plugin.getDescriptor().id + ":tonis:(.*):(.*)", function(page, url, title) {
        page.loading = true;
        var resp = showtime.httpReq(unescape(url)).toString();
        page.loading = false;
        var match = resp.match(/src='(http:\/\/media.wnet.ua\/tonis\/player[\s\S]*?)'/);
        if (match) {
            resp = showtime.httpReq(match[1]).toString();
            var key = resp.match(/"(\?s=[\s\S]*?)"/)[1];
            var link = resp.match(/url: "([\s\S]*?)"/)[1] + key;
            page.type = "video";
            page.source = "videoparams:" + showtime.JSONEncode({
                title: unescape(title),
                canonicalUrl: plugin.getDescriptor().id + ':tonis:' + url + ':' + title,
                sources: [{
                    url: 'hls:' + link.replace('manifest.f4m', 'master.m3u8')
                }],
                no_subtitle_scan: true
            });
        } else page.error("Sorry, can't get the link :(");
    });

    plugin.addURI(plugin.getDescriptor().id + ":tivix:(.*):(.*)", function(page, url, title) {
        page.loading = true;
        var resp = showtime.httpReq(unescape(url)).toString();
        page.loading = false;
        var re = /file=([\S\s]*?)&/g;
        var match = re.exec(resp);
        if (!match) {
            re = /skin" src="([\S\s]*?)"/g;
            match = re.exec(resp);
        }
        while (match) {
            page.loading = true;
            if (showtime.probe(match[1]).result) {
                match = re.exec(resp);
                continue;
            }
            if (match[1].match(/rtmp/))
                var link = unescape(match[1]) + ' swfUrl=http://tivix.net' + resp.match(/data="(.*)"/)[1] + ' pageUrl=' + unescape(url);
            else
                var link = match[1].match('m3u8') ? 'hls:' + unescape(match[1]) : unescape(match[1]);

            page.loading = false;
            page.type = "video";
            page.source = "videoparams:" + showtime.JSONEncode({
                title: unescape(title),
                canonicalUrl: plugin.getDescriptor().id + ':tivix:' + url + ':' + title,
                sources: [{
                    url: link
                }],
                no_subtitle_scan: true
            });
            return;
        }

        // try to get youtube link
        match = resp.match(/\.com\/v\/([\S\s]*?)(\?|=)/);
        if (match) {
            page.redirect('youtube:video:' + match[1]);
            return;
        }

        page.error("Sorry, can't get the link :(");
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
                }],
                no_subtitle_scan: true
            });
        } else page.error("Sorry, can't get the link :(");
    });

    plugin.addURI(plugin.getDescriptor().id + ":seetv:(.*):(.*)", function(page, url, title) {
        page.loading = true;
        var resp = showtime.httpReq("http://seetv.tv/see/" + unescape(url)).toString();
        page.loading = false;
        var match = resp.match(/"link",([\S\s]*?)\)/);
        if (match) {
            page.loading = true;
            doc = showtime.JSONDecode(showtime.httpReq('http://seetv.tv/get/player/' + match[1], {
                headers: {
                    Referer: 'http://seetv.tv/see/' + unescape(url),
                    'X-Requested-With': 'XMLHttpRequest'
                }
            }));
            page.loading = false;

            if (doc && doc.file) {
                page.type = "video";
                page.source = "videoparams:" + showtime.JSONEncode({
                    title: unescape(title),
                    canonicalUrl: plugin.getDescriptor().id + ':seetv:' + url + ':' + title,
                    sources: [{
                        url: 'hls:' + unescape(doc.file)
                    }],
                    no_subtitle_scan: true
                });
            } else
                page.error("Sorry, can't get the link :(");
        } else
            page.error("Sorry, can't get the link :(");
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
                }],
                no_subtitle_scan: true
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
                }],
                no_subtitle_scan: true
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
                }],
                no_subtitle_scan: true
            });
       } else page.error("Sorry, can't get the link :(");
    });

    plugin.addURI(plugin.getDescriptor().id + ":yamgo:(.*):(.*)", function(page, url, title) {
        page.loading = true;
        var resp = showtime.JSONDecode(showtime.httpReq("http://yamgo.com/get-channel/" + unescape(url) + '?format=json'));
        page.loading = false;
        if (resp && resp.channel && resp.channel.channel_url_ipad) {
            page.type = "video";
            page.source = "videoparams:" + showtime.JSONEncode({
                title: unescape(title),
                canonicalUrl: plugin.getDescriptor().id + ':yamgo:' + url + ':' + title,
                sources: [{
                    url: 'hls:' + resp.channel.channel_url_ipad
                }],
                no_subtitle_scan: true
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
                    }],
                    no_subtitle_scan: true
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
                    }],
                    no_subtitle_scan: true
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
                }],
                no_subtitle_scan: true
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
                    }],
                    no_subtitle_scan: true
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
            }],
            no_subtitle_scan: true
        });
        page.type = 'video'
        page.source = link;
    });


    function fill_fav(page) {
	var list = eval(store.list);

        if (!list || !list.toString()) {
           page.error("My Favorites list is empty");
           return;
        }
        var pos = 0;
	for (var i in list) {
	    var itemmd = showtime.JSONDecode(list[i]);
	    var item = page.appendItem(decodeURIComponent(itemmd.link), "video", {
       		title: decodeURIComponent(itemmd.title),
		icon: decodeURIComponent(itemmd.icon),
                description: new showtime.RichText(coloredStr('Link: ', orange) + decodeURIComponent(itemmd.link))
	    });
	    item.addOptAction("Remove '" + decodeURIComponent(itemmd.title) + "' from My Favorites", pos);

	    item.onEvent(pos, function(item) {
		var list = eval(store.list);
		showtime.notify("'" + decodeURIComponent(showtime.JSONDecode(list[item]).title) + "' has been removed from My Favorites.", 2);
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

    plugin.addURI(plugin.getDescriptor().id + ":indexTivix:(.*):(.*)", function(page, url, title) {
        setPageHeader(page, decodeURIComponent(title));
        var url = prefixUrl = 'http://tivix.net' + decodeURIComponent(url);
        var tryToSearch = true, fromPage = 1, n = 0;

        function loader() {
            if (!tryToSearch) return false;
            page.loading = true;
            var doc = showtime.httpReq(url).toString();
            page.loading = false;
            // 1-title, 2-url, 3-icon
            var re = /<div class="all_tv" title="([\S\s]*?)">[\S\s]*?<a href="([\S\s]*?)">[\S\s]*?<img src="([\S\s]*?)"/g;
            var match = re.exec(doc);
            while (match) {
                var link = plugin.getDescriptor().id + ":tivix:" + escape(match[2]) + ':' + escape(match[1]);
                var icon = 'http://tivix.net' + match[3];
                var item = page.appendItem(link, "video", {
                    title: match[1],
                    icon: icon
                });
                addToFavoritesOption(item, link, match[1], icon);
                n++;
                match = re.exec(doc);
            }
            page.metadata.title = new showtime.RichText(decodeURIComponent(title) + ' (' + n + ')');
            var next = doc.match(/">Вперед<\/a>/);
            if (!next)
                return tryToSearch = false;
            fromPage++;
            url = prefixUrl + 'page/' + fromPage;;
            return true;
        }
        loader();
        page.paginator = loader;
        page.loading = false;
    });

    plugin.addURI(plugin.getDescriptor().id + ":tivixStart", function(page) {
        setPageHeader(page, 'Tivix.net');
        page.loading = true;
        var doc = showtime.httpReq('http://tivix.net').toString();
        page.loading = false;
        var re = /<div class="menuuuuuu"([\S\s]*?)<\/div>/g;
        var menus = re.exec(doc);
        var re2 = /<a href="([\S\s]*?)"[\S\s]*?>([\S\s]*?)<\/a>/g;
        while (menus) {
            var submenus = re2.exec(menus[1]);
            while (submenus) {
                page.appendItem(plugin.getDescriptor().id + ":indexTivix:" + encodeURIComponent(submenus[1]) + ':' + encodeURIComponent(submenus[2]), "directory", {
	            title: submenus[2]
                });
                submenus = re2.exec(menus[1]);
            }
            menus = re.exec(doc);
            page.appendItem("", "separator");
        }
    });

    plugin.addURI(plugin.getDescriptor().id + ":divanStart", function(page) {
        setPageHeader(page, 'Divan.tv');
        page.loading = true;

        plugin.addHTTPAuth('.*divan\\.tv', function(req) {
            req.setHeader('User-Agent', 'Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2228.0 Safari/537.36');
        });
        plugin.addHTTPAuth('.*divan\\.tv.*', function(req) {
            req.setHeader('User-Agent', 'Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2228.0 Safari/537.36');
        });

        var international = false;
        var doc = showtime.httpReq('https://divan.tv/tv/?devices=online&access=free').toString();
        if (doc.match(/land-change-site/) || international) {
            international = true;
            doc = showtime.httpReq('https://divan.tv/int/tv/?devices=online&access=free').toString();
        }

        // 1-url, 2-icon, 3-title
        var re = /class="tv-channel[\S\s]*?<a href="([\S\s]*?)"[\S\s]*?src="([\S\s]*?)"[\S\s]*?<a title="([\S\s]*?)"/g;
        var n = 0;

        function appendItems() {
            var match = re.exec(doc);
            while (match) {
                var item = page.appendItem(plugin.getDescriptor().id + ":divan:" + escape(match[1]) + ':' + escape(match[3]), "video", {
                    title: match[3],
                    icon: match[2]
                });
                addToFavoritesOption(item, plugin.getDescriptor().id + ":divan:" + escape(match[1]) + ':' + escape(match[3]), match[3], match[2]);
                match = re.exec(doc);
                n++;
            }
        }

        appendItems();
        var nextPageUrl = 'http://divan.tv/tv/getNextPage';
        if (international)
            nextPageUrl = 'https://divan.tv/int/tv/getNextPage';
        doc = showtime.httpReq(nextPageUrl, {
            postdata: {
                filters: '{"page":2}'
            }
        }).toString();
        appendItems();

        doc = showtime.httpReq(nextPageUrl, {
            postdata: {
                filters: '{"page":3}'
            }
        }).toString();
        appendItems();

        page.metadata.title = 'Divan.tv (' + n + ')';
        page.loading = false;
    });

    plugin.addURI(plugin.getDescriptor().id + ":sputnikStart", function(page) {
        setPageHeader(page, 'Sputniktv.in.ua');
        page.loading = true;

        plugin.addHTTPAuth('.*divan\\.tv', function(req) {
            req.setHeader('User-Agent', 'Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2228.0 Safari/537.36');
        });
        plugin.addHTTPAuth('.*divan\\.tv.*', function(req) {
            req.setHeader('User-Agent', 'Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2228.0 Safari/537.36');
        });

        // 1-link, 2-title, 3-epg
        var re = /<div class="channel_main channel" onclick="location.href='([\s\S]*?)'[\s\S]*?<div class="program_title">([\s\S]*?)<\/div>([\s\S]*?)/g;
        var tryToSearch = true, n = 0, start = 0;

        function loader() {
            if (!tryToSearch) return false;
            page.loading = true;
            var html = showtime.httpReq('http://sputniktv.in.ua/online/vse.php', {
                postdata: {
                    count: 20,
                    begin: start
                }
            }).toString();
            var match = re.exec(html);
            while (match) {
                var link = plugin.getDescriptor().id + ':sputniktv:' + escape('http://sputniktv.in.ua/' + match[1]) + ':' + escape(match[2]);
                var item = page.appendItem(link, 'video', {
                    title: match[2]
                });
                addToFavoritesOption(item, link, match[2], '');
                n++;
                match = re.exec(html);
            }
            page.metadata.title = new showtime.RichText('Sputniktv.in.ua (' + n + ')');
            page.loading = false;
            if (html.trim()) {
                start+=20;
                return true;
            }
            return tryToSearch = false;
        }
        loader();
        page.paginator = loader;
        page.loading = false;
    });

    plugin.addURI(plugin.getDescriptor().id + ":yooooStart", function(page) {
        setPageHeader(page, 'Yoooo.tv');
        page.loading = true;
        var id = yoooo.key ? yoooo.key : '';
        plugin.addHTTPAuth('.*yoooo\\.tv', function(req) {
            req.setHeader('Cookie', 'yoooo=' + id);
        });
        plugin.addHTTPAuth('.*yoooo\\.tv.*', function(req) {
            req.setHeader('Cookie', 'yoooo=' + id);
        });

        if (!id) {
            var doc = showtime.httpReq('http://yoooo.tv', {
                headers: {
                    'Cookie': ''
                },
                method: 'HEAD'
            });
            if (!doc.headers['Set-Cookie']) {
                page.error("Sorry, can't get ID :(");
                return;
            }
            id = (doc.headers['Set-Cookie']).match(/yoooo=([\S\s]*?);/)[1];
        }

        page.loading = true;
        json = showtime.JSONDecode(showtime.httpReq('http://yoooo.tv/json/channel_now'));
        var counter = 0;
        for (var i in json) {
            var title = json[i].channel_name;
            var link = "videoparams:" + showtime.JSONEncode({
                title: title,
                sources: [{
                    url: 'hls:http://tv.yoooo.tv/onstream/' + id + '/' + i + '.m3u8'
                }],
                no_subtitle_scan: true
            });
            var icon = 'http://yoooo.tv/images/playlist/' + json[i].img;
            var item = page.appendItem(link, "video", {
                title: new showtime.RichText(title + ' - ' + coloredStr(json[i].name, orange)),
                icon: icon,
                duration: json[i].duration / 60,
                description: new showtime.RichText(coloredStr(json[i].name, orange) + ' ' + json[i].descr)
            });
            addToFavoritesOption(item, link, title, icon);
            counter++;
        };
        page.metadata.title = 'Yoooo.tv (' + counter + ')';
        page.options.createAction('setYooooKey', 'Set/change Yoooo.tv key', function() {
            var result = showtime.textDialog('Enter authorization key:', true, true);
            if (!result.rejected && result.input) {
                yoooo.key = result.input;
                var resp = showtime.httpReq('http://yoooo.tv/status.php?key=' + yoooo.key).toString();
                showtime.notify("The key is set: " + resp.trim(), 2);
                page.flush();
                page.redirect(plugin.getDescriptor().id + ':yooooStart');
            }
        });
        page.loading = false;
    });

    function showPlaylist(page) {
	var list = eval(playlists.list);

        if (!list || !list.toString()) {
            page.appendPassiveItem("directory", '', {
                title: "You can add M3U & XML playlists via the page menu"
            });
        }
        var pos = 0;
	for (var i in list) {
	    var itemmd = showtime.JSONDecode(list[i]);
            if (!itemmd.link.match(/m3u:http/) && !itemmd.link.match(/xml:http/))
                itemmd.link = 'm3u:' + itemmd.link;
	    var item = page.appendItem(itemmd.link + ':' + itemmd.title, "directory", {
       		title: decodeURIComponent(itemmd.title),
		link: decodeURIComponent(itemmd.link)
	    });
	    item.addOptAction("Remove '" + decodeURIComponent(itemmd.title) + "' playlist from the list", pos);
	    item.onEvent(pos, function(item) {
		var list = eval(playlists.list);
		showtime.notify("'" + decodeURIComponent(showtime.JSONDecode(list[item]).title) + "' has been removed from from the list.", 2);
	        list.splice(item, 1);
		playlists.list = showtime.JSONEncode(list);
                page.flush();
                page.redirect(plugin.getDescriptor().id + ':start');
	    });
            pos++;
	}
    }

    var m3uItems = [], groups = [], theLastList = '';

    plugin.addURI('m3uGroup:(.*):(.*)', function(page, pl, groupID) {
        setPageHeader(page, decodeURIComponent(groupID));
        if (theLastList != pl)
            readAndParseM3U(page, pl);

        var num = 0;
        for (var i in m3uItems) {
            if (decodeURIComponent(groupID) != m3uItems[i].group)
                continue;
            addItem(page, m3uItems[i].url, m3uItems[i].title, m3uItems[i].logo);
            num++;
        }
        page.metadata.title = decodeURIComponent(groupID) + ' (' + num + ')';
    });

    function readAndParseM3U(page, pl) {
        var tmp = page.metadata.title + '';
        page.loading = true;
        page.metadata.title = 'Downloading M3U list...';
        var m3u = showtime.httpReq(decodeURIComponent(pl)).toString().split('\n');
        theLastList = pl;
        m3uItems = [], groups = [];
        var m3uUrl = '', m3uTitle = '', m3uImage = '', m3uGroup = '';
        for (var i = 0; i < m3u.length; i++) {
            page.metadata.title = 'Parsing M3U list. Line ' + i + ' of ' + m3u.length;
            if (m3u[i].length < 7) continue; // skip empty lines
            var line = showtime.entityDecode(m3u[i]).trim().replace(/[\u200B-\u200F\u202A-\u202E]/g, '');
            if (line.length < 7) continue; // skip empty lines
            switch(line.substr(0, 7)) {
                case '#EXTINF':
                    var match = line.match(/#EXTINF:.*,(.*)/);
                    if (match)
                        m3uTitle = match[1].trim();
                    match = line.match(/group-title="([\s\S]*?)"/);
                    if (match) {
                        m3uGroup = match[1].trim();
                        if (groups.indexOf(m3uGroup) < 0)
                            groups.push(m3uGroup);
                    }
                    match = line.match(/tvg-logo=["|”]([\s\S]*?)["|”]/);
                    if (match)
                        m3uImage = match[1].trim();
                    break;
                case '#EXTGRP':
                    var match = line.match(/#EXTGRP:(.*)/);
                    if (match) {
                        m3uGroup = match[1].trim();
                        if (groups.indexOf(m3uGroup) < 0)
                            groups.push(m3uGroup);
                    }
                    break;
                case '#EXTIMG':
                    var match = line.match(/#EXTIMG:(.*)/);
                    if (match)
                        m3uImage = match[1].trim();
                    break;
                default:
                    if (line[0] == '#') continue; // skip unknown tags
                    line = line.replace(/rtmp:\/\/\$OPT:rtmp-raw=/, '');
                    m3uItems.push({
                        title: m3uTitle ? m3uTitle : line,
                        url: line,
                        group: m3uGroup,
                        logo: m3uImage
                    });
                    m3uUrl = '', m3uTitle = '', m3uImage = '';//, m3uGroup = '';
            }
        }
        page.metadata.title = new showtime.RichText(tmp);
        page.loading = false;
    }

    function addItem(page, url, title, logo, description) {
        // try to detect item type
        var match = url.match(/([\s\S]*?):(.*)/);
        var type = 'video';
        if (match && match[1].toUpperCase().substr(0, 4) != 'HTTP' &&
            match[1].toUpperCase().substr(0, 4) != 'RTMP') {
            var link = plugin.getDescriptor().id + ':' + match[1] + ":" + escape(match[2]) + ':' + escape(title);
            if (match[1].toUpperCase() == 'M3U') { // the link is m3u list
                var link = 'm3u:' + encodeURIComponent(match[2]) + ":" + escape(title);
                type = 'directory'
            }
            var linkUrl = link;
        } else {
            var link = "videoparams:" + showtime.JSONEncode({
                title: title,
                sources: [{
                    url: url.match(/m3u8/) ? 'hls:' + url : url
                }],
                no_fs_scan: true,
                no_subtitle_scan: true
            });
            var linkUrl = url;
        }
        // get icon from description
        if (!logo && description) {
            logo = description.match(/img src="(\s\S*?)"/)
            if (logo) logo = logo[1];
        }
        if (!linkUrl) {
            var item = page.appendPassiveItem(type, '', {
                title: new showtime.RichText(title),
                icon: logo ? logo : null,
                description: new showtime.RichText(description)
            });
        } else {
            var item = page.appendItem(link, type, {
                title: new showtime.RichText(title),
                icon: logo ? logo : null,
                description: new showtime.RichText((linkUrl ? coloredStr('Link: ', orange) + linkUrl : '') +
                    (description ? '\n' + description : ''))
            });
            addToFavoritesOption(item, link, title, logo);
        }
    }

    plugin.addURI('m3u:(.*):(.*)', function(page, pl, title) {
        setPageHeader(page, unescape(title));
        readAndParseM3U(page, pl);

        var num = 0;
        for (var i in groups) {
            page.appendItem('m3uGroup:' + pl + ':' + encodeURIComponent(groups[i]), "directory", {
	        title: groups[i]
            });
            num++;
        }

        for (var i in m3uItems) {
            if (m3uItems[i].group)
                continue;
            var extension = m3uItems[i].url.split('.').pop().toUpperCase();
            if (extension == 'M3U' || extension == 'PHP' && m3uItems[i].url.toUpperCase().substr(0, 4) != 'RTMP') {
                page.appendItem('m3u:' + encodeURIComponent(m3uItems[i].url) + ':' + encodeURIComponent(m3uItems[i].title), "directory", {
                    title: m3uItems[i].title
                });
                num++;
            } else {
                addItem(page, m3uItems[i].url, m3uItems[i].title, m3uItems[i].logo);
                num++;
            }
        }
        page.metadata.title = new showtime.RichText(unescape(title) + ' (' + num + ')');
    });

    var XML = require('showtime/xml');

    function setColors(s) {
        if (!s) return '';
        return s.toString().replace(/="##/g, '="#').replace(/="lime"/g,
            '="#32CD32"').replace(/="aqua"/g, '="#00FFFF"').replace(/='green'/g,
            '="#00FF00"').replace(/='cyan'/g, '="#00FFFF"').replace(/="LightSalmon"/g,
            '="#ffa07a"').replace(/="PaleGoldenrod"/g, '="#eee8aa"').replace(/="Aquamarine"/g,
            '="#7fffd4"').replace(/="LightSkyBlue"/g, '="#87cefa"').replace(/="palegreen"/g,
            '="#98fb98"').replace(/="yellow"/g, '="#FFFF00"').replace(/font color=""/g, 'font color="#FFFFFF"');
    }

    plugin.addURI(plugin.getDescriptor().id + ':parse:(.*):(.*)', function(page, parser, title) {
        setPageHeader(page, unescape(title));
        page.loading = true;
        var n = 1;
        showtime.print('Parser is: ' + unescape(parser));
        var params = unescape(parser).split('|');
        showtime.print('Requesting: ' + params[0]);
        if (!params[0]) {
            page.error('The link is empty');
            return;
        }
        var html = showtime.httpReq(params[0]).toString();
        var base_url = params[0].match(/^.+?[^\/:](?=[?\/]|$)/);
        if (params.length > 1) {
            var start = html.indexOf(params[1]) + params[1].length;
            var length = html.indexOf(params[2], start) - start;
            var url = html.substr(start, length).split(',');
            showtime.print('Found URL: ' + url);
            //var urlCheck = params[1].replace(/\\\//g, '/') + url + params[2].replace(/\\\//g, '/');
            //if (urlCheck.match(/(http.*)/))
            //    url = urlCheck.match(/(http.*)/)[1];
            if (!url[0].trim()) {
                url = html.match(/pl:"([\s\S]*?)"/)[1];
                showtime.print('Fetching URL from pl: ' + url);
                var json = showtime.JSONDecode(showtime.httpReq(url));
            } else if (url[0].trim().substr(0, 4) != 'http') {
                if (url[0][0] == '/') {
                    page.appendItem(base_url + url[0], 'video', {
                        title: new showtime.RichText(unescape(title))
                    });
                } else {
                    url = url[0].match(/value="([\s\S]*?)"/);
                    if (url) {
                        url = url[1];
                        showtime.print('Fetching URL from value: ' + url);
                        var json = showtime.JSONDecode(showtime.httpReq(url));
                        showtime.print(showtime.JSONEncode(json));
                        for (var i in json.playlist) {
                            if (json.playlist[i].file) {
                                page.appendItem(json.playlist[i].file.split(' ')[0], 'video', {
                                    title: new showtime.RichText(json.playlist[i].comment)
                                });
                            }
                            for (var j in json.playlist[i].playlist) {
                                showtime.print(json.playlist[i].playlist[j].comment);
                                page.appendItem(json.playlist[i].playlist[j].file.split(' ')[0], 'video', {
                                    title: new showtime.RichText(json.playlist[i].comment + ' - ' + json.playlist[i].playlist[j].comment)
                                });
                            }
                        }
                    } else {
                        showtime.print('Fetching URL from file":": ' + url);
                        var file = html.match(/file":"([\s\S]*?)"/);
                        if (file) {
                            page.appendItem(file[1].replace(/\\\//g, '/'), 'video', {
                                title: new showtime.RichText(unescape(title))
                            });
                        } else {
                            showtime.print('Fetching URL from pl":": ' + url);
                            var pl = html.match(/pl":"([\s\S]*?)"/)[1].replace(/\\\//g, '/');
                            var json = showtime.JSONDecode(showtime.httpReq(pl).toString().trim());
                            for (var i in json.playlist) {
                                if (json.playlist[i].file) {
                                    page.appendItem(json.playlist[i].file.split(' ')[0], 'video', {
                                        title: new showtime.RichText(json.playlist[i].comment)
                                    });
                                }
                                for (var j in json.playlist[i].playlist) {
                                    showtime.print(json.playlist[i].playlist[j].comment);
                                    page.appendItem(json.playlist[i].playlist[j].file.split(' ')[0], 'video', {
                                        title: new showtime.RichText(json.playlist[i].comment + ' - ' + json.playlist[i].playlist[j].comment)
                                    });
                                }
                            }
                        }
                    }
                }
            } else {
                for (i in url) {
                    page.appendItem(url[i], 'video', {
                        title: new showtime.RichText(unescape(title) + ' #' + n)
                    });
                    n++;
                }
            }
        } else {
            html = html.split('\n');
            for (var i = 0; i < html.length; i++) {
                if (!html[i].trim()) continue;
                page.appendItem(html[i].trim(), 'video', {
                    title: new showtime.RichText(unescape(title) + ' #' + n)
                });
                n++;
            }
        }
        page.loading = false;
    });

    plugin.addURI('xml:(.*):(.*)', function(page, pl, pageTitle) {
        showtime.print('Main list: ' + decodeURIComponent(pl).trim());
        setPageHeader(page, unescape(pageTitle));
        page.loading = true;
        try {
            var doc = XML.parse(showtime.httpReq(decodeURIComponent(pl)));
        } catch(err) {
            page.error(err);
            return;
        }
        if (!doc.items) {
            page.error('Cannot get proper xml file');
            return;
        }

        var channels = doc.items.filterNodes('channel');
        var num = 0;
        for (var i = 0; i < channels.length; i++) {
            if (channels[i].category_id && channels[i].category_id != 1) continue;
            var title = showtime.entityDecode(channels[i].title);
            title = setColors(title);
            //showtime.print(title);
            var playlist = channels[i].playlist_url;
            var description = channels[i].description ? channels[i].description : null;
            description = setColors(description);
            if (playlist && playlist != 'null' && !channels[i].parser) {
                var extension = playlist.split('.').pop().toLowerCase();
                if (extension != 'm3u')
                    extension = 'xml';
                var url = extension + ':' + encodeURIComponent(playlist) + ':' + escape(title);
                var icon = null;
                if (description) {
                   icon = description.match(/src="([\s\S]*?)"/)
                   if (icon) icon = showtime.entityDecode(icon[1]);
                }
                var description = description.replace(/<img[\s\S]*?src=[\s\S]*?(>|$)/, '').replace(/\t/g, '').replace(/\n/g, '').trim();
                page.appendItem(url, 'video', {
                    title: new showtime.RichText(title),
                    icon: icon,
                    description: new showtime.RichText((playlist ? coloredStr('Link: ', orange) + playlist + '\n' : '') + description)
                });
            } else {
                if (channels[i].parser)
                    page.appendItem(plugin.getDescriptor().id + ':parse:' + escape(channels[i].parser) + ':' + escape(title), 'directory', {
                        title: new showtime.RichText(title)
                    });
                else {
                    var url = channels[i].stream_url ? channels[i].stream_url : '';
                    var match = url.match(/http:\/\/www.youtube.com\/watch\?v=(.*)/);
                    if (match) {
                        url = 'youtube:video:' + match[1];
                        page.appendItem(url, 'video', {
                            title: title,
                            icon: logo,
                            description: new showtime.RichText(coloredStr('Link: ', orange) + url)
                        });
                    } else
                        addItem(page, url, title, '', description);
                }
            }
            num++;
        }
        page.metadata.title = new showtime.RichText(unescape(pageTitle) + ' (' + num + ')');
        page.loading = false;
    });

    plugin.addURI(plugin.getDescriptor().id + ":streamlive:(.*):(.*)", function(page, url, title) {
        page.loading = true;
        var doc = showtime.httpReq(unescape(url)).toString();

        var match = doc.match(/Question: \((\d+) (\-|\+) (\d+)\) x (\d+) =/);
        if (match) {
            if (match[2] == '+')
                var captcha = (+match[1] + (+match[3])) * (+match[4]);
            else
                var captcha = (+match[1] - (+match[3])) * (+match[4]);

            showtime.print('Sending captcha: ' + captcha);
            doc = showtime.httpReq(unescape(url), {
                postdata: {
                    captcha: captcha
                }
            })
            doc = showtime.httpReq(unescape(url)).toString();
        } else {
            match = doc.match(/in the box: ([\s\S]*?)<br/);
            if (match) {
                showtime.print('Sending captcha: ' + captcha);
                doc = showtime.httpReq(unescape(url), {
                    postdata: {
                        captcha: match[1]
                    }
                })
                doc = showtime.httpReq(unescape(url)).toString();
            }
        }

        var token = doc.match(/getJSON\("([\s\S]*?)"/);
        if (!token) {
            showtime.print(doc);
            page.error('Cannot pass captcha. Return back and retry :(');
            return;
        }

        token = showtime.JSONDecode(showtime.httpReq(token[1])).token;
        var streamer = doc.match(/streamer: "([\s\S]*?)"/)[1].replace(/\\/g, '');
        var param = ' app=' + doc.match(/streamer: "[\s\S]*?(edge[\s\S]*?)"/)[1].replace(/\\/g, '');
        param += ' playpath=' + doc.match(/file: "([\s\S]*?)\./)[1];
        param += ' swfUrl=http://www.streamlive.to/ads/streamlive.swf';
        param += ' tcUrl=' + streamer;
        param += ' pageUrl=' + url;
        param += ' token=' + token;
        page.type = 'video';
        page.source = "videoparams:" + showtime.JSONEncode({
            title: unescape(title),
            canonicalUrl: plugin.getDescriptor().id + ':streamlive:' + url + ':' + title,
            sources: [{
                url: streamer + param
            }],
            no_subtitle_scan: true
        });
        page.loading = false;
    });

    plugin.addURI(plugin.getDescriptor().id + ":streamliveStart", function(page) {
        setPageHeader(page, 'StreamLive.to');
        page.loading = true;

        plugin.addHTTPAuth('.*streamlive\\.to', function(req) {
            req.setHeader('User-Agent', 'Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2228.0 Safari/537.36');
            req.setHeader('Host', 'www.streamlive.to');
            req.setHeader('Origin', 'http://www.streamlive.to');
            req.setHeader('Referer', url);
        });

        plugin.addHTTPAuth('.*streamlive\\.to.*', function(req) {
            req.setHeader('User-Agent', 'Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2228.0 Safari/537.36');
            req.setHeader('Host', 'www.streamlive.to');
            req.setHeader('Origin', 'http://www.streamlive.to');
            req.setHeader('Referer', url);
        });

        var url = 'http://www.streamlive.to/channels';
        var doc = showtime.httpReq(url).toString();

        n = 1, tryToSearch = true;
        var totalCount = 0;

        function loader() {
            if (!tryToSearch) return false;
            // 1-logo, 2-title, 3-flags, 4-link, 5-description, 6-viewers, 7-category, 8-totalviews, 9-language
            var re = /class="clist-thumb">[\s\S]*?src="([\s\S]*?)"[\s\S]*?alt="([\s\S]*?)"([\s\S]*?)<a href="([\s\S]*?)"[\s\S]*?<strong>([\s\S]*?)<\/strong>[\s\S]*?<span class="viewers">([\s\S]*?)<\/span>[\s\S]*?<span class="totalviews">([\s\S]*?)<\/span>[\s\S]*?">([\s\S]*?)<\/a>[\s\S]*?">([\s\S]*?)<\/a>/g;
            match = re.exec(doc);
            var itemsCount = 0;
            while (match) {
                if (match[3].match(/premium_only/)) {
                    match = re.exec(doc);
                    continue;
                }
                var link = plugin.getDescriptor().id + ':streamlive:' + escape(match[4]) + ':' + escape(match[2]);
                var item = page.appendItem(link, "video", {
                    title: match[2],
                    icon: match[1],
                    description: new showtime.RichText(coloredStr('Description: ', orange) + match[5].replace(/\s{2,}/g, ' ').replace(/\n/g, '') +
                        coloredStr('\nViewers: ', orange) + match[6] +
                        coloredStr('\nTotal views: ', orange) + match[7] +
                        coloredStr('\nCategory: ', orange) + match[8] +
                        coloredStr('\nLanguage: ', orange) + match[9])
                });
                addToFavoritesOption(item, link, match[2], match[1]);
                match = re.exec(doc);
                itemsCount++;
            };
            if (!itemsCount) return tryToSearch = false;
            totalCount += itemsCount;
            page.metadata.title = 'StreamLive.to (' + totalCount + ')';
            n++;
            doc = showtime.httpReq(url + '/?p=' + n);
            return true;
        }
        loader();
        page.paginator = loader;
        page.loading = false;
    });

    function addActionToTheItem(page, menuText, id, type) {
        page.options.createAction('addPlaylist' + type, menuText, function() {
            var result = showtime.textDialog('Enter the URL to the playlist like:\n' +
                'http://bit.ly/' + id + ' or just bit.ly/' + id + ' or ' + id, true, true);
            if (!result.rejected && result.input) {
                var link = result.input;
                if (!link.match(/\./))
                    link = 'http://bit.ly/' + link;
                if (!link.match(/:\/\//))
                    link = 'http://' + link;
                var result = showtime.textDialog('Enter the name of the playlist:', true, true);
                if (!result.rejected && result.input) {
                    var entry = showtime.JSONEncode({
                        title: encodeURIComponent(result.input),
                        link: type.toLowerCase() + ':' + encodeURIComponent(link)
                    });
                    playlists.list = showtime.JSONEncode([entry].concat(eval(playlists.list)));
                    showtime.notify("Playlist '" + result.input + "' has been added to the list.", 2);
                    page.flush();
                    page.redirect(plugin.getDescriptor().id + ':start');
                }
            }
        });
    }

    // Start page
    plugin.addURI(plugin.getDescriptor().id + ":start", function(page) {
        setPageHeader(page, plugin.getDescriptor().title);
	page.appendItem(plugin.getDescriptor().id + ":favorites", "directory", {
	    title: "My Favorites"
	});

        page.appendItem("", "separator", {
            title: 'M3U & XML playlists'
        });

        addActionToTheItem(page, 'Add M3U playlist', '1Hbuve6', 'M3U');
        addActionToTheItem(page, 'Add XML playlist', '1zVA91a', 'XML');

        if (!service.disableSampleList) {
            var item = page.appendItem('m3u:http%3A%2F%2Fbit.ly%2F1Hbuve6:Sample M3U list', "directory", {
                title: 'Sample M3U list'
            });
        }

        if (!service.disableSampleXMLList) {
            var item = page.appendItem('xml:http%3A%2F%2Fbit.ly%2F1zVA91a:Sample XML list', "directory", {
                title: 'Sample XML list'
            });
        }

        showPlaylist(page);

        page.appendItem("", "separator", {
            title: 'Providers'
        });
	page.appendItem(plugin.getDescriptor().id + ":divanStart", "directory", {
	    title: "Divan.tv"
	});
	page.appendItem(plugin.getDescriptor().id + ":tivixStart", "directory", {
	    title: "Tivix.net"
	});
	page.appendItem(plugin.getDescriptor().id + ":sputnikStart", "directory", {
	    title: "Sputniktv.in.ua"
	});
	page.appendItem(plugin.getDescriptor().id + ":yooooStart", "directory", {
	    title: "Yoooo.tv"
	});
	page.appendItem(plugin.getDescriptor().id + ":streamliveStart", "directory", {
	    title: "StreamLive.to"
	});
    });
})(this);