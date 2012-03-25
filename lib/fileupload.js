var async = require('async')
  , fs = require('fs')
  ;

module.exports.createFileUpload = function(options) {

  // Assume file based uploader
  if (typeof options === 'string') {
    var uploadDir = options;

    options = {
      type: 'file',
      options: {
        uploadDir: uploadDir
      }
    };
  }

  var uploadDelegate = require('./modules/' + options.type)(options.options);

  return {
    get: uploadDelegate.get,
    put: uploadDelegate.put,
    delete: uploadDelegate.delete,
    middleware: function(req, res, next) {
      if (typeof req.files === 'undefined' || Object.keys(req.files).length === 0) {
        return next();
      }

      async.forEach(Object.keys(req.files), function(key, eachCallback) {
        var files = req.files[key]
          , filesArray = []
          ;

        if (!Array.isArray(files)) {
          files = [files];
        }

        async.forEach(files, function(file, callback) {
          filesArray = [];

          if (typeof file.path === 'undefined' || file.size === 0) {
            return callback();
          }

          uploadDelegate.put(file, function(error, storedFile) {
            filesArray.push(storedFile);
            callback();
          });

        }, function() {
          req.body[key] = filesArray;
          eachCallback();
        });

      }, function(error) {
        next();
      });
    }
  };
};