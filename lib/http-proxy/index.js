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