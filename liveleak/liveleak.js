/**
 * Liveleak.com plugin for Showtime Media Center
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
 *  along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

(function(plugin) {
    var BASE_URL = 'http://www.liveleak.com';
    var logo = plugin.path + "icon.gif";

    function setPageHeader(page, title) {
        if (page.metadata) {
            page.metadata.title = title;
            page.metadata.logo = logo;
        }
        page.type = "directory";
        page.contents = "items";
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
        return s.replace(/(\r\n|\n|\r)/gm, "").replace(/(^\s*)|(\s*$)/gi, "").replace(/[ ]{2,}/gi, " ").replace(/\t/g, ' ');
    }

    var service = plugin.createService(plugin.getDescriptor().id, plugin.getDescriptor().id + ":start", "video", true, logo);
  
    plugin.addURI(plugin.getDescriptor().id + ":play:(.*):(.*)", function(page, url, title) {
        page.loading = true;
        var doc = showtime.httpReq(unescape(url)).toString();
        //console.log(unescape(url));
        var match = doc.match(/config: "([\S\s]*?)"/g);
        if (!match) { // youtube
             match = doc.match(/<iframe[\S\s]*?src="([\S\s]*?)"/);
             page.redirect('youtube:video:' + match[1]);
        } else if (match.length == 1) {
            page.type = "video";
            var lnk = match[0].match(/hd_file_url=([\S\s]*?)&/);
            if (lnk)
                lnk = lnk[1]
            else
                lnk = match[0].match(/file_url=([\S\s]*?)&/)[1];
            page.source = "videoparams:" + showtime.JSONEncode({
                title: unescape(title),
                no_fs_scan: true,
                canonicalUrl: plugin.getDescriptor().id + ':play:' + url + ':' + title,
                sources: [{
                    url: unescape(lnk)
                }]
            });
        } else {
            setPageHeader(page, doc.match(/<title>([\S\s]*?)<\/title>/)[1]);
            for (var i=0; i < match.length; i++) {
                var lnk = match[i].match(/hd_file_url=([\S\s]*?)&/);
                if (lnk)
                    lnk = lnk[1]
                else
                    lnk = match[i].match(/file_url=([\S\s]*?)&/)[1];

                var link = "videoparams:" + showtime.JSONEncode({
                    title: unescape(title) + '_part' + (i + 1),
                    no_fs_scan: true,
                    canonicalUrl: plugin.getDescriptor().id + ':' + url + ':' + title + '_part' + (i + 1),
                    sources: [{
                        url: unescape(lnk)
                    }]
                });
                page.appendItem(link, "video", {
                    title: unescape(title) + '_part' + (i + 1),
                    icon: unescape(match[i].match(/preview_image_url=([\S\s]*?)&/)[1])
                });
            }
        }
    });

    function scrape_videos(page, url) {
        var fromPage = 1, tryToSearch = true;
        page.entries = 0;
        // 1-link, 2-icon, 3-title, 4-genres, 5-marks, 6-description, 7-info
        var re = /<div class="thumbnail_column"[\S\s]*?<a href="([\S\s]*?)"[\S\s]*?src="([\S\s]*?)"[\S\s]*?title="([\S\s]*?)"[\S\s]*?title="Rating: ([\S\s]*?)"[\S\s]*?<div class="item_info_column">([\S\s]*?)<br \/>([\S\s]*?)<h4>([\S\s]*?)<\/div>/g;

        function loader() {
            if (!tryToSearch) return false;
            page.loading = true;
            var doc = showtime.httpReq(BASE_URL + url + '&page=' + fromPage).toString();
            page.loading = false;

            var match = re.exec(doc);
            while (match) {
                page.appendItem(plugin.getDescriptor().id + ":play:" + escape(match[1]) + ':' + escape(match[3]), "video", {
                    title: new showtime.RichText(match[5].match(/hd_video_icon/) ? coloredStr('HD ', orange) + match[3] : match[3]),
                    icon: match[2],
                    genre: match[4],
                    description: new showtime.RichText(coloredStr('Description: ', orange) + trim(match[6]) + '\n' + trim(match[7]))
                });
                match = re.exec(doc);
                page.entries++;
            }
            fromPage++;
            return true;
        }
        loader();
        page.paginator = loader;
    };

    plugin.addURI(plugin.getDescriptor().id + ":start", function(page)    {
        setPageHeader(page, plugin.getDescriptor().title + ' - Featured videos');
        scrape_videos(page, '/browse?featured=1');
    });

    plugin.addSearcher(plugin.getDescriptor().id, logo, function(page, query) {
        setPageHeader(page, plugin.getDescriptor().title + ' - Videos');
        scrape_videos(page, '/browse?q=' + encodeURIComponent(query));
    });
})(this);