/*
 *  Digitally Imported plugin for Movian Media Center
 *
 *  Copyright (C) 2012-2015 Henrik Andersson, lprot
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
    var logo = plugin.path + 'di_square.png';

    plugin.createService(plugin.getDescriptor().title, plugin.getDescriptor().id + ':start', 'music', true, logo);

    plugin.addURI(plugin.getDescriptor().id + ':start', function(page) {
	page.type = 'directory';
	page.metadata.glwview = plugin.path + 'views/array.view';
	page.contents = 'items';
	page.metadata.logo = logo;
	page.metadata.title = plugin.getDescriptor().title;
        page.loading = true;
	var doc = showtime.httpReq('http://www.di.fm/channels').toString().match(/start\(([\S\s]*?)\);/)[1];
        page.loading = false;
        var json = showtime.JSONDecode(doc);
        for (var i in json.channels) {
            var entity = json.channels[i];
            var icon = entity.images.default.match(/(^[^\{]*)/)[1];
	    page.appendItem('icecast:http://listen.di.fm/public3/'+ entity.key + '.pls', 'station', {
		station: entity.name,
		title: entity.name,
		description: entity.description_short,
		icon: icon.substr(0, 4) == 'http' ? icon : 'http:' + icon + '?size=150x150',
		album_art: icon.substr(0, 4) == 'http' ? icon : 'http:' + icon + '?size=150x150',
		album: ''
	    });
	};
    });
})(this);