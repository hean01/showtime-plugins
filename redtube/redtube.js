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

    var PREFIX = 'redtube';

    var logo = plugin.path + "logo.png";

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
            var pin = plugin.cacheGet("PIN", "Value");
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

    function unHTML(str) {
	str = str.replace(/\&circ;/g,'\^');
	str = str.replace(/\&tilde;/g,'\~');
	str = str.replace(/\&quot;/g,'\"');
	str = str.replace(/\&amp;/g,'&');
	str = str.replace(/\&gt;/g,'>');
	str = str.replace(/\&lt;/g,'<');
	str = str.replace(/\&#039;/g,'\'');
	str = str.replace(/\&#39;/g,'\'');
	return str;
    }

    function startPage(page) {
        if (!parental_control(page)) {
            page.loading = false;
            return;
        };

        setPageHeader(page, 'Redtube - Home Page');
        page.appendItem(PREFIX + ':categories', 'directory', {
            title: 'Categories'
        });
        page.appendItem(PREFIX + ':tags', 'directory', {
            title: 'Tags'
        });
        page.appendItem(PREFIX + ':stars', 'directory', {
            title: 'Stars'
        });
        page.loading = false;
    };

    plugin.addURI(PREFIX + ":categories", function(page) {
        setPageHeader(page, 'Redtube - Categories');
        var jsonobj = showtime.JSONDecode(showtime.httpGet("http://api.redtube.com/?data=redtube.Categories.getCategoriesList&output=json").toString());
        for (var i in jsonobj.categories) {
            page.appendItem(PREFIX + ':search:category=' + escape(jsonobj.categories[i].category), 'directory', {
                title: jsonobj.categories[i].category
            })
        }
        page.loading = false;
    });

    plugin.addURI(PREFIX + ":tags", function(page) {
        setPageHeader(page, 'Redtube - Tags');
        var jsonobj = showtime.JSONDecode(showtime.httpGet("http://api.redtube.com/?data=redtube.Tags.getTagList&output=json").toString());
        for (var i in jsonobj.tags) {
            page.appendItem(PREFIX + ':search:tags[]=' + escape(jsonobj.tags[i].tag.tag_name), 'directory', {
                title: jsonobj.tags[i].tag.tag_name
            })
        }
        page.loading = false;
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
                    title: jsonobj.stars[offset].star.star_name
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
        if (!str) return false;
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
                var description = '<font size="4" color="6699CC">Video ID: </font><font size="4">' + jsonobj.videos[i].video.video_id + '</font>\n\n';
                description += '<font size="4" color="6699CC">Views: </font><font size="4">' + jsonobj.videos[i].video.views + '</font>\n\n';
                description += '<font size="4" color="6699CC">Ratings: </font><font size="4">' + jsonobj.videos[i].video.ratings + '</font>\n\n';

                var stars = 0;
                if (jsonobj.videos[i].video.stars) {
                    stars = '';
                    for (var j in jsonobj.videos[i].video.stars) {
                        if (stars) stars += ", ";
                        stars += jsonobj.videos[i].video.stars[j].star_name;
                    };
                };
                if (stars) description += '<font size="4" color="6699CC">Starring: </font><font size="4">' + stars + '.</font>\n\n';

                var tags = 0;
                if (jsonobj.videos[i].video.tags) {
                    tags = '';
                    for (var j in jsonobj.videos[i].video.tags) {
                        if (tags) tags += ", ";
                        tags += jsonobj.videos[i].video.tags[j].tag_name;
                    };
                };
                if (tags) description += '<font size="4" color="6699CC">Tags: </font><font size="4">' + tags + '.</font>\n';

                var title = (!jsonobj.videos[i].video.title) ? "Unnamed video" : jsonobj.videos[i].video.title;
		title = unHTML(title);
                page.appendItem(PREFIX + ":play:" + jsonobj.videos[i].video.video_id + ":" + escape(title), "video", {
                    title: new showtime.RichText(title + '<font size="3" color="6699CC"> ( ' + jsonobj.videos[i].video.duration + ' )</font>'),
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
        var re = /flv_h264_url\=(.*?)\&/i;
        var m = re.exec(showtime.httpGet("http://www.redtube.com/" + video_id).toString());
        page.type = "video";
        page.source = "videoparams:" + showtime.JSONEncode({
            title: unescape(title),
            sources: [{
                url: unescape(m[1])
            }]
        });
        page.loading = false;
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
            preparePage(page, escape("http://api.redtube.com/?data=redtube.Videos.searchVideos&output=json&thumbsize=none&search="), escape(query));
        } catch (err) {
            showtime.trace('Redtube - Searcher error: ' + err)
        }
    });

})(this);
