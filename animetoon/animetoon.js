/**
 * Animetoon plugin for Showtime Media Center
 *
 *  Copyright (C) 2014 fdm
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
    var PLUGIN_PREFIX = "animetoon:";
    var SITE_URL = "http://animetoon.tv";
    var service = plugin.createService("Animetoon", PLUGIN_PREFIX + "start", "video", true, plugin.path + "animetoon.png");

    function getBetween(str0, str1, str2) {
        var tmp = str0.substring(str0.indexOf(str1) + str1.length, str0.length);
        return tmp.substring(0, tmp.indexOf(str2));
    }

    plugin.addURI(PLUGIN_PREFIX + "start", function(page) {
        page.type = "directory";
        page.metadata.title = 'Animetoon';
        page.appendItem(PLUGIN_PREFIX + "byletter:" + showtime.JSONEncode({
            type: "Dubbed Anime",
            postfix: "/dubbed-anime"
        }), "directory", {
            title: "Dubbed Anime"
        });
        page.appendItem(PLUGIN_PREFIX + "byletter:" + showtime.JSONEncode({
            type: "Cartoons",
            postfix: "/cartoon"
        }), "directory", {
            title: "Cartoon List"
        });
        page.appendItem(PLUGIN_PREFIX + "byletter:" + showtime.JSONEncode({
            type: "Movies",
            postfix: "/movies"
        }), "directory", {
            title: "Movie List"
        });
        page.loading = false;
    });

    plugin.addURI(PLUGIN_PREFIX + "byletter:(.*)", function(page, vars) {
        var type = showtime.JSONDecode(vars).type;
        var postfix = showtime.JSONDecode(vars).postfix;
        page.type = "directory";
        page.metadata.title = type + ' By Letter';
        page.appendItem(PLUGIN_PREFIX + "getlisting:" + showtime.JSONEncode({
            type: type,
            postfix: postfix,
            letter: "#"
        }), "directory", {
            title: "#"
        });
        for (var i = 0; i < 26; i++) {
            page.appendItem(PLUGIN_PREFIX + "getlisting:" + showtime.JSONEncode({
                type: type,
                postfix: postfix,
                letter: String.fromCharCode(i + 65)
            }), "directory", {
                title: String.fromCharCode(i + 65)
            });
        }
        page.loading = false;
    });

    plugin.addURI(PLUGIN_PREFIX + "getlisting:(.*)", function(page, vars) {
        var type = showtime.JSONDecode(vars).type;
        var postfix = showtime.JSONDecode(vars).postfix;
        var letter = showtime.JSONDecode(vars).letter;
        var prefix = "getepisodes:"
        if (type == "Movies") {
            prefix == "getmovies:"
        }
        page.type = "directory";
        page.metadata.title = type + " - " + letter;
        showtime.trace(SITE_URL + postfix);
        var html = showtime.httpGet(SITE_URL + postfix).toString();
        var capture = getBetween(html, "<h3 class=\"generic\">" + letter + "</h3>", "</table>");
        var segments = capture.split("<tr>")
        var left = new Array();
        var right = new Array();
        for (var i = 1; i < segments.length; i++) {
            var parts = segments[i].split("<td>")
            left[left.length] = [getBetween(parts[1], ">", "<"), getBetween(parts[1], "href=\"", "\"")];
            if (parts[2].indexOf("href=\"") != -1) {
                right[right.length] = [getBetween(parts[2], ">", "<"), getBetween(parts[2], "href=\"", "\"")];
            }
        }
        for (var y = 0; y < left.length; y++) {
            page.appendItem(PLUGIN_PREFIX + prefix + showtime.JSONEncode({
                title: left[y][0],
                link: left[y][1]
            }), "directory", {
                title: left[y][0]
            });
        }
        for (var z = 0; z < right.length; z++) {
            page.appendItem(PLUGIN_PREFIX + prefix + showtime.JSONEncode({
                title: right[z][0],
                link: right[z][1]
            }), "directory", {
                title: right[z][0]
            });
        }
        page.loading = false;
    });

    plugin.addURI(PLUGIN_PREFIX + "getepisodes:(.*)", function(page, vars) {
        var title = showtime.JSONDecode(vars).title;
        var link = showtime.JSONDecode(vars).link;
        page.type = "directory";
        page.metadata.title = title + " Episodes";
        showtime.trace(link);
        var html = showtime.httpGet(link).toString();
        while (true) {
            var capture = getBetween(html, "<div id=\"videos\">", "</div>");
            var segments = capture.split("<li>");
            for (var i = 1; i < segments.length; i++) {
                var eptitle = getBetween(segments[i], ">", "<");
                var eplink = getBetween(segments[i], "href=\"", "\"");
                page.appendItem(PLUGIN_PREFIX + "gethosts:" + showtime.JSONEncode({
                    title: eptitle,
                    link: eplink,
                    playlist: "",
                    round: "0"
                }), "directory", {
                    title: eptitle
                });
            }
            if (html.indexOf("<ul class=\"pagination\">") == -1) {
                break;
            }
            var tmp = getBetween(html, "<ul class=\"pagination\">", "</ul>");
            tmp = tmp.split("<li>")
            if (tmp[tmp.length - 1].indexOf("<a href=\"") == -1) {
                break;
            }
            var nextpage = getBetween(tmp[tmp.length - 1], "<a href=\"", "\"");
            html = showtime.httpGet(nextpage).toString();
            showtime.trace(nextpage);
        }
        page.loading = false;
    });

    plugin.addURI(PLUGIN_PREFIX + "getmovies:(.*)", function(page, vars) {
        var title = showtime.JSONDecode(vars).title;
        var link = showtime.JSONDecode(vars).link;
        page.type = "directory";
        page.metadata.title = title + " Groups";
        showtime.trace(link);
        var html = showtime.httpGet(link).toString();
        var capture = html.split("</h2>")[1];
        capture = getBetween(capture, "<ul>", "</ul>").split(".");
        var segments = capture.split("<li>");
        for (var i = 1; i < segments.length; i++) {
            var mvtitle = getBetween(segments[i], ">", "<");
            var mvlink = getBetween(segments[i], "href=\"", "\"");
            page.appendItem(PLUGIN_PREFIX + "gethosts:" + showtime.JSONEncode({
                title: mvtitle,
                link: mvlink,
                playlist: "",
                round: "0"
            }), "directory", {
                title: mvtitle
            });
        }
    });

    plugin.addURI(PLUGIN_PREFIX + "gethosts:(.*)", function(page, vars) {
        var title = showtime.JSONDecode(vars).title;
        var link = showtime.JSONDecode(vars).link;
        var playlist = showtime.JSONDecode(vars).playlist;
        var round = showtime.JSONDecode(vars).round;
        showtime.trace(link);
        var html = showtime.httpGet(link).toString();
        var segments = html.split("<span class=\"playlist\"");
        for (var i = 1; i < segments.length; i++) {
            if (round == "0") {
                page.type = "directory";
                page.metadata.title = title + " Links";
                var hostlink = getBetween(segments[i], "src=\"", "\"");
                var tmp = getBetween(hostlink, "//", "/").split(".");
                var hosttitle = tmp[tmp.length - 2]
                if (segments[i].indexOf("<ul class=\"part_list\">") == -1) {
                    page.appendItem(PLUGIN_PREFIX + "play:" + showtime.JSONEncode({
                        link: hostlink
                    }), "video", {
                        title: hosttitle
                    });
                } else {
                    playlist = getBetween(segments[i], ">", "<");
                    page.appendItem(PLUGIN_PREFIX + "gethosts:" + showtime.JSONEncode({
                        title: hosttitle,
                        link: link,
                        playlist: playlist,
                        round: "1"
                    }), "directory", {
                        title: hosttitle
                    });
                }
            } else if (round == "1") {
                page.type = "directory";
                page.metadata.title = title + " Playlists";
                if (playlist == getBetween(segments[i], ">", "<")) {
                    var partlist = getBetween(segments[i], "<ul class=\"part_list\">", "</ul>");
                    var segments2 = partlist.split("<li>");
                    for (var j = 1; j < segments2.length; j++) {
                        var parttitle = getBetween(segments2[j], ">", "<");
                        var partlink = getBetween(segments2[j], "href=\"", "\"");
                        page.appendItem(PLUGIN_PREFIX + "gethosts:" + showtime.JSONEncode({
                            title: parttitle,
                            link: partlink,
                            playlist: playlist,
                            round: "2"
                        }), "video", {
                            title: parttitle
                        });
                    }
                    break;
                }
            } else {
                if (playlist == getBetween(segments[i], ">", "<")) {
                    var hostlink = getBetween(segments[i], "src=\"", "\"");
                    playlink(page, hostlink);
                    return;
                }
            }
        }
        page.loading = false;
    });

    plugin.addURI(PLUGIN_PREFIX + "play:(.*)", function(page, vars) {
        var link = showtime.JSONDecode(vars).link;
        playlink(page, link);
    });

    function playlink(page, link) {
        showtime.trace(link);
        var html = showtime.httpGet(link).toString();
        var videoUrl = decodeURIComponent(getBetween(html, "_url = \"", "\""));
        showtime.trace(videoUrl);
        page.type = 'video';
        page.source = videoUrl;
        page.loading = false;
    }
})(this);