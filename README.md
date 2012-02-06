# fileupload

Route middleware for connect to process file uploads.

File uploads have been built in to Connect since 1.8, but they dont come in to the post body (req.body) like other form fields, they get put into req.files.

This piece of route middleware moves the files to the upload directory specified in the constructor and adds the files to req.body as if they were normal form fields, simple.

## Installation

     git clone git://github.com/domharrington/fileupload.git

## Usage
     var fileupload = require('fileupload').createFileUpload('/uploadDir');

     app.post('/upload', fileupload, function(req, res) {
       //Files are now in the req.body object along with other form fields
       //Files also get moved to the uploadDir specified
     });

## Credits
[Dom Harrington](https://github.com/domharrington/)

## License
Licensed under the [New BSD License](http://opensource.org/licenses/bsd-license.php)