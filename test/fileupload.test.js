var fileupload = require('../index')
  , should = require('should')
  , fs = require('fs')
  , express = require('express')
  , fermata = require('fermata')
  , port = 7778
  , path = require('path')
  , mime = require('mime')
  , helpers = require('./testHelpers')({
      port: port
    })
  ;

describe('fileupload', function() {

  describe('#createFileUpload()', function() {

    var url = 'http://localhost:' + port;

    function postFiles(files, callback) {
      fermata.json(url).post({
        'Content-Type': 'multipart/form-data'
      },
      files,
      function(error, data) {
        callback(data);
      });
    }

    function postFields(fields, callback) {
      fermata.json(url).post(fields, function(error, data) {
        callback(data);
      });
    }

    describe('middleware', function() {
      var options = helpers.defaultOptions('/middleware-test')
        , uploadDir
        , image1Name = 'test1.gif'
        , image2Name = 'test2.gif'
        , image1 = fs.createReadStream(__dirname + '/files/' + image1Name)
        , image2 = fs.createReadStream(__dirname + '/files/' + image2Name)
        ;

      uploadDir = options;

      it('creates the upload dir if it doesnt exist', function(done) {

        fs.stat(uploadDir, function(error, stats) {
          error.code.should.equal('ENOENT');

          var app = helpers.setupMiddleware(options);

          setTimeout(function() {
            fs.stat(uploadDir, function(error, stats) {
              stats.isDirectory().should.equal(true);
              fs.rmdirSync(uploadDir);
              app.close();
              done();
            });
          }, 30);

        });
      });

      it('moves file to the correct location', function(done) {
        var app = helpers.setupMiddleware(options);

        postFiles({
          image: {
            data: image1,
            name: image1Name
          }
        }, function(data) {
          fs.stat(path.join(uploadDir, data.image[0].path,
            data.image[0].basename), function(error, stats) {

            stats.isFile().should.equal(true);
            app.close();
            done();
          });
        });
      });

      it('works for more than one file input in a form', function(done) {
        var app = helpers.setupMiddleware(options);

        postFiles({
          image1: {
            data: image1,
            name: image1Name
          },
          image2: {
            data: image2,
            name: image2Name
          }
        }, function(data) {
          data.image1[0].basename.should.equal(image1Name);
          data.image2[0].basename.should.equal(image2Name);
          app.close();
          done();
        });
      });

      it('works for arrays of files', function(done) {
        var app = helpers.setupMiddleware(options);

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
        }, function(data) {
          Array.isArray(data.images).should.equal(true);
          data.images.length.should.equal(2);
          app.close();
          done();
        });
      });

      it('is tolerant of no files being uploaded', function(done) {
        var app = helpers.setupMiddleware(options)
          , field = {
              hello: 'world'
            }
          ;

        postFields(field, function(data) {
          data.should.eql(field);
          done();
        });
      });

      afterEach(helpers.afterEach(uploadDir));
    });

    describe('#put()', function() {
      var options = helpers.defaultOptions('/put-test')
        , filePath = __dirname + '/files/test1.gif'
        , uploadDir = options
        ;

      it('successfully puts a file when given a file path', function(done) {
        var put = helpers.setupPut(options);

        put(filePath, function(error, file) {
          file.should.be.a('object');
          fs.stat(path.join(uploadDir, file.path,
            path.basename(filePath)), function(error, stats) {
            stats.isFile().should.equal(true);
            done();
          });
        });
      });

      it('returns the correct file mime type', function(done) {
        var put = helpers.setupPut(options);

        put(filePath, function(error, file) {
          file.type.should.equal(mime.lookup(filePath));
          done();
        });
      });

      it('returns the correct file size', function(done) {
        var put = helpers.setupPut(options);

        put(filePath, function(error, file) {
          fs.stat(filePath, function(error, stats) {
            file.size.should.equal(stats.size);
            done();
          });
        });
      });

      it('moves files to the correct location', function(done) {
        var put = helpers.setupPut(options);

        put(filePath, function(error, file) {
          fs.stat(path.join(uploadDir, file.path, file.basename), function(error, stats) {
            stats.isFile().should.equal(true);
            done();
          });
        });

      });

      it('returns an error if file doesnt exist', function(done) {
        var put = helpers.setupPut(options);

        put('test-fake-file.gif', function(error, file) {
          should.exist(error);
          error.should.be.an.instanceof(Error);
          error.code.should.equal('ENOENT');
          done();
        });
      });

      afterEach(helpers.afterEach(uploadDir));
    });

    describe('#get()', function() {
      var options = helpers.defaultOptions('/get-test')
        , filePath = __dirname + '/files/test1.gif'
        , uploadDir = options
        , storedFile
        ;

      before(function(done) {
        var put = helpers.setupPut(options);

        put(filePath, function(error, file) {
          storedFile = file;
          done();
        });
      });

      it('returns the file when passed a file object', function(done) {
        var get = helpers.setupGet(options);
        get(storedFile, function(error, file) {
          file.should.be.an.instanceof(Buffer);
          done();
        });
      });

      it('returns the file when passed a file path', function(done) {
        var get = helpers.setupGet(options);

        get(path.join(storedFile.path, storedFile.basename), function(error, file) {
          file.should.be.an.instanceof(Buffer);
          done();
        });
      });

      it('returns an error if file doesnt exist', function(done) {
        var get = helpers.setupGet(options);

        get('test-fake-file.gif', function(error, file) {
          should.exist(error);
          error.should.be.an.instanceof(Error);
          error.code.should.equal('ENOENT');
          done();
        });
      });

      after(helpers.afterEach(uploadDir));
    });

    describe('#delete()', function() {
      var options = helpers.defaultOptions('/delete-test')
        , filePath = __dirname + '/files/test1.gif'
        , uploadDir = options
        , storedFile
        , storedFilePath
        ;

      before(function(done) {
        var put = helpers.setupPut(options);

        put(filePath, function(error, file) {
          storedFile = file;
          storedFilePath = path.join(storedFile.path, storedFile.basename);

          done();
        });
      });

      it('deletes the file when passed a file object', function(done) {
        var remove = helpers.setupDelete(options);

        remove(storedFile, function(error) {
          fs.stat(storedFilePath, function(error, stats) {
            error.code.should.equal('ENOENT');
            done();
          });
        });
      });

      it('deletes the file when passed a file path', function(done) {
        var remove = helpers.setupDelete(options);

        remove(storedFilePath, function(error) {
          fs.stat(storedFilePath, function(error, stats) {
            error.code.should.equal('ENOENT');
            done();
          });
        });
      });

      after(helpers.afterEach(uploadDir));
    });

  });
});