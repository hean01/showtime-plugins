/*
 *  Digitally Imported
 *
 *  Copyright (C) 2014 Henrik Andersson, lprot
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
    var pInfo = plugin.getDescriptor();
    var PREFIX = pInfo.id;
    var logo = plugin.path + 'di_square.png';
    var BASE_URL = 'http://www.di.fm';

    plugin.createService(pInfo.title, PREFIX + ':start', 'audio', true, logo);

    // Start page
    plugin.addURI(PREFIX + ':start', function(page) {
showtime.print(pInfo.id);
showtime.print(pInfo.logo);
	page.type = 'directory';
	page.metadata.glwview = plugin.path + 'views/array.view';
	page.contents = 'items';
	page.metadata.logo = logo;
	page.metadata.title = pInfo.title;
        page.loading = true;
	var doc = showtime.httpReq(BASE_URL).toString().match(/\.Channels([\S\s]*?)<\/script>/)[1];
        page.loading = false;

        var json = doc.match(/NS\(\'AudioAddict\'\)\.Channels = ([\s\S]*?)<\/script>/);
        if (json) {
showtime.print('ssss')        ;
            json = showtime.JSONDecode(json[1]);
            showtime.print(showtime.JSONEncode(json));
        }

	// 1-description, 2-key, 3-title, 4-icon
        var re = /"description_short":"(.*?)"[\S\s]*?"key":"(.*?)"[\S\s]*?"name":"(.*?)"[\S\s]*?"default":"(.*?)\{/g;
        var match = re.exec(doc);
        while (match) {
	    page.appendItem('icecast:http://listen.di.fm/public3/'+match[2]+'.pls', 'station', {
		station: match[3],
		title: match[3],
		description: match[1],
		icon: match[4].substr(0, 4) == 'http' ? match[4] : 'http:' + match[4]+'.jpg?size=150x150',
		album_art: match[4].substr(0, 4) == 'http' ? match[4] : 'http:' + match[4]+'.jpg?size=150x150',
		album: ''
	    });
	    match = re.exec(doc);
	};
    });
})(this);