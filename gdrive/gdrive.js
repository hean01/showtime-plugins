/**
 *  Copyright (C) 2014-2015 lprot
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
    var client_id='283962994932-qlgee7q6flfg1v8ca6tvkmgbrrlcrf5u.apps.googleusercontent.com';
    var client_secret='aJcACtensWaxnO1UUcNpOjhI';
    var logo = plugin.path + 'logo.png';
    var html, API = 'https://api.gdrive.com/1/';
    var headersAreSet = false;

    var blue = '6699CC', orange = 'FFA500', red = 'EE0000', green = '008B45';

    function colorStr(str, color) {
        return '<font color="' + color + '"> (' + str + ')</font>';
    }

    function coloredStr(str, color) {
        return '<font color="' + color + '">' + str + '</font>';
    }

    plugin.createService(plugin.getDescriptor().title, 'gdrive:browse:' + escape("'root' in parents") + ':' + escape(plugin.getDescriptor().title + ' Root'), 'other', true, logo);
  
    var store = plugin.createStore('authinfo', true);

    var settings = plugin.createSettings(plugin.getDescriptor().title, logo, plugin.getDescriptor().synopsis);
    settings.createAction('clearAuth', 'Unlink from ' + plugin.getDescriptor().title + '...', function() {
        store.refresh_token = '';
        showtime.notify('Showtime is unlinked from ' + plugin.getDescriptor().title, 3, '');
    });

    function bytesToSize(bytes) {
        var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        if (bytes == 0) return '0 Byte';
        var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
        return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
    };

    function setHeaders() {
        plugin.addHTTPAuth('https://docs.google.com.*', function(req) {
            req.setHeader('Authorization', store.token_type + ' ' + store.access_token);
        });
        headersAreSet = true;
    };

    function getAPI(page, path) {
        page.loading = true;
        try {
            html = showtime.httpReq(path, {
                headers: {
                    Authorization: store.token_type + ' ' + store.access_token
                }
            });
        } catch(err) {
            html = showtime.httpReq('https://accounts.google.com/o/oauth2/token', {
                postdata: {
                    client_id: client_id,
                    client_secret: client_secret,
                    refresh_token: store.refresh_token,
                    grant_type: 'refresh_token'
                }
            });
            store.access_token = showtime.JSONDecode(html).access_token;
            setHeaders();
            html = showtime.httpReq(path, {
                headers: {
                    Authorization: store.token_type + ' ' + store.access_token
                }
            });
        }
        page.loading = false;
    }

    plugin.addURI("gdrive:browse:(.*):(.*)", function(page, path, title) {
        if (!headersAreSet)
            setHeaders();

        page.type = "directory";
        page.content = "items";
        if (page.metadata)
            page.metadata.title = unescape(title);

        page.loading = true;

        if (!store.refresh_token) {
            var GALX = false;
            while (1) {
                page.loading = false;
                var credentials = plugin.getAuthCredentials(plugin.getDescriptor().synopsis, 'Please enter email and password to authorize Showtime', true, false, true);
                if (credentials.rejected) {
                    page.error('Cannot login to ' + plugin.getDescriptor().title);
                    return;
                }

                if (credentials.username && credentials.password) {
                    page.loading = true;
                    html = showtime.httpReq('https://accounts.google.com/o/oauth2/auth?scope=https://www.googleapis.com/auth/drive&response_type=code&redirect_uri=urn:ietf:wg:oauth:2.0:oob&client_id=' + client_id, {
                        noFollow: true
                    });

                    if (html.headers.Location) { // we need to login
                        html = showtime.httpReq(html.headers.Location, {
                            noFollow: true
                        });
                        if (!GALX)
                             GALX = html.multiheaders['Set-Cookie'][0].match(/GALX=([\s\S]*?);/)[1]
                        html = showtime.httpReq('https://accounts.google.com/ServiceLoginAuth', {
                            postdata: {
                                GALX: GALX,
                                Email: credentials.username,
                                Passwd: credentials.password
                            }
                        });
                        if (!html.toString().match(/href="https:\/\/accounts.google.com\/Logout"/))
                            continue;
                        html = showtime.httpReq('https://accounts.google.com/o/oauth2/auth?scope=https://www.googleapis.com/auth/drive&response_type=code&redirect_uri=urn:ietf:wg:oauth:2.0:oob&client_id=' + client_id);
                    }
                    break;
                }
            }

            // Approve access
            html = showtime.httpReq(showtime.entityDecode(html.toString().match(/action="([\s\S]*?)"/)[1]), {
                postdata: {
                    state_wrapper: html.toString().match(/name="state_wrapper" value="([\s\S]*?)"/)[1],
                    submit_access:true
                }
            });

            // Exchange code for tokens
            html = showtime.httpReq('https://accounts.google.com/o/oauth2/token', {
                postdata: {
                    code: html.toString().match(/id="code"[\s\S]*?value="([\s\S]*?)"/)[1],
                    client_id: client_id,
                    client_secret: client_secret,
                    redirect_uri: 'urn:ietf:wg:oauth:2.0:oob',
                    grant_type: 'authorization_code'
                }
            });

            var json = showtime.JSONDecode(html);
            store.refresh_token = json.refresh_token;
            store.access_token = json.access_token;
            store.token_type = json.token_type;
            setHeaders();
            page.loading = false;
        }

        if (unescape(path) == "'root' in parents") {
            getAPI(page, 'https://www.googleapis.com/drive/v2/about');
            var json = showtime.JSONDecode(html);
            page.metadata.title = plugin.getDescriptor().title + ' Root';
            var description = coloredStr('\nName: ', orange) + json.user.displayName +
                    coloredStr('\nEmail: ', orange) + json.user.emailAddress +
                    coloredStr('\nQuota total: ', orange) + bytesToSize(json.quotaBytesTotal) +
                    coloredStr('\nQuota used: ', orange) + bytesToSize(json.quotaBytesUsed) +
                    coloredStr('\nQuota used aggregate: ', orange) + bytesToSize(json.quotaBytesUsedAggregate) +
                    coloredStr('\nQuota used in trash: ', orange) + bytesToSize(json.quotaBytesUsedInTrash);
            for (var i in json.quotaBytesByService)
                description += coloredStr('\nQuota by ' + json.quotaBytesByService[i].serviceName + ': ', orange) + bytesToSize(json.quotaBytesByService[i].bytesUsed);

            for (var i in json.maxUploadSizes)
                description += coloredStr('\nMax upload size for ' +
                    json.maxUploadSizes[i].type.replace('application/vnd.google-apps.', '').replace('application/', '') + ': ', orange) + bytesToSize(json.maxUploadSizes[i].size);

            page.appendPassiveItem('video', '', {
                title: new showtime.RichText(coloredStr('Account info', orange)),
                description: new showtime.RichText(description)
            });
        }
        ls(page, unescape(path));
    });

    function dateToHuman(s) {
        return colorStr(s.split('T')[0] + ' ' + s.split('T')[1].substr(0, 8), orange)
    }

    function ls(page, path) {
        var json;
        function processJSON() {
            json = showtime.JSONDecode(html);
            // folders first
            for (var i in json.items) {
                if (json.items[i].mimeType == 'application/vnd.google-apps.folder') {
                    page.appendItem("gdrive:browse:" + escape("'"+ json.items[i].id + "' in parents") + ':' + escape(json.items[i].title), "directory", {
                        title: new showtime.RichText(json.items[i].title + dateToHuman(json.items[i].modifiedDate))
	            });
                    page.entries++;
                }
            }

            // then files
            for (var i in json.items) {
                if (json.items[i].mimeType != 'application/vnd.google-apps.folder') {
                    var url = '';
                    if (json.items[i].webContentLink)
                        url = json.items[i].webContentLink;
                    if (json.items[i].fileExtension && json.items[i].fileExtension.toUpperCase() == 'PLX')
                        url = 'navi-x:playlist:playlist:' + escape(url)
                    var type = json.items[i].mimeType.split('/')[0];
                    if (!url) url = '';
                    page.appendItem(url, 'video', {
	                title: new showtime.RichText(json.items[i].title + colorStr(bytesToSize(json.items[i].fileSize ? json.items[i].fileSize : json.items[i].quotaBytesUsed), blue) + ' ' + dateToHuman(json.items[i].modifiedDate)),
                        icon: json.items[i].thumbnailLink ? json.items[i].thumbnailLink : json.items[i].iconLink
	            });
                    page.entries++;
                }
            }
        }

        getAPI(page, 'https://www.googleapis.com/drive/v2/files?q=' + encodeURI(path));
        processJSON();

        while (json.nextPageToken) {
            getAPI(page, json.nextLink);
            processJSON();
        }
    }

    plugin.addSearcher(plugin.getDescriptor().title, logo, function(page, query) {
        page.entries = 0;
        ls(page, "title contains '"+ query + "'");
    });
})(this);