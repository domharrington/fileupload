var fs = require('fs')
  , path = require('path')
  , async = require('async')
  , crypto = require('crypto')
  , mime = require('mime')

module.exports = function (uploadDir) {

  async.waterfall([
    function (callback) {
      fs.stat(uploadDir, function (error) {
        // Deliberately passing error to next function for checking
        callback(null, error)
      })
    },
    function (error, callback) {
      if (error && error.code === 'ENOENT') {
        fs.mkdir(uploadDir, '0755', callback)
      }
    }
  ], function (error) {
    if (error) {
      throw error
    }
  })

  function put(file, callback) {

    async.waterfall([
      function (callback) {

        // Checking if the file is a path
        if (typeof file === 'string') {
          var fileType = mime.lookup(file)
            , size

          getFileHash(file, function (error, name) {
            if (error) return callback(error)

            fs.stat(file, function (error, stats) {
              if (error && error.code === 'ENOENT') {
                return callback(error)
              }

              size = stats.size
              file = fs.createReadStream(file)
              file.name = path.basename(file.path)
              file.type = fileType
              file.size = size
              callback(null, name)
            })
          })
        } else {
          getFileHash(file.path, callback)
        }
      },
      function (name, callback) {
        fs.mkdir(path.join(uploadDir, name), '0755', function () {

          var tempLocation = file.path
            , destPath = path.join(uploadDir, name, file.name)

          file =
            { size: file.size
            , type: file.type
            , path: name + '/'
            , basename: file.name
            }

          fs.stat(destPath, function (error, stats) {
            // If the file doesn't exist, create it
            if (error && error.code === 'ENOENT') {
              var readFile = fs.createReadStream(tempLocation)
                , writeFile = fs.createWriteStream(destPath, { flags: 'w' })

              readFile.pipe(writeFile)
              readFile.on('end', function () {
                callback(null, file)
              })

            // If the file does exist, just pass back the file details
            } else if (stats && stats.isFile()) {
              callback(null, file)

            // If there was an error that wasn't a non-existent file, return it
            } else {
              callback(error)
            }
          })
        })
      }
    ], callback)

  }

  function getFilePath(file) {
    return typeof file === 'string' ? file : path.join(file.path, file.basename)
  }

  function get(file, callback) {
    fs.readFile(path.join(uploadDir, getFilePath(file)), callback)
  }

  function getAsReadStream(file, options) {
    return fs.createReadStream(path.join(uploadDir, getFilePath(file)), options)
  }

  function remove(file, callback) {
    fs.unlink(path.join(uploadDir, getFilePath(file)), callback)
  }

  return {
    put: put,
    get: get,
    getAsReadStream: getAsReadStream,
    'delete': remove
  }
}

module.exports.getFileHash = getFileHash

// Generate MD5 hash based on file content to stop double upload
function getFileHash(filePath, callback) {
  fs.readFile(filePath, 'utf-8', function (error, file) {
    if (error) return callback(error)

    callback(null, crypto.createHash('md5').update(file).digest('hex'))
  })
}