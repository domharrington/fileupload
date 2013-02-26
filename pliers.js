module.exports = tasks

var join = require('path').join

function tasks(pliers) {

  pliers.filesets('tests', [join(__dirname, 'test', '*.js')])

  pliers('qa', 'test', 'lint')

  pliers('lint', function (done) {
    pliers.exec('jshint .', true, done)
  })

  pliers('test', function (done) {
    pliers.exec('node ./test/tests', done)
  })
}