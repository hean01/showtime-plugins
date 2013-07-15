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

    function getRating(str) {
        if (str == "&nbsp;") return 0;
        return +(str.replace("%", ""));
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
            // 1 - link, 2 - img, 3 - title, 4 - rating, 5 - duration, 6 - HDflag, 7 - views, 8 - was added, 9 - time units
            re = /<a href="([\S\s]*?)"[\S\s]*?<img src="([\S\s]*?)" alt="([\S\s]*?)"[\S\s]*?<span class="[\S\s]*?">([\S\s]*?)<\/span>[\S\s]*?<span class="[\S\s]*?">([\S\s]*?)<\/span>([\S\s]*?)<span class="right-side"><span>([\S\s]*?)<\/span>[\S\s]*?<span class="left-side"><span>([\S\s]*?)<\/span>([\S\s]*?)<\/span>[\S\s]*?<\/a>/g;
            var match = re.exec(bw);
            var re2 = /(hd-icon)/;
            if (match) match[6] = re2.exec(match[6]);
            while (match) {
                var re3 = /data-original="([\S\s]*?$)/;
                var icon = re3.exec(match[2]);
                if (!icon) {
                    icon = match[2]
                } else {
                    icon = icon[1]
                };
                page.appendItem(PREFIX + ':video:' + escape(match[1]) + ":" + escape(match[3]), 'video', {
                    title: new showtime.RichText((match[6] ? blueStr("HD ") : "") + match[3]),
                    duration: match[5],
                    rating: getRating(match[4]),
                    description: new showtime.RichText("Views: " + blueStr(match[7]) + "\nAdded:" + blueStr(match[8]) + match[9]),
                    icon: icon
                });
                match = re.exec(bw);
                if (match) match[6] = re2.exec(match[6]);
            }
        }

        var v = showtime.httpGet(BASE_URL);

        // Being watched now
        re = /<div class="most-viewed-home" id="ajax-holder">([\S\s]*?)<\/div>/;
        addSectionAndScrape("Being watched now:");

        // Recent videos
        re = /<!-- Recent videos([\S\s]*?)<!-- Recent videos end -->/;
        addSectionAndScrape("Recent videos:");
    };

    plugin.addURI(PREFIX + ":videos:(.*):(.*)", function(page, url, title) {
        setPageHeader(page, 'Porntube - ' + unescape(title));
        var pageNum = 1;
        var done = false;
        var Order = "age",
            Quality = "all",
            Age = "alltime";

        function loader() {
            if (done) return false;
            var v = showtime.httpGet(BASE_URL + unescape(url) + '?p=' + pageNum + '&order=' + Order + '&quality=' + Quality + '&age=' + Age);
            var re = /<div class="overlay"([\S\s]*?)<div class="relax"/;
            var bw = re.exec(v)[1];
            // 1 - link, 2 - img, 3 - title, 4 - rating, 5 - duration, 6 - HDflag, 7 - views, 8 - was added, 9 - time units
            re = /<a href="([\S\s]*?)"[\S\s]*?<img src="([\S\s]*?)" alt="([\S\s]*?)"[\S\s]*?<span class="[\S\s]*?">([\S\s]*?)<\/span>[\S\s]*?<span class="[\S\s]*?">([\S\s]*?)<\/span>([\S\s]*?)<span class="right-side"><span>([\S\s]*?)<\/span>[\S\s]*?<span class="left-side"><span>([\S\s]*?)<\/span>([\S\s]*?)<\/span>[\S\s]*?<\/a>/g;
            var match = re.exec(bw);
            var re2 = /(hd-icon)/;
            if (match) match[6] = re2.exec(match[6]);
            while (match) {
                var re3 = /data-original="([\S\s]*?$)/;
                var icon = re3.exec(match[2]);
                if (!icon) {
                    icon = match[2]
                } else {
                    icon = icon[1]
                };
                page.appendItem(PREFIX + ':video:' + escape(match[1]) + ":" + escape(match[3]), 'video', {
                    title: new showtime.RichText((match[6] ? blueStr("HD ") : "") + match[3]),
                    duration: match[5],
                    rating: getRating(match[4]),
                    description: new showtime.RichText("Views: " + blueStr(match[7]) + "\nAdded:" + blueStr(match[8]) + match[9]),
                    icon: icon
                });
                page.entries++;
                match = re.exec(bw);
                if (match) match[6] = re2.exec(match[6]);
            }
            pageNum++;
            re = /page-next.gif/;
            match = re.exec(v);
            if (!match) {
                done = true;
                return false;
            }
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
            pageNum = 1, done = false;
            loader();
            page.paginator = loader;
        });
        loader();
        page.paginator = loader;
    });

    plugin.addURI(PREFIX + ":categories", function(page) {
        setPageHeader(page, 'Porntube - Categories');
        var v = showtime.httpGet(BASE_URL + "/categories");
        var re = /<!-- Most popular categories([\S\s]*?)<!-- Most popular categories. -->/;
        var bw = re.exec(v)[1];
        // 1 - link, 2 - img, 3 - title, 4 - total
        re = /<a class="link" href="([\S\s]*?)">[\S\s]*?<img src="([\S\s]*?)"[\S\s]*?alt="([\S\s]*?)"[\S\s]*?<span class="total"><span class="bg">Total: <span>([\S\s]*?)<\/span>/g;
        var match = re.exec(bw);
        while (match) {
            var re3 = /data-original="([\S\s]*?$)/;
            var icon = re3.exec(match[2]);
            if (!icon) {
                icon = match[2]
            } else {
                icon = icon[1]
            };

            page.appendItem(PREFIX + ':videos:' + escape(match[1]) + ":" + escape(match[3]), 'video', {
                title: new showtime.RichText(match[3] + blueStr(" (" + match[4] + ")")),
                icon: icon
            });
            match = re.exec(bw);
        };
    });

    plugin.addURI(PREFIX + ":channels", function(page) {
        setPageHeader(page, 'Porntube - Channels');
        var pageNum = 1;
        var done = false;
        var Letter = "all",
            Order = "age",
            Age = "alltime";

        function loader() {
            if (done) return false;
            var v = showtime.httpGet(BASE_URL + '/channels?p=' + pageNum + '&letter=' + Letter + '&order=' + Order + '&age=' + Age);
            var re = /<ul class="sites pictures" id="pictures">([\S\s]*?)<\/ul>/;
            var bw = re.exec(v)[1];
            // 1 - link, 2 - img, 3 - title, 4 - rating, 5 - videos, 6 - views
            re = /<a href="([\S\s]*?)">[\S\s]*?" data-original="([\S\s]*?)" alt="([\S\s]*?)"[\S\s]*?class="[\S\s]*?">([\S\s]*?)<\/span>[\S\s]*?<span class="time">([\S\s]*?)<\/span>[\S\s]*?<span class="right-side"><span>([\S\s]*?)<\/span>/g;
            var match = re.exec(bw);
            while (match) {
                page.appendItem(PREFIX + ':videos:' + escape(match[1]) + ":" + escape(match[3]), 'video', {
                    title: new showtime.RichText(match[3]),
                    rating: getRating(match[4]),
                    description: new showtime.RichText("Views: " + blueStr(match[6]) + "\nVideos: " + blueStr(match[5].replace(/[A-Za-z$-]/g, ""))),
                    icon: match[2]
                });
                match = re.exec(bw);
            }
            pageNum++;
            re = /page-next.gif/;
            match = re.exec(v);
            if (!match) {
                done = true;
                return false;
            };
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
            ['age', 'Date Added', true],
            ['popularity', 'Most popular'],
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
            pageNum = 1, done = false;
            loader();
            page.paginator = loader;
        });
        loader();
        page.paginator = loader;
    });

    plugin.addURI(PREFIX + ":pornstars", function(page) {
        setPageHeader(page, 'Porntube - Pornstars');

        var pageNum = 1;
        var done = false;
        var Letter = "all",
            Order = "popularity";

        function loader() {
            if (done) return false;
            var v = showtime.httpGet(BASE_URL + '/pornstars?p=' + pageNum + '&letter=' + Letter + '&order=' + Order);
            var re = /<ul class="pornstars">([\S\s]*?)<\/ul>/;
            var bw = re.exec(v)[1];
            // 1 - title, 2 - link, 3 - img, 4 - videos, 5 - views
            re = /<a title="([\S\s]*?)" href="([\S\s]*?)">[\S\s]*?" data-original="([\S\s]*?)"[\S\s]*?<span class="side-right">[\S\s]*?<span>([\S\s]*?)<\/span>[\S\s]*?<span class="side-left">[\S\s]*?<span>([\S\s]*?)<\/span>/g;
            var match = re.exec(bw);
            while (match) {
                page.appendItem(PREFIX + ':videos:' + escape(match[2]) + ":" + escape(match[1]), 'video', {
                    title: new showtime.RichText(match[1]),
                    description: new showtime.RichText("Views: " + blueStr(match[5]) + "\nVideos: " + blueStr(match[4])),
                    icon: match[3]
                });
                match = re.exec(bw);
            }
            pageNum++;
            re = /page-next.gif/;
            match = re.exec(v);
            if (!match) {
                done = true;
                return false;
            };
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
            pageNum = 1, done = false;
            loader();
            page.paginator = loader;
        });
        loader();
        page.paginator = loader;
    });

    // Play links
    plugin.addURI(PREFIX + ":video:(.*):(.*)", function(page, url, title) {
        var v = showtime.httpGet(BASE_URL + unescape(url));
        var re = /playerFallbackFile = '([\s\S]*?)'/;
        var match = re.exec(v);
        showtime.print(showtime.entityDecode(match[1]));
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
        try {
            setPageHeader(page, 'Porntube - ' + query);
            query = query.replace(/\s/g, '\+');
            var pageNum = 1;
            var done = false;

            function loader() {
                if (done) return false;
                var v = showtime.httpGet(BASE_URL + '/search?q=' + query + "&p=" + pageNum);
                var re = /<ul class="pictures" id="pictures">([\S\s]*?)<\/ul>/;
                var bw = re.exec(v)[1];
                // 1 - link, 2 - img, 3 - title, 4 - rating, 5 - duration, 6 - HDflag, 7 - views, 8 - was added, 9 - time units
                re = /<a href="([\S\s]*?)">[\S\s]*?<img src="([\S\s]*?)" alt="([\S\s]*?)"[\S\s]*?class="RotatingThumbs[\S\s]*?<span class="[\S\s]*?">([\S\s]*?)<\/span>[\S\s]*?<span class="time">([\S\s]*?)<\/span>([\S\s]*?)<span class="right-side"><span>([\S\s]*?)<\/span>[\S\s]*?<span class="left-side"><span>([\S\s]*?)<\/span>([\S\s]*?)<\/span>[\S\s]*?<\/a>/g;
                var match = re.exec(bw);
                var re2 = /(hd-icon)/;
                if (match) match[6] = re2.exec(match[6]);
                while (match) {
                    var re3 = /data-original="([\S\s]*?$)/;
                    var icon = re3.exec(match[2]);
                    if (!icon) {
                        icon = match[2]
                    } else {
                        icon = icon[1]
                    };

                    page.appendItem(PREFIX + ':video:' + escape(match[1]) + ":" + escape(match[3]), 'video', {
                        title: new showtime.RichText((match[6] ? blueStr("HD ") : "") + match[3]),
                        duration: match[5],
                        rating: getRating(match[4]),
                        description: new showtime.RichText("Views: " + blueStr(match[7]) + "\nAdded:" + blueStr(match[8]) + match[9]),
                        icon: icon
                    });
                    page.entries++;
                    match = re.exec(bw);
                    if (match) match[6] = re2.exec(match[6]);
                }
                pageNum++;
                re = /page-next.gif/;
                match = re.exec(v);
                if (!match) {
                    done = true;
                    return false;
                }
                return true;
            };
            loader();
            page.paginator = loader;
        } catch (err) {
            showtime.trace('Porntube - Search error: ' + err)
        }
    });
})(this);
