# fileupload

Route middleware for connect to process file uploads.

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