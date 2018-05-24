// Use explicit /index.js to help browserify negociation in require './lib/http-proxy' (!)
const ProxyServer = require('./http-proxy/index.js').Server

/**
 * Creates the proxy server.
 *
 * Examples:
 *
 *  httpProxy.createProxyServer({ .. }, 8000)
 *  // => '{ web: [Function], ws: [Function] ... }'
 *
 * @param {Object} options Config object passed to the proxy
 * @returns {Object} Proxy Proxy object with handles for `ws` and `web` requests
 */
function createProxyServer(options) {
  /*
   *  `options` is needed and it must have the following layout:
   *
   *  {
   *    target: <url string to be parsed with the url module>
   *    forward: <url string to be parsed with the url module>
   *    agent: <object to be passed to http(s).request>
   *    ssl: <object to be passed to https.createServer()>
   *    ws: <true/false, if you want to proxy websocket>
   *    wfwd: <true/false, adds x-forward headers>
   *    secure: <true/false, verify SSL certificate>
   *    toProxy: <true/false, explicitly specify if we are proxying to another proxy>
   *    prependPath: <true/false, Default: true - specify whether you want to prepend the target's path to the proxy path>
   *    ignorePath: <true/false, Default: false - specify whether you want to ignore the proxy path of the incoming request>
   *    localAddress: <Local interface string to bind for outgoing connections>
   *    changeOrigin: <true/false, Default: false - changes the origin of the host header to the target URL>
   *    preserveHeaderKeyCase: <true/false, Default: false - specify whether you want to keep letter case of response header key>
   *    auth: Basic authentication i.e. 'user:password' to compute an Authorization header.
   *    hostRewrite: rewrites the location hostname on (301/302/307/308) redirects, Default: null.
   *    autoRewrite: rewrites the location host/port on (301/302/307/308) redirects based on requested host/port. Default: false.
   *    protocolRewrite: rewrites the location protocol on (301/302/307/308) redirects to 'http' or 'https'. Default: null.
   *  }
   *
   *  NOTE: `options.ws` and `options.ssl` are optional.
   *    `options.target` and `options.forward` cannot be
   *    both missing
   */

  return ProxyServer(options)
}

ProxyServer.createProxyServer = createProxyServer
ProxyServer.createServer = createProxyServer
ProxyServer.createProxy = createProxyServer

/**
 * Export the proxy "Server" as the main export.
 */
module.exports = ProxyServer