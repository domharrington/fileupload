var express = require('express')
  , fileupload = require('../')
  , exec = require('child_process').exec

module.exports = function (testOptions) {

  function setup(options) {
    var app = express()
      , fileuploadInstance = fileupload.createFileUpload(options)

    return {
      app: app,
      fileupload: fileuploadInstance
    }
  }

  return {
    setupMiddleware: function (options) {
      var setupVariables = setup(options)
        , app = setupVariables.app
        , middleware = setupVariables.fileupload.middleware

      app.use(express.bodyParser())

      app.post('/', middleware, function (req, res) {
        res.send(req.body)
      })

      return app.listen(testOptions.port)
    },
    setupGet: function (options) {
      var setupVariables = setup(options)
        , get = setupVariables.fileupload.get

      return get
    },
    setupGetAsReadStream: function (options) {
      var setupVariables = setup(options)
        , getAsReadStream = setupVariables.fileupload.getAsReadStream

      return getAsReadStream
    },
    setupPut: function (options) {
      var setupVariables = setup(options)
        , put = setupVariables.fileupload.put

      return put
    },
    setupDelete: function (options) {
      var setupVariables = setup(options)
        , remove = setupVariables.fileupload['delete']

      return remove
    },
    defaultOptions: function (uploadDir) {
      return __dirname + uploadDir
    },
    afterEach: function (uploadDir) {
      return function (done) {
        exec('rm -rf ' + uploadDir, function () {
          done()
        })
      }
    }
  }
}