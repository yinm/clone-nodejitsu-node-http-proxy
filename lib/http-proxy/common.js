const common = exports
const url = require('url')
const extend = require('util')._extend
const required = require('requires-port')

const upgradeHeader = /(^|,)\s*upgrade\s*($|,)/i
const isSSL = /^https|wss/

/**
 * Simple Regex for testing if protocol is https
 */
common.isSSL = isSSL

