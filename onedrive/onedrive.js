/**
 *  Copyright (C) 2015 lprot
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
    var client_id = '000000004C15009B';
    var client_secret = 'vhaJSWTL6z4ofvX19ZhX6QzLkPiLPj6n';
    var logo = plugin.path + 'logo.png';
    var doc, API = 'https://api.onedrive.com/v1.0';

    var blue = '6699CC', orange = 'FFA500', red = 'EE0000', green = '008B45';

    function colorStr(str, color) {
        return '<font color="' + color + '"> (' + str + ')</font>';
    }

    function coloredStr(str, color) {
        return '<font color="' + color + '">' + str + '</font>';
    }

    plugin.createService(plugin.getDescriptor().title, plugin.getDescriptor().id + ':browse:root', 'other', true, logo);
  
    var store = plugin.createStore('authinfo', true);

    var settings = plugin.createSettings(plugin.getDescriptor().id, logo, plugin.getDescriptor().synopsis);
    settings.createAction('clearAuth', 'Unlink from ' + plugin.getDescriptor().title + ' ...', function() {
        store.access_token = '';
        showtime.notify('Movian is unlinked from ' + plugin.getDescriptor().title, 3, '');
    });

    function bytesToSize(bytes) {
        var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        if (bytes == 0) return '0 Byte';
        var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
        return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
    };

    function callAPI(page, path) {
        page.loading = true;
        try {
            result = showtime.JSONDecode(showtime.httpReq(API + path, {
                headers: {
                    Authorization: 'Bearer ' + store.access_token
                }
            }));
        } catch(err) {
            // We need to refresh token
            var json = showtime.JSONDecode(showtime.httpReq('https://login.live.com/oauth20_token.srf', {
                postdata: {
                    client_id: client_id,
                    client_secret: client_secret,
                    'refresh_token': store.refresh_token,
                    'grant_type': 'refresh_token'
                }
            }));
            store.access_token = json.access_token;
            store.refresh_token = json.refresh_token;

            // And retry the request
            result = showtime.JSONDecode(showtime.httpReq(API + path, {
                headers: {
                    Authorization: 'Bearer ' + store.access_token
                }
            }));
        }
        page.loading = false;
        return result;
    };

    plugin.addURI(plugin.getDescriptor().id + ':browse:(.*)', function(page, path) {
        page.type = "directory";
        page.content = "items";

        if (!store.access_token || !store.refresh_token) {
            while (1) {
                page.loading = true;
                // Requesting login form
                var doc = showtime.httpReq('https://login.live.com/oauth20_authorize.srf?scope=onedrive.readwrite%20wl.offline_access&response_type=code&client_id=' + client_id, {
                    headers: {
                        Cookie: ''
                    }
                }).toString();

                var postURL = doc.match(/urlPost:'([\s\S]*?)'/);
                if (!postURL) {
                    page.error('Cannot get login params. Contact plugin author.');
                    return;
                }

                page.loading = false;

                var credentials = plugin.getAuthCredentials(plugin.getDescriptor().synopsis, 'Please enter email and password to login to your ' + plugin.getDescriptor().title + ' account', true, false, true);
                if (credentials.rejected) {
                    page.error('To continue you need to login to your ' + plugin.getDescriptor().title + ' account');
                    return;
                }

                if (credentials.username && credentials.password) {
                    // Try to login by using entered credentials
                    page.loading = true;
                    var PPFT = doc.match(/name="PPFT"[\s\S]*?value="([\s\S]*?)"/)[1];
                    doc = showtime.httpReq(postURL[1], {
                        postdata: {
                            passwd: credentials.password,
                            login: credentials.username,
                            PPFT: PPFT
                        },
                        noFollow: true
                    });

                    // If we got no Location - credentials are bad or we need to authorize
                    if (!doc.headers.Location) {
                        // Try to authorize
                        doc = doc.toString();
                        var link = doc.match(/action="([\s\S]*?)"/);
                        if (!link) // bad credentials
                            continue;
                        doc = showtime.httpReq(link[1], {
                            postdata: {
                                ipt: doc.match(/id="ipt" value="([\s\S]*?)"/)[1]
                            }
                        });
                        doc = doc.toString();
                        doc = showtime.httpReq(link[1], {
                            postdata: {
                                canary: doc.match(/name="canary" value="([\s\S]*?)"/)[1],
                                ucaccept: 'Yes'
                            },
                            noFollow: true
                        });
                        doc = showtime.httpReq(doc.headers.Location, {
                            noFollow: true
                        });

                    }
                    page.loading = false;

                    // Redeem the code for access tokens
                    json = showtime.JSONDecode(showtime.httpReq('https://login.live.com/oauth20_token.srf', {
                        postdata: {
                            client_id: client_id,
                            client_secret: client_secret,
                            code: doc.headers.Location.match(/code=(.*)/)[1],
                            'grant_type': 'authorization_code'
                        },
                        noFollow: true
                    }));

                    showtime.print(showtime.JSONEncode(json));
                    store.access_token = json.access_token;
                    store.refresh_token = json.refresh_token;
                    break;
                }
            }
        }
        page.loading = true;

        if (path == 'root') {
            page.metadata.title = plugin.getDescriptor().title + ' - Root';
            json = callAPI(page, '/drive/');
            page.appendPassiveItem('video', '', {
                title: new showtime.RichText(coloredStr('Account info', orange)),
                description: new showtime.RichText(
                    coloredStr('\nDisplay name: ', orange) + json.owner.user.displayName +
                    coloredStr('\nID: ', orange) + json.id +
                    coloredStr('\nDrive type: ', orange) + json.driveType +
                    coloredStr('\nQuota total: ', orange) + bytesToSize(json.quota.total) +
                    coloredStr('\nUsed: ', orange) + bytesToSize(json.quota.used) +
                    coloredStr('\nDeleted: ', orange) + bytesToSize(json.quota.deleted) +
                    coloredStr('\nRemaining: ', orange) + bytesToSize(json.quota.remaining) +
                    coloredStr('\nState: ', orange) + json.quota.state
                )
            });
        }
        json = callAPI(page, '/drive/' + path + '/children');
        showtime.print(showtime.JSONEncode(json));
        page.metadata.title = plugin.getDescriptor().title + ' - ' + json.value.name;
        ls(page, json);

        //if (!doc.is_dir) {
        //    page.error("Browsing non directory item");
        //    return;
        //}
        //var title = doc.path.split('/');
        //} else
        //    page.metadata.title = title[title.length-1];
    });

    function ls(page, json) {
        // folders first
        for (var i in json.value) {
            if (json.value[i].folder) {
                page.appendItem(plugin.getDescriptor().id + ":browse:/items/" + showtime.pathEscape(json.value[i].id), "directory", {
	            title: new showtime.RichText(json.value[i].name + colorStr(json.value[i].size, blue) + ' ' + json.value[i].lastModifiedDateTime)
	        });
                page.entries++;
            }
        }

        // then files
        for (var i in json.value) {
            if (!json.value[i].folder) {
                var title = json.value[i].name.split('/');
                title = title[title.length-1]
                var url = json.value[i].webUrl;
                if (json.value[i].name.split('.').pop().toUpperCase() == 'PLX')
                    url = 'navi-x:playlist:playlist:' + escape(url)
                var type = json.value[i].file.mimeType.split('/')[0];

	        page.appendItem(url, 'video', {
	            title: new showtime.RichText(json.value[i].name + colorStr(json.value[i].size, blue) + ' ' + json.value[i].lastModifiedDateTime)
	        });
                page.entries++;
            }
        }
    }

    plugin.addSearcher(plugin.getDescriptor().id, logo, function(page, query) {
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