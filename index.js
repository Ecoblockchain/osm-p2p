var hyperlog = require('hyperlog')
var fdstore = require('fd-chunk-store')
var path = require('path')
var mkdirp = require('mkdirp')
var osmdb = require('osm-p2p-db')

var LevelUp = require('levelup')
var leveldown = require('leveldown')
var deflevel = require('deferred-leveldown')
var deferredStore = require('deferred-chunk-store')

module.exports = function (opts) {
  if (typeof opts === 'string') opts = { dir: opts }
  if (!opts) opts = {}
  var dir = opts.dir || path.resolve('./osm-p2p-data')
  var defIndexDB = new deflevel()
  var defLogDB = new deflevel()

  var log = hyperlog(levelup(defLogDB), { valueEncoding: 'json' })
  var chunkLength = opts.chunkLength || 4096
  var defStore = deferredStore(chunkLength)

  mkdirp(dir, function (err) {
    if (err) osm.emit('error', err)
    var store = fdstore(chunkLength, path.join(dir, 'kdb'))
    defStore.setStore(store)

    var indexDown = leveldown(path.join(dir, 'index'))
    indexDown.open(function (err) {
      if (err) osm.emit('error', err)
      else defIndexDB.setDb(indexDown)
    })

    var logDown = leveldown(path.join(dir, 'log'))
    logDown.open(function (err) {
      if (err) osm.emit('error', err)
      else defLogDB.setDb(logDown)
    })
  })
  var osm = osmdb({
    log: log,
    db: levelup(defIndexDB),
    store: defStore
  })
  return osm
}

function levelup (down) {
  return new LevelUp({ db: function () { return down } })
}
