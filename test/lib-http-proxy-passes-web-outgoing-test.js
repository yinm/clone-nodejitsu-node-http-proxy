const httpProxy = require('../lib/http-proxy/passes/web-outgoing')
const expect = require('expect.js')

describe('lib/http-proxy/passes/web-outgoing.js', () => {
  describe('#setRedirectHostRewrite', () => {
    beforeEach(function() {
      this.req = {
        headers: {
          host: 'ext-auto.com'
        }
      }
      this.proxyRes = {
        statusCode: 301,
        headers: {
          location: 'http://backend.com/'
        }
      }
      this.options = {
        target: 'http://backend.com'
      }
    })

    context('rewrites location host with hostRewrite', function() {
      beforeEach(function() {
        this.options.hostRewrite = 'ext-manual.com'
      });

      [201, 301, 302, 307, 308].forEach(function(code) {
        it(`on ${code}`, function() {
          this.proxyRes.statusCode = code
          httpProxy.setRedirectHostRewrite(this.req, {}, this.proxyRes, this.options)
          expect(this.proxyRes.headers.location).to.eql('http://ext-manual.com/')
        })
      })

      it('not on 200', function() {
        this.proxyRes.statusCode = 200
        httpProxy.setRedirectHostRewrite(this.req, {}, this.proxyRes, this.options)
        expect(this.proxyRes.headers.location).to.eql('http://backend.com/')
      })

      it('not when hostRewrite is unset', function() {
        delete this.options.hostRewrite
        httpProxy.setRedirectHostRewrite(this.req, {}, this.proxyRes, this.options)
        expect(this.proxyRes.headers.location).to.eql('http://backend.com/')
      })

      it('takes precedence over autoRewrite', function() {
        this.options.autoRewrite = true
        httpProxy.setRedirectHostRewrite(this.req, {}, this.proxyRes, this.options)
        expect(this.proxyRes.headers.location).to.eql('http://ext-manual.com/')
      })

      it('not when the redirected location does not match target host', function() {
        this.proxyRes.statusCode = 302
        this.proxyRes.headers.location = 'http://some-other/'
        httpProxy.setRedirectHostRewrite(this.req, {}, this.proxyRes, this.options)
        expect(this.proxyRes.headers.location).to.eql('http://some-other/')
      })

      it('not when the redirected location does not match target port', function() {
        this.proxyRes.statusCode = 302
        this.proxyRes.headers.location = 'http://backend.com:8080/'
        httpProxy.setRedirectHostRewrite(this.req, {}, this.proxyRes, this.options)
        expect(this.proxyRes.headers.location).to.eql('http://backend.com:8080/')
      })
    })

    context('rewrites location host with autoRewrite', function() {
      beforeEach(function() {
        this.options.autoRewrite = true
      });

      [201, 301, 302, 307, 308].forEach(function(code) {
        it(`on ${code}`, function() {
          this.proxyRes.statusCode = code
          httpProxy.setRedirectHostRewrite(this.req, {}, this.proxyRes, this.options)
          expect(this.proxyRes.headers.location).to.eql('http://ext-auto.com/')
        })
      })

      it('not on 200', function() {
        this.proxyRes.statusCode = 200
        httpProxy.setRedirectHostRewrite(this.req, {}, this.proxyRes, this.options)
        expect(this.proxyRes.headers.location).to.eql('http://backend.com/')
      })

      it('not when autoRewrite is unset', function() {
        delete this.options.autoRewrite
        httpProxy.setRedirectHostRewrite(this.req, {}, this.proxyRes, this.options)
        expect(this.proxyRes.headers.location).to.eql('http://backend.com/')
      })

      it('not when the redirected location does not match target host', function() {
        this.proxyRes.statusCode = 302
        this.proxyRes.headers.location = 'http://some-other/'
        httpProxy.setRedirectHostRewrite(this.req, {}, this.proxyRes, this.options)
        expect(this.proxyRes.headers.location).to.eql('http://some-other/')
      })

      it('not when the redirected location does not match target host', function() {
        this.proxyRes.statusCode = 302
        this.proxyRes.headers.location = 'http://backend.com:8080/'
        httpProxy.setRedirectHostRewrite(this.req, {}, this.proxyRes, this.options)
        expect(this.proxyRes.headers.location).to.eql('http://backend.com:8080/')
      })

    })

  })

})
