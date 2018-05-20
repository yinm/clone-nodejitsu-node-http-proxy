const common = require('../lib/http-proxy/common')
const url = require('url')
const expect = require('expect.js')

describe('lib/http-proxy/common.js', () => {
  describe('#setupOutgoing', () => {
    it ('should setup the correct headers', () => {
      let outgoing = {}

      common.setupOutgoing(outgoing,
        {
          agent: '?',
          target: {
            host: 'hey',
            hostname: 'how',
            socketPath: 'are',
            port: 'you',
          },
          headers: {'fizz': 'bang', 'overwritten': true},
          localAddress: 'local.address',
          auth: 'username:pass',
        },
        {
          method: 'i',
          url: 'am',
          headers: {'pro': 'xy', 'overwritten': false},
        }
      )

      expect(outgoing.host).to.eql('hey')
      expect(outgoing.hostname).to.eql('how')
      expect(outgoing.socketPath).to.eql('are')
      expect(outgoing.port).to.eql('you')
      expect(outgoing.agent).to.eql('?')

      expect(outgoing.method).to.eql('i')
      expect(outgoing.path).to.eql('am')

      expect(outgoing.headers.pro).to.eql('xy')
      expect(outgoing.headers.fizz).to.eql('bang')
      expect(outgoing.headers.overwritten).to.eql(true)
      expect(outgoing.localAddress).to.eql('local.address')
      expect(outgoing.auth).to.eql('username:pass')
    })

    it('should not override agentless upgrade header', () => {
      let outgoing = {}

      common.setupOutgoing(outgoing,
        {
          agent: undefined,
          target: {
            host: 'hey',
            hostname: 'how',
            socketPath: 'are',
            port: 'you',
          },
          headers: {'connection': 'upgrade'},
        },
        {
          method: 'i',
          url: 'am',
          headers: {'pro': 'xy', 'overwritten': false},
        }
      )

      expect(outgoing.headers.connection).to.eql('upgrade')
    })

    it('should not override agentless connection: contains upgrade', () => {
      let outgoing = {}

      common.setupOutgoing(outgoing,
        {
          agent: undefined,
          target: {
            host: 'hey',
            hostname: 'how',
            socketPath: 'are',
            port: 'you',
          },
          headers: {'connection': 'keep-alive, upgrade'}, // this is what Firefox sets
        },
        {
          method: 'i',
          url: 'am',
          headers: {'pro': 'xy', 'overwritten': false},
        }
      )

      expect(outgoing.headers.connection).to.eql('keep-alive, upgrade')
    })

    it('should override agentless connection: contains improper upgrade', () => {
      // sanity check on upgrade regex
      let outgoing = {}

      common.setupOutgoing(outgoing,
        {
          agent: undefined,
          target: {
            host: 'hey',
            hostname: 'how',
            socketPath: 'are',
            port: 'you',
          },
          headers: {'connection': 'keep-alive, not upgrade'},
        },
        {
          method: 'i',
          url: 'am',
          headers: {'pro': 'xy', 'overwritten': false},
        }
      )

      expect(outgoing.headers.connection).to.eql('close')
    })

    it('should override agentless non-upgrade header to close', () => {
      let outgoing = {}

      common.setupOutgoing(outgoing,
        {
          agent: undefined,
          target: {
            host: 'hey',
            hostname: 'how',
            socketPath: 'are',
            port: 'you',
          },
          headers: {'connection': 'xyz'},
        },
        {
          method: 'i',
          url: 'am',
          headers: {'pro': 'xy', 'overwritten': false},
        }
      )

      expect(outgoing.headers.connection).to.eql('close')
    })

    it('should set the agent to false if none is given', () => {
      let outgoing = {}

      common.setupOutgoing(outgoing,
        {
          target: 'http://localhost',
        },
        {
          url: '/',
        },
      )

      expect(outgoing.agent).to.eql(false)
    })

    it('set the port according to the protocol', () => {
      let outgoing = {}

      common.setupOutgoing(
        outgoing,
        {
          agent: '?',
          target: {
            host: 'how',
            hostname: 'are',
            socketPath: 'you',
            protocol: 'https',
          },
        },
        {
          method: 'i',
          url: 'am',
          headers: {pro: 'xy'},
        }
      )

      expect(outgoing.host).to.eql('how')
      expect(outgoing.hostname).to.eql('are')
      expect(outgoing.socketPath).to.eql('you')
      expect(outgoing.agent).to.eql('?')

      expect(outgoing.method).to.eql('i')
      expect(outgoing.path).to.eql('am')
      expect(outgoing.headers.pro).to.eql('xy')

      expect(outgoing.port).to.eql(443)
    })

    it('should keep the original target path in the outgoing path', () => {
      let outgoing = {}

      common.setupOutgoing(
        outgoing,
        {
          target: {
            path: 'some-path',
          },
        },
        {
          url: 'am',
        }
      )

      expect(outgoing.path).to.eql('some-path/am')
    })

    it('should keep the original forward path in the outgoing path', () => {
      let outgoing = {}

      common.setupOutgoing(
        outgoing,
        {
          target: {},
          forward: {
            path: 'some-path',
          },
        },
        {
          url: 'am',
        },
        'forward'
      )

      expect(outgoing.path).to.eql('some-path/am')
    })

    it('should properly detect https/wss protocol without the colon', () => {
      let outgoing = {}

      common.setupOutgoing(
        outgoing,
        {
          target: {
            protocol: 'https',
            host: 'whatever.com',
          },
        },
        {
          url: '/',
        }
      )

      expect(outgoing.port).to.eql(443)
    })

    it('should not prepend the target path to the outgoing path with prependPath = false', () => {
      let outgoing = {}

      common.setupOutgoing(
        outgoing,
        {
          target: {
            path: 'hellothere',
          },
          prependPath: false,
        },
        {
          url: 'hi',
        }
      )

      expect(outgoing.path).to.eql('hi')
    })

    it('should properly join paths', () => {
      let outgoing = {}

      common.setupOutgoing(
        outgoing,
        {
          target: {
            path: '/forward',
          },
        },
        {
          url: '/static/path',
        }
      )

      expect(outgoing.path).to.eql('/forward/static/path')
    })

    it('should not modify the query string', () => {
      let outgoing = {}

      common.setupOutgoing(
        outgoing,
        {
          target: {
            path: '/forward',
          },
        },
        {
          url: '/?foo=bar//&target=http://foobar.com/?a=1%26b=2&other=2'
        }
      )

      expect(outgoing.path).to.eql('/forward/?foo=bar//&target=http://foobar.com/?a=1%26b=2&other=2')
    })

    // This is the proper failing test case for the common.join problem
    it('should correctly format the toProxy URL', () => {
      let outgoing = {}
      const google = 'https://google.com'

      common.setupOutgoing(
        outgoing,
        {
          target: url.parse('http://sometarget.com:80'),
          toProxy: true,
        },
        {
          url: google,
        }
      )

      expect(outgoing.path).to.eql(`/${google}`)
    })

    it('should not replace :\ to :\\ when no https word before', () => {
      let outgoing = {}
      const google = 'https://google.com/join/join.js'

      common.setupOutgoing(
        outgoing,
        {
          target: url.parse('http://sometarget.com:80'),
          toProxy: true,
        },
        {
          url: google,
        }
      )

      expect(outgoing.path).to.eql(`/${google}`)
    })

    it('should not replace :\ to :\\ when no http word before', () => {
      let outgoing = {}
      const google = 'https://google.com/join/join.js'

      common.setupOutgoing(
        outgoing,
        {
          target: url.parse('http://sometarget.com:80'),
          toProxy: true,
        },
        {
          url: google,
        }
      )

      expect(outgoing.path).to.eql(`/${google}`)
    })

  })

})