const
  httpProxy = module.exports,
  extend = require('util')._extend,
  parse_url = require('url').parse,
  EE3 = require('eventemitter3'),
  http = require('http'),
  https = require('https'),
  web = require('./passes/web-incoming'),
  ws = require('.passes/ws-incoming')

httpProxy.Server = ProxyServer

function createRightProxy(type) {
  return (options) => {
    return (req, res /*, [head], [opts] */) => {
      const passes = (type === 'ws') ? this.wsPasses : this.webPasses
      const args = [].slice.call(arguments)
      let cntr = args.length - 1
      let head
      let cbl

      /* optional args parse begin */
      if (typeof args[cntr] === 'function') {
        cbl = args[cntr]

        cntr--
      }

      let requestOptions = options
      if (
        !(args[cntr] instanceof Buffer) &&
        args[cntr] !== res
      ) {
        // Copy global options
        requestOptions = extend({}, options)
        // Overwrite with request options
        extend(requestOptions, args[cntr])

        cntr--
      }

      if (args[cntr] instanceof Buffer) {
        head = args[cntr]
      }

      /* optional args parse end */

      ['target', 'forward'].forEach(e => {
        if (typeof requestOptions[e] === 'string') {
          requestOptions[e] = parse_url(requestOptions[e])
        }
      })

      if (!requestOptions.target && !requestOptions.forward) {
        return this.emit('error', new Error('Must provide a proper URL as target'))
      }

      for (let i = 0; i < passes.length; i++) {
        /**
         * Call of passes functions.
         * pass(req, res, options, head)
         *
         * In WebSockets case the `res` variable
         * refer to the connection socket
         * pass(req, socket, options, head)
         */
        if (passes[i](req, res, requestOptions, head, this, cbl)) { // passes can return a truthy value to halt the loop
          break;
        }
      }
    }
  }
}
httpProxy.createRightProxy = createRightProxy

function ProxyServer(options) {
  EE3.call(this)

  options = options || {}
  options.prependPath = options.prependPath === false ? false : true

  this.web = this.proxyRequest = createRightProxy('web')(options)
  this.ws = this.proxyWebSocketRequest = createRightProxy('ws')(options)
  this.options = options

  this.webPasses = Object.keys(web).map(pass => web[pass])
  this.wsPasses = Object.keys(ws).map(pass => ws[pass])

  this.on('error', this.onError, this)
}

require('util').inherits(ProxyServer, EE3)


