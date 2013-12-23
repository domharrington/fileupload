var async = require('async')
  , _ = require('lodash')
  , tidyUpTmpDir = require('./tidy-up-tmp-dir')

module.exports.createFileUpload = function (options) {

  // If no adapter passed in, assume options is just an upload dir
  var uploadDelegate = options.adapter || require('./modules/file')(options)

  return _.extend(
    { middleware: function (req, res, next) {
        if (typeof req.files === 'undefined' || Object.keys(req.files).length === 0) {
          return next()
        }

        function parseRequest(field, cb) {
          var files = req.files[field]
            , filesArray = []

          if (!Array.isArray(files)) {
            files = [files]
          }

          async.forEach(files, function (file, cb) {
            filesArray = []

            if (typeof file.path === 'undefined' || file.size === 0) {
              return cb()
            }

            uploadDelegate.put(file, function (error, storedFile) {
              filesArray.push(storedFile)
              cb()
            })

          }, function () {
            req.body[field] = filesArray
            cb()
          })
        }

        async.forEach(Object.keys(req.files), parseRequest, function (error) {
          if (error) return next (error)
          tidyUpTmpDir(req, res, next)
        })
      }
    }, uploadDelegate)
}