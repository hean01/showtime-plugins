/**
 *  Copyright (C) 2011-2014 Andreas Öman, lprot
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
    var OAUTH_CONSUMER_KEY='wuqod6evftbfe5k';
    var OAUTH_CONSUMER_SECRET='mg4qqagy2ingdue';
    var logo = plugin.path + 'logo.png';
    var doc, API = 'https://api.dropbox.com/1/';

    var blue = '6699CC', orange = 'FFA500', red = 'EE0000', green = '008B45';

    function colorStr(str, color) {
        return '<font color="' + color + '"> (' + str + ')</font>';
    }

    function coloredStr(str, color) {
        return '<font color="' + color + '">' + str + '</font>';
    }

    plugin.createService(plugin.getDescriptor().title, 'dropbox:browse:/', 'other', true, logo);
  
    var store = plugin.createStore('authinfo', true);

    var settings = plugin.createSettings(plugin.getDescriptor().title, logo, plugin.getDescriptor().synopsis);
    settings.createAction('clearAuth', 'Unlink from Dropbox...', function() {
        store.access_token = '';
        showtime.notify('Showtime is unlinked from Dropbox', 3, '');
    });

    plugin.addURI("dropbox:auth:(.*)", function(page, code) {
        page.loading = false;
        try {
            page.loading = true;
            doc = showtime.httpReq(API + 'oauth2/token', {
                postdata: {
                    'grant_type': 'authorization_code',
                    'code': code,
                    'client_id': OAUTH_CONSUMER_KEY,
                    'client_secret': OAUTH_CONSUMER_SECRET
                }
            });
            page.loading = false;
        } catch (err) {
            page.error('Wrong code. Please try again.');
            return;
        }
        var json = showtime.JSONDecode(doc);
        if (json.access_token)
            store.access_token = json.access_token;
        else {
            page.error('Unknown error!');
            return;
        }
        page.redirect('dropbox:browse:/');
    });

    function bytesToSize(bytes) {
        var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        if (bytes == 0) return '0 Byte';
        var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
        return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
    };

    plugin.addURI("dropbox:browse:(.*)", function(page, path) {
        page.type = "directory";
        page.content = "items";
        page.loading = false;

        if (!store.access_token) {
            var msg =  'To link Dropbox to Showtime, on any PC with internet browser open\n\n' +
                       'http://dropbox.com/1/oauth2/authorize?response_type=code&client_id=' + OAUTH_CONSUMER_KEY +
                       '\n\nSign in to Dropbox and allow Showtime to access your folders and files.'+
                       '\nAfter allowing the access - Dropbox will show you the code that you should enter to the textbox below:\n'+
                       '(alternatively you can enter the code via http://showtimeIP:42000/ as dropbox:auth:CodeFromDropbox'

            while (1) {
                var result = showtime.textDialog(msg, true, true);
                if (result.rejected) {
                    page.error('You need to link Dropbox to Showtime to continue');
                    return;
                }
                try {
                    page.loading = true;
                    doc = showtime.httpReq(API + 'oauth2/token', {
                        postdata: {
                            'grant_type': 'authorization_code',
                            'code': result.input,
                            'client_id': OAUTH_CONSUMER_KEY,
                            'client_secret': OAUTH_CONSUMER_SECRET
                        }
                    });
                    page.loading = false;
                } catch (err) {
                    showtime.notify("Wrong code, please try again...", 5, '');
                    continue;
                }
                var json = showtime.JSONDecode(doc);
                if (json.access_token) {
                    store.access_token = json.access_token;
                    break;
                }
            }
        }

        page.loading = true;
        var doc = showtime.JSONDecode(showtime.httpReq(API + 'metadata/dropbox' + path + '?access_token=' + store.access_token));
        page.loading = false;

        if (!doc.is_dir) {
            page.error("Browsing non directory item");
            return;
        }
        var title = doc.path.split('/');
        if (doc.path == '/') {
            page.metadata.title = 'Dropbox Root';
            var json = showtime.JSONDecode(showtime.httpReq(API + 'account/info?access_token=' + store.access_token));
            page.appendPassiveItem('video', '', {
                title: new showtime.RichText(coloredStr('Account info', orange)),
                description: new showtime.RichText(
                    coloredStr('\nDisplay name: ', orange) + json.display_name +
                    coloredStr('\nEmail: ', orange) + json.email +
                    coloredStr('\nCountry: ', orange) + json.country +
                    coloredStr('\nQuota: ', orange) + bytesToSize(json.quota_info.quota) +
                    coloredStr('\nUsed: ', orange) + bytesToSize(json.quota_info.normal) +
                    coloredStr('\nShared: ', orange) + bytesToSize(json.quota_info.shared) +
                    coloredStr('\nUID: ', orange) + json.uid +
                    coloredStr('\nReferral link: ', orange) + json.referral_link
                )
            });
        } else
            page.metadata.title = title[title.length-1];
        ls(page, doc.contents);
    });

    function ls(page, json) {
        // folders first
        for (var i in json) {
            if (json[i].is_dir) {
                var title = json[i].path.split('/');
                title = title[title.length-1]
                page.appendItem("dropbox:browse:" + showtime.pathEscape(json[i].path), "directory", {
                    title: new showtime.RichText(title + colorStr(json[i].modified.replace(/ \+0000/, ''), orange))
	        });
                page.entries++;
            }

        }

        // then files
        for (var i in json) {
            if (!json[i].is_dir) {
                var title = json[i].path.split('/');
                title = title[title.length-1]
                var url = 'https://api-content.dropbox.com/1/files/dropbox' + showtime.pathEscape(json[i].path) + '?access_token=' + store.access_token;
                if (json[i].path.split('.').pop().toUpperCase() == 'PLX')
                    url = 'navi-x:playlist:playlist:' + escape(url)
                var type = json[i].mime_type.split('/')[0];

	        page.appendItem(url, type, {
	            title: new showtime.RichText(title + colorStr(json[i].size, blue) + ' ' + json[i].modified.replace( /\+0000/, ''))
	        });
                page.entries++;
            }
        }
    }

    plugin.addSearcher(plugin.getDescriptor().title, logo, function(page, query) {
        page.entries = 0;
        page.loading = true;
        var json = showtime.JSONDecode(showtime.httpReq(API + 'search/auto/', {
            args: {
                access_token: store.access_token,
                query: query
            }
        }));
        page.loading = false;
        ls(page, json);
    });
})(this);