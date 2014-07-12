/**
 * xxx-tracker.com plugin for Showtime
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
    var plugin_info = plugin.getDescriptor();
    var PREFIX = plugin_info.id;
    var BASE_URL = 'http://xxx-tracker.com';
    var logo = plugin.path + "logo.png";
    var slogan = plugin_info.synopsis;

    var blue = '6699CC', orange = 'FFA500', red = 'EE0000', green = '008B45';

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

    plugin.createService(plugin_info.title, PREFIX + ":start", "video", true, logo);

    plugin.addURI(PREFIX + ":start", function(page) {
        setPageHeader(page, plugin_info.synopsis);
        page.loading = true;
        var doc = showtime.httpReq(BASE_URL + '/top').toString();
        page.loading = false;
        doc = doc.match(/<div id="index">([\s\S]*?)<\/div>/);
        if (doc) {
           var re = /<h2>([\s\S]*?)<\/h2>([\s\S]*?)<\/table>/g;
           var match = re.exec(doc[1]);
           while (match) {
               page.appendItem("", "separator", {
 	           title: new showtime.RichText(match[1])
               });
               // 1-date, 2-filelink, 3-infolink, 4-title,
               // 5-(1)size, (2)seeds, (3)peers
               var re2 = /<tr class="[gai|tum]+"><td>([\s\S]*?)<\/td>[\s\S]*?" href="([\s\S]*?)"[\s\S]*?<a href="([\s\S]*?)">([\s\S]*?)<\/a>([\s\S]*?)<\/tr>/g;
               var match2 = re2.exec(match[2]);
               while (match2) {
                   if (match2[5].match(/alt="comment"/)) {
                       var end = match2[5].match(/[\s\S]*?align="right">[\s\S]*?align="right">([\s\S]*?)<[\s\S]*?nbsp;([\s\S]*?)<\/span>[\s\S]*?nbsp;([\s\S]*?)<\/span>/);
                       var comments = match2[5].match(/[\s\S]*?align="right">([\s\S]*?)</)[1];
                   } else
                       var end = match2[5].match(/[\s\S]*?<td align="right">([\s\S]*?)<[\s\S]*?nbsp;([\s\S]*?)<\/span>[\s\S]*?nbsp;([\s\S]*?)<\/span>/);
                   page.appendItem('torrent:video:'+BASE_URL+match2[2], "directory", {
    	               title: new showtime.RichText(colorStr(match2[1], orange) + ' ' +
                           match2[4] + ' ('+ coloredStr(end[2], green) + '/'+
                           coloredStr(end[3], red) + ') ' + colorStr(end[1], blue) +
                           (comments ? colorStr(comments, orange) : ''))
                   });
                   match2 = re2.exec(match[2]);
               }
               match = re.exec(doc[1]);
           }

        }
    });

    plugin.addSearcher(plugin_info.title, logo, function(page, query) {
    });
})(this);