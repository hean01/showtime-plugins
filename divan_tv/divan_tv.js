/**
 * divan.tv plugin for Showtime
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
 *  along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

(function(plugin) {
    var plugin_info = getDescriptor();
    var PREFIX = 'divan_tv';
    var BASE_URL = 'http://p.divan.tv/jsonrpc';
    var logo = plugin.path + "logo.png";
    var slogan = plugin_info.synopsis;

    function trim(s) {
        return s.replace(/(\r\n|\n|\r)/gm, "").replace(/(^\s*)|(\s*$)/gi, "").replace(/[ ]{2,}/gi, " ").replace(/\t/, '');
    }

    function blueStr(str) {
        return '<font color="6699CC"> (' + str + ')</font>';
    }

    var blue = "6699CC", orange = "FFA500";

    function colorStr(str, color) {
        return '<font color="' + color + '"> (' + str + ')</font>';
    }

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

    var service = plugin.createService("divan.tv", PREFIX + ":start", "video", true, logo);

    // Index media by id
    plugin.addURI(PREFIX + ":index:(.*):(.*)", function(page, id, title) {
        setPageHeader(page, unescape(title));
        page.loading = true;
        var json = showtime.JSONDecode(showtime.httpReq(BASE_URL, {
            postdata: '{"method":"getChannelInfoById","Params":{"baseClientKey":"6838b9dca903f24bbe1edc1e12dd795b","id":'+id+',"login":null,"userKey":null,"ip":null,"mobile":true,"international":false}}'
        }));
        var lnk = "videoparams:" + showtime.JSONEncode({
            title: unescape(title),
            //canonicalUrl: PREFIX + ":play:" + id + ":" + title,
            sources: [{
                url: "hls:" + json.stream
            }]
        });

        page.appendItem(lnk, 'video', {
              title: json.name,
                  description: new showtime.RichText(json.description),
                  icon: json.image,
                  rating: json.rating*10
        });
        page.loading = false;
    });

    plugin.addURI(PREFIX + ":start", function(page) {
        setPageHeader(page, slogan);
        var totalItems, counter = 50, offset = 50, tryToSearch = true;
        function loader() {
            if (!tryToSearch) return false;
            page.loading = true;
            var json;
            if (offset == 50) {
                json = showtime.JSONDecode(showtime.httpReq(BASE_URL, {
                    postdata: '{"method":"getFilteredChannelsAndNewFilters","Params":{"isFree":null,"categoryIDs":null,"count":50,"needProgram":false,"mobile":true,"international":false,"baseClientKey":"6838b9dca903f24bbe1edc1e12dd795b"}}'
                }));
                totalItems = json.count;
            } else {
                json = showtime.JSONDecode(showtime.httpReq(BASE_URL, {
                    postdata: '{"method":"getFilteredChannels","Params":{"isFree":null,"categoryIDs":null,"count":50,"offset":'+offset+',"mobile":true,"international":false,"baseClientKey":"6838b9dca903f24bbe1edc1e12dd795b"}}'
                }));
            }
            page.loading = false;
            if (offset == 50) {
                for (i in json.channels) {
                    page.appendItem(PREFIX + ':index:' + json.channels[i].id + ':' + escape(json.channels[i].name), 'video', {
                        title: json.channels[i].name,
                        icon: json.channels[i].image,
                        rating: json.channels[i].rating * 10
                    });
                    counter++;
                }
            } else {
                for (i in json) {
                    page.appendItem(PREFIX + ':index:' + json[i].id + ':' + escape(json[i].name), 'video', {
                        title: json[i].name,
                        icon: json[i].image,
                        rating: json[i].rating * 10
                    });
                    counter++;
                }
            };
            if (counter >= totalItems) return tryToSearch = false;
            offset += 50;
            return true;
        }
        loader();
        page.loading = false;
        page.paginator = loader;
    });
})(this);