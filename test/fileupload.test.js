var assert = require('assert')
  , fs = require('fs')
  , fermata = require('fermata')
  , port = 7778
  , path = require('path')
  , mime = require('mime')
  , fileModule = require('../lib/modules/file')
  , helpers = require('./test-helpers')({ port: port })
  , temp = require('temp')

describe('fileupload', function () {

  describe('#createFileUpload()', function () {

    var url = 'http://localhost:' + port

    function postFiles(files, callback) {
      fermata.json(url).post({
        'Content-Type': 'multipart/form-data'
      },
      files,
      function (error, data) {
        callback(data)
      })
    }

    function postFields(fields, callback) {
      fermata.json(url).post(fields, function (error, data) {
        callback(data)
      })
    }

    describe('middleware', function () {
      var options = helpers.defaultOptions('/middleware-test')
        , uploadDir
        , image1Name = 'test1.gif'
        , image2Name = 'test2.gif'
        , image1 = fs.createReadStream(__dirname + '/files/' + image1Name)
        , image2 = fs.createReadStream(__dirname + '/files/' + image2Name)

      uploadDir = options

      it('creates the upload dir if it doesnt exist', function (done) {

        fs.stat(uploadDir, function (error) {
          assert.equal(error.code, 'ENOENT')

          var app = helpers.setupMiddleware(options)

          setTimeout(function () {
            fs.stat(uploadDir, function (error, stats) {
              assert.equal(true, stats.isDirectory())
              fs.rmdirSync(uploadDir)
              app.close()
              done()
            })
          }, 30)

        })
      })

      it('moves file to the correct location', function (done) {
        var app = helpers.setupMiddleware(options)

        postFiles({
          image: {
            data: image1,
            name: image1Name
          }
        }, function (data) {
          fs.stat(path.join(uploadDir, data.image[0].path,
            data.image[0].basename), function (error, stats) {

            assert.equal(true, stats.isFile())
            app.close()
            done()
          })
        })
      })

      it('works for more than one file input in a form', function (done) {
        var app = helpers.setupMiddleware(options)

        postFiles({
          image1: {
            data: image1,
            name: image1Name
          },
          image2: {
            data: image2,
            name: image2Name
          }
        }, function (data) {
          assert.equal(image1Name, data.image1[0].basename)
          assert.equal(image2Name, data.image2[0].basename)
          app.close()
          done()
        })
      })

      it('works for arrays of files', function (done) {
        var app = helpers.setupMiddleware(options)

        postFiles({
          images: [
            {
              data: image1,
              name: image1Name
            },
            {
              data: image2,
              name: image2Name
            }
          ]
        }, function (data) {
          assert.equal(Array.isArray(data.images), true)
          assert.equal(data.images.length, 2)
          app.close()
          done()
        })
      })

      it('is tolerant of no files being uploaded', function (done) {
        var field = { hello: 'world' }
          , app = helpers.setupMiddleware(options)

        postFields(field, function (data) {
          assert.deepEqual(data, field)
          app.close()
          done()
        })
      })

      it('should tidy up the tmp dir of files', function (done) {
        var app = helpers.setupMiddleware(options)
          , numberOfFilesInTmp = fs.readdirSync('/tmp').length

        postFiles({
          images: [
            {
              data: image1,
              name: image1Name
            },
            {
              data: image2,
              name: image2Name
            }
          ]
        }, function () {
          app.close()
          assert.equal(fs.readdirSync('/tmp').length, numberOfFilesInTmp)
          done()
        })
      })

      afterEach(helpers.afterEach(uploadDir))
    })

    describe('#put()', function () {
      var options = helpers.defaultOptions('/put-test')
        , filePath = __dirname + '/files/test1.gif'
        , uploadDir = options

      it('successfully puts a file when given a file path', function (done) {
        var put = helpers.setupPut(options)

        put(filePath, function (error, file) {
          assert.equal('object', typeof file)
          fs.stat(path.join(uploadDir, file.path,
            path.basename(filePath)), function (error, stats) {
            assert.equal(true, stats.isFile())
            done()
          })
        })
      })

      it('returns the correct file mime type', function (done) {
        var put = helpers.setupPut(options)

        put(filePath, function (error, file) {
          assert.equal(file.type, mime.lookup(filePath))
          done()
        })
      })

      it('returns the correct file size', function (done) {
        var put = helpers.setupPut(options)

        put(filePath, function (error, file) {
          fs.stat(filePath, function (error, stats) {
            assert.equal(file.size, stats.size)
            done()
          })
        })
      })

      it('moves files to the correct location', function (done) {
        var put = helpers.setupPut(options)

        put(filePath, function (error, file) {
          fs.stat(path.join(uploadDir, file.path, file.basename), function (error, stats) {
            assert.equal(true, stats.isFile())
            done()
          })
        })

      })

      it('returns an error if file doesnt exist', function (done) {
        var put = helpers.setupPut(options)

        put('test-fake-file.gif', function (error) {
          assert.equal(false, error === null)
          assert(error instanceof Error)
          assert.equal('ENOENT', error.code)
          done()
        })
      })

      it('stores the file in a folder named as an md5 hash of the file', function (done) {
        var put = helpers.setupPut(options)

        put(filePath, function (error, file) {
          fileModule.getFileHash(filePath, function (error, hash) {
            // Removing the trailing slash from the file path
            file.path = file.path.slice(0, -1)
            assert.equal(file.path, hash)
            done()
          })
        })
      })

      afterEach(helpers.afterEach(uploadDir))
    })

    describe('#get()', function () {
      var options = helpers.defaultOptions('/get-test')
        , fileName = '/files/test1.gif'
        , filePath = __dirname + fileName
        , uploadDir = options
        , storedFile


      before(function (done) {
        var put = helpers.setupPut(options)

        put(filePath, function (error, file) {
          storedFile = file
          done()
        })
      })

      it('returns the file when passed a file object', function (done) {
        var get = helpers.setupGet(options)
        get(storedFile, function (error, file) {
          assert(file instanceof Buffer)
          done()
        })
      })

      it('returns the file when passed a file path', function (done) {
        var get = helpers.setupGet(options)

        get(path.join(storedFile.path, storedFile.basename), function (error, file) {
          assert(file instanceof Buffer)
          done()
        })
      })

      it('returns an error if file does not exist', function (done) {
        var get = helpers.setupGet(options)

        get('test-fake-file.gif', function (error) {
          assert.equal(false, error === null)
          assert(error instanceof Error)
          assert.equal('ENOENT', error.code)
          done()
        })
      })

      describe('Streams', function () {
        it('writes file data to a stream', function (done) {
          var getAsReadStream = helpers.setupGetAsReadStream(options)
            , writeStream = temp.createWriteStream()
            , readStream = getAsReadStream(storedFile)

          writeStream.on('close', function (err) {
            assert(typeof err === 'undefined')
            done()
          })

          assert(readStream instanceof fs.ReadStream)

          readStream.pipe(writeStream)
        })
      })

      after(helpers.afterEach(uploadDir))
    })

    describe('#delete()', function () {
      var options = helpers.defaultOptions('/delete-test')
        , filePath = __dirname + '/files/test1.gif'
        , uploadDir = options
        , storedFile
        , storedFilePath


      before(function (done) {
        var put = helpers.setupPut(options)

        put(filePath, function (error, file) {
          storedFile = file
          storedFilePath = path.join(storedFile.path, storedFile.basename)

          done()
        })
      })

      it('deletes the file when passed a file object', function (done) {
        var remove = helpers.setupDelete(options)

        remove(storedFile, function () {
          fs.stat(storedFilePath, function (error) {
            assert.equal('ENOENT', error.code)
            done()
          })
        })
      })

      it('deletes the file when passed a file path', function (done) {
        var remove = helpers.setupDelete(options)

        remove(storedFilePath, function () {
          fs.stat(storedFilePath, function (error) {
            assert.equal('ENOENT', error.code)
            done()
          })
        })
      })

      after(helpers.afterEach(uploadDir))
    })

  })
})