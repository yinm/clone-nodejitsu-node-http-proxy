const webPasses = require('../lib/http-proxy/passes/web-incoming')
const httpProxy = require('../lib/http-proxy')
const expect = require('expect.js')
const concat = require('concat-stream')
const async = require('async')
const url = require('url')
const http = require('http')

describe('lib/http-proxy/passes/web.js', () => {
  describe('#deleteLength', () => {
    it('should change `content-length` for DELETE requests', () => {
      let stubRequest = {
        method: 'DELETE',
        headers: {},
      }
      webPasses.deleteLength(stubRequest, {}, {})
      expect(stubRequest.headers['content-length']).to.eql('0')
    })

    it('should change `content-length` for OPTIONS requests', () => {
      let stubRequest = {
        method: 'OPTIONS',
        headers: {},
      }

      webPasses.deleteLength(stubRequest, {}, {})
      expect(stubRequest.headers['content-length']).to.eql('0')
    })

    it('should change `transfer-encoding` from empty DELETE requests', () => {
      let stubRequest = {
        method: 'DELETE',
        headers: {
          'transfer-encoding': 'chunked',
        },
      }

      webPasses.deleteLength(stubRequest, {}, {})
      expect(stubRequest.headers['content-length']).to.eql('0')
      expect(stubRequest.headers).to.not.have.key('transfer-encoding')
    })
  })

  describe('#timeout', () => {
    it('should set timeout on the socket', () => {
      let
        done = false,
        stubRequest = {
          socket: {
            setTimeout(value) { done = value }
          }
        }

      webPasses.timeout(stubRequest, {}, { timeout: 5000 })
      expect(done).to.eql(5000)
    })
  })

  describe('#XHeaders', () => {
    let stubRequest = {
      connection: {
        remoteAddress: '192.168.1.2',
        remotePort: '8080',
      },
      headers: {
        host: '192.168.1.2:8080'
      },
    }

    it('set the correct x-forwarded-* headers', () => {
      webPasses.XHeaders(stubRequest, {}, { xfwd: true })
      expect(stubRequest.headers['x-forwarded-for']).to.be('192.168.1.2')
      expect(stubRequest.headers['x-forwarded-port']).to.be('8080')
      expect(stubRequest.headers['x-forwarded-proto']).to.be('http')
    })
  })
})

describe('#createProxyServer.web() using own http server', () => {
  it('should proxy the request using the web proxy handler', (done) => {
    let proxy = httpProxy.createProxyServer({
      target: 'http://127.0.0.1:8080'
    })

    function requestHandler(req, res) {
      proxy.web(req, res)
    }

    const proxyServer = http.createServer(requestHandler)

    const source = http.createServer(function(req, res) {
      source.close()
      proxyServer.close()
      expect(req.method).to.eql('GET')
      expect(req.headers.host.split(':')[1]).to.eql('8081')
      done()
    })

    proxyServer.listen('8081')
    source.listen('8080')

    http.request('http://127.0.0.1:8081', function() {}).end()
  })

  it('should detect a proxyReq event and modify headers', (done) => {
    let proxy = httpProxy.createProxyServer({
      target: 'http://127.0.0.1:8080',
    })

    proxy.on('proxyReq', (proxyReq, req, res, options) => {
      proxyReq.setHeader('X-Special-Proxy-Header', 'foobar')
    })

    function requestHandler(req, res) {
      proxy.web(req, res)
    }

    const proxyServer = http.createServer(requestHandler)

    const source = http.createServer((req, res) => {
      source.close()
      proxyServer.close()
      expect(req.headers['x-special-proxy-header']).to.eql('foobar')
      done()
    })

    proxyServer.listen('8081')
    source.listen('8080')

    http.request('http://127.0.0.1:8081', () => {}).end()
  })

  it('should proxy the request and handle error via callback', (done) => {
    const proxy = httpProxy.createProxyServer({
      target: 'http://127.0.0.1:8080'
    })

    const proxyServer = http.createServer(requestHandler)

    function requestHandler(req, res) {
      proxy.web(req, res, (err) => {
        proxyServer.close()
        expect(err).to.be.an(Error)
        expect(err.code).to.be('ECONNREFUSED')
        done()
      })
    }

    proxyServer.listen('8082')

    http.request({
      hostname: '127.0.0.1',
      port: '8082',
      method: 'GET',
    }, () => {}).end()
  })

  it('should proxy the request and handle error via listener', (done) => {
    const proxy = httpProxy.createProxyServer({
      target: 'http://127.0.0.1:8080'
    })

    const proxyServer = http.createServer(requestHandler)

    function requestHandler(req, res) {
      proxy.once('error', (err, errReq, errRes) => {
        proxyServer.close()
        expect(err).to.be.an(Error)
        expect(errReq).to.be.equal(req)
        expect(errRes).to.be.equal(res)
        expect(err.code).to.be('ECONNREFUSED')
        done()
      })

      proxy.web(req, res)
    }

    proxyServer.listen('8083')

    http.request({
      hostname: '127.0.0.1',
      port: '8083',
      method: 'GET',
    }, () => {}).end()
  })

})