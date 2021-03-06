const secrets = require('secrets.js-grempe')
const sodium = require('sodium-native')
const isString = require('./isString')

const MAC_LENGTH = 32

module.exports = {
  pack: function packV2 (secret, label) {
    return JSON.stringify([secret, label])
  },
  unpack: function unpackV2 (secret) {
    let arr
    try {
      arr = JSON.parse(secret)

      if ((arr.length !== 2) || (!arr.every(isString))) return false
    } catch (err) {
      return false
    }
    return { secret: arr[0], label: arr[1] }
  },
  share: function shareV2 (secret, numOfShards, quorum) {
    const shardsHex = secrets.share(secret2Hex(secret), numOfShards, quorum)
    return shardsHex.map(compress)
  },
  combine: function combineV2 (shards) {
    // this could probably be improved by checking the hash before converting to hex
    const hex = secrets.combine(shards.map(decompress))
    return hex2Secret(hex)
  },
  verify: function verifyV2 (shards) {
    const hex = secrets.combine(shards.map(decompress))
    const secret = secrets.hex2str(hex.slice(MAC_LENGTH))
    if (Mac(secret) !== mac(hex)) return false
    else return true
  },
  validateShard: function validateShardV2 (shard) {
    try {
      secrets.extractShareComponents(decompress(shard))
    } catch (err) {
      return false
    }
    return true
  }
}

// helpers which prepare a secret ready for sharding, and also manage the MAC
// TODO - could be better names

// secret-specific mac
function mac (hex) {
  return hex.slice(0, MAC_LENGTH)
}

function secret2Hex (string) {
  return Mac(string) + secrets.str2hex(string)
}

function hex2Secret (hex) {
  const mac = hex.slice(0, MAC_LENGTH)
  const secret = secrets.hex2str(hex.slice(MAC_LENGTH))

  if (Mac(secret) !== mac) throw new Error('This secret appears to be corrupt - invalid MAC')
  else return secret
}

// supposedly 'original' mac
function Mac (secret) {
  var hash = Buffer.alloc(sodium.crypto_hash_sha256_BYTES)
  sodium.crypto_hash_sha256(hash, Buffer.from(secret))

  return hash
    .toString('hex')
    .slice(-1 * MAC_LENGTH)
}

// compress shards by using denser encoding

function compress (shard) {
  const shardData = shard.slice(3)
  const shardDataBase64 = Buffer.from(shardData, 'hex').toString('base64')
  return shard.slice(0, 3) + shardDataBase64
}

function decompress (shard) {
  const shardData = shard.slice(3)
  const shardDataHex = Buffer.from(shardData, 'base64').toString('hex')
  return shard.slice(0, 3) + shardDataHex
}
