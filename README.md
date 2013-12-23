[![build status](https://secure.travis-ci.org/domharrington/fileupload.png)](http://travis-ci.org/domharrington/fileupload)
# fileupload

This module's main aim is to make file uploads even easier in Node.JS. In it's simplest form, when instantiated, this module returns 4 functions:

- middleware - route middleware
- get - to retrieve uploaded files
- put - to add files to the upload directory
- delete - to remove uploaded files

Currently only supporting file based uploads, in the near future will support GridFS (mongo db data store), S3 (amazon simple storage services) and SFTP.

This module removes the uploaded files after successful upload.

## Installation

     npm install fileupload

## Usage

### middleware()

Route middleware for connect to process file uploads.

File uploads have been built in to Connect since 1.8, but they dont come in to the post body (req.body) like other form fields, they get put into req.files.

This piece of route middleware moves the files to the upload directory specified in the constructor and adds the files to req.body as if they were normal form fields.

     var fileupload = require('fileupload').createFileUpload('/uploadDir').middleware

     app.post('/upload', fileupload, function(req, res) {
       // files are now in the req.body object along with other form fields
       // files also get moved to the uploadDir specified
     })

###get()

Retrieves a file from the upload directory.


     var fileupload = require('fileupload').createFileUpload('/uploadDir')

     fileupload.get('path-to-uploaded-file.gif', function(error, data) {
       // data is the contents of the file
     })

###put()

Puts a file to the upload directory.


     var fileupload = require('fileupload').createFileUpload('/uploadDir')

     fileupload.put('path-to-file.gif', function(error, file) {
       // file is an object with information about the uploaded file
       // See below for the contents of this object
     })

###delete()

Deletes a file from the upload directory.


     var fileupload = require('fileupload').createFileUpload('/uploadDir')

     fileupload.delete('path-to-file.gif', function(error) {

     })

###File object
The file objects that are returned from the middleware and put actions contain the following fields:

- size - size of the file

- type - mime type of the file

- path - the folder name that the file has been stored in

- basename - the name of the file

Here is an example file object:

     {
       size: 3909,
       type: 'image/gif',
       path: 'b36e7d8a26e5dac9be9d9a5ad76cedb5/',
       basename: 'test1.gif'
     }

## Todo

- GridFS
- S3
- SFTP
- Better code documentation

## Credits
[Dom Harrington](https://github.com/domharrington/)

## License
Licensed under the [New BSD License](http://opensource.org/licenses/bsd-license.php)