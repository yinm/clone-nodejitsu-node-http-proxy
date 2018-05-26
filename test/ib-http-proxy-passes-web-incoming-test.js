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

  })

})