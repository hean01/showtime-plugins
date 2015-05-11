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
    var slogan = "Online TV";

    function setPageHeader(page, title) {
	page.type = "directory";
	page.contents = "items";
	page.metadata.logo = logo;
	page.metadata.title = title;
    }

    var blue = '6699CC', orange = 'FFA500', red = 'EE0000', green = '008B45';

    function colorStr(str, color) {
        return '<font color="' + color + '"> (' + str + ')</font>';
    }

    function coloredStr(str, color) {
        return '<font color="' + color + '">' + str + '</font>';
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
        store.list = "[]";
    }

    var playlists = plugin.createStore('playlists', true)
    if (!playlists.list) {
        playlists.list = "[]";
    }

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
        page.loading = false;
        var match = resp.match(/file=([\S\s]*?)"/);
        if (!match)
           match = resp.match(/value="src=([\S\s]*?)&/)
        if (match) {
            page.type = "video";
            page.source = "videoparams:" + showtime.JSONEncode({
                title: unescape(title),
                canonicalUrl: plugin.getDescriptor().id + ':sputniktv:' + url + ':' + title,
                sources: [{
                    url: 'hls:' + match[1]
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
		icon: decodeURIComponent(itemmd.icon)
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
        var tryToSearch = true, fromPage = 1;

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
                var title = match[1];
                var icon = 'http://tivix.net' + match[3];
                var item = page.appendItem(link, "video", {
                    title: title,
                    icon: icon
                });
                addToFavoritesOption(item, link, title, icon);
                match = re.exec(doc);
            }
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

        page.metadata.title += ' (' + n + ')';
        page.loading = false;
    });

    plugin.addURI(plugin.getDescriptor().id + ":yooooStart", function(page) {
        setPageHeader(page, 'Yoooo.tv');
        page.loading = true;
        try {
            var doc = showtime.httpReq('http://yoooo.tv', {
                headers: {
                    Cookie: ''
                },
                method: 'HEAD'
            });
        } catch(err) {
            page.error(err);
            return;
        }
        page.loading = false;

        if (!doc.headers['Set-Cookie']) {
            page.error("Sorry, can't get ID :(");
            return;
        }

        var id = (doc.headers['Set-Cookie']).match(/yoooo=([\S\s]*?);/)[1];
        page.loading = true;
        var doc = showtime.httpReq('http://yoooo.tv/json/channel_now');
        page.loading = false;
        json = showtime.JSONDecode(doc);
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
        page.metadata.title = page.metadata.title + ' (' + counter + ')'
    });

    function showPlaylist(page) {
	var list = eval(playlists.list);

        if (!list || !list.toString()) {
            page.appendPassiveItem("directory", '', {
                title: "You can add M3U playlists via the page menu"
            });
        }
        var pos = 0;
	for (var i in list) {
	    var itemmd = showtime.JSONDecode(list[i]);
	    var item = page.appendItem('m3u:' + itemmd.link + ':' + itemmd.title, "directory", {
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

    var m3uItems = [];
    var groups = [];
    var theLastList = '';

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
        page.metadata.title += ' (' + num + ')';
    });

    var clean = /[\x00-\x09\x0B-\x1F\x7F-\x9F\xAD\u0378\u0379\u037F-\u0383\u038B\u038D\u03A2\u0528-\u0530\u0557\u0558\u0560\u0588\u058B-\u058E\u0590\u05C8-\u05CF\u05EB-\u05EF\u05F5-\u0605\u061C\u061D\u06DD\u070E\u070F\u074B\u074C\u07B2-\u07BF\u07FB-\u07FF\u082E\u082F\u083F\u085C\u085D\u085F-\u089F\u08A1\u08AD-\u08E3\u08FF\u0978\u0980\u0984\u098D\u098E\u0991\u0992\u09A9\u09B1\u09B3-\u09B5\u09BA\u09BB\u09C5\u09C6\u09C9\u09CA\u09CF-\u09D6\u09D8-\u09DB\u09DE\u09E4\u09E5\u09FC-\u0A00\u0A04\u0A0B-\u0A0E\u0A11\u0A12\u0A29\u0A31\u0A34\u0A37\u0A3A\u0A3B\u0A3D\u0A43-\u0A46\u0A49\u0A4A\u0A4E-\u0A50\u0A52-\u0A58\u0A5D\u0A5F-\u0A65\u0A76-\u0A80\u0A84\u0A8E\u0A92\u0AA9\u0AB1\u0AB4\u0ABA\u0ABB\u0AC6\u0ACA\u0ACE\u0ACF\u0AD1-\u0ADF\u0AE4\u0AE5\u0AF2-\u0B00\u0B04\u0B0D\u0B0E\u0B11\u0B12\u0B29\u0B31\u0B34\u0B3A\u0B3B\u0B45\u0B46\u0B49\u0B4A\u0B4E-\u0B55\u0B58-\u0B5B\u0B5E\u0B64\u0B65\u0B78-\u0B81\u0B84\u0B8B-\u0B8D\u0B91\u0B96-\u0B98\u0B9B\u0B9D\u0BA0-\u0BA2\u0BA5-\u0BA7\u0BAB-\u0BAD\u0BBA-\u0BBD\u0BC3-\u0BC5\u0BC9\u0BCE\u0BCF\u0BD1-\u0BD6\u0BD8-\u0BE5\u0BFB-\u0C00\u0C04\u0C0D\u0C11\u0C29\u0C34\u0C3A-\u0C3C\u0C45\u0C49\u0C4E-\u0C54\u0C57\u0C5A-\u0C5F\u0C64\u0C65\u0C70-\u0C77\u0C80\u0C81\u0C84\u0C8D\u0C91\u0CA9\u0CB4\u0CBA\u0CBB\u0CC5\u0CC9\u0CCE-\u0CD4\u0CD7-\u0CDD\u0CDF\u0CE4\u0CE5\u0CF0\u0CF3-\u0D01\u0D04\u0D0D\u0D11\u0D3B\u0D3C\u0D45\u0D49\u0D4F-\u0D56\u0D58-\u0D5F\u0D64\u0D65\u0D76-\u0D78\u0D80\u0D81\u0D84\u0D97-\u0D99\u0DB2\u0DBC\u0DBE\u0DBF\u0DC7-\u0DC9\u0DCB-\u0DCE\u0DD5\u0DD7\u0DE0-\u0DF1\u0DF5-\u0E00\u0E3B-\u0E3E\u0E5C-\u0E80\u0E83\u0E85\u0E86\u0E89\u0E8B\u0E8C\u0E8E-\u0E93\u0E98\u0EA0\u0EA4\u0EA6\u0EA8\u0EA9\u0EAC\u0EBA\u0EBE\u0EBF\u0EC5\u0EC7\u0ECE\u0ECF\u0EDA\u0EDB\u0EE0-\u0EFF\u0F48\u0F6D-\u0F70\u0F98\u0FBD\u0FCD\u0FDB-\u0FFF\u10C6\u10C8-\u10CC\u10CE\u10CF\u1249\u124E\u124F\u1257\u1259\u125E\u125F\u1289\u128E\u128F\u12B1\u12B6\u12B7\u12BF\u12C1\u12C6\u12C7\u12D7\u1311\u1316\u1317\u135B\u135C\u137D-\u137F\u139A-\u139F\u13F5-\u13FF\u169D-\u169F\u16F1-\u16FF\u170D\u1715-\u171F\u1737-\u173F\u1754-\u175F\u176D\u1771\u1774-\u177F\u17DE\u17DF\u17EA-\u17EF\u17FA-\u17FF\u180F\u181A-\u181F\u1878-\u187F\u18AB-\u18AF\u18F6-\u18FF\u191D-\u191F\u192C-\u192F\u193C-\u193F\u1941-\u1943\u196E\u196F\u1975-\u197F\u19AC-\u19AF\u19CA-\u19CF\u19DB-\u19DD\u1A1C\u1A1D\u1A5F\u1A7D\u1A7E\u1A8A-\u1A8F\u1A9A-\u1A9F\u1AAE-\u1AFF\u1B4C-\u1B4F\u1B7D-\u1B7F\u1BF4-\u1BFB\u1C38-\u1C3A\u1C4A-\u1C4C\u1C80-\u1CBF\u1CC8-\u1CCF\u1CF7-\u1CFF\u1DE7-\u1DFB\u1F16\u1F17\u1F1E\u1F1F\u1F46\u1F47\u1F4E\u1F4F\u1F58\u1F5A\u1F5C\u1F5E\u1F7E\u1F7F\u1FB5\u1FC5\u1FD4\u1FD5\u1FDC\u1FF0\u1FF1\u1FF5\u1FFF\u200B-\u200F\u202A-\u202E\u2060-\u206F\u2072\u2073\u208F\u209D-\u209F\u20BB-\u20CF\u20F1-\u20FF\u218A-\u218F\u23F4-\u23FF\u2427-\u243F\u244B-\u245F\u2700\u2B4D-\u2B4F\u2B5A-\u2BFF\u2C2F\u2C5F\u2CF4-\u2CF8\u2D26\u2D28-\u2D2C\u2D2E\u2D2F\u2D68-\u2D6E\u2D71-\u2D7E\u2D97-\u2D9F\u2DA7\u2DAF\u2DB7\u2DBF\u2DC7\u2DCF\u2DD7\u2DDF\u2E3C-\u2E7F\u2E9A\u2EF4-\u2EFF\u2FD6-\u2FEF\u2FFC-\u2FFF\u3040\u3097\u3098\u3100-\u3104\u312E-\u3130\u318F\u31BB-\u31BF\u31E4-\u31EF\u321F\u32FF\u4DB6-\u4DBF\u9FCD-\u9FFF\uA48D-\uA48F\uA4C7-\uA4CF\uA62C-\uA63F\uA698-\uA69E\uA6F8-\uA6FF\uA78F\uA794-\uA79F\uA7AB-\uA7F7\uA82C-\uA82F\uA83A-\uA83F\uA878-\uA87F\uA8C5-\uA8CD\uA8DA-\uA8DF\uA8FC-\uA8FF\uA954-\uA95E\uA97D-\uA97F\uA9CE\uA9DA-\uA9DD\uA9E0-\uA9FF\uAA37-\uAA3F\uAA4E\uAA4F\uAA5A\uAA5B\uAA7C-\uAA7F\uAAC3-\uAADA\uAAF7-\uAB00\uAB07\uAB08\uAB0F\uAB10\uAB17-\uAB1F\uAB27\uAB2F-\uABBF\uABEE\uABEF\uABFA-\uABFF\uD7A4-\uD7AF\uD7C7-\uD7CA\uD7FC-\uF8FF\uFA6E\uFA6F\uFADA-\uFAFF\uFB07-\uFB12\uFB18-\uFB1C\uFB37\uFB3D\uFB3F\uFB42\uFB45\uFBC2-\uFBD2\uFD40-\uFD4F\uFD90\uFD91\uFDC8-\uFDEF\uFDFE\uFDFF\uFE1A-\uFE1F\uFE27-\uFE2F\uFE53\uFE67\uFE6C-\uFE6F\uFE75\uFEFD-\uFF00\uFFBF-\uFFC1\uFFC8\uFFC9\uFFD0\uFFD1\uFFD8\uFFD9\uFFDD-\uFFDF\uFFE7\uFFEF-\uFFFB\uFFFE\uFFFF]/g;

    function readAndParseM3U(page, pl) {
        page.loading = true;
        var m3u = showtime.entityDecode(showtime.httpReq(decodeURIComponent(pl)).toString().replace(clean, '').replace(/rtmp:\/\/\$OPT:rtmp-raw=/g, '')).split('\n');
        theLastList = pl;
        m3uItems = [], groups = [];
        var m3uUrl = '', m3uTitle = '', m3uImage = '', m3uGroup = '';

        for (var i = 0; i < m3u.length; i++) {
            var line = m3u[i].trim();
            if (line.length < 7) continue; // skip empty lines
            switch(line.substr(0, 7)) {
                case '#EXTINF':
                    var match = line.match(/#EXTINF:.*,(.*)/);
                    if (match)
                        m3uTitle = match[1].trim();
                    match = line.match(/group-title="([\s\S]*?)"/);
                    if (match) {
                        m3uGroup = match[1];
                        if (groups.indexOf(m3uGroup) < 0)
                            groups.push(m3uGroup);
                    }
                    break;
                case '#EXTGRP':
                    var match = line.match(/#EXTGRP:(.*)/);
                    if (match) {
                        m3uGroup = match[1];
                        if (groups.indexOf(m3uGroup) < 0)
                            groups.push(m3uGroup);
                    }
                    break;
                case '#EXTIMG':
                    var match = line.match(/#EXTIMG:(.*)/);
                    if (match)
                        m3uImage = match[1];
                    break;
                default:
                    if (line[0] == '#') continue; // skip unknown tags
                    m3uItems.push({
                        title: m3uTitle ? m3uTitle : line,
                        url: line,
                        group: m3uGroup,
                        logo: m3uImage
                    });
                    m3uUrl = '', m3uTitle = '', m3uImage = '', m3uGroup = '';
            }
        }
        page.loading = false;
    }

    function addItem(page, url, title, logo) {
        var match = url.match(/([\s\S]*?):(.*)/);
        var type = 'video';
        if (match && match[1].toUpperCase().substr(0, 4) != 'HTTP' &&
            match[1].toUpperCase().substr(0, 4) != 'RTMP') {
            var link = plugin.getDescriptor().id + ':' + match[1] + ":" + escape(match[2]) + ':' + escape(title);
            if (match[1].toUpperCase() == 'M3U') {// the link is m3u list
                var link = 'm3u:' + encodeURIComponent(match[2]) + ":" + escape(title);
                type = 'directory'
            }
        } else {
            var link = "videoparams:" + showtime.JSONEncode({
                title: title,
                sources: [{
                    url: url.match(/m3u8/) ? 'hls:' + url : url
                }],
                no_fs_scan: true,
                no_subtitle_scan: true
            });
        }
        var item = page.appendItem(link, type, {
            title: title,
            icon: logo
        });
        addToFavoritesOption(item, link, title, logo);
    }

    plugin.addURI('m3u:(.*):(.*)', function(page, pl, title) {
        setPageHeader(page, decodeURIComponent(title));
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
            if (extension == 'M3U' || extension == 'PHP') {
                page.appendItem('m3u:' + encodeURIComponent(m3uItems[i].url) + ':' + encodeURIComponent(m3uItems[i].title), "directory", {
                    title: m3uItems[i].title
                });
                num++;
            } else {
                addItem(page, m3uItems[i].url, m3uItems[i].title, m3uItems[i].logo);
                num++;
            }
        }
        page.metadata.title += ' (' + num + ')';
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

    // Start page
    plugin.addURI(plugin.getDescriptor().id + ":start", function(page) {
        setPageHeader(page, slogan);
	page.appendItem(plugin.getDescriptor().id + ":favorites", "directory", {
	    title: "My Favorites"
	});

        page.appendItem("", "separator", {
            title: 'M3U playlists'
        });
        page.options.createAction('addPlaylist', 'Add M3U playlist', function() {
            var result = showtime.textDialog('Enter the URL to the playlist like:\n' +
                'http://bit.ly/1Hbuve6 or just bit.ly/1Hbuve6 or 1Hbuve6', true, true);
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
                        link: encodeURIComponent(link)
                    });
                    playlists.list = showtime.JSONEncode([entry].concat(eval(playlists.list)));
                    showtime.notify("Playlist '" + result.input + "' has been added to the list.", 2);
                    page.flush();
                    page.redirect(plugin.getDescriptor().id + ':start');
                }
            }
        });
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
	page.appendItem(plugin.getDescriptor().id + ":yooooStart", "directory", {
	    title: "Yoooo.tv"
	});
	page.appendItem(plugin.getDescriptor().id + ":streamliveStart", "directory", {
	    title: "StreamLive.to"
	});
    });
})(this);