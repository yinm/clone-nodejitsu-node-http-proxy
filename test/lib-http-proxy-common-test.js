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

  })

})