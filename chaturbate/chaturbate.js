/*
 *  Chaturbate plugin for Movian Media Center
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
    var BASE_URL = 'https://chaturbate.com';
    var logo = plugin.path + "logo.png";

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

    plugin.createService(plugin.getDescriptor().title, plugin.getDescriptor().id + ":start", "tv", true, logo);

    var settings = plugin.createSettings(plugin.getDescriptor().title, logo, plugin.getDescriptor().title);

    plugin.addURI(plugin.getDescriptor().id + ":play:(.*):(.*)", function(page, url, title) {
        page.loading = true;
        var html = showtime.httpReq(BASE_URL + url).toString();
        var link = html.match(/"src='([\s\S]*?)'/);
        if (!link) {
            page.error('Camera is offline');
            return;
        }
        page.type = 'video';
        page.source = "videoparams:" + showtime.JSONEncode({
            title: unescape(title),
            sources: [{
                url: 'hls:' + link[1]
            }],
            no_subtitle_scan: true
        });
        page.loading = false;
    });

    plugin.addURI(plugin.getDescriptor().id + ":index:(.*):(.*)", function(page, url, title) {
        setPageHeader(page, unescape(title));
        var url = BASE_URL + url;

        tryToSearch = true;
        // 1-link, 2-icon, 3-label, 4-nick, 5-type/gender, 6-age, 7-description, 8-location, 9-stats
        var re = /<li>[\s\S]*?<a href="([\s\S]*?)"[\s\S]*?<img src="([\s\S]*?)"[\s\S]*?<div class="thumbnail_label[\s\S]*?thumbnail_label[\s\S]*?">([\s\S]*?)<\/div>[\s\S]*?\/"> ([\s\S]*?)<\/a>[\s\S]*?<span class="age gender([\s\S]*?)">([\s\S]*?)<\/span>[\s\S]*?<li title="([\s\S]*?)">[\s\S]*?<li class="location"[\s\S]*?">([\s\S]*?)<\/li>[\s\S]*?<li class="cams">([\s\S]*?)<\/li>/g;
        var doc;
        function scrapeItems(blob) {
            var match = re.exec(blob);
            while (match) {
                var gender = match[5];
                if (match[5] == 'c') gender = 'couple';
                if (match[5] == 'f') gender = 'female';
                if (match[5] == 'm') gender = 'male';
                if (match[5] == 's') gender = 'shemale';
                page.appendItem(plugin.getDescriptor().id + ":play:" + match[1] + ':' + escape(match[4]), "video", {
                    title: new showtime.RichText(match[3].trim() + ' ' + coloredStr(match[4], orange) + ' (' + gender + ' ' + match[6] + ') ' + coloredStr(match[8], orange)),
                    icon: match[2],
                    description: new showtime.RichText(coloredStr('Status: ', orange) + match[9] +
                        coloredStr('\nLocation: ', orange) + match[8] +
                        (match[7] ? coloredStr('\nDescription: ', orange) + match[7] : null))
                });
                match = re.exec(blob);
            }
        }

        function loader() {
            if (!tryToSearch) return false;
            page.loading = true;
            doc = showtime.httpReq(url).toString();
            page.loading = false;
            var blob = doc.match(/<ul class="list">([\s\S]*?)<div class="featured_blog_posts">/);
            if (blob) {
                scrapeItems(blob[1]);
            } else {
                // 1-title, 2-blob, 3-end of blob
                var re2 = /class="callout">([\s\S]*?)<\/h([\s\S]*?)<h2>/g;
                var match2 = re2.exec(doc);
                while (match2) {
                    page.appendItem("", "separator", {
                        title: match2[1]
                    });
                    scrapeItems(match2[2]);
                    match2 = re2.exec(doc);
                }
            }
            var next = doc.match(/<link rel="next" href="([\s\S]*?)">/);
            if (!next) return tryToSearch = false;
            url = BASE_URL + next[1];
            return true;
        }
        loader();
        page.paginator = loader;
        page.loading = false;
    });

    // Start page
    plugin.addURI(plugin.getDescriptor().id + ":start", function(page) {
        setPageHeader(page, plugin.getDescriptor().title);
        page.loading = true;
        plugin.addHTTPAuth('.*chaturbate\\.com', function(req) {
            req.setHeader('User-Agent', 'Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2228.0 Safari/537.36');
            //req.setHeader('Host', 'chaturbate.com');
            //req.setHeader('Origin', 'https://chaturbate.com');
            //req.setHeader('Referer', 'https://chaturbate.com');
        });

        plugin.addHTTPAuth('.*chaturbate\\.com.*', function(req) {
            req.setHeader('User-Agent', 'Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2228.0 Safari/537.36');
            //req.setHeader('Host', 'chaturbate.com');
            //req.setHeader('Origin', 'https://chaturbate.com');
            //req.setHeader('Referer', 'https://chaturbate.com');
        });

        var doc = showtime.httpReq('https://chaturbate.com').toString();
        // 1-section title, 2-block of links
        var re = /<div class="col[\s\S]*?<h2>([\s\S]*?)<\/h2>([\s\S]*?)<\/dl>/g;
        // 1-link, title
        var re2 = /<a href="([\s\S]*?)"[\s\S]*?>([\s\S]*?)<\/a>/g;
        var match = re.exec(doc);
        while (match) {
            page.appendItem("", "separator", {
                title: match[1]
            });
            var match2 = re2.exec(match[2]);
            while (match2) {
                page.appendItem(plugin.getDescriptor().id + ":index:" + match2[1] + ':' + escape(match2[2]), "directory", {
	            title: match2[2]
	        });
                match2 = re2.exec(match[2]);
            }
            match = re.exec(doc);
        }
        page.loading = false;
    });
})(this);