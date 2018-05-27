const http = require('http')
const https = require('https')
const common = require('../common')

/**
 * Array of passes.
 *
 * A `pass` is just a function that is exexuted on `req, socket, options`
 * so that you can easily add ew checks while still keeping the base
 * Flexible.
 */

/**
 * Websockets Passes
 */

module.exports = {
  /**
   * WebSocket requests must have the `GET` method and
   * thw `upgrade:websocket` header
   *
   * @param {ClientRequest} req Request object
   * @param {Socket} socket
   */
  checkMethodAndHeader(req, socket) {
    if (req.method !== 'GET' || !req.headers.upgrade) {
      socket.destroy()
      return true
    }

    if (req.headers.upgrade.toLowerCase() !== 'websocket') {
      socket.destroy()
      return true
    }
  },

  /**
   * Sets `x-forwarded-*` headers if specified in config.
   *
   * @param {ClientRequest} req Request object
   * @param {Socket} socket Websocket
   * @param {Object} options Config object passed to the proxy
   */
  XHeaders(req, socket, options) {
    if (!options.xfwd) {
      return
    }

    const values = {
      for: req.connection.remoteAddress || req.socket.remoteAddress,
      port: common.getPort(req),
      proto: common.hadEncryptedConnection(req) ? 'wss' : 'ws'
    };

    ['for', 'port', 'proto'].forEach(header => {
      req.headers[`x-forwarded-${header}`] =
        (req.headers[`x-forwarded-${header}`] || '') +
        (req.headers[`x-forwarded-${header}`] ? ',' : '') +
        values[header]
    })
  },

  /**
   * Does the actual proxying. Make the request and upgrade it
   * send the Switching Protocols request and pipe the sockets.
   *
   * @param {ClientRequest} req Request object
   * @param {Socket} socket Websocket
   * @param {Object} options Config object passed to the proxy
   */
  stream(req, socket, options, head, server, clb) {
    const createHttpHeader = (line, headers) => {
      return Object.keys(headers).reduce((head, key) => {
        let value = headers[key]

        if (!Array.isArray(value)) {
          head.push(`${key}:${value}`)
          return head
        }

        for (let i = 0; i < value.length; i++) {
          head.push(`${key}; ${value[i]}`)
        }

        return head
      }, [line])
        .join('\r\n') + '\r\n\r\n'
    }

    common.setupSocket(socket)

    if (head && head.length) {
      socket.unshift(head)
    }

    const proxyReq = (common.isSSL.test(options.target.protocol) ? https : http).request(
      common.setupOutgoing(options.ssl || {}, options, req)
    )

    // Enable developers to modify the proxyReq before headers are sent
    if (server) {
      server.emit('proxyReqWs', proxyReq, req, socket, options, head)
    }

    // Error Handler
    proxyReq.on('error', onOutgoingError)
    proxyReq.on('response', res => {
      // if upgrade event isn't going to happen, close the socket
      if (!res.upgrade) {
        socket.write(createHttpHeader(`HTTP/${res.httpVersion} ${res.statusCode} ${res.statusMessage}`, res.headers))
        res.pipe(socket)
      }
    })

    proxyReq.on('upgrade', (proxyREs, proxySocket, proxyHead) => {
      proxySocket.on('error', onOutgoingError)

      // Allow us to listen when the websocket has completed
      proxySocket.on('end', () => {
        server.emit('close', proxyRes, proxySocket, proxyHead)
      })

      /**
       * The pipe below will end proxySocket if socket closes cleanly, but not
       * if it errors (e.g. vanishes from the net and starts returning
       * EHOSTTUNREACH) We need to do that explicitly.
       */
      socket.on('error', () => {
        proxySocket.end()
      })

      common.setupSocket(proxySocket)

      if (proxyHead && proxyHead.length) {
        proxySocket.unshift(proxyHead)
      }

      // Remark: Handle writing the headers to the socket when switching protocols
      // Also handles when a header is an array
      socket.write(createHttpHeader('HTTP/1.1 101 Switching Protocols', proxyRes.headers))

      proxySocket.pipe(socket).pipe(proxySocket)

      server.emit('open', proxySocket)
      server.emit('proxySocket', proxySocket) // DEPRECATED
    })

    return proxyRes.end() // XXX: CHECK IF THIS IS THIS CORRECT

    function onOutgoingError(err) {
      if (clb) {
        clb(err, req, socket)
      } else {
        server.emit('error', err, req, socket)
      }

      socket.end()
    }
  }
}