/**
 * Porntube plugin for Movian Media Center
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

    var service = plugin.createService(plugin.getDescriptor().title, plugin.getDescriptor().id + ":start", "video", true, logo);
    var Order = "", Quality = "", Age = "";

    function trim(s) {
        return s.replace(/(\r\n|\n|\r)/gm, "").replace(/(^\s*)|(\s*$)/gi, "").replace(/[ ]{2,}/gi, " ").replace(/\t/, '');
    }

    function getRating(str) {
        str = trim(str);
        if (str == "&nbsp;" || str == '') return 0;
        return +(str.match(/\d+/));
    }

    plugin.addURI(plugin.getDescriptor().id + ":videos:(.*):(.*)", function(page, url, title) {
        setPageHeader(page, plugin.getDescriptor().title + ' - ' + unescape(title));
        var fromPage = 1, tryToSearch = true;
        var Order = '', Quality = '', Duration = '', Age = '';

        function loader() {
            if (!tryToSearch) return false;
            page.loading = true;
            v = showtime.httpReq((url.substr(0, 4) != 'http' ? BASE_URL : '') + unescape(url) + '?p=' + fromPage + Order + Quality + Duration + Age).toString();
            page.loading = false;
            re = /<div class="col thumb_video"([\S\s]*?)class="pagination"/;
            scrape(page);
            if (v.match(/"#" id="next"/)) return tryToSearch = false;
            fromPage++;
            return true;
        };
        page.options.createMultiOpt("order", "Sort by", [
            ['', 'Popularity', true],
            ['&sort=date', 'Date'],
            ['&sort=duration', 'Duration'],
            ['&sort=rating', 'Rating'],
            ['&sort=views', 'Views']
        ], function(res) {
            Order = res;
        });
        page.options.createMultiOpt("quality", "Quality", [
            ['', 'All', true],
            ['&quality=hd', 'HD only']
        ], function(res) {
            Quality = res;
        });
        page.options.createMultiOpt("duration", "Duration", [
            ['', 'Any', true],
            ['&duration=short', 'Short(0-5 min)'],
            ['&duration=medium', 'Medium(5-20 min)'],
            ['&duration=long', 'Long(20+ min)']
        ], function(res) {
            Duration = res;
        });
        page.options.createMultiOpt("age", "Time", [
            ['', 'Any', true],
            ['&time=24h', 'Past 24 hours'],
            ['&time=week', 'Past Week'],
            ['&time=month', 'Past Month'],
            ['&time=year', 'Past Year']
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

    plugin.addURI(plugin.getDescriptor().id + ":categories", function(page) {
        setPageHeader(page, plugin.getDescriptor().title + ' - Categories');
        page.loading = true;
        var v = showtime.httpReq(BASE_URL + "/tags").toString();
        page.loading = false;
        var htmlBlock = v.match(/categories_page([\S\s]*?)class="footer"/);
        if (htmlBlock) {
            // 1-link, 2-count, 3-title, 4-icon
            var re = /<a class="thumb-link" href="([\S\s]*?)"[\S\s]*?<\/i>([\S\s]*?)<\/li>[\S\s]*?class="thumb-title">([\S\s]*?)<[\S\s]*?data-original="([\S\s]*?)"/g;
            var match = re.exec(htmlBlock[1]);
            while (match) {
                page.appendItem(plugin.getDescriptor().id + ':videos:' + escape(match[1]) + ":" + escape(match[3]), 'video', {
                    title: new showtime.RichText(match[3] + blueStr(" (" + trim(match[2].replace(',','')) + ")")),
                    icon: match[4]
                });
                match = re.exec(htmlBlock[1]);
            };
        };
        htmlBlock = v.match(/All categories([\S\s]*?)<\/ul>/);
        if (htmlBlock) {
            page.appendItem("", "separator", {
                title: "All categories:"
            });
            // 1-link, 2-title, 3-count
            var re = /<a href="([\S\s]*?)"[\S\s]*?">([\S\s]*?)<span>([\S\s]*?)<\/span>/g;
            var match = re.exec(htmlBlock[1]);
            while (match) {
                page.appendItem(plugin.getDescriptor().id + ':videos:' + escape(match[1]) + ":" + escape(trim(match[2])), 'directory', {
                    title: new showtime.RichText(trim(match[2]) + ' ' + blueStr(trim(match[3])))
                });
                match = re.exec(htmlBlock[1]);
            };
        };
    });

    plugin.addURI(plugin.getDescriptor().id + ":channels", function(page) {
        setPageHeader(page, plugin.getDescriptor().title + ' - Channels');
        var fromPage = 1, tryToSearch = true;
        var Letter = '', Order = '', Age = "alltime";

        function loader() {
            if (!tryToSearch) return false;
            page.loading = true;
            var v = showtime.httpReq(BASE_URL + '/channels?p=' + fromPage + '&letter=' + Letter + (Order ? '&sort=' + Order : '')).toString();
            page.loading = false;
            var htmlBlock = v.match(/channels_page([\S\s]*?)class="footer"/);
            if (htmlBlock) {
                // 1-link, 2-count, 3-title, 4-icon
                var re = /<a class="thumb-link" href="([\S\s]*?)"[\S\s]*?<\/i>([\S\s]*?)<\/li>[\S\s]*?">([\S\s]*?)<[\S\s]*?data-original="([\S\s]*?)"/g;
                var match = re.exec(htmlBlock[1]);
                while (match) {
                    page.appendItem(plugin.getDescriptor().id + ':videos:' + escape(match[1]) + ":" + escape(match[3]), 'video', {
                       title: new showtime.RichText(match[3] + blueStr(" (" + trim(match[2].replace(',','')) + ")")),
                       icon: match[4]
                    });
                    match = re.exec(htmlBlock[1]);
                };
            };
            if (v.match(/"#" id="next"/)) return tryToSearch = false;
            fromPage++;
            return true;
        };
        page.options.createMultiOpt("letter", "Filter by letter", [
            ['', 'ALL', true], ['A', 'A'], ['B', 'B'], ['C', 'C'],
            ['D', 'D'], ['E', 'E'], ['F', 'F'], ['G', 'G'], ['H', 'H'],
            ['I', 'I'], ['J', 'J'], ['K', 'K'], ['L', 'L'], ['M', 'M'],
            ['N', 'N'], ['O', 'O'], ['P', 'P'], ['Q', 'Q'], ['R', 'R'],
            ['S', 'S'], ['T', 'T'], ['U', 'U'], ['V', 'V'], ['W', 'W'],
            ['X', 'X'], ['Y', 'Y'], ['Z', 'Z'], ['0-9', '0-9']
        ], function(res) {
            Letter = res;
        });
        page.options.createMultiOpt("order", "Sort by", [
            ['', 'Videos', true],
            ['name', 'Name'],
            ['date', 'Date added']
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

    plugin.addURI(plugin.getDescriptor().id + ":pornstars", function(page) {
        setPageHeader(page, plugin.getDescriptor().title + ' - Pornstars');
        var fromPage = 1, tryToSearch = true;
        var Letter = '', Order = 'rating', Titties = '', Age = '', Hair = '', Height = '';

        function loader() {
            if (!tryToSearch) return false;
            page.loading = true;
            var v = showtime.httpReq(BASE_URL + '/pornstars' + Letter + '?p=' + fromPage + '&sort=' + Order + Hair + Height+ Age + Titties).toString();
            page.loading = false;
            var htmlBlock = v.match(/pornstars_page([\S\s]*?)class="footer"/);
            if (htmlBlock) {
                // 1-link, 2-title, 3-count, 4-followers, 5-icon
                var re = /<a class="thumb-link" href="([\S\s]*?)" title="([\S\s]*?)"[\S\s]*?<\/i>([\S\s]*?)<\/li>[\S\s]*?<span>([\S\s]*?)<\/span>[\S\s]*?data-original="([\S\s]*?)"/g;
                var match = re.exec(htmlBlock[1]);
                while (match) {
                    page.appendItem(plugin.getDescriptor().id + ':videos:' + escape(match[1]) + ":" + escape(match[2]), 'video', {
                       title: new showtime.RichText(match[2] + blueStr(" (" + trim(match[3].replace(',','')) + ")")),
                       icon: match[5],
                       description: match[4]
                    });
                    match = re.exec(htmlBlock[1]);
                };
            };
            if (v.match(/"#" id="next"/)) return tryToSearch = false;
            fromPage++;
            return true;
        };

        page.options.createMultiOpt("letter", "Filter by letter", [
            ['', 'ALL', true], ['/a', 'A'], ['/b', 'B'], ['/c', 'C'],
            ['/d', 'D'], ['/e', 'E'], ['/f', 'F'], ['/g', 'G'], ['/h', 'H'],
            ['/i', 'I'], ['/j', 'J'], ['/k', 'K'], ['/l', 'L'], ['/m', 'M'],
            ['/n', 'N'], ['/o', 'O'], ['/p', 'P'], ['/q', 'Q'], ['/r', 'R'],
            ['/s', 'S'], ['/t', 'T'], ['/u', 'U'], ['/v', 'V'], ['/w', 'W'],
            ['/x', 'X'], ['/y', 'Y'], ['/z', 'Z']
        ], function(res) {
            Letter = res;
        });
        page.options.createMultiOpt("order", "Sort by", [
            ['popularity', 'Popularity'],
            ['twitter', 'Twiter followers'],
            ['videos', 'Number of videos'],
            ['name', 'Name'],
            ['date', 'Date added'],
            ['rating', 'Rating', true]
        ], function(res) {
            Order = res;
        });
        page.options.createMultiOpt("titties", "Titties", [
            ['', 'All', true],
            ['&titties=small', 'S'],
            ['&titties=medium', 'M'],
            ['&titties=large', 'L'],
            ['&titties=xxl', 'XL']
        ], function(res) {
            Titties = res;
        });
        page.options.createMultiOpt("age", "Age", [
            ['', 'All', true],
            ['&age=18-20', '18-20'],
            ['&age=21-34', '21-34'],
            ['&age=35-50', '35-50'],
            ['&age=51', '50+']
        ], function(res) {
            Age = res;
        });
        page.options.createMultiOpt("hair", "Hair color", [
            ['', 'All', true],
            ['&hair=black', 'Black'],
            ['&hair=blonde', 'Blonde'],
            ['&hair=brunette', 'Brunette'],
            ['&hair=redhead', 'Red head'],
            ['&hair=other', 'Other']
        ], function(res) {
            Hair = res;
        });
        page.options.createMultiOpt("height", "Height", [
            ['', 'All', true],
            ['&height=short', 'Short'],
            ['&height=average', 'Average'],
            ['&height=tall', 'Tall']
        ], function(res) {
            Height = res;
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
    plugin.addURI(plugin.getDescriptor().id + ":video:(.*):(.*)", function(page, url, title) {
        page.loading = true;
        var v = showtime.httpReq(unescape(url)).toString();
        page.loading = false;
        var re = /data-quality="([\S\s]*?)"/g;
        var match = re.exec(v);
        var maxRes = 0;
	while (match) {
            if (parseInt(maxRes) < parseInt(match[1])) maxRes = parseInt(match[1]);
            match = re.exec(v);
        }
        page.loading = true;
	var v = showtime.httpReq('http://tkn.porntube.com/'+v.match(/button data-id="([\d^]+)"/)[1]+'/desktop/'+maxRes, {
		'method' : 'POST',
		'headers': { 'Host': 'tkn.porntube.com', 'Origin': BASE_URL,
			'User-Agent' : 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/31.0.1650.57 Safari/537.36' }
		}).toString();
        page.loading = false;
	match = v.match(/"token":"([\S\s]*?)"\}/);
        page.type = "video";
        page.source = "videoparams:" + showtime.JSONEncode({
            title: showtime.entityDecode(unescape(title)),
            canonicalUrl: plugin.getDescriptor().id + ":video:" + url + ":" + title,
            sources: [{
                url: unescape(showtime.entityDecode(match[1]))
            }],
            no_subtitle_scan: true
        });
        page.loading = false;
    });

    var re, v;
    function scrape(page, html) {
        var bw = re.exec(v)[1];
        // 1-link, 2-title, 3-icon, 4-HDflag, 5-duration, 6-views, 7-was added
        re = /<a href="([\S\s]*?)"[\S\s]*?title="([\S\s]*?)"[\S\s]*?data-original="([\S\s]*?)"[\S\s]*?<ul class="thumb-info_top">([\S\s]*?)div class="bottom">[\S\s]*?"icon icon-timer"><\/i>([\S\s]*?)<\/li><li><i class="icon icon-eye"><\/i>([\S\s]*?)<\/li><li><i class="icon icon-up"><\/i>([\S\s]*?)<\/li>/g;
        var match = re.exec(bw);
        while (match) {
            page.appendItem(plugin.getDescriptor().id + ':video:' + escape(match[1]) + ":" + escape(match[2]), 'video', {
                title: new showtime.RichText((match[4].match(/>HD</) ? blueStr("HD ") : "") + match[2]),
                duration: trim(match[5]),
                description: new showtime.RichText("Views: " + blueStr(trim(match[6])) + "\nAdded: " + blueStr(trim(match[7]))),
                icon: match[3]
            });
            page.entries++;
            match = re.exec(bw);
        }
    }

    plugin.addURI(plugin.getDescriptor().id + ":start", function(page) {
        setPageHeader(page, plugin.getDescriptor().synopsis);
        page.appendItem(plugin.getDescriptor().id + ':videos:/videos:Videos', 'directory', {
            title: 'Videos',
            icon: logo
        });
        page.appendItem(plugin.getDescriptor().id + ':categories', 'directory', {
            title: 'Categories',
            icon: logo
        });
        page.appendItem(plugin.getDescriptor().id + ':channels', 'directory', {
            title: 'Channels',
            icon: logo
        });
        page.appendItem(plugin.getDescriptor().id + ':pornstars', 'directory', {
            title: 'Pornstars',
            icon: logo
        });

        var fromPage = 1, tryToSearch = true;
        function loader() {
            if (!tryToSearch) return false;
            if (fromPage == 1) { // Most viewed today
                page.loading = true;
                v = showtime.httpReq(BASE_URL).toString();
                page.loading = false;

                page.appendItem("", "separator", {
                    title: "Most viewed today:"
                });
                re = /class="swiper-slide"([\S\s]*?)class="swiper-pagination"/;
                scrape(page);
                page.appendItem("", "separator", {
                    title: "Recent videos:"
                });
                re = /class="grid ([\S\s]*?)class="pagination"/;
                scrape(page);
            } else {
                page.loading = true;
                v = showtime.httpReq(BASE_URL + '/videos?p=' + fromPage).toString();
                page.loading = false;
                re = /class="video_list"([\S\s]*?)class="pagination"/;
                scrape(page);
            }
            if (v.match(/"#" id="next"/)) return tryToSearch = false;
            fromPage++;
            return true;
        }
        loader();
        page.paginator = loader;
    });

    plugin.addSearcher(plugin.getDescriptor().title, logo, function(page, query) {
        page.entries = 0;
        var fromPage = 1, tryToSearch = true;

        function loader() {
          try {
            if (!tryToSearch) return false;
            page.loading = true;
            v = showtime.httpReq(BASE_URL + '/search?q=' + encodeURI(query) + "&p=" + fromPage).toString();
            page.loading = false;
            re = /<div class="col thumb_video"([\S\s]*?)class="pagination"/;
            scrape(page);
            if (v.match(/"#" id="next"/)) return tryToSearch = false;
            fromPage++;
            return true;
          } catch(err) {
            return tryToSearch = false;
          }
        };
        loader();
        page.paginator = loader;
    });
})(this);