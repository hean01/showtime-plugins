/**
 *  Copyright (C) 2011-2015 Andreas Öman, lprot
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
    var OAUTH_CONSUMER_KEY='8qfw2dhophpbj39';
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
        showtime.notify('Movian is unlinked from Dropbox', 3, '');
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

        if (!store.access_token) {
            while (1) {
                page.loading = true;
                // Requesting t cookie (needed for login)
                var doc = showtime.httpReq('https://dropbox.com/1/oauth2/authorize?response_type=token&redirect_uri=https://localhost&client_id=' + OAUTH_CONSUMER_KEY, {
                    headers: {
                        Cookie: ''
                    }
                });
                page.loading = false;

                var credentials = plugin.getAuthCredentials(plugin.getDescriptor().synopsis, 'Please enter email and password to login to your Dropbox account', true, false, true);
                if (credentials.rejected) {
                    page.error('To continue you need to login to your Dropbox account');
                    return;
                }

                if (credentials.username && credentials.password) {
                    // Try to login by using entered credentials
                    var t = doc.multiheaders['set-cookie'].toString().match(/t=([\s\S]*?);/)[1];
                    page.loading = true;
                    doc = showtime.httpReq('https://www.dropbox.com/ajax_login', {
                        postdata: {
                            'is_xhr': true,
                            't': t,
                            'login_email': credentials.username,
                            'login_password': credentials.password
                        }
                    });

                    // Try to get access_token in doc.headers.location)
                    doc = showtime.httpReq('https://dropbox.com/1/oauth2/authorize?response_type=token&redirect_uri=https://localhost&client_id=' + OAUTH_CONSUMER_KEY, {
                        noFollow: true
                    });

                    // If we got no token then we need to authorize the app
                    if (!doc.headers.location) {
                        doc = doc.toString();

                        // Checking if we are succesfully logged
                        if (!doc.match(/name="user_id"/))
                            continue;

                        doc = showtime.httpReq('https://www.dropbox.com/1/oauth2/authorize_submit', {
                            postdata: {
                                't': doc.match(/name="t" value="([\s\S]*?)"/)[1],
                                'allow_access': 1,
                                'context': '{"redirect_uri": "https://localhost", "response_type": "token", "client_id": "' + OAUTH_CONSUMER_KEY + '"}',
                                'user_id': doc.match(/name="user_id" value="([\s\S]*?)"/)[1]
                            },
                            noFollow: true
                        });
                    }
                    page.loading = false;
                    store.access_token = doc.headers.location.match(/access_token=([\s\S]*?)&/)[1]
                    break;
                }
            }
        }

        page.loading = true;
        try {
            doc = showtime.JSONDecode(showtime.httpReq(API + 'metadata/dropbox' + path + '?access_token=' + store.access_token));
        } catch(err) {
            store.access_token = '';
            page.error(err);
            return;
        }
        page.loading = false;

        if (!doc.is_dir) {
            page.error("Browsing non directory item");
            return;
        }
        var title = doc.path.split('/');
        if (doc.path == '/') {
            page.metadata.title = 'Dropbox Root';
            page.loading = true;
            var json = showtime.JSONDecode(showtime.httpReq(API + 'account/info?access_token=' + store.access_token));
            page.loading = false;
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
        if (!store.access_token) return false;
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