var Mocha = require('mocha')
  , join = require('path').join

var mocha = new Mocha()
  , counts =
    { total: 0
    , pass: 0
    , fail: 0
    }

mocha.reporter('spec').ui('bdd')

mocha.addFile(join(__dirname, 'fileupload.test.js'))

var runner = mocha.run(function () {
  console.log('Finished', counts)
  process.exit(counts.fail === 0 ? 0 : 1)
})

runner.on('pass', function () {
  counts.total += 1
  counts.pass += 1
})

runner.on('fail', function () {
  counts.total += 1
  counts.fail += 1
})