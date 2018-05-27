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