/**
 * Porntube plugin for Showtime
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
    var PREFIX = 'porntube';
    var BASE_URL = 'http://www.porntube.com';
    var logo = plugin.path + "logo.png";

    function blueStr(str) {
        return '<font color="6699CC">' + str + '</font>';
    }

    function setPageHeader(page, title) {
        if (page.metadata) {
            page.metadata.title = title;
            page.metadata.logo = logo;
        }
        page.type = "directory";
        page.contents = "items";
        page.loading = false;
    }

    var service = plugin.createService("Porntube", PREFIX + ":start", "video", true, logo);
    var Order = "",
        Quality = "",
        Age = "";

    function trim(s) {
        return s.replace(/(\r\n|\n|\r)/gm, "").replace(/(^\s*)|(\s*$)/gi, "").replace(/[ ]{2,}/gi, " ");
    }

    function getRating(str) {
        str = trim(str);
        if (str == "&nbsp;" || str == '') return 0;
        return +(str.match(/\d+/));
    }

    function startPage(page) {
        setPageHeader(page, 'Porntube - Watch FREE Porn Videos');
        page.appendItem(PREFIX + ':videos:/videos:Videos', 'directory', {
            title: 'Videos',
            icon: logo
        });
        page.appendItem(PREFIX + ':categories', 'directory', {
            title: 'Categories',
            icon: logo
        });
        page.appendItem(PREFIX + ':channels', 'directory', {
            title: 'Channels',
            icon: logo
        });
        page.appendItem(PREFIX + ':pornstars', 'directory', {
            title: 'Pornstars',
            icon: logo
        });

        var re;

        function addSectionAndScrape(name) {
            page.appendItem("", "separator", {
                title: name
            });
            var bw = re.exec(v)[1];
            // 1-link, 2-img, 3-title, 4-HDflag, 5-views, 6-duration, 7-rating, 8-was added, 9-time units
            re = /<a href="([\S\s]*?)"[\S\s]*?<img src="([\S\s]*?)" alt="([\S\s]*?)"[\S\s]*?<a href="[\S\s]*?">([\S\s]*?)<span>([\S\s]*?) views <\/span>([\S\s]*?)<\/a>[\S\s]*?<strong>([\S\s]*?)like this<\/strong>[\S\s]*?<span>([\S\s]*?)<\/span>([\S\s]*?)<\/a>/g;
            var match = re.exec(bw);
            var re2 = /"hd"/;
            if (match) match[4] = re2.exec(match[4]);
            while (match) {
                var re3 = /data-original="([\S\s]*?$)/;
                var icon = re3.exec(match[2]);
                if (!icon) {
                    icon = match[2]
                } else {
                    icon = icon[1]
                };
                page.appendItem(PREFIX + ':video:' + escape(match[1]) + ":" + escape(match[3]), 'video', {
                    title: new showtime.RichText((match[4] ? blueStr("HD ") : "") + match[3]),
                    duration: trim(match[6]),
                    rating: getRating(match[7]),
                    description: new showtime.RichText("Views: " + blueStr(match[5]) + "\nAdded:" + blueStr(match[8]) + match[9]),
                    icon: icon
                });
                match = re.exec(bw);
                if (match) match[4] = re2.exec(match[4]);
            }
        }

        var v = showtime.httpGet(BASE_URL);

        // Being watched now
        re = /<div class="most-viewed-home" id="ajax-holder">([\S\s]*?)<div class="relax">/;
        addSectionAndScrape("Being watched now:");

        // Recent videos
        re = /<!-- Recent videos([\S\s]*?)<!-- Recent videos end -->/;
        addSectionAndScrape("Recent videos:");
    };

    plugin.addURI(PREFIX + ":videos:(.*):(.*)", function(page, url, title) {
        setPageHeader(page, 'Porntube - ' + unescape(title));
        var fromPage = 1,
            tryToSearch = true;
        var Order = "age",
            Quality = "all",
            Age = "alltime";

        function loader() {
            if (!tryToSearch) return false;
            var v = showtime.httpGet(BASE_URL + unescape(url) + '?p=' + fromPage + '&order=' + Order + '&quality=' + Quality + '&age=' + Age);
            var re = /<div class="overlay"([\S\s]*?)<div class="relax"/;
            var bw = re.exec(v)[1];
            // 1-link, 2-img, 3-title, 4-HDflag, 5-views, 6-duration, 7-rating, 8-was added, 9-time units
            re = /<a href="([\S\s]*?)"[\S\s]*?<img src="([\S\s]*?)" alt="([\S\s]*?)"[\S\s]*?<a href="[\S\s]*?">([\S\s]*?)<span>([\S\s]*?) views <\/span>([\S\s]*?)<\/a>[\S\s]*?<strong>([\S\s]*?)like this<\/strong>[\S\s]*?<span>([\S\s]*?)<\/span>([\S\s]*?)<\/a>/g;
            var match = re.exec(bw);
            var re2 = /"hd"/;
            if (match) match[4] = re2.exec(match[4]);
            while (match) {
                var re3 = /data-original="([\S\s]*?$)/;
                var icon = re3.exec(match[2]);
                if (!icon) {
                    icon = match[2]
                } else {
                    icon = icon[1]
                };
                page.appendItem(PREFIX + ':video:' + escape(match[1]) + ":" + escape(match[3]), 'video', {
                    title: new showtime.RichText((match[4] ? blueStr("HD ") : "") + match[3]),
                    duration: trim(match[6]),
                    rating: getRating(match[7]),
                    description: new showtime.RichText("Views: " + blueStr(match[5]) + "\nAdded:" + blueStr(match[8]) + match[9]),
                    icon: icon
                });
                page.entries++;
                match = re.exec(bw);
                if (match) match[4] = re2.exec(match[4]);
            }
            re = /navNext">Next/;
            if (!re.exec(v)) return tryToSearch = false;
            fromPage++;
            return true;
        };
        page.options.createMultiOpt("order", "Sort by", [
            ['age', 'Date Added', true],
            ['rating', 'Top Rated'],
            ['numviews', 'Most Viewed'],
            ['popularity', 'Most popular'],
            ['duration', 'Duration']
        ], function(res) {
            Order = res;
        });
        page.options.createMultiOpt("quality", "Quality", [
            ['all', 'All', true],
            ['hd', 'HD (720p - 1080p)']
        ], function(res) {
            Quality = res;
        });
        page.options.createMultiOpt("age", "Uploaded", [
            ['alltime', 'All Time', true],
            ['today', 'Today'],
            ['week', 'This Week'],
            ['month', 'This Month']
        ], function(res) {
            Age = res;
        });
        page.options.createAction('apply', 'Apply', function() {
            page.paginator = function dummy() {
                return true
            };
            page.flush();
            fromPage = 1, tryToSearch = false;
            loader();
            page.paginator = loader;
        });
        loader();
        page.paginator = loader;
    });

    plugin.addURI(PREFIX + ":categories", function(page) {
        setPageHeader(page, 'Porntube - Categories');
        var v = showtime.httpGet(BASE_URL + "/categories");
        // 1-link, 2-img, 3-title, 4-total
        var re = /<div class="video-thumb category-thumb[\S\s]*?<a href="([\S\s]*?)">[\S\s]*?data-original="([\S\s]*?)"[\S\s]*?alt="([\S\s]*?)"[\S\s]*?<h3>[\S\s]*?<a href="[\S\s]*?">([\S\s]*?) videos/g;
        var match = re.exec(v);
        while (match) {
            page.appendItem(PREFIX + ':videos:' + escape(match[1]) + ":" + escape(match[3]), 'video', {
                title: new showtime.RichText(match[3] + blueStr(" (" + trim(match[4].replace(',','')) + ")")),
                icon: match[2]
            });
            match = re.exec(v);
        };
    });

    plugin.addURI(PREFIX + ":channels", function(page) {
        setPageHeader(page, 'Porntube - Channels');
        var fromPage = 1,
            tryToSearch = true;
        var Letter = "all",
            Order = "popularity",
            Age = "alltime";

        function loader() {
            if (!tryToSearch) return false;
            var v = showtime.httpGet(BASE_URL + '/channels?p=' + fromPage + '&letter=' + Letter + '&order=' + Order + '&age=' + Age);
            // 1-link, 2-img, 3-title, 4-views, 5-rating, 6-videos
            var re = /<div class="video-thumb site-thumb[\S\s]*?<a href="([\S\s]*?)">[\S\s]*?data-original="([\S\s]*?)"[\S\s]*?alt="([\S\s]*?)"[\S\s]*?<a href="[\S\s]*?<span>([\S\s]*?) views <\/span>[\S\s]*?<strong>([\S\s]*?)<\/strong>([\S\s]*?) videos/g;
            var match = re.exec(v);
            while (match) {
                page.appendItem(PREFIX + ':videos:' + escape(match[1]) + ":" + escape(match[3]), 'video', {
		    title: new showtime.RichText(match[3] + blueStr(" (" + match[6].match(/\d+/) + ")")),
                    rating: getRating(match[5]),
                    description: new showtime.RichText("Views: " + blueStr(match[4])),
                    icon: match[2]
                });
                match = re.exec(v);
            }
            re = /navNext">Next/;
            if (!re.exec(v)) return tryToSearch = false;
            fromPage++;
            return true;
        };
        page.options.createMultiOpt("letter", "Filter by letter", [
            ['all', 'ALL', true],
            ['A', 'A'],
            ['B', 'B'],
            ['C', 'C'],
            ['D', 'D'],
            ['E', 'E'],
            ['F', 'F'],
            ['G', 'G'],
            ['H', 'H'],
            ['I', 'I'],
            ['J', 'J'],
            ['K', 'K'],
            ['L', 'L'],
            ['M', 'M'],
            ['N', 'N'],
            ['O', 'O'],
            ['P', 'P'],
            ['Q', 'Q'],
            ['R', 'R'],
            ['S', 'S'],
            ['T', 'T'],
            ['U', 'U'],
            ['V', 'V'],
            ['W', 'W'],
            ['X', 'X'],
            ['Y', 'Y'],
            ['Z', 'Z']
        ], function(res) {
            Letter = res;
        });
        page.options.createMultiOpt("order", "Sort by", [
            ['age', 'Date Added'],
            ['popularity', 'Most popular', true],
            ['rating', 'Top Rated'],
            ['name', 'Alphabetically'],
            ['videos', 'Most videos'],
            ['numviews', 'Most Viewed']
        ], function(res) {
            Order = res;
        });
        page.options.createMultiOpt("age", "Uploaded", [
            ['alltime', 'All Time', true],
            ['today', 'Today'],
            ['week', 'This Week'],
            ['month', 'This Month']
        ], function(res) {
            Age = res;
        });
        page.options.createAction('apply', 'Apply', function() {
            page.paginator = function dummy() {
                return true
            };
            page.flush();
            fromPage = 1, tryToSearch = true;
            loader();
            page.paginator = loader;
        });
        loader();
        page.paginator = loader;
    });

    plugin.addURI(PREFIX + ":pornstars", function(page) {
        setPageHeader(page, 'Porntube - Pornstars');

        var fromPage = 1,
            tryToSearch = true;
        var Letter = "all",
            Order = "popularity";

        function loader() {
            if (!tryToSearch) return false;
            var v = showtime.httpGet(BASE_URL + '/pornstars?p=' + fromPage + '&letter=' + Letter + '&order=' + Order);
            // 1-link, 2-title, 3-img, 4-views, 5-rank, 6-videos
            var re = /<div class="video-thumb pornstar-thumb[\S\s]*?<a href="([\S\s]*?)" title="([\S\s]*?)">[\S\s]*?data-original="([\S\s]*?)"[\S\s]*?<a href="[\S\s]*?<span>([\S\s]*?) profile views <\/span>[\S\s]*?<strong>([\S\s]*?)<\/strong>([\S\s]*?) videos/g;
            var match = re.exec(v);
            while (match) {
                page.appendItem(PREFIX + ':videos:' + escape(match[1]) + ":" + escape(match[2]), 'video', {
		    title: new showtime.RichText(match[2] + blueStr(" (" + match[6].match(/\d+/) + ")")),
                    description: new showtime.RichText("Views: " + blueStr(match[4])+"\n"+match[5]),
                    icon: match[3]
                });
                match = re.exec(v);
            }
            re = /navNext">Next/;
            if (!re.exec(v)) return tryToSearch = false;
            fromPage++;
            return true;
        };

        page.options.createMultiOpt("letter", "Filter by letter", [
            ['all', 'ALL', true],
            ['A', 'A'],
            ['B', 'B'],
            ['C', 'C'],
            ['D', 'D'],
            ['E', 'E'],
            ['F', 'F'],
            ['G', 'G'],
            ['H', 'H'],
            ['I', 'I'],
            ['J', 'J'],
            ['K', 'K'],
            ['L', 'L'],
            ['M', 'M'],
            ['N', 'N'],
            ['O', 'O'],
            ['P', 'P'],
            ['Q', 'Q'],
            ['R', 'R'],
            ['S', 'S'],
            ['T', 'T'],
            ['U', 'U'],
            ['V', 'V'],
            ['W', 'W'],
            ['X', 'X'],
            ['Y', 'Y'],
            ['Z', 'Z']
        ], function(res) {
            Letter = res;
        });
        page.options.createMultiOpt("order", "Sort by", [
            ['popularity', 'Most popular', true],
            ['views', 'Most viewed'],
            ['videos', 'Most videos'],
            ['name', 'Alphabetically'],
            ['date', 'Latest added']
        ], function(res) {
            Order = res;
        });
        page.options.createAction('apply', 'Apply', function() {
            page.paginator = function dummy() {
                return true
            };
            page.flush();
            fromPage = 1, tryToSearch = true;
            loader();
            page.paginator = loader;
        });
        loader();
        page.paginator = loader;
    });

    // Play links
    plugin.addURI(PREFIX + ":video:(.*):(.*)", function(page, url, title) {
        var v = showtime.httpGet(BASE_URL + unescape(url));
        var re = /embedPlayer\(([\d^]+)[\S\s]*?\[([\S\s]*?)\]/;
        var match = re.exec(v);
	var res = match[2].split(",");
	var maxRes = '0';
	for (var i in res) if (parseInt(maxRes) < parseInt(res[i])) maxRes = res[i];
	var v = showtime.httpReq('http://tkn.porntube.com/'+match[1]+'/desktop/'+maxRes, {
		'method' : 'POST',
		'headers': { 'Host': 'tkn.porntube.com', 'Origin': BASE_URL,
			'User-Agent' : 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/31.0.1650.57 Safari/537.36' }
		}).toString();
	match = v.match(/"token":"([\S\s]*?)"}/);
        page.type = "video";
        page.source = "videoparams:" + showtime.JSONEncode({
            title: unescape(title),
            canonicalUrl: PREFIX + ":video:" + url + ":" + title,
            sources: [{
                url: unescape(showtime.entityDecode(match[1]))
            }]
        });
        page.loading = false;
    });

    plugin.addURI(PREFIX + ":start", startPage);

    plugin.addSearcher("Porntube", logo,

    function(page, query) {
        var fromPage = 1,
            tryToSearch = true;

        function loader() {
            if (!tryToSearch) return false;
            var response = showtime.httpGet(BASE_URL + '/search?q=' + query.replace(/\s/g, '\+') + "&p=" + fromPage);
            var re = /<div class="overlay"([\S\s]*?)<div class="relax"/;
            var response2 = re.exec(response)[1];
            // 1-link, 2-img, 3-title, 4-HDflag, 5-views, 6-duration, 7-rating, 8-was added, 9-time units
            re = /<a href="([\S\s]*?)"[\S\s]*?<img src="([\S\s]*?)" alt="([\S\s]*?)"[\S\s]*?<a href="[\S\s]*?">([\S\s]*?)<span>([\S\s]*?) views <\/span>([\S\s]*?)<\/a>[\S\s]*?<strong>([\S\s]*?)like this<\/strong>[\S\s]*?<span>([\S\s]*?)<\/span>([\S\s]*?)<\/a>/g;
            var match = re.exec(response2);
            var re2 = /"hd"/;
            if (match) match[4] = re2.exec(match[4]);
            while (match) {
                var re3 = /data-original="([\S\s]*?$)/;
                var icon = re3.exec(match[2]);
                if (!icon) {
                    icon = match[2]
                } else {
                    icon = icon[1]
                };
                page.appendItem(PREFIX + ':video:' + escape(match[1]) + ":" + escape(match[3]), 'video', {
                    title: new showtime.RichText((match[4] ? blueStr("HD ") : "") + match[3]),
                    duration: trim(match[6]),
                    rating: getRating(match[7]),
                    description: new showtime.RichText("Views: " + blueStr(match[5]) + "\nAdded:" + blueStr(match[8]) + match[9]),
                    icon: icon
                });
                page.entries++;
                match = re.exec(response2);
                if (match) match[4] = re2.exec(match[4]);
            }
            re = /navNext">Next/;
            if (!re.exec(response)) return tryToSearch = false;
            fromPage++;
            return true;
        };
        loader();
        page.paginator = loader;
    });
})(this);
