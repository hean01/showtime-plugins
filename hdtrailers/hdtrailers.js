/*
 *  HD-Trailers.net plugin for Showtime Media Center
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
    var BASE_URL = 'http://www.hd-trailers.net';
    var logo = plugin.path + "logo.png";

    function setPageHeader(page, title) {
	page.type = "directory";
	page.contents = "items";
	page.metadata.logo = logo;
	page.metadata.title = title;
	page.loading = false;
    }

    var blue = '6699CC',
        orange = 'FFA500',
        red = 'EE0000',
        green = '008B45';

    function coloredStr(str, color) {
        return '<font color="' + color + '">' + str + '</font>';
    }

    function colorStr(str, color) {
        return coloredStr(' (' + str + ')', color);
    }

    function trim(s) {
        if (!s) return '';
        return s.replace(/^\s+|\s+$/g, '');
    };

    var service = plugin.createService(plugin.getDescriptor().title, plugin.getDescriptor().id + ":start", "video", true, logo);

    plugin.addURI(plugin.getDescriptor().id + ":yahoo:(.*):(.*)", function(page, id, height) {
        page.loading = true;
        var doc = showtime.httpReq('http://video.media.yql.yahoo.com/v1/video/sapi/streams/' + id);
        doc = showtime.JSONDecode(doc);
        page.type = 'video';
        page.loading = false;
        var link = null;
        for (var i in doc.query.results.mediaObj[0].streams) {
            if (doc.query.results.mediaObj[0].streams[i].height == height) {
                link = doc.query.results.mediaObj[0].streams[i].host + doc.query.results.mediaObj[0].streams[i].path;
                break;
            }
        }
        if (!link) {
            page.error("Sorry, can't get the link :(");
            return;
        }
        page.source = "videoparams:" + showtime.JSONEncode({
                        title: showtime.entityDecode(doc.query.results.mediaObj[0].meta.title),
                        canonicalUrl: plugin.getDescriptor().id + ':yahoo:' + id + ':' + height,
                        no_fs_scan: true,
                        sources: [{
                            url: link
                        }]
                    });
    });

    function getTimestamp(str) {
        if (!str) return 0;
        var d = str.match(/\d+/g); // extract date parts
        return +Date.UTC(d[0], d[1] - 1, d[2]) / 1000; // year, month, day
    }

    plugin.addURI(plugin.getDescriptor().id + ":index:(.*):(.*)", function(page, url, title) {
        setPageHeader(page, showtime.entityDecode(decodeURIComponent(title)));
        page.loading = true;
        var doc = showtime.httpReq(BASE_URL + decodeURIComponent(url)).toString();
        page.loading = false;
        var icon = doc.match(/<span class="topTableImage"><img src="([\s\S]*?)"/)[1];
        var description = doc.match(/<span itemprop="description">([\s\S]*?)<\/span>/)[1];
        var table = doc.match(/<table class="bottomTable">([\s\S]*?)<\/table>/)[1];
        var re = /itemprop="trailer"([\s\S]*?)<\/tr>/g;
        var match = re.exec(table);
        var re2 = /<td class="bottomTableResolution"><a href="([\s\S]*?)"[\s\S]*?">([\s\S]*?)<\/a>/g;
        while (match) {
            var match2 = re2.exec(match[1]);
            while (match2) {
                var date = match[1].match(/<td class="bottomTableDate" rowspan="2">([\s\S]*?)<\/td>/)[1];
                var title = match[1].match(/itemprop="name">([\s\S]*?)<\/span>/)[1] + colorStr(date, orange) + ' ' + match2[2];
                var link = showtime.entityDecode(match2[1]);
                if (link.match(/yahoo-redir/))
                    link = plugin.getDescriptor().id + ':yahoo:' + link.match(/id=(.*)&/)[1] + ':' + link.match(/resolution=(.*)/)[1];
                else if (link.match(/youtube/))
                    link = 'youtube:video:' + escape(link);
                else {
                    link = "videoparams:" + showtime.JSONEncode({
                        title: title.replace(/(<([^>]+)>)/ig, ''),
                        no_fs_scan: true,
                        sources: [{
                            url: link
                        }]
                    });
                }
                page.appendItem(link, "video", {
                    title: new showtime.RichText(title),
                    icon: icon,
                    timestamp: getTimestamp(date),
                    genre: match2[2],
                    description: description
                });
                match2 = re2.exec(match[1]);
            }
            match = re.exec(table);
        }
        page.loading = false;
    });

    function scrape(page, url, title) {
        setPageHeader(page, decodeURIComponent(title));
        var fromPage = 1, tryToSearch = true;

        function loader() {
            if (!tryToSearch) return false;
            page.loading = true;
            if (url == '/page/')
                var doc = showtime.httpReq(BASE_URL + url + fromPage + '/').toString();
            else
                var doc = showtime.httpReq(BASE_URL + url).toString();
            var blocks = doc.match(/mainHeading([\s\S]*?)(<th|<\/table>)/g);
            page.loading = false;

            // 1-link, 2-icon, 3-title
            var re = /indexTableTrailerImage[\s\S]*?<a href="([\s\S]*?)">[\s\S]*?src="([\s\S]*?)"[\s\S]*?alt="([\s\S]*?)"/g;
            if (blocks.length > 1) {
                for (var i = 0; i < blocks.length; i++) {
                    var sectionTitle = blocks[i].match(/mainHeading[\s\S]*?<div>([\s\S]*?)<\/div>/)[1]
                    page.appendItem("", "separator", {
                        title: sectionTitle
                    });
                    var match = re.exec(blocks[i]);
                    while (match) {
                        var link = plugin.getDescriptor().id + ":index:" + encodeURIComponent(match[1]) + ':' + encodeURIComponent(match[3]);
                        if (showtime.entityDecode(match[3]) == 'More...')
                            link = plugin.getDescriptor().id + ":scrape:" + match[1].replace('/page/1/', '/page/') + ':' + encodeURIComponent(sectionTitle);
                        page.appendItem(link, "video", {
                            title: showtime.entityDecode(match[3]),
                            icon: match[2]
                        });
                        match = re.exec(blocks[i]);
                    }
                }
            } else {
                var match = re.exec(doc);
                while (match) {
                    page.appendItem(plugin.getDescriptor().id + ":index:" + encodeURIComponent(match[1]) + ':' + encodeURIComponent(match[3]), "video", {
                        title: showtime.entityDecode(match[3]),
                        icon: match[2]
                    });
                    match = re.exec(doc);
                }
            }
            if (!doc.match(/Next &#8811;/))
                return tryToSearch = false;
            fromPage++;
            return true;
        }
        loader();
        page.paginator = loader;
        page.loading = false;
    }

    plugin.addURI(plugin.getDescriptor().id + ":scrape:(.*):(.*)", function(page, url, title) {
        scrape(page, url, title);
    });

    plugin.addURI(plugin.getDescriptor().id + ":library", function(page) {
        setPageHeader(page, 'Library');
        page.loading = true;
        var str = "#abcdefghijklmnopqrstuvxyz";
        for (var i = 0; i < str.length; i++) {
            page.appendItem(plugin.getDescriptor().id + ":scrape:/poster-library/" + str.charAt(i) + '/:Library - ' + str.charAt(i).toUpperCase(), "directory", {
                title: str.charAt(i).toUpperCase()
            });
	}
        page.loading = false;
    });

    plugin.addURI(plugin.getDescriptor().id + ":academyAwards", function(page) {
        setPageHeader(page, 'Academy Awards');
        page.loading = true;
        var doc = showtime.httpReq(BASE_URL + '/academy-awards/').toString();
        doc = doc.match(/<div class="academy-awards-list">([\s\S]*?)<\/div>/)[1];
        // 1-link, 2-title
        var re = /<a href="([\s\S]*?)">([\s\S]*?)<\/a>/g;
        var match = re.exec(doc);
        while (match) {
            page.appendItem(plugin.getDescriptor().id + ':scrape:' + match[1] + ':' + encodeURIComponent(match[2]), "directory", {
                title: match[2]
            });
            match = re.exec(doc);
	}
        page.loading = false;
    });

    // Start page
    plugin.addURI(plugin.getDescriptor().id + ":start", function(page) {
        plugin.addHTTPAuth('(http|https)://.*\\.apple\\.com.*', function(req) {
            req.setHeader('User-Agent', 'QuickTime/7.6.2');
        });
        page.appendItem(plugin.getDescriptor().id + ':scrape:/page/:Latest', "directory", {
            title: 'Latest (Newest)'
        });
        page.appendItem(plugin.getDescriptor().id + ':library', "directory", {
            title: 'Library'
        });
        page.appendItem(plugin.getDescriptor().id + ':scrape:/most-watched/:Most Watched', "directory", {
            title: 'Most Watched'
        });
        page.appendItem(plugin.getDescriptor().id + ':scrape:/top-movies/:Top 10', "directory", {
            title: 'Top 10'
        });
        page.appendItem(plugin.getDescriptor().id + ':scrape:/opening-this-week/:Opening', "directory", {
            title: 'Opening'
        });
        page.appendItem(plugin.getDescriptor().id + ':scrape:/coming-soon/:Coming Soon', "directory", {
            title: 'Coming Soon'
        });
        page.appendItem(plugin.getDescriptor().id + ':scrape:/netflix-new-releases/:New @ Netflix', "directory", {
            title: 'New @ Netflix'
        });
        page.appendItem(plugin.getDescriptor().id + ':academyAwards', "directory", {
            title: 'Academy Awards'
        });
        scrape(page, '', plugin.getDescriptor().title + ' - Home');
    });
})(this);