var fs = require('fs')
  , path = require('path')
  , async = require('async')
  , crypto = require('crypto')
  , mime = require('mime')
  ;

module.exports = function(uploadDir) {

  async.waterfall([
    function(callback) {
      fs.stat(uploadDir, function(error) {
        // Deliberately passing error to next function for checking
        callback(null, error);
      });
    },
    function(error, callback) {
      if (error && error.code === 'ENOENT') {
        fs.mkdir(uploadDir, '0755', function(error) {
          callback(error);
        });
      }
    }
  ], function(error) {
    if (error) {
      throw error;
    }
  });

  function put(file, callback) {

    async.waterfall([
      function(callback) {
        // Checking if the file is a path
        if (typeof file === 'string') {
          var fileType = mime.lookup(file)
            , size
            , name = ''
            ;

            // Creates a random folder name
            for (var i = 0; i < 32; i++) {
              name += Math.floor(Math.random() * 16).toString(16);
            }

            fs.stat(file, function(error, stats) {
              if (error && error.code === 'ENOENT') {
                return callback(error);
              }

              size = stats.size;
              file = fs.createReadStream(file);
              file.name = path.basename(file.path);
              file.type = fileType;
              file.size = size;
              callback(null, name);
            });

        } else {
          callback(null, path.basename(file.path));
        }
      },
      function(name, callback) {
        fs.mkdir(path.join(uploadDir, name), '0755', function(error) {

          var destPath = path.join(uploadDir, name, file.name)
            , readFile = fs.createReadStream(file.path)
            , writeFile = fs.createWriteStream(destPath, { flags: 'w' })
            ;

          readFile.pipe(writeFile);
          readFile.on('end', function() {
            file = {
              size: file.size,
              type: file.type,
              path: name + '/',
              basename: file.name
            };
            callback(null, file);
          });
        });
      }
    ], function(error, file) {
      callback(error, file);
    });

  }

  function getFilePath(file) {
    var filePath;

    if (typeof file === 'string') {
      filePath = file;
    } else if (typeof file === 'object' && file.path && file.basename) {
      filePath = path.join(file.path, file.basename);
    }

    return filePath;
  }

  function get(file, callback) {
    var filePath = getFilePath(file);

    fs.readFile(path.join(uploadDir, filePath), function(error, data) {
      callback(error, data);
    });
  }

  function remove(file, callback) {
    var filePath = getFilePath(file);

    fs.unlink(path.join(uploadDir, filePath), function(error) {
      callback(error);
    });
  }

  return {
    put: put,
    get: get,
    delete: remove
  };
};