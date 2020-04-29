import $ from 'jquery';
import _ from 'lodash';
import SockJS from 'sockjs-client';

var PluginRegistry = function (base) {
  this.base = base;
  this.components = {};
};

var OctoPrintClient = function (options) {
  this.options = options || {
    baseurl: undefined,
    apikey: undefined,
    locale: undefined,
  };

  this.components = {};
  this.plugins = new PluginRegistry(this);
};

OctoPrintClient.registerComponent = function (name, component) {
  Object.defineProperty(OctoPrintClient.prototype, name, {
    get: function () {
      if (this.components[name] !== undefined) {
        return this.components[name];
      }

      var instance = new component(this);
      this.components[name] = instance;
      return instance;
    },
    enumerable: false,
    configurable: false,
  });
};

OctoPrintClient.registerPluginComponent = function (name, component) {
  Object.defineProperty(PluginRegistry.prototype, name, {
    get: function () {
      if (this.components[name] !== undefined) {
        return this.components[name];
      }

      var instance = new component(this.base);
      this.components[name] = instance;
      return instance;
    },
    enumerable: false,
    configurable: false,
  });
};

var noCache = function (opts) {
  opts = opts || {};

  var params = $.extend({}, opts);
  params.headers = $.extend({}, params.headers || {});
  params.headers['Cache-Control'] = 'no-cache';

  return params;
};

var contentTypeJson = function (opts) {
  opts = opts || {};

  var params = $.extend({}, opts);
  params.contentType = 'application/json; charset=UTF-8';

  return params;
};

var contentTypeFalse = function (opts) {
  opts = opts || {};

  var params = $.extend({}, opts);
  params.contentType = false;

  return params;
};

var noProcessData = function (opts) {
  opts = opts || {};

  var params = $.extend({}, opts);
  params.processData = false;

  return params;
};

var replaceUndefinedWithNull = function (key, value) {
  if (value === undefined) {
    return null;
  } else {
    return value;
  }
};

OctoPrintClient.prototype.getBaseUrl = function () {
  var url = this.options.baseurl;
  if (!_.endsWith(url, '/')) {
    url = url + '/';
  }
  return url;
};

OctoPrintClient.prototype.getRequestHeaders = function (additional) {
  additional = additional || {};

  var headers = $.extend({}, additional);

  if (this.options.apikey) {
    headers['X-Api-Key'] = this.options.apikey;
  }
  if (this.options.locale !== undefined) {
    headers['X-Locale'] = this.options.locale;
  }

  return headers;
};

OctoPrintClient.prototype.ajax = function (method, url, opts) {
  opts = opts || {};

  method = opts.method || method || 'GET';
  url = opts.url || url || '';

  var urlToCall = url;
  if (!_.startsWith(url, 'http://') && !_.startsWith(url, 'https://')) {
    urlToCall = this.getBaseUrl() + url;
    opts.url = urlToCall;
  }

  var headers = this.getRequestHeaders(opts.headers);

  var params = $.extend({}, opts);
  params.type = method;
  params.headers = headers;
  params.dataType = params.dataType || 'json';

  return $.ajax(urlToCall, params);
};

OctoPrintClient.prototype.ajaxWithData = function (method, url, data, opts) {
  opts = opts || {};

  var params = $.extend({}, opts);
  params.data = data;

  return this.ajax(method, url, params);
};

OctoPrintClient.prototype.get = function (url, opts) {
  return this.ajax('GET', url, opts);
};

OctoPrintClient.prototype.getWithQuery = function (url, data, opts) {
  return this.ajaxWithData('GET', url, data, opts);
};

OctoPrintClient.prototype.post = function (url, data, opts) {
  return this.ajaxWithData('POST', url, data, noCache(opts));
};

OctoPrintClient.prototype.postForm = function (url, data, opts) {
  var form = new FormData();
  _.each(data, function (value, key) {
    form.append(key, value);
  });

  return this.post(url, form, contentTypeFalse(noProcessData(opts)));
};

OctoPrintClient.prototype.postJson = function (url, data, opts) {
  return this.post(url, JSON.stringify(data, replaceUndefinedWithNull), contentTypeJson(opts));
};

OctoPrintClient.prototype.put = function (url, data, opts) {
  return this.ajaxWithData('PUT', url, data, noCache(opts));
};

OctoPrintClient.prototype.putJson = function (url, data, opts) {
  return this.put(url, JSON.stringify(data, replaceUndefinedWithNull), contentTypeJson(opts));
};

OctoPrintClient.prototype.patch = function (url, data, opts) {
  return this.ajaxWithData('PATCH', url, data, noCache(opts));
};

OctoPrintClient.prototype.patchJson = function (url, data, opts) {
  return this.patch(url, JSON.stringify(data, replaceUndefinedWithNull), contentTypeJson(opts));
};

OctoPrintClient.prototype.delete = function (url, opts) {
  return this.ajax('DELETE', url, opts);
};

OctoPrintClient.prototype.download = function (url, opts) {
  var params = $.extend({}, opts || {});
  params.dataType = 'text';
  return this.get(url, params);
};

OctoPrintClient.prototype.upload = function (url, file, filename, additional) {
  additional = additional || {};

  var fileData;
  if (file instanceof jQuery) {
    fileData = file[0].files[0];
  } else if (typeof file == 'string') {
    fileData = $(file)[0].files[0];
  } else {
    fileData = file;
  }

  filename = filename || fileData.name;
  var filesize = fileData.size;

  var form = new FormData();
  form.append('file', fileData, filename);

  _.each(additional, function (value, key) {
    form.append(key, value);
  });

  var deferred = $.Deferred();

  var request = new XMLHttpRequest();
  request.onreadystatechange = function () {
    if (request.readyState == 4) {
      deferred.notify({ loaded: filesize, total: filesize });

      var success = (request.status >= 200 && request.status < 300) || request.status === 304;
      var error, json, statusText;

      try {
        json = JSON.parse(request.response);
        statusText = 'success';
      } catch (e) {
        success = false;
        error = e;
        statusText = 'parsererror';
      }

      if (success) {
        deferred.resolve([json, statusText, request]);
      } else {
        if (!statusText) {
          statusText = request.statusText;
        }
        deferred.reject([request, statusText, error]);
      }
    }
  };
  request.ontimeout = function () {
    deferred.reject([request, 'timeout', 'Timeout']);
  };
  request.upload.addEventListener('loadstart', function (e) {
    deferred.notify({ loaded: e.loaded, total: e.total });
  });
  request.upload.addEventListener('progress', function (e) {
    deferred.notify({ loaded: e.loaded, total: e.total });
  });
  request.upload.addEventListener('loadend', function (e) {
    deferred.notify({ loaded: e.loaded, total: e.total });
  });

  var headers = this.getRequestHeaders();

  var urlToCall = url;
  if (!_.startsWith(url, 'http://') && !_.startsWith(url, 'https://')) {
    urlToCall = this.getBaseUrl() + url;
  }

  request.open('POST', urlToCall);
  _.each(headers, function (value, key) {
    request.setRequestHeader(key, value);
  });
  request.send(form);

  return deferred.promise();
};

OctoPrintClient.prototype.issueCommand = function (url, command, payload, opts) {
  payload = payload || {};

  var data = $.extend({}, payload);
  data.command = command;

  return this.postJson(url, data, opts);
};

OctoPrintClient.prototype.getSimpleApiUrl = function (plugin) {
  return 'api/plugin/' + plugin;
};

OctoPrintClient.prototype.simpleApiGet = function (plugin, opts) {
  return this.get(OctoPrintClient.prototype.getSimpleApiUrl(plugin), opts);
};

OctoPrintClient.prototype.simpleApiCommand = function (plugin, command, payload, opts) {
  return this.issueCommand(OctoPrintClient.prototype.getSimpleApiUrl(plugin), command, payload, opts);
};

OctoPrintClient.prototype.getBlueprintUrl = function (plugin) {
  return 'plugin/' + plugin + '/';
};

OctoPrintClient.createRejectedDeferred = function () {
  var deferred = $.Deferred();
  deferred.reject(arguments);
  return deferred;
};

OctoPrintClient.createCustomException = function (name) {
  var constructor;

  if (_.isFunction(name)) {
    constructor = name;
  } else {
    constructor = function (message) {
      this.name = name;
      this.message = message;
      this.stack = new Error().stack;
    };
  }

  constructor.prototype = Object.create(Error.prototype);
  constructor.prototype.constructor = constructor;

  return constructor;
};

OctoPrintClient.InvalidArgumentError = OctoPrintClient.createCustomException('InvalidArgumentError');

OctoPrintClient.deprecated = function (deprecatedFct, newFct, fn) {
  return function () {
    console.warn(deprecatedFct + ' is deprecated, please use the new ' + newFct + ' function instead');
    return fn.apply(this, arguments);
  };
};

OctoPrintClient.deprecatedMethod = function (object, oldNamespace, oldFct, newNamespace, newFct, fn) {
  object[oldFct] = OctoPrintClient.deprecated(oldNamespace + '.' + oldFct, newNamespace + '.' + newFct, fn);
};

OctoPrintClient.deprecatedVariable = function (object, oldNamespace, oldVar, newNamespace, newVar, getter, setter) {
  Object.defineProperty(object, oldVar, {
    get: function () {
      return OctoPrintClient.deprecated(oldNamespace + '.' + oldVar, newNamespace + '.' + newVar, getter)();
    },
    set: function (val) {
      OctoPrintClient.deprecated(oldNamespace + '.' + oldVar, newNamespace + '.' + newVar, setter)(val);
    },
  });
};

(() => {
  var baseAccessUrl = 'api/access';

  //~~ permissions client api

  var OctoPrintAccessPermissionsClient = function (access) {
    this.access = access;
    this.base = this.access.base;

    var baseUrl = baseAccessUrl + '/permissions';
    this.url = function () {
      if (arguments.length) {
        return baseUrl + '/' + Array.prototype.join.call(arguments, '/');
      } else {
        return baseUrl;
      }
    };
  };

  OctoPrintAccessPermissionsClient.prototype.list = function (opts) {
    return this.base.get(this.url(), opts);
  };

  //~~ groups client api

  var OctoPrintAccessGroupsClient = function (access) {
    this.access = access;
    this.base = this.access.base;

    var baseUrl = baseAccessUrl + '/groups';
    this.url = function () {
      if (arguments.length) {
        return baseUrl + '/' + Array.prototype.join.call(arguments, '/');
      } else {
        return baseUrl;
      }
    };
  };

  OctoPrintAccessGroupsClient.prototype.list = function (opts) {
    return this.base.get(this.url(), opts);
  };

  OctoPrintAccessGroupsClient.prototype.add = function (group, opts) {
    if (!group.key) {
      throw new OctoPrintClient.InvalidArgumentError('group key must be set');
    }
    if (!group.name) {
      throw new OctoPrintClient.InvalidArgumentError('group name must be set');
    }

    var data = {
      key: group.key,
      name: group.name,
      description: group.description,
      permissions: group.permissions,
      subgroups: group.subgroups,
      default: group.default,
    };

    return this.base.postJson(this.url(), data, opts);
  };

  OctoPrintAccessGroupsClient.prototype.get = function (key, opts) {
    if (!key) {
      throw new OctoPrintClient.InvalidArgumentError('group key must be set');
    }

    return this.base.get(this.url(key), opts);
  };

  OctoPrintAccessGroupsClient.prototype.update = function (group, opts) {
    if (!group.key) {
      throw new OctoPrintClient.InvalidArgumentError('group key must be set');
    }

    var data = {
      description: group.description,
      permissions: group.permissions,
      subgroups: group.subgroups,
      default: group.default,
    };
    return this.base.putJson(this.url(group.key), data, opts);
  };

  OctoPrintAccessGroupsClient.prototype.delete = function (key, opts) {
    if (!key) {
      throw new OctoPrintClient.InvalidArgumentError('group key must be set');
    }

    return this.base.delete(this.url(key), opts);
  };

  //~~ users client api

  var OctoPrintAccessUsersClient = function (access) {
    this.access = access;
    this.base = this.access.base;

    var baseUrl = baseAccessUrl + '/users';
    this.url = function () {
      if (arguments.length) {
        return baseUrl + '/' + Array.prototype.join.call(arguments, '/');
      } else {
        return baseUrl;
      }
    };
  };

  OctoPrintAccessUsersClient.prototype.list = function (opts) {
    return this.base.get(this.url(), opts);
  };

  OctoPrintAccessUsersClient.prototype.add = function (user, opts) {
    if (!user.name || !user.password) {
      throw new OctoPrintClient.InvalidArgumentError("Both user's name and password need to be set");
    }

    var data = {
      name: user.name,
      password: user.password,
      groups: user.hasOwnProperty('groups') ? user.groups : [],
      permissions: user.hasOwnProperty('permissions') ? user.permissions : [],
      active: user.hasOwnProperty('active') ? !!user.active : true,
      admin: user.hasOwnProperty('admin') ? !!user.admin : false,
    };

    return this.base.postJson(this.url(), data, opts);
  };

  OctoPrintAccessUsersClient.prototype.get = function (name, opts) {
    if (!name) {
      throw new OctoPrintClient.InvalidArgumentError('user name must be set');
    }

    return this.base.get(this.url(name), opts);
  };

  OctoPrintAccessUsersClient.prototype.update = function (name, active, admin, permissions, groups, opts) {
    if (!name) {
      throw new OctoPrintClient.InvalidArgumentError('user name must be set');
    }

    var data = {
      active: !!active,
      groups: groups,
      permissions: permissions,
      admin: !!admin,
    };
    return this.base.putJson(this.url(name), data, opts);
  };

  OctoPrintAccessUsersClient.prototype.delete = function (name, opts) {
    if (!name) {
      throw new OctoPrintClient.InvalidArgumentError('user name must be set');
    }

    return this.base.delete(this.url(name), opts);
  };

  OctoPrintAccessUsersClient.prototype.changePassword = function (name, password, opts) {
    if (!name || !password) {
      throw new OctoPrintClient.InvalidArgumentError('user name and password must be set');
    }

    var data = {
      password: password,
    };
    return this.base.putJson(this.url(name, 'password'), data, opts);
  };

  OctoPrintAccessUsersClient.prototype.generateApiKey = function (name, opts) {
    if (!name) {
      throw new OctoPrintClient.InvalidArgumentError('user name must be set');
    }

    return this.base.postJson(this.url(name, 'apikey'), opts);
  };

  OctoPrintAccessUsersClient.prototype.resetApiKey = function (name, opts) {
    if (!name) {
      throw new OctoPrintClient.InvalidArgumentError('user name must be set');
    }

    return this.base.delete(this.url(name, 'apikey'), opts);
  };

  OctoPrintAccessUsersClient.prototype.getSettings = function (name, opts) {
    if (!name) {
      throw new OctoPrintClient.InvalidArgumentError('user name must be set');
    }

    return this.base.get(this.url(name, 'settings'), opts);
  };

  OctoPrintAccessUsersClient.prototype.saveSettings = function (name, settings, opts) {
    if (!name) {
      throw new OctoPrintClient.InvalidArgumentError('user name must be set');
    }

    settings = settings || {};
    return this.base.patchJson(this.url(name, 'settings'), settings, opts);
  };

  var OctoPrintAccessClient = function (base) {
    this.base = base;

    this.permissions = new OctoPrintAccessPermissionsClient(this);
    this.groups = new OctoPrintAccessGroupsClient(this);
    this.users = new OctoPrintAccessUsersClient(this);
  };
  OctoPrintClient.registerComponent('access', OctoPrintAccessClient);
  return OctoPrintAccessClient;
})();

(() => {
  var loginUrl = 'api/login';
  var logoutUrl = 'api/logout';

  var OctoPrintBrowserClient = function (base) {
    this.base = base;
  };

  OctoPrintBrowserClient.prototype.login = function (username, password, remember, opts) {
    var data = {
      user: username,
      pass: password,
      remember: !!remember,
    };
    return this.base.postJson(loginUrl, data, opts);
  };

  OctoPrintBrowserClient.prototype.passiveLogin = function (opts) {
    return this.base.postJson(loginUrl, { passive: true }, opts);
  };

  OctoPrintBrowserClient.prototype.logout = function (opts) {
    return this.base.postJson(logoutUrl, {}, opts);
  };

  OctoPrintClient.registerComponent('browser', OctoPrintBrowserClient);
  return OctoPrintBrowserClient;
})();

(() => {
  var url = 'api/connection';

  var OctoPrintConnectionClient = function (base) {
    this.base = base;
  };

  OctoPrintConnectionClient.prototype.getSettings = function (opts) {
    return this.base.get(url, opts);
  };

  OctoPrintConnectionClient.prototype.connect = function (data, opts) {
    return this.base.issueCommand(url, 'connect', data || {}, opts);
  };

  OctoPrintConnectionClient.prototype.disconnect = function (opts) {
    return this.base.issueCommand(url, 'disconnect', {}, opts);
  };

  OctoPrintConnectionClient.prototype.fakeAck = function (opts) {
    return this.base.issueCommand(url, 'fake_ack', {}, opts);
  };

  OctoPrintClient.registerComponent('connection', OctoPrintConnectionClient);
  return OctoPrintConnectionClient;
})();

(() => {
  var customUrl = 'api/printer/command/custom';
  var commandUrl = 'api/printer/command';

  var OctoPrintControlClient = function (base) {
    this.base = base;
  };

  OctoPrintControlClient.prototype.getCustomControls = function (opts) {
    return this.base.get(customUrl, opts);
  };

  OctoPrintControlClient.prototype.sendGcodeWithParameters = function (commands, parameters, opts) {
    commands = commands || [];
    parameters = parameters || {};

    if (typeof commands === 'string') {
      commands = [commands];
    }

    return this.base.postJson(
      commandUrl,
      {
        commands: commands,
        parameters: parameters,
      },
      opts
    );
  };

  OctoPrintControlClient.prototype.sendGcodeScriptWithParameters = function (script, context, parameters, opts) {
    script = script || '';
    context = context || {};
    parameters = parameters || {};

    return this.base.postJson(
      commandUrl,
      {
        script: script,
        context: context,
        parameters: parameters,
      },
      opts
    );
  };

  OctoPrintControlClient.prototype.sendGcode = function (commands, opts) {
    return this.sendGcodeWithParameters(commands, undefined, opts);
  };

  OctoPrintControlClient.prototype.sendGcodeScript = function (script, context, opts) {
    return this.sendGcodeScriptWithParameters(script, context, undefined, opts);
  };

  OctoPrintClient.registerComponent('control', OctoPrintControlClient);
  return OctoPrintControlClient;
})();

(() => {
  var url = 'api/files';
  var downloadUrl = 'downloads/files';

  var OctoPrintFilesClient = function (base) {
    this.base = base;
  };

  var resourceForLocation = function (location) {
    return url + '/' + location;
  };

  var downloadForLocation = function (location) {
    return downloadUrl + '/' + location;
  };

  var downloadForEntry = function (location, filename) {
    return downloadForLocation(location) + '/' + filename;
  };

  var resourceForEntry = function (location, filename) {
    return resourceForLocation(location) + '/' + filename;
  };

  var preProcessList = function (response) {
    var recursiveCheck = function (element, index, list) {
      if (!element.hasOwnProperty('parent')) element.parent = { children: list, parent: undefined };
      if (!element.hasOwnProperty('size')) element.size = undefined;
      if (!element.hasOwnProperty('date')) element.date = undefined;

      if (element.type == 'folder') {
        element.weight = 0;
        _.each(element.children, function (e, i, l) {
          e.parent = element;
          recursiveCheck(e, i, l);
          element.weight += e.weight;
        });
      } else {
        element.weight = 1;
      }
    };
    _.each(response.files, recursiveCheck);
  };

  OctoPrintFilesClient.prototype.get = function (location, entryname, opts) {
    return this.base.get(resourceForEntry(location, entryname), opts);
  };

  OctoPrintFilesClient.prototype.list = function (recursively, force, opts) {
    recursively = recursively || false;
    force = force || false;

    var query = {};
    if (recursively) {
      query.recursive = recursively;
    }
    if (force) {
      query.force = force;
    }

    return this.base.getWithQuery(url, query, opts).done(preProcessList);
  };

  OctoPrintFilesClient.prototype.listForLocation = function (location, recursively, opts) {
    recursively = recursively || false;
    return this.base.getWithQuery(resourceForLocation(location), { recursive: recursively }, opts).done(preProcessList);
  };

  OctoPrintFilesClient.prototype.issueEntryCommand = function (location, entryname, command, data, opts) {
    var url = resourceForEntry(location, entryname);
    return this.base.issueCommand(url, command, data, opts);
  };

  OctoPrintFilesClient.prototype.select = function (location, path, print, opts) {
    print = print || false;

    var data = {
      print: print,
    };

    return this.issueEntryCommand(location, path, 'select', data, opts);
  };

  OctoPrintFilesClient.prototype.analyse = function (location, path, parameters, opts) {
    return this.issueEntryCommand(location, path, 'analyse', parameters || {}, opts);
  };

  OctoPrintFilesClient.prototype.slice = function (location, path, parameters, opts) {
    return this.issueEntryCommand(location, path, 'slice', parameters || {}, opts);
  };

  OctoPrintFilesClient.prototype.delete = function (location, path, opts) {
    return this.base.delete(resourceForEntry(location, path), opts);
  };

  OctoPrintFilesClient.prototype.copy = function (location, path, destination, opts) {
    return this.issueEntryCommand(location, path, 'copy', { destination: destination }, opts);
  };

  OctoPrintFilesClient.prototype.move = function (location, path, destination, opts) {
    return this.issueEntryCommand(location, path, 'move', { destination: destination }, opts);
  };

  OctoPrintFilesClient.prototype.createFolder = function (location, name, path, opts) {
    var data = { foldername: name };
    if (path !== undefined && path !== '') {
      data.path = path;
    }

    return this.base.postForm(resourceForLocation(location), data, opts);
  };

  OctoPrintFilesClient.prototype.upload = function (location, file, data) {
    data = data || {};

    var filename = data.filename || undefined;
    if (data.userdata && typeof data.userdata === 'object') {
      data.userdata = JSON.stringify(userdata);
    }
    return this.base.upload(resourceForLocation(location), file, filename, data);
  };

  OctoPrintFilesClient.prototype.download = function (location, path, opts) {
    return this.base.download(downloadForEntry(location, path), opts);
  };

  OctoPrintFilesClient.prototype.pathForEntry = function (entry) {
    if (!entry || !entry.hasOwnProperty('parent') || entry.parent == undefined) {
      return '';
    }

    var recursivePath = function (element, path) {
      if (element.hasOwnProperty('parent') && element.parent != undefined) {
        return recursivePath(element.parent, element.name + '/' + path);
      }

      return path;
    };

    return recursivePath(entry.parent, entry.name);
  };

  OctoPrintFilesClient.prototype.entryForPath = function (path, root) {
    if (_.isArray(root)) {
      root = { children: root };
    }

    var recursiveSearch = function (path, entry) {
      if (path.length == 0) {
        return entry;
      }

      if (!entry.hasOwnProperty('children') || !entry.children) {
        return undefined;
      }

      var name = path.shift();
      for (var i = 0; i < entry.children.length; i++) {
        if (name == entry.children[i].name) {
          return recursiveSearch(path, entry.children[i]);
        }
      }

      return undefined;
    };

    return recursiveSearch(path.split('/'), root);
  };

  OctoPrintFilesClient.prototype.pathForElement = function (element) {
    // TODO Remove in 1.4.x
    log.warn('pathForElement has been renamed to pathForEntry, please use that instead');
    return this.pathForEntry(element);
  };

  OctoPrintFilesClient.prototype.elementByPath = function (location, startElement) {
    // TODO Remove in 1.4.x
    log.warn('elementByPath has been renamed to entryForPath, please use that instead');
    return this.entryForPath(location, startElement);
  };

  OctoPrintClient.registerComponent('files', OctoPrintFilesClient);
  return OctoPrintFilesClient;
})();

(() => {
  var url = 'api/job';

  var OctoPrintJobClient = function (base) {
    this.base = base;
  };

  OctoPrintJobClient.prototype.issueCommand = function (command, payload, opts) {
    if (arguments.length == 2) {
      opts = payload;
      payload = {};
    }

    return this.base.issueCommand(url, command, payload, opts);
  };

  OctoPrintJobClient.prototype.get = function (opts) {
    return this.base.get(url, opts);
  };

  OctoPrintJobClient.prototype.start = function (opts) {
    return this.issueCommand('start', opts);
  };

  OctoPrintJobClient.prototype.restart = function (opts) {
    return this.issueCommand('restart', opts);
  };

  OctoPrintJobClient.prototype.pause = function (opts) {
    return this.issueCommand('pause', { action: 'pause' }, opts);
  };

  OctoPrintJobClient.prototype.resume = function (opts) {
    return this.issueCommand('pause', { action: 'resume' }, opts);
  };

  OctoPrintJobClient.prototype.togglePause = function (opts) {
    return this.issueCommand('pause', { action: 'toggle' }, opts);
  };

  OctoPrintJobClient.prototype.cancel = function (opts) {
    return this.issueCommand('cancel', opts);
  };

  OctoPrintClient.registerComponent('job', OctoPrintJobClient);
  return OctoPrintJobClient;
})();

(() => {
  var url = 'api/languages';

  var OctoPrintLanguagesClient = function (base) {
    this.base = base;
  };

  OctoPrintLanguagesClient.prototype.list = function (opts) {
    return this.base.get(url, opts);
  };

  OctoPrintLanguagesClient.prototype.upload = function (file) {
    return this.base.upload(url, file);
  };

  OctoPrintLanguagesClient.prototype.delete = function (locale, pack, opts) {
    var packUrl = url + '/' + locale + '/' + pack;
    return this.base.delete(packUrl, opts);
  };

  OctoPrintClient.registerComponent('languages', OctoPrintLanguagesClient);
  return OctoPrintLanguagesClient;
})();

(() => {
  var url = 'api/printer';
  var printheadUrl = url + '/printhead';
  var toolUrl = url + '/tool';
  var bedUrl = url + '/bed';
  var chamberUrl = url + '/chamber';
  var sdUrl = url + '/sd';

  var OctoPrintPrinterClient = function (base) {
    this.base = base;
  };

  OctoPrintPrinterClient.prototype.issuePrintheadCommand = function (command, payload, opts) {
    return this.base.issueCommand(printheadUrl, command, payload, opts);
  };

  OctoPrintPrinterClient.prototype.issueToolCommand = function (command, payload, opts) {
    return this.base.issueCommand(toolUrl, command, payload, opts);
  };

  OctoPrintPrinterClient.prototype.issueBedCommand = function (command, payload, opts) {
    return this.base.issueCommand(bedUrl, command, payload, opts);
  };

  OctoPrintPrinterClient.prototype.issueChamberCommand = function (command, payload, opts) {
    return this.base.issueCommand(chamberUrl, command, payload, opts);
  };

  OctoPrintPrinterClient.prototype.issueSdCommand = function (command, payload, opts) {
    return this.base.issueCommand(sdUrl, command, payload, opts);
  };

  OctoPrintPrinterClient.prototype.getFullState = function (flags, opts) {
    flags = flags || {};

    var history = flags.history || undefined;
    var limit = flags.limit || undefined;
    var exclude = flags.exclude || undefined;

    var getUrl = url;
    if (history || exclude) {
      getUrl += '?';
      if (history) {
        getUrl += 'history=true&';
        if (limit) {
          getUrl += 'limit=' + limit + '&';
        }
      }

      if (exclude) {
        getUrl += 'exclude=' + exclude.join(',') + '&';
      }
    }

    return this.base.get(getUrl, opts);
  };

  OctoPrintPrinterClient.prototype.getToolState = function (flags, opts) {
    flags = flags || {};

    var history = flags.history || undefined;
    var limit = flags.limit || undefined;

    var getUrl = toolUrl;
    if (history) {
      getUrl += '?history=true';
      if (limit) {
        getUrl += '&limit=' + limit;
      }
    }

    return this.base.get(getUrl, opts);
  };

  OctoPrintPrinterClient.prototype.getBedState = function (flags, opts) {
    flags = flags || {};

    var history = flags.history || undefined;
    var limit = flags.limit || undefined;

    var getUrl = bedUrl;
    if (history) {
      getUrl += '?history=true';
      if (limit) {
        getUrl += '&limit=' + limit;
      }
    }

    return this.base.get(getUrl, opts);
  };

  OctoPrintPrinterClient.prototype.getChamberState = function (flags, opts) {
    flags = flags || {};

    var history = flags.history || undefined;
    var limit = flags.limit || undefined;

    var getUrl = chamberUrl;
    if (history) {
      getUrl += '?history=true';
      if (limit) {
        getUrl += '&limit=' + limit;
      }
    }

    return this.base.get(getUrl, opts);
  };

  OctoPrintPrinterClient.prototype.getSdState = function (opts) {
    return this.base.get(sdUrl, opts);
  };

  OctoPrintPrinterClient.prototype.jog = function (params, opts) {
    params = params || {};

    var absolute = params.absolute || false;

    var payload = { absolute: absolute };
    if (params.x) payload.x = params.x;
    if (params.y) payload.y = params.y;
    if (params.z) payload.z = params.z;
    if (params.speed !== undefined) payload.speed = params.speed;

    return this.issuePrintheadCommand('jog', payload, opts);
  };

  OctoPrintPrinterClient.prototype.home = function (axes, opts) {
    axes = axes || [];

    var payload = {
      axes: axes,
    };

    return this.issuePrintheadCommand('home', payload, opts);
  };

  OctoPrintPrinterClient.prototype.setFeedrate = function (factor, opts) {
    factor = factor || 100;

    var payload = {
      factor: factor,
    };

    return this.issuePrintheadCommand('feedrate', payload, opts);
  };

  OctoPrintPrinterClient.prototype.setToolTargetTemperatures = function (targets, opts) {
    targets = targets || {};

    var payload = {
      targets: targets,
    };

    return this.issueToolCommand('target', payload, opts);
  };

  OctoPrintPrinterClient.prototype.setToolTemperatureOffsets = function (offsets, opts) {
    offsets = offsets || {};

    var payload = {
      offsets: offsets,
    };

    return this.issueToolCommand('offset', payload, opts);
  };

  OctoPrintPrinterClient.prototype.selectTool = function (tool, opts) {
    tool = tool || undefined;

    var payload = {
      tool: tool,
    };

    return this.issueToolCommand('select', payload, opts);
  };

  OctoPrintPrinterClient.prototype.extrude = function (amount, opts) {
    amount = amount || undefined;

    var payload = {
      amount: amount,
    };

    return this.issueToolCommand('extrude', payload, opts);
  };

  OctoPrintPrinterClient.prototype.setFlowrate = function (factor, opts) {
    factor = factor || 100;

    var payload = {
      factor: factor,
    };

    return this.issueToolCommand('flowrate', payload, opts);
  };

  OctoPrintPrinterClient.prototype.setBedTargetTemperature = function (target, opts) {
    target = target || 0;

    var payload = {
      target: target,
    };

    return this.issueBedCommand('target', payload, opts);
  };

  OctoPrintPrinterClient.prototype.setBedTemperatureOffset = function (offset, opts) {
    offset = offset || 0;

    var payload = {
      offset: offset,
    };

    return this.issueBedCommand('offset', payload, opts);
  };

  OctoPrintPrinterClient.prototype.setChamberTargetTemperature = function (target, opts) {
    target = target || 0;

    var payload = {
      target: target,
    };

    return this.issueChamberCommand('target', payload, opts);
  };

  OctoPrintPrinterClient.prototype.setChamberTemperatureOffset = function (offset, opts) {
    offset = offset || 0;

    var payload = {
      offset: offset,
    };

    return this.issueChamberCommand('offset', payload, opts);
  };

  OctoPrintPrinterClient.prototype.initSd = function (opts) {
    return this.issueSdCommand('init', {}, opts);
  };

  OctoPrintPrinterClient.prototype.refreshSd = function (opts) {
    return this.issueSdCommand('refresh', {}, opts);
  };

  OctoPrintPrinterClient.prototype.releaseSd = function (opts) {
    return this.issueSdCommand('release', {}, opts);
  };

  OctoPrintClient.registerComponent('printer', OctoPrintPrinterClient);
  return OctoPrintPrinterClient;
})();

(() => {
  var url = 'api/printerprofiles';

  var profileUrl = function (profile) {
    return url + '/' + profile;
  };

  var OctoPrintPrinterProfileClient = function (base) {
    this.base = base;
  };

  OctoPrintPrinterProfileClient.prototype.list = function (opts) {
    return this.base.get(url, opts);
  };

  OctoPrintPrinterProfileClient.prototype.add = function (profile, basedOn, opts) {
    profile = profile || {};

    var data = { profile: profile };
    if (basedOn) {
      data.basedOn = basedOn;
    }

    return this.base.postJson(url, data, opts);
  };

  OctoPrintPrinterProfileClient.prototype.get = function (id, opts) {
    return this.base.get(profileUrl(id), opts);
  };

  OctoPrintPrinterProfileClient.prototype.update = function (id, profile, opts) {
    profile = profile || {};

    var data = { profile: profile };

    return this.base.patchJson(profileUrl(id), data, opts);
  };

  OctoPrintPrinterProfileClient.prototype.delete = function (id, opts) {
    return this.base.delete(profileUrl(id), opts);
  };

  OctoPrintClient.registerComponent('printerprofiles', OctoPrintPrinterProfileClient);
  return OctoPrintPrinterProfileClient;
})();
(() => {
  var url = 'api/settings';
  var apiKeyUrl = url + '/apikey';

  var OctoPrintSettingsClient = function (base) {
    this.base = base;
  };

  OctoPrintSettingsClient.prototype.get = function (opts) {
    return this.base.get(url, opts);
  };

  OctoPrintSettingsClient.prototype.save = function (settings, opts) {
    settings = settings || {};
    return this.base.postJson(url, settings, opts);
  };

  OctoPrintSettingsClient.prototype.getPluginSettings = function (plugin, opts) {
    return this.get(opts).then(function (settings, statusText, request) {
      if (!settings.plugins || !settings.plugins[plugin]) {
        return $.Deferred()
          .reject(request, 'dataerror', 'No settings for plugin ' + plugin)
          .promise();
      } else {
        return settings.plugins[plugin];
      }
    });
  };

  OctoPrintSettingsClient.prototype.savePluginSettings = function (plugin, settings, opts) {
    var data = {};
    data['plugins'] = {};
    data['plugins'][plugin] = settings;
    return this.save(data, opts);
  };

  OctoPrintSettingsClient.prototype.generateApiKey = function (opts) {
    return this.base.postJson(apiKeyUrl, opts);
  };

  OctoPrintClient.registerComponent('settings', OctoPrintSettingsClient);
  return OctoPrintSettingsClient;
})();
(() => {
  var url = 'api/slicing';

  var slicerUrl = function (slicer) {
    return url + '/' + slicer;
  };

  var profileUrl = function (slicer, profileId) {
    return slicerUrl(slicer) + '/profiles/' + profileId;
  };

  var OctoPrintSlicingClient = function (base) {
    this.base = base;
  };

  OctoPrintSlicingClient.prototype.listAllSlicersAndProfiles = function (opts) {
    return this.base.get(url, opts);
  };

  OctoPrintSlicingClient.prototype.listProfilesForSlicer = function (slicer, opts) {
    return this.base.get(slicerUrl(slicer) + '/profiles', opts);
  };

  OctoPrintSlicingClient.prototype.getProfileForSlicer = function (slicer, profileId, opts) {
    return this.base.get(profileUrl(slicer, profileId), opts);
  };

  OctoPrintSlicingClient.prototype.addProfileForSlicer = function (slicer, profileId, profile, opts) {
    profile = profile || {};
    return this.base.putJson(profileUrl(slicer, profileId), profile, opts);
  };

  OctoPrintSlicingClient.prototype.updateProfileForSlicer = function (slicer, profileId, profile, opts) {
    profile = profile || {};
    return this.base.patchJson(profileUrl(slicer, profileId), profile, opts);
  };

  OctoPrintSlicingClient.prototype.deleteProfileForSlicer = function (slicer, profileId, opts) {
    return this.base.delete(profileUrl(slicer, profileId), opts);
  };

  OctoPrintClient.registerComponent('slicing', OctoPrintSlicingClient);
  return OctoPrintSlicingClient;
})();
(() => {
  var normalClose = 1000;

  var OctoPrintSocketClient = function (base) {
    var self = this;

    this.base = base;

    this.options = {
      timeouts: [0, 1, 1, 2, 3, 5, 8, 13, 20, 40, 100],
      connectTimeout: 5000,
      rateSlidingWindowSize: 20,
    };

    this.socket = undefined;
    this.reconnecting = false;
    this.reconnectTrial = 0;
    this.registeredHandlers = {};

    this.rateThrottleFactor = 1;
    this.rateBase = 500;
    this.rateLastMeasurements = [];

    this.connectTimeout = undefined;

    this.onMessage('connected', function () {
      // Make sure to clear connection timeout on connect
      if (self.connectTimeout) {
        clearTimeout(self.connectTimeout);
        self.connectTimeout = undefined;
      }
    });
  };

  OctoPrintSocketClient.prototype.propagateMessage = function (event, data) {
    var start = new Date().getTime();

    var eventObj = { event: event, data: data };

    var catchAllHandlers = this.registeredHandlers['*'];
    if (catchAllHandlers && catchAllHandlers.length) {
      _.each(catchAllHandlers, function (handler) {
        handler(eventObj);
      });
    }

    var handlers = this.registeredHandlers[event];
    if (handlers && handlers.length) {
      _.each(handlers, function (handler) {
        handler(eventObj);
      });
    }

    var end = new Date().getTime();
    this.analyzeTiming(end - start);
  };

  OctoPrintSocketClient.prototype.analyzeTiming = function (measurement) {
    while (this.rateLastMeasurements.length >= this.options.rateSlidingWindowSize) {
      this.rateLastMeasurements.shift();
    }
    this.rateLastMeasurements.push(measurement);

    var processingLimit = this.rateThrottleFactor * this.rateBase;
    if (measurement > processingLimit) {
      this.onRateTooHigh(measurement, processingLimit);
    } else if (this.rateThrottleFactor > 1) {
      var maxProcessingTime = Math.max.apply(null, this.rateLastMeasurements);
      var lowerProcessingLimit = (this.rateThrottleFactor - 1) * this.rateBase;
      if (maxProcessingTime < lowerProcessingLimit) {
        this.onRateTooLow(maxProcessingTime, lowerProcessingLimit);
      }
    }
  };

  OctoPrintSocketClient.prototype.increaseRate = function () {
    if (this.rateThrottleFactor <= 1) {
      this.rateThrottleFactor = 1;
      return;
    }
    this.rateThrottleFactor--;
    this.sendThrottleFactor();
  };

  OctoPrintSocketClient.prototype.decreaseRate = function () {
    this.rateThrottleFactor++;
    this.sendThrottleFactor();
  };

  OctoPrintSocketClient.prototype.sendThrottleFactor = function () {
    this.sendMessage('throttle', this.rateThrottleFactor);
  };

  OctoPrintSocketClient.prototype.sendAuth = function (userId, session) {
    this.sendMessage('auth', userId + ':' + session);
  };

  OctoPrintSocketClient.prototype.sendMessage = function (type, payload) {
    var data = {};
    data[type] = payload;
    this.socket.send(JSON.stringify(data));
  };

  OctoPrintSocketClient.prototype.connect = function (opts) {
    opts = opts || {};

    var self = this;

    self.disconnect();

    var url = self.base.options.baseurl;
    if (!_.endsWith(url, '/')) {
      url += '/';
    }

    var onOpen = function () {
      self.reconnecting = false;
      self.reconnectTrial = 0;
      self.onConnected();
    };

    var onClose = function (e) {
      if (e.code === normalClose) {
        return;
      }

      if (self.onReconnectAttempt(self.reconnectTrial)) {
        return;
      }

      self.onDisconnected(e.code);

      if (self.reconnectTrial < self.options.timeouts.length) {
        var timeout = self.options.timeouts[self.reconnectTrial];
        setTimeout(function () {
          self.reconnect();
        }, timeout * 1000);
        self.reconnectTrial++;
      } else {
        self.onReconnectFailed();
      }
    };

    var onMessage = function (msg) {
      _.each(msg.data, function (data, key) {
        self.propagateMessage(key, data);
      });
    };

    if (self.connectTimeout) {
      clearTimeout(self.connectTimeout);
    }
    self.connectTimeout = setTimeout(function () {
      self.onConnectTimeout();
    }, self.options.connectTimeout);

    self.socket = new SockJS(url + 'sockjs', undefined, opts);
    self.socket.onopen = onOpen;
    self.socket.onclose = onClose;
    self.socket.onmessage = onMessage;
  };

  OctoPrintSocketClient.prototype.reconnect = function () {
    this.disconnect();
    this.socket = undefined;
    this.connect();
  };

  OctoPrintSocketClient.prototype.disconnect = function () {
    if (this.socket !== undefined) {
      this.socket.close();
    }
  };

  OctoPrintSocketClient.prototype.onMessage = function (message, handler) {
    if (!this.registeredHandlers.hasOwnProperty(message)) {
      this.registeredHandlers[message] = [];
    }
    this.registeredHandlers[message].push(handler);
    return this;
  };

  OctoPrintSocketClient.prototype.onReconnectAttempt = function (trial) {};
  OctoPrintSocketClient.prototype.onReconnectFailed = function () {};
  OctoPrintSocketClient.prototype.onConnected = function () {};
  OctoPrintSocketClient.prototype.onDisconnected = function (code) {};
  OctoPrintSocketClient.prototype.onConnectTimeout = function () {};

  OctoPrintSocketClient.prototype.onRateTooLow = function (measured, minimum) {
    this.increaseRate();
  };
  OctoPrintSocketClient.prototype.onRateTooHigh = function (measured, maximum) {
    this.decreaseRate();
  };

  OctoPrintClient.registerComponent('socket', OctoPrintSocketClient);
  return OctoPrintSocketClient;
})();
(() => {
  var url = 'api/system';
  var commandUrl = 'api/system/commands';

  var OctoPrintSystemClient = function (base) {
    this.base = base;
  };

  OctoPrintSystemClient.prototype.getCommands = function (opts) {
    return this.base.get(commandUrl, opts);
  };

  OctoPrintSystemClient.prototype.getCommandsForSource = function (source, opts) {
    return this.base.get(commandUrl + '/' + source, opts);
  };

  OctoPrintSystemClient.prototype.executeCommand = function (source, action, opts) {
    return this.base.postJson(commandUrl + '/' + source + '/' + action, {}, opts);
  };

  OctoPrintClient.registerComponent('system', OctoPrintSystemClient);
  return OctoPrintSystemClient;
})();
(() => {
  var url = 'api/timelapse';

  var downloadUrl = 'downloads/timelapse';

  var timelapseUrl = function (filename) {
    return url + '/' + filename;
  };

  var timelapseDownloadUrl = function (filename) {
    return downloadUrl + '/' + filename;
  };

  var unrenderedTimelapseUrl = function (name) {
    return url + '/unrendered/' + name;
  };

  var OctoPrintTimelapseClient = function (base) {
    this.base = base;
  };

  OctoPrintTimelapseClient.prototype.get = function (unrendered, opts) {
    if (unrendered) {
      opts = opts || {};
      opts.data = { unrendered: unrendered };
    }
    return this.base.get(url, opts);
  };

  OctoPrintTimelapseClient.prototype.list = function (opts) {
    var deferred = $.Deferred();

    this.get(true, opts)
      .done(function (response, status, request) {
        deferred.resolve(
          {
            rendered: response.files,
            unrendered: response.unrendered,
          },
          status,
          request
        );
      })
      .fail(function () {
        deferred.reject.apply(null, arguments);
      });

    return deferred.promise();
  };

  OctoPrintTimelapseClient.prototype.listRendered = function (opts) {
    var deferred = $.Deferred();

    this.get(false, opts)
      .done(function (response, status, request) {
        deferred.resolve(response.files, status, request);
      })
      .fail(function () {
        deferred.reject.apply(null, arguments);
      });

    return deferred.promise();
  };

  OctoPrintTimelapseClient.prototype.listUnrendered = function (opts) {
    var deferred = $.Deferred();

    this.get(true, opts)
      .done(function (response, status, request) {
        deferred.resolve(response.unrendered, status, request);
      })
      .fail(function () {
        deferred.reject.apply(null, arguments);
      });

    return deferred.promise();
  };

  OctoPrintTimelapseClient.prototype.download = function (filename, opts) {
    return this.base.download(timelapseDownloadUrl(filename), opts);
  };

  OctoPrintTimelapseClient.prototype.delete = function (filename, opts) {
    return this.base.delete(timelapseUrl(filename), opts);
  };

  OctoPrintTimelapseClient.prototype.deleteUnrendered = function (name, opts) {
    return this.base.delete(unrenderedTimelapseUrl(name), opts);
  };

  OctoPrintTimelapseClient.prototype.renderUnrendered = function (name, opts) {
    return this.base.issueCommand(unrenderedTimelapseUrl(name), 'render');
  };

  OctoPrintTimelapseClient.prototype.getConfig = function (opts) {
    var deferred = $.Deferred();
    this.get(false, opts)
      .done(function (response, status, request) {
        deferred.resolve(response.config, status, request);
      })
      .fail(function () {
        deferred.reject.apply(null, arguments);
      });
    return deferred.promise();
  };

  OctoPrintTimelapseClient.prototype.saveConfig = function (config, opts) {
    config = config || {};
    return this.base.postJson(url, config, opts);
  };

  OctoPrintClient.registerComponent('timelapse', OctoPrintTimelapseClient);
  return OctoPrintTimelapseClient;
})();
(() => {
  var deprecatedUserClient = function (deprecatedFct, newFct, fn) {
    return OctoPrintClient.deprecated('OctoPrintClient.users.' + deprecatedFct, 'OctoPrintClient.access.users.' + newFct, fn);
  };

  var OctoPrintUserClient = function (base) {
    this.base = base;
  };

  OctoPrintUserClient.prototype.list = deprecatedUserClient('list', 'list', function (opts) {
    return this.base.access.users.list(opts);
  });

  OctoPrintUserClient.prototype.add = deprecatedUserClient('add', 'add', function (user, opts) {
    return this.base.access.users.add(user, opts);
  });

  OctoPrintUserClient.prototype.get = deprecatedUserClient('get', 'get', function (name, opts) {
    return this.base.access.users.get(name, opts);
  });

  OctoPrintUserClient.prototype.update = deprecatedUserClient('update', 'update', function (
    name,
    active,
    admin,
    permissions,
    groups,
    opts
  ) {
    return this.base.access.users.update(name, active, admin, permissions, groups, opts);
  });

  OctoPrintUserClient.prototype.delete = deprecatedUserClient('delete', 'delete', function (name, opts) {
    return this.base.access.users.delete(name, opts);
  });

  OctoPrintUserClient.prototype.changePassword = deprecatedUserClient('changePassword', 'changePassword', function (
    name,
    password,
    opts
  ) {
    return this.base.access.users.changePassword(name, password, opts);
  });

  OctoPrintUserClient.prototype.generateApiKey = deprecatedUserClient('generateApiKey', 'generateApiKey', function (
    name,
    opts
  ) {
    return this.base.access.users.generateApiKey(name, opts);
  });

  OctoPrintUserClient.prototype.resetApiKey = deprecatedUserClient('resetApiKey', 'resetApiKey', function (name, opts) {
    return this.base.access.users.resetApiKey(name, opts);
  });

  OctoPrintUserClient.prototype.getSettings = deprecatedUserClient('getSettings', 'getSettings', function (name, opts) {
    return this.base.access.users.getSettings(name, opts);
  });

  OctoPrintUserClient.prototype.saveSettings = deprecatedUserClient('saveSettings', 'saveSettings', function (
    name,
    settings,
    opts
  ) {
    return this.base.access.users.saveSettings(name, settings, opts);
  });

  OctoPrintClient.registerComponent('users', OctoPrintUserClient);
  return OctoPrintUserClient;
})();
(() => {
  var url = 'api/util';
  var testUrl = url + '/test';

  var OctoPrintUtilClient = function (base) {
    this.base = base;
  };

  OctoPrintUtilClient.prototype.test = function (command, parameters, opts) {
    return this.base.issueCommand(testUrl, command, parameters, opts);
  };

  OctoPrintUtilClient.prototype.testPath = function (path, additional, opts) {
    additional = additional || {};

    var data = $.extend({}, additional);
    data.path = path;

    return this.test('path', data, opts);
  };

  OctoPrintUtilClient.prototype.testExecutable = function (path, additional, opts) {
    additional = additional || {};

    var data = $.extend({}, additional);
    data.path = path;
    data.check_type = 'file';
    data.check_access = 'x';

    return this.test('path', data, opts);
  };

  OctoPrintUtilClient.prototype.testUrl = function (url, additional, opts) {
    additional = additional || {};

    var data = $.extend({}, additional);
    data.url = url;

    return this.test('url', data, opts);
  };

  OctoPrintUtilClient.prototype.testServer = function (host, port, additional, opts) {
    additional = additional || {};

    var data = $.extend({}, additional);
    data.host = host;
    data.port = port;

    return this.test('server', data, opts);
  };

  OctoPrintClient.registerComponent('util', OctoPrintUtilClient);
  return OctoPrintUtilClient;
})();
(() => {
  var url = 'api/setup/wizard';

  var OctoPrintWizardClient = function (base) {
    this.base = base;
  };

  OctoPrintWizardClient.prototype.get = function (opts) {
    return this.base.get(url, opts);
  };

  OctoPrintWizardClient.prototype.finish = function (handled, opts) {
    return this.base.postJson(url, { handled: handled || [] }, opts);
  };

  OctoPrintClient.registerComponent('wizard', OctoPrintWizardClient);
  return OctoPrintWizardClient;
})();

export default OctoPrintClient;
