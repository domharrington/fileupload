var
	fileupload = require('../index'),
	should = require('should'),
	fs = require('fs'),
	express = require('express'),
	fermata = require('fermata'),
	exec = require('child_process').exec;

describe('fileupload', function() {

	describe('#createFileUpload()', function() {
		var
			uploadDir = __dirname + '/uploads',
			port = 7778,
			url = 'http://localhost:' + port,
			image1Name = 'test1.gif',
			image2Name = 'test2.gif',
			image1 = fs.createReadStream(__dirname + '/files/' + image1Name),
			image2 = fs.createReadStream(__dirname + '/files/' + image2Name);

		function startServer() {
			var
				app = express.createServer(),
				testFileUpload = fileupload.createFileUpload(uploadDir);

			app.use(express.bodyParser());

			app.post('/', testFileUpload, function(req, res) {
				res.send(req.body);
			});

			app.listen(port);
			return app;
		}

		function postFiles(files, callback) {
			fermata.json(url).post({
				'Content-Type': 'multipart/form-data'
			},
			files,
			function(error, data) {
				callback(data);
			});
		}

		it('creates the upload dir if it doesnt exist', function(done) {

			fs.stat(uploadDir, function(error, stats) {
				error.code.should.equal('ENOENT');

				var app = startServer();

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

		it('works for more than one file input in a form', function(done) {
			var app = startServer();

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
			var app = startServer();

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
				app.close();
				done();
			});
		});

		it('moves file to the correct location', function(done) {
			var app = startServer();

			postFiles({
				image: {
					data: image1,
					name: image1Name
				}
			}, function(data) {
				fs.stat(uploadDir + '/' + data.image[0].path + data.image[0].basename, function(error, stats) {
					stats.isFile().should.equal(true);
					done();
				});
			});
		});

		afterEach(function(done) {
			exec('rm -rf ' + uploadDir, function() {
				done();
			});
		});

	});
});