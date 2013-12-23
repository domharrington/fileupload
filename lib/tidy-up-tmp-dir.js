var async = require('async')
  , fs = require('fs')

module.exports = function tidyUpTmpDir(req, res, next) {

  function deleteFile(field, next) {
    var files = req.files[field]

    if (!Array.isArray(files)) {
      files = [files]
    }

    async.each(files, function (file, next) {
      fs.unlink(file.path, next)
    }, next)
  }

  async.each(Object.keys(req.files), deleteFile, next)
}
