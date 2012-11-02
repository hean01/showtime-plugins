/**
 * Redtube plugin for Showtime
 *
 *  Copyright (C) 2012 lprot
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

    var PREFIX = 'fs_ua';
    var BASE_URL = 'http://fs.ua';

    var logo = plugin.path + "logo.png";

    function setPageHeader(page, title) {
        if (page.metadata) {
            page.metadata.title = title;
            page.metadata.logo = logo;
        }
        page.type = "directory";
        page.contents = "items";
    }

    var service = plugin.createService("fs.ua", PREFIX + ":start", "video", true, logo);

    function startPage(page) {
        setPageHeader(page, 'fs.ua - Видео');
        page.loading = false;
        page.appendItem(PREFIX + ':index:/films/?sort=rating&view=list', 'directory', {
            title: 'Фильмы',
            icon: logo
        });
        page.appendItem(PREFIX + ':index:/serials/?sort=rating&view=list', 'directory', {
            title: 'Сериалы',
            icon: logo
        });
        page.appendItem(PREFIX + ':index:/cartoons/?sort=rating&view=list', 'directory', {
            title: 'Мультфильмы',
            icon: logo
        });
        page.appendItem(PREFIX + ':index:/cartoonserials/?sort=rating&view=list', 'directory', {
            title: 'Мультсериалы',
            icon: logo
        });
        page.appendItem(PREFIX + ':index:/tvshow/?sort=rating&view=list', 'directory', {
            title: 'Телепередачи',
            icon: logo
        });
        page.appendItem(PREFIX + ':index:/clips/?sort=rating&view=list', 'directory', {
            title: 'Клипы',
            icon: logo
        });
        page.appendItem(PREFIX + ':index:/concerts/?sort=rating&view=list', 'directory', {
            title: 'Концерты',
            icon: logo
        });
    };

    function index(page, url) {
        setPageHeader(page, '');
        var p = 0;
        function loader() {
            var response = showtime.httpGet(url + "&page=" + p).toString();
            var re = /class="selected">([\S\s]*?)\</;
            var match = re.exec(response);
            if (match) if (page.metadata) page.metadata.title = match[1];
//	    var a;
//	    page.appendPassiveItem("directory", a, {
//	    	title: "Популярно прямо сейчас:"
//	    });
//	    page.appendPassiveItem("directory", a, {
//	    	title: match[1]
//	    });
	    //1-link 2-img 3-title 4-date 5-description
            re = /class="subject-link" href="([^"]+)[\S\s]*?<img src="([^"]+)[\S\s]*?alt=\'([^\']+)[\S\s]*?class="date">\(([^\)]+)[\S\s]*?class="subject-link m-full">[\S\s]*?\<span>([\S\s]*?)\<\/span>/g;
            match = re.exec(response);
            while (match) {
                page.appendItem(PREFIX + ":play:" + escape(match[1]), "video", {
                    title: new showtime.RichText(match[3] + '<font color="6699CC"> (' + match[4] + ')</font>'),
                    icon: match[2],
                    description: new showtime.RichText(match[5])
                });
                match = re.exec(response);
            }
            p++;
            var re = /<b>Следующая страница<\/b>/;
            if (!re.exec(response)) {
                return false
            } else {
                return true;
            }
        }
        loader();
        page.loading = false;
        page.paginator = loader;
    }

    // Index page at URL
    plugin.addURI(PREFIX + ":index:(.*)", function(page, url) {
        index(page, BASE_URL + "/video" + url);
    });

    plugin.addURI(PREFIX + ":play:(.*)", function(page, video_id) {
        page.type = "video";
	var response = showtime.httpGet(BASE_URL + video_id).toString();
        var re = /<title>([\S\s]+)<\/title>[\S\s]*?<div class="b-view-material">[\S\s]*?<a href="([^"]+)/;
        var m = re.exec(response);
	if (!m) {
		re = /<title>([\S\s]+)<\/title>/;
		m = re.exec(response);
		var title = m[1];
        	re = /playlist: \[[\S\s]*?url: '([^']+)/;
		m = re.exec(response);
	} else {
		var title = m[1];
        	re = /playlist: \[[\S\s]*?url: '([^']+)/;
		m = re.exec(showtime.httpGet(BASE_URL + m[2]).toString());
	}

        page.loading = false;
        page.source = "videoparams:" + showtime.JSONEncode({
            title: unescape(title),
            canonicalUrl: PREFIX + ":play:" + video_id,
            sources: [{
                url: m[1]
            }]
        });
    });

    plugin.addURI(PREFIX + ":start", startPage);

    function find(page, url) {
        setPageHeader(page, '');
        var p = 0;
        function loader() {
            var response = showtime.httpGet(unescape(url) + "&page=" + p).toString();
            var re = /class="selected">([\S\s]*?)\</;
            var match = re.exec(response);
            if (match) if (page.metadata) page.metadata.title = match[1];
	    //1-link 2-img 3-title 4-date 5-description
            re = /class="image-wrap">[\S\s]*?\<a href="([^"]+)" title="([^"]+)"><img src="([^"]+)/g;
            match = re.exec(response);
            while (match) {
                page.appendItem(PREFIX + ":play:" + escape(match[1]), "video", {
                    title: new showtime.RichText(match[2]),
                    icon: match[3]//,
//                    description: new showtime.RichText(match[5])
                });
		page.entries++;
                match = re.exec(response);
            }
            p++;
            var re = /<b>Следующая страница<\/b>/;
            if (!re.exec(response)) {
                return false
            } else {
                return true;
            }
        }
        loader();
        page.loading = false;
        page.paginator = loader;
    };

    plugin.addSearcher("fs.ua", logo,
    function(page, query) {
        try {
            query = query.replace(/\s/g, '\+');
            find(page, BASE_URL+ "/search.aspx?search="+escape(query));
        } catch (err) {
            showtime.print('FS.UA - Ошибка поиска: ' + err)
        }
    });

})(this);
