/**
 * Redtube plugin for Showtime
 *
 *  Copyright (C) 2014 lprot
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
    var pluginInfo = getDescriptor();
    var PREFIX = pluginInfo.id;
    var BASE_URL = 'http://www.redtube.com';
    var logo = plugin.path + "logo.png";
    var slogan = pluginInfo.synopsis;

    function fix_entity(doc) {
        doc = doc.replace(/\&Acirc;\&iexcl;/g, '\u00a1');
        doc = doc.replace(/\&Acirc;\&ordf;/g, '\u00aa');
        doc = doc.replace(/\&Acirc;\&deg;/g, '\u00b0');
        doc = doc.replace(/\&Atilde;\&nbsp;/g, '\u00e0');
        doc = doc.replace(/\&Atilde;\&iexcl;/g, '\u00e1');
        doc = doc.replace(/\&Atilde;\&cent;/g, '\u00e2');
        doc = doc.replace(/\&Atilde;\&pound;/g, '\u00e3');
        doc = doc.replace(/\&Atilde;\&curren;/g, '\u00e4');
        doc = doc.replace(/\&Atilde;\&yen;/g, '\u00e5');
        doc = doc.replace(/\&Atilde;\&sect;/g, '\u00e7');
        doc = doc.replace(/\&Atilde;\&uml;/g, '\u00e8');
        doc = doc.replace(/\&Atilde;\&copy;/g, '\u00e9');
        doc = doc.replace(/\&Atilde;\&ordf;/g, '\u00ea');
        doc = doc.replace(/\&Atilde;\&laquo;/g, '\u00eb');
        doc = doc.replace(/\&Atilde;\&reg;/g, '\u00ee');
        doc = doc.replace(/\&Atilde;\&shy;/g, '\u00ed');
        doc = doc.replace(/\&Atilde;\&plusmn;/g, '\u00f1');
        doc = doc.replace(/\&Atilde;\&sup3;/g, '\u00f3');
        doc = doc.replace(/\&Atilde;\&acute;/g, '\u00f4');
        doc = doc.replace(/\&Atilde;\&micro;/g, '\u00f5');
        doc = doc.replace(/\&Atilde;\&para;/g, '\u00f6');
        doc = doc.replace(/\&Atilde;\&ordm;/g, '\u00fa');
        doc = doc.replace(/\&Atilde;\&frac14;/g, '\u00fc');
        doc = doc.replace(/\&quot;/g, '\"');
        doc = doc.replace(/\&amp;/g, '&');
        doc = doc.replace(/\&gt;/g, '>');
        doc = doc.replace(/\&lt;/g, '<');
        doc = doc.replace(/\&#039;/g, '\'');
        doc = doc.replace(/\&#39;/g, '\'');
        if (doc.indexOf('\&Atilde;') != -1) showtime.message(doc, true, false);
        if (doc.indexOf('\&Acirc;') != -1) showtime.message(doc, true, false);
        return trim(doc);
    }

    // remove multiple, leading or trailing spaces and line feeds
    function trim(s) {
        return s.replace(/(\r\n|\n|\r)/gm, "").replace(/(^\s*)|(\s*$)/gi, "").replace(/[ ]{2,}/gi, " ");
    }

    var blue = "6699CC", orange = "FFA500";

    function coloredStr(str, color) {
        return '<font color="' + color + '">' + str + '</font>';
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

    var service = plugin.createService(pluginInfo.title, PREFIX + ":start", "video", true, logo);

    var settings = plugin.createSettings(pluginInfo.title, logo, slogan);

    function index_pornstars(page, url) {
        setPageHeader(page, 'Redtube - Pornstar Directory');
	var fromPage = 1, tryToSearch = true;
        // 1-link, 2-title, 3-icon, 4-num of videos
        var re = /<a href="([^"]+)" title="([^"]+)[\S\s]*?onclick="trackByCookie[\S\s]*?src="([^"]+)[\S\s]*?class="pornstar-stats">([\d^]+)\s/g;
        var re2 = /"Next Page"/;

        function loader() {
            if (!tryToSearch) return false;
            page.loading = true;
            var response = showtime.httpReq(url+'?page='+fromPage).toString();
            page.loading = false;
            if (fromPage == 1) {
                match = response.match(/categoryHeading">[\S\s^]*?([\d].*)\)/);
                if (match) if (page.metadata) page.metadata.title = "Redtube - Pornstar Directory - found (" + match[1].replace(",", "") + ") videos"
            };

            var match = re.exec(response);
            while (match) {
                page.appendItem(PREFIX + ":index:" + match[1] + '?:' + match[2], "video", {
                    title: new showtime.RichText(match[2] + coloredStr(' (' + match[4] + ')', orange)),
                    icon: match[3]
                });
                match = re.exec(response);
            }
            if (!re2.exec(response)) return tryToSearch = false;
            fromPage++;
            return true;
        }
        loader();
        page.paginator = loader;
    }

    function index(page, url, title) {
showtime.print('www');
        setPageHeader(page, title);
	var fromPage = 1, tryToSearch = true;
        //1-link, 2-title, 3-duration, 4-icon, 5-hd flag, 6-rating, 7-views
        var re = /first-in-row">[\S\s]*?<a href="([^"]+)" title="([^"]+)[\S\s]*?\'">([\S\s]*?)<\/span>[\S\s]*?data-src="([\S\s]*?)"([\S\s]*?)video-percent">([\S\s]*?)\%[\S\s]*?video-views">([\S\s]*?)<\/span>/g;
        var profile = "";

        function loader() {
            if (!tryToSearch) return false;
            page.loading = true;
            var response = showtime.httpReq(url + "page=" + fromPage).toString();
            response = response.match(/<ul class="video-listing([\S\s]*?)<div class="pages">/)[1].replace(/<\/li><li >/g, '<li class="first-in-row">');
            if (fromPage == 1) {
                var details = response.match(/<ul class="pornstar-details">([\S\s]*?)<\/ul>/);
                if (details) {
                   var re3 = /<span>([\S\s]*?)<\/span>([\S\s]*?)<\/li>/g;
                   var m = re3.exec(details[1]);
                   while (m) {
                         profile += " " + coloredStr(m[1], orange) + " " + trim(m[2]);
                         m = re3.exec(details[1]);
                   };
                };
            };
            page.loading = false;
            var match = re.exec(response);
            while (match) {
                page.appendItem(PREFIX + ":play:" + escape(match[1]) + ":" + escape(match[2]), "video", {
                    title: new showtime.RichText((match[5].match(/hd-video/) ? coloredStr('HD ', orange) : '') + match[2] + coloredStr(' (' + match[3] + ')', orange)),
                    icon: match[4],
                    description: new showtime.RichText(trim(match[7])+ profile),
                    genre: 'Adult',
                    duration: match[3],
                    rating: +match[6]
                });
                match = re.exec(response);
            }
            if (!response.match(/"Next Page/)) return tryToSearch = false;
            fromPage++;
            return true;
        }
        loader();
        page.paginator = loader;
    }

    plugin.addURI(PREFIX + ":categoriesAPI", function(page) {
        setPageHeader(page, 'Redtube - Categories');
        //Getting pictures
        page.loading = true;
        var response = showtime.httpReq(BASE_URL + "/channels");
        page.loading = false;
        var re = /class="video">[\S\s]*?<a href="([^"]+)" title="([^"]+)[\S\s]*?src="([^"]+)[\S\s]*?numberVideos">[\S\s]*?([0-9].*)\sVideos/g;
        var match = re.exec(response);
        page.loading = true;
        var jsonobj = showtime.JSONDecode(showtime.httpReq("http://api.redtube.com/?data=redtube.Categories.getCategoriesList&output=json").toString());
        page.loading = false;
	var lastIcon;
        for (var i in jsonobj.categories) {
            page.appendItem(PREFIX + ':search:category=' + escape(jsonobj.categories[i].category), 'video', {
                title: jsonobj.categories[i].category,
                icon: (jsonobj.categories[i].category == 'japanesecensored') ? lastIcon : match[3]
            });
	    lastIcon = match[3];
            if (jsonobj.categories[i].category == 'japanesecensored') continue;
            match = re.exec(response);
        }
    });

    plugin.addURI(PREFIX + ":categories", function(page) {
        setPageHeader(page, 'Redtube - Categories');
        page.loading = true;
        var response = showtime.httpReq(BASE_URL + "/channels");
        page.loading = false;
        var re = /class="video">[\S\s]*?<a href="([^"]+)" title="([^"]+)[\S\s]*?src="([^"]+)[\S\s]*?numberVideos">[\S\s]*?([0-9].*)\sVideos/g;
        var match = re.exec(response);
        while (match) {
            page.appendItem(PREFIX + ":sorting:" + match[1] + ":" + match[2], "video", {
                title: new showtime.RichText(match[2] + coloredStr(' (' + match[4].replace(',', '') + ')', orange)),
                icon: match[3]
            });
            match = re.exec(response);
        }
    });

    // For sorting selected category
    plugin.addURI(PREFIX + ":sorting:(.*):(.*)", function(page, uri, name) {
        setPageHeader(page, 'Redtube - ' + name);
        page.loading = false;
        page.appendItem(PREFIX + ':index:' + uri + '?:Newest videos', 'directory', {
            title: "Newest videos",
            icon: logo
        });
        page.appendItem(PREFIX + ':index:' + uri + '?sorting=rating&:Top rated', 'directory', {
            title: "Top rated",
            icon: logo
        });
        page.appendItem(PREFIX + ':index:' + uri + '?sorting=mostviewed&:Most viewed', 'directory', {
            title: "Most viewed",
            icon: logo
        });
        page.appendItem(PREFIX + ':index:' + uri + '?sorting=mostfavored&:Most favored', 'directory', {
            title: "Most favored",
            icon: logo
        });
    });

    // Index page at URL
    plugin.addURI(PREFIX + ":index:(.*):(.*)", function(page, url, title) {
        index(page, BASE_URL + url, title);
    });

    // Index Pornstar Directory page
    plugin.addURI(PREFIX + ":index_stars:(.*)", function(page, url) {
        index_pornstars(page, BASE_URL + url);
    });

    plugin.addURI(PREFIX + ":tags", function(page) {
        setPageHeader(page, 'Redtube - Tags');
        page.loading = true;
        var jsonobj = showtime.JSONDecode(showtime.httpReq("http://api.redtube.com/?data=redtube.Tags.getTagList&output=json").toString());
        page.loading = false;
        for (var i in jsonobj.tags) {
            page.appendItem(PREFIX + ':search:tags[]=' + escape(jsonobj.tags[i].tag.tag_name), 'directory', {
                title: jsonobj.tags[i].tag.tag_name,
                icon: logo
            })
        }
    });

    plugin.addURI(PREFIX + ":stars", function(page) {
        page.loading = true;
        var jsonobj = showtime.JSONDecode(showtime.httpReq("http://api.redtube.com/?data=redtube.Stars.getStarList&output=json").toString());
        page.loading = false;
        if (!jsonobj) return;
        var starCounter = 0;
        for (var i in jsonobj.stars) starCounter++;
        page.entries = starCounter;
        setPageHeader(page, 'Redtube - Stars (found ' + starCounter + ' stars)');
        var offset = 0;

        function showPage() {
            var itemCounter = 0;
            while ((itemCounter < 20) && (offset < starCounter)) {
                page.appendItem(PREFIX + ':search:stars[]=' + escape(jsonobj.stars[offset].star.star_name), 'directory', {
                    title: jsonobj.stars[offset].star.star_name,
                    icon: logo
                });
                itemCounter++;
                offset++;
            }
            return offset < starCounter;
        }

        showPage();
        page.paginator = showPage;
    });

    function getTimestamp(str) {
        if (!str) return 0;
        var d = str.match(/\d+/g); // extract date parts
        return +Date.UTC(d[0], d[1] - 1, d[2], d[3], d[4], d[5]) / 1000;
    }

    function scraper(page, url, query) {
        url = unescape(url);
        query = unescape(query);
        var pageNum = 0, offset = 0;

        function loader() {
            pageNum++;
            page.loading = true;
            var jsonobj = showtime.JSONDecode(showtime.httpReq(url + query + "&page=" + pageNum).toString());
            page.loading = false;
            if (!jsonobj.videos) return -1;
            setPageHeader(page, 'Redtube - Search (found ' + jsonobj.count + ' videos)');
            for (var i in jsonobj.videos) {
                var description = coloredStr('Video ID: ', orange) + jsonobj.videos[i].video.video_id +
                    coloredStr(' Views: ', orange) + jsonobj.videos[i].video.views +
                    coloredStr(' Ratings: ', orange) + jsonobj.videos[i].video.ratings + '\n';

                var stars = 0;
                if (jsonobj.videos[i].video.stars) {
                    stars = '';
                    for (var j in jsonobj.videos[i].video.stars) {
                        if (stars) stars += ", ";
                        stars += jsonobj.videos[i].video.stars[j].star_name;
                    };
                };
                if (stars) description += coloredStr('Starring: ', orange) + stars + '.\n';

                var tags = 0;
                if (jsonobj.videos[i].video.tags) {
                    tags = '';
                    for (var j in jsonobj.videos[i].video.tags) {
                        if (tags) tags += ", ";
                        tags += jsonobj.videos[i].video.tags[j].tag_name;
                    };
                };
                if (tags) description += coloredStr('Tags: ', orange) + tags + '.';

                if (jsonobj.videos[i].video.title)
                    var title = jsonobj.videos[i].video.title
                else {
                    page.loading = true;
                    var title = showtime.JSONDecode(showtime.httpReq("http://api.redtube.com/?data=redtube.Videos.getVideoById&video_id=" + jsonobj.videos[i].video.video_id + "&output=json&thumbsize=none").toString());
                    page.loading = false;
                    title = title.video.title
                }
                title = showtime.entityDecode(fix_entity(title));
                page.appendItem(PREFIX + ":play:" + jsonobj.videos[i].video.video_id + ":" + escape(title), "video", {
                    title: new showtime.RichText(title + coloredStr(' (' + jsonobj.videos[i].video.duration + ')', orange)),
                    rating: +(jsonobj.videos[i].video.rating) * 20,
                    icon: jsonobj.videos[i].video.default_thumb,
                    duration: jsonobj.videos[i].video.duration,
                    year: jsonobj.videos[i].video.publish_date ? +parseInt(jsonobj.videos[i].video.publish_date) : 0,
                    timestamp: getTimestamp(jsonobj.videos[i].video.publish_date),
                    genre: jsonobj.videos[i].video.tags ? jsonobj.videos[i].video.tags[0].tag_name : 0,
                    description: new showtime.RichText(description)
                });
                offset++;
            };
            page.entries = jsonobj.count;
            return offset < page.entries;
        }
        loader();
        page.paginator = loader;
    };

    plugin.addURI(PREFIX + ":search:(.*)", function(page, query) {
        scraper(page, escape("http://api.redtube.com/?data=redtube.Videos.searchVideos&output=json&thumbsize=none&"), escape(query))
    });

    plugin.addURI(PREFIX + ":play:(.*):(.*)", function(page, video_id, title) {
        page.loading = true;
	var link = showtime.httpReq("http://www.redtube.com/" + video_id).toString().match(/vpVideoSource[\S\s]*?"([\S\s]*?)"/);
        page.loading = false;
        page.type = "video";
        page.source = "videoparams:" + showtime.JSONEncode({
            title: unescape(title),
            canonicalUrl: PREFIX + ":play:" + video_id + ":" + title,
            sources: [{
                url: unescape(link[1]).replace(/\\/g,'')
            }]
        });
    });

    plugin.addURI(PREFIX + ":start", function(page) {
        setPageHeader(page, slogan);

        page.appendItem(PREFIX + ':index:/?:Newest videos', 'directory', {
            title: 'Newest videos',
            icon: logo
        });
        page.appendItem(PREFIX + ':index:/top?:Top rated', 'directory', {
            title: 'Top rated (weekly)',
            icon: logo
        });
        page.appendItem(PREFIX + ':index:/top?period=monthly&:Top rated (monthly)', 'directory', {
            title: 'Top rated (monthly)',
            icon: logo
        });
        page.appendItem(PREFIX + ':index:/top?period=alltime&:Top rated (all time)', 'directory', {
            title: 'Top rated (all time)',
            icon: logo
        });
        page.appendItem(PREFIX + ':index:/mostviewed?:Most viewed (weekly)', 'directory', {
            title: 'Most viewed (weekly)',
            icon: logo
        });
        page.appendItem(PREFIX + ':index:/mostviewed?period=monthly&:Most viewed (monthly)', 'directory', {
            title: 'Most viewed (monthly)',
            icon: logo
        });
        page.appendItem(PREFIX + ':index:/mostviewed?period=alltime&:Most viewed (all time)', 'directory', {
            title: 'Most viewed (all time)',
            icon: logo
        });
        page.appendItem(PREFIX + ':index:/mostfavored?:Most favored (weekly)', 'directory', {
            title: 'Most favored (weekly)',
            icon: logo
        });
        page.appendItem(PREFIX + ':index:/mostfavored?period=monthly&:Most favored (monthly)', 'directory', {
            title: 'Most favored (monthly)',
            icon: logo
        });
        page.appendItem(PREFIX + ':index:/mostfavored?period=alltime&:Most favored (all time)', 'directory', {
            title: 'Most favored (all time)',
            icon: logo
        });
        page.appendItem(PREFIX + ':categories', 'directory', {
            title: 'Categories',
            icon: logo
        });
        page.appendItem(PREFIX + ':categoriesAPI', 'directory', {
            title: 'Categories (API)',
            icon: logo
        });
        page.appendItem(PREFIX + ':tags', 'directory', {
            title: 'Tags',
            icon: logo
        });
        page.appendItem(PREFIX + ':index_stars:/pornstar/alphabetical', 'directory', {
            title: 'Pornstar Directory (Female by Alphabet)',
            icon: logo
        });
        page.appendItem(PREFIX + ':index_stars:/pornstar', 'directory', {
            title: 'Pornstar Directory (Female by Videocount)',
            icon: logo
        });
        page.appendItem(PREFIX + ':index_stars:/pornstar/alphabetical/male', 'directory', {
            title: 'Pornstar Directory (Male by Alphabet)',
            icon: logo
        });
        page.appendItem(PREFIX + ':index_stars:/pornstar/male', 'directory', {
            title: 'Pornstar Directory (Male by Videocount)',
            icon: logo
        });
        page.appendItem(PREFIX + ':index_stars:/pornstar/alphabetical/all', 'directory', {
            title: 'Pornstar Directory (All by Alphabet)',
            icon: logo
        });
        page.appendItem(PREFIX + ':index_stars:/pornstar/all', 'directory', {
            title: 'Pornstar Directory (All by Videocount)',
            icon: logo
        });

        page.appendItem(PREFIX + ':stars', 'directory', {
            title: 'Stars',
            icon: logo
        });
    });

    plugin.addSearcher(pluginInfo.title, logo, function(page, query) {
        scraper(page, escape("http://api.redtube.com/?data=redtube.Videos.searchVideos&output=json&thumbsize=none&search="), escape(query.replace(/\s/g, '\+')));
    });
})(this);