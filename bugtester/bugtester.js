/**
 * bugtester plugin for Showtime
 *
 *  Copyright (C) 2013 lprot
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

    var PREFIX = 'bugtester';
    var BASE_URL = 'http://sdf.to';

    var logo = plugin.path + "logo.png";

    function setPageHeader(page, title) {
        if (page.metadata) {
            page.metadata.title = title;
            page.metadata.logo = logo;
        }
        page.type = "directory";
        page.contents = "items";
        page.loading = false;
    }

    var service = plugin.createService("bugtester", PREFIX + ":start", "video", true, logo);

    function startPage(page) {
        setPageHeader(page, 'bugtester - Simple bug tester plugin');

        page.appendItem("", "separator", {
            title: 'Separator'
        });

	showtime.trace("HELLO WORLD!!!");

        page.loading = false;
    };

    plugin.addURI(PREFIX + ":start", startPage);

    plugin.addSearcher("bugtester", logo, function(page, query) {
        var fromPage = 1, tryToSearch = true;
        //1-link, 2-title, 3-image, 4 - description, 5 - type, 6 - type in text, 7 - genre
        var re = /class="image-wrap">[\S\s]*?<a href="([^"]+)" title="([^"]+)"><img src="([^"]+)[\S\s]*?<p class="text">([\S\s]*?)<\/p>[\S\s]*?<span class="section ([^"]+)">([\S\s]*?)<\/span>[\S\s]*?<span class="genre"><span class="caption">Жанр:<\/span><span>([\S\s]*?)<\/span>/g;
        var re2 = /<b>Следующая страница<\/b>/;
		showtime.trace("loader");
        function loader() {
            if (!tryToSearch) return false;
	    var link = BASE_URL + "/search.aspx?search=" + query.replace(/\s/g, '\+'); 
	    showtime.trace("link");
            if (fromPage != 1) link = link + "&page=" + fromPage;
            var response = showtime.httpGet(link);
            showtime.trace("link2");
            var match = re.exec(response);
            showtime.trace("response");
            while (match) {
				showtime.trace(match[2]);
                page.appendItem(PREFIX + ":listRoot:" + escape(match[1]) + ":" + escape(match[2]), "video", {
                    title: match[2],
                    icon: match[3],
                    genre: match[7],
                    description: 'Раздел: ' + match[6] + match[4]
                });
                page.entries++;
                match = re.exec(response);
            };

            if (!re2.exec(response)) return tryToSearch = false;
            fromPage++;
            return page.entries;
        };
        showtime.trace("loader1");
        loader();
        showtime.trace("loader2");
        page.paginator = loader;
        showtime.trace("loader3");
    });
})(this);

