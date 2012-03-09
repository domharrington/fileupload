var async = require('async')
  , fs = require('fs')
  , path = require('path')
  ;

module.exports.createFileUpload = function(uploadDir) {

  async.waterfall([
    function(callback) {
      fs.stat(uploadDir, function(error) {
        // Deliberately passing error to next function
        callback(null, error);
      });
    },
    function(error, callback) {
      if (error && error.code === 'ENOENT') {
        fs.mkdir(uploadDir, '0755', function(error) {
          console.log(error);
          callback(error);
        });
      }
    }
  ], function(error) {
    if (error) {
      throw error;
    }
  });

  return function(req, res, next) {

    if (typeof req.files === 'undefined' || Object.keys(req.files).length === 0) {
      return next();
    }

    async.forEach(Object.keys(req.files), function(key, eachCallback) {
      var
        files = req.files[key],
        filesArray = [];

      if (!Array.isArray(files)) {
        files = [files];
      }

      async.forEach(files, function(file, callback) {
        filesArray = [];

        if (typeof file.path === 'undefined' || file.size === 0) {
          return callback();
        }

        var hash = path.basename(file.path);

        fs.mkdir(uploadDir + '/' + hash, '0755', function(error) {

          var destPath = path.normalize(uploadDir + '/' + hash + '/' + file.name)
            , readFile = fs.createReadStream(file.path)
            , writeFile = fs.createWriteStream(destPath, { flags: 'w' })
            ;

          readFile.pipe(writeFile);
          readFile.on('end', function() {
            filesArray.push({
              size: file.size,
              type: file.type,
              path: hash + '/',
              basename: file.name
            });
            callback();
          });
        });
      }, function() {
        req.body[key] = filesArray;
        eachCallback();
      });

    }, function(error) {
      next();
    });
  };
};