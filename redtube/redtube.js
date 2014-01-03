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

    var PREFIX = 'redtube';
    var BASE_URL = 'http://www.redtube.com';

    var logo = plugin.path + "logo.png";

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
        return doc;
    }

    function setPageHeader(page, title) {
        if (page.metadata) {
            page.metadata.title = title;
            page.metadata.logo = logo;
        }
        page.type = "directory";
        page.contents = "items";
    }

    var service = plugin.createService("Redtube", PREFIX + ":start", "video", true, logo);

    var settings = plugin.createSettings("Redtube", plugin.path + "logo.png", "Redtube: Home of free porn videos");

    settings.createDivider('Parental control');
    settings.createBool("parental", "Parental control", true, function(v) {
        service.parental = v;
    });

    settings.createString("pin", "PIN", "0000", function(v) {
        service.pin = v;
    });

    settings.createDivider('Searching control');
    settings.createBool("searcher", "Search enabled", true, function(v) {
        service.searcher = v;
    });

    function parental_control(page) {
        if (service.parental) {
            try {
                var pin = plugin.cacheGet("PIN", "Value");
            } catch (err) {}
            if ((pin) && (service.pin == pin.pin)) return true;
            var res = showtime.textDialog('Redtube parental control. Enter PIN: ', true, true);
            plugin.cachePut("PIN", "Value", {
                pin: res.input
            }, 3600); // 1 hour
            if ((res.rejected) || (res.input != service.pin)) {
                page.error("Wrong PIN");
                return false;
            }
        }
        return true;
    };

    function startPage(page) {
        if (!parental_control(page)) {
            page.loading = false;
            return;
        };
        setPageHeader(page, 'Redtube - Home Page');
        page.loading = false;
        page.appendItem(PREFIX + ':index:/?', 'directory', {
            title: 'Newest Videos',
            icon: logo
        });
        page.appendItem(PREFIX + ':index:/top?', 'directory', {
            title: 'Top rated: Weekly',
            icon: logo
        });
        page.appendItem(PREFIX + ':index:/top?period=monthly&', 'directory', {
            title: 'Top rated: Monthly',
            icon: logo
        });
        page.appendItem(PREFIX + ':index:/top?period=alltime&', 'directory', {
            title: 'Top rated: All time',
            icon: logo
        });
        page.appendItem(PREFIX + ':index:/mostviewed?', 'directory', {
            title: 'Most Viewed: Weekly',
            icon: logo
        });
        page.appendItem(PREFIX + ':index:/mostviewed?period=monthly&', 'directory', {
            title: 'Most Viewed: Monthly',
            icon: logo
        });
        page.appendItem(PREFIX + ':index:/mostviewed?period=alltime&', 'directory', {
            title: 'Most Viewed: All time',
            icon: logo
        });
        page.appendItem(PREFIX + ':index:/mostfavored?', 'directory', {
            title: 'Most Favored: Weekly',
            icon: logo
        });
        page.appendItem(PREFIX + ':index:/mostfavored?period=monthly&', 'directory', {
            title: 'Most Favored: Monthly',
            icon: logo
        });
        page.appendItem(PREFIX + ':index:/mostfavored?period=alltime&', 'directory', {
            title: 'Most Favored: All time',
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
        page.appendItem(PREFIX + ':index_stars:/pornstar', 'directory', {
            title: 'Pornstar Directory (Female by Alphabet)',
            icon: logo
        });
        page.appendItem(PREFIX + ':index_stars:/pornstar/videocount', 'directory', {
            title: 'Pornstar Directory (Female by Videocount)',
            icon: logo
        });
        page.appendItem(PREFIX + ':index_stars:/pornstar/male', 'directory', {
            title: 'Pornstar Directory (Male by Alphabet)',
            icon: logo
        });
        page.appendItem(PREFIX + ':index_stars:/pornstar/videocount/male', 'directory', {
            title: 'Pornstar Directory (Male by Videocount)',
            icon: logo
        });
        page.appendItem(PREFIX + ':index_stars:/pornstar/all', 'directory', {
            title: 'Pornstar Directory (All by Alphabet)',
            icon: logo
        });
        page.appendItem(PREFIX + ':index_stars:/pornstar/videocount/all', 'directory', {
            title: 'Pornstar Directory (All by Videocount)',
            icon: logo
        });

        page.appendItem(PREFIX + ':stars', 'directory', {
            title: 'Stars',
            icon: logo
        });
    };

    function index_pornstars(page, url) {
        setPageHeader(page, 'Redtube - Pornstar Directory');
        var offset = 0;
        if (page.metadata) var title = page.metadata.title;
        var response = showtime.httpGet(url).toString();

        function loader() {
            var items = 0;
            var re = /class="pornStar">[\S\s]*?<a href="([^"]+)" title="([^"]+)[\S\s]*?src="([^"]+)[\S\s]*?class="videosCount">([\d^\s]+)\s/g;
            var match = re.exec(response);
            while (match) {
                page.appendItem(PREFIX + ":index:" + match[1] + '?', "video", {
                    title: new showtime.RichText(match[2] + '<font color="6699CC"> (' + match[4] + ')</font>'),
                    icon: match[3]
                });
                offset++;
                items++;
                if (items > 50) {
                    break;
                };
                match = re.exec(response);
            }

            re = /categoryHeading">[\S\s^]*?([\d].*)\)/;
            match = re.exec(response);
            if (match) {
                page.entries = match[1].replace(",", "");
                if (page.metadata) page.metadata.title = title + " - found (" + match[1].replace(",", "") + ") videos"
            }
            return offset < page.entries;
        }
        loader();
        page.loading = false;
        page.paginator = loader;
    }

    function index(page, url) {
        setPageHeader(page, '');
        var offset = 0;
        var p = 1;

        function loader() {
            var response = showtime.httpGet(url + "page=" + p).toString();
            var re = /categoryHeading">([\S\s]*?)\</;
            var match = re.exec(response);
            if (match) if (page.metadata) page.metadata.title = match[1];
            re = /class="video">[\S\s]*?<a href="([^"]+)" title="([^"]+)[\S\s]*?src="([^"]+)[\S\s]*?class="d">([^\<]+)[\S\s]*?;">[\S\s]*?([0-9^\<].*)[\S\s]*?;">[\S\s]*?([0-9].*)\s/g;
            match = re.exec(response);
            while (match) {
                page.appendItem(PREFIX + ":play:" + escape(match[1]) + ":" + escape(match[2]), "video", {
                    title: new showtime.RichText(match[2] + '<font color="6699CC"> (' + match[4] + ')</font>'),
                    icon: match[3],
                    description: new showtime.RichText(match[6]),
                    genre: 'Adult',
                    duration: match[4],
                    rating: +(match[5]) * 20
                });
                match = re.exec(response);
            }
            p++;
            var re = /><b>Next<\/b>/;
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

    plugin.addURI(PREFIX + ":categoriesAPI", function(page) {
        setPageHeader(page, 'Redtube - Categories');
        //Getting pictures
        var response = showtime.httpGet(BASE_URL + "/channels");
        page.loading = false;
        var re = /class="video">[\S\s]*?<a href="([^"]+)" title="([^"]+)[\S\s]*?src="([^"]+)[\S\s]*?numberVideos">[\S\s]*?([0-9].*)\sVideos/g;
        var match = re.exec(response);
        var jsonobj = showtime.JSONDecode(showtime.httpGet("http://api.redtube.com/?data=redtube.Categories.getCategoriesList&output=json").toString());
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
        var response = showtime.httpGet(BASE_URL + "/channels");
        page.loading = false;
        var re = /class="video">[\S\s]*?<a href="([^"]+)" title="([^"]+)[\S\s]*?src="([^"]+)[\S\s]*?numberVideos">[\S\s]*?([0-9].*)\sVideos/g;
        var match = re.exec(response);
        while (match) {
            page.appendItem(PREFIX + ":sorting:" + match[1] + ":" + match[2], "video", {
                title: new showtime.RichText(match[2] + '<font color="6699CC"> (' + match[4].replace(',', '') + ')</font>'),
                icon: match[3]
            });
            match = re.exec(response);
        }
    });

    // For sorting selected category
    plugin.addURI(PREFIX + ":sorting:(.*):(.*)", function(page, uri, name) {
        setPageHeader(page, 'Redtube - ' + name);
        page.loading = false;
        page.appendItem(PREFIX + ':index:' + uri + '?', 'directory', {
            title: "Newest Videos",
            icon: logo
        });
        page.appendItem(PREFIX + ':index:' + uri + '?sorting=rating&', 'directory', {
            title: "Top rated",
            icon: logo
        });
        page.appendItem(PREFIX + ':index:' + uri + '?sorting=mostviewed&', 'directory', {
            title: "Most Viewed",
            icon: logo
        });
        page.appendItem(PREFIX + ':index:' + uri + '?sorting=mostfavored&', 'directory', {
            title: "Most Favored",
            icon: logo
        });
    });

    // Index page at URL
    plugin.addURI(PREFIX + ":index:(.*)", function(page, url) {
        index(page, BASE_URL + url);
    });

    // Index Pornstar Directory page
    plugin.addURI(PREFIX + ":index_stars:(.*)", function(page, url) {
        index_pornstars(page, BASE_URL + url);
    });

    plugin.addURI(PREFIX + ":tags", function(page) {
        setPageHeader(page, 'Redtube - Tags');
        var jsonobj = showtime.JSONDecode(showtime.httpGet("http://api.redtube.com/?data=redtube.Tags.getTagList&output=json").toString());
        page.loading = false;
        for (var i in jsonobj.tags) {
            page.appendItem(PREFIX + ':search:tags[]=' + escape(jsonobj.tags[i].tag.tag_name), 'directory', {
                title: jsonobj.tags[i].tag.tag_name,
                icon: logo
            })
        }
    });

    plugin.addURI(PREFIX + ":stars", function(page) {
        var jsonobj = showtime.JSONDecode(showtime.httpGet("http://api.redtube.com/?data=redtube.Stars.getStarList&output=json").toString());
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
        page.loading = false;
    });

    function getTimestamp(str) {
        if (!str) return 0;
        var d = str.match(/\d+/g); // extract date parts
        return +Date.UTC(d[0], d[1] - 1, d[2], d[3], d[4], d[5]) / 1000;
    }

    function preparePage(page, url, query) {
        url = unescape(url);
        query = unescape(query);
        var pageNum = 0;
        var offset = 0;

        function showPage() {
            pageNum++;
            var jsonobj = showtime.JSONDecode(showtime.httpGet(url + query + "&page=" + pageNum).toString());
            if (!jsonobj.videos) return -1;
            setPageHeader(page, 'Redtube - Search (found ' + jsonobj.count + ' videos)');
            for (var i in jsonobj.videos) {
                var description = '<font color="6699CC">Video ID: </font>' + jsonobj.videos[i].video.video_id + ' ';
                description += '<font color="6699CC">Views: </font>' + jsonobj.videos[i].video.views + ' ';
                description += '<font color="6699CC">Ratings: </font>' + jsonobj.videos[i].video.ratings + '\n';

                var stars = 0;
                if (jsonobj.videos[i].video.stars) {
                    stars = '';
                    for (var j in jsonobj.videos[i].video.stars) {
                        if (stars) stars += ", ";
                        stars += jsonobj.videos[i].video.stars[j].star_name;
                    };
                };
                if (stars) description += '<font color="6699CC">Starring: </font>' + stars + '.\n';

                var tags = 0;
                if (jsonobj.videos[i].video.tags) {
                    tags = '';
                    for (var j in jsonobj.videos[i].video.tags) {
                        if (tags) tags += ", ";
                        tags += jsonobj.videos[i].video.tags[j].tag_name;
                    };
                };
                if (tags) description += '<font color="6699CC">Tags: </font>' + tags + '.';

                if (jsonobj.videos[i].video.title) var title = jsonobj.videos[i].video.title
                else {
                    var title = showtime.JSONDecode(showtime.httpGet("http://api.redtube.com/?data=redtube.Videos.getVideoById&video_id=" + jsonobj.videos[i].video.video_id + "&output=json&thumbsize=none").toString());
                    title = title.video.title
                }
                title = showtime.entityDecode(fix_entity(title));
                page.appendItem(PREFIX + ":play:" + jsonobj.videos[i].video.video_id + ":" + escape(title), "video", {
                    title: new showtime.RichText(title + '<font color="6699CC"> ( ' + jsonobj.videos[i].video.duration + ' )'),
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

        showPage();
        page.paginator = showPage;
        page.loading = false;
    };

    plugin.addURI(PREFIX + ":search:(.*)", function(page, query) {
        preparePage(page, escape("http://api.redtube.com/?data=redtube.Videos.searchVideos&output=json&thumbsize=none&"), escape(query))
    });

    plugin.addURI(PREFIX + ":play:(.*):(.*)", function(page, video_id, title) {
        page.loading = false;
        var re = /flv_h264_url=(.*?)&/;
        var re2 = /flv_url=(.*?)&/;
	var st = showtime.httpGet("http://www.redtube.com/" + video_id).toString();
        var m = re.exec(st);
	if (showtime.probe(unescape(m[1])).result != 0) {
		m = re2.exec(st);
	}
        page.type = "video";
        page.source = "videoparams:" + showtime.JSONEncode({
            title: unescape(title),
            canonicalUrl: PREFIX + ":play:" + video_id + ":" + title,
            sources: [{
                url: unescape(m[1])
            }]
        });
    });

    plugin.addURI(PREFIX + ":start", startPage);

    plugin.addSearcher("Redtube - Videos", logo,

    function(page, query) {
        if (!service.searcher) return;
        if (!parental_control(page)) {
            page.loading = false;
            return;
        };
        try {
            preparePage(page, escape("http://api.redtube.com/?data=redtube.Videos.searchVideos&output=json&thumbsize=none&search="), escape(query.replace(/\s/g, '\+')));
        } catch (err) {
            showtime.trace('Redtube - Searcher error: ' + err)
        }
    });

})(this);
