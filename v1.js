const secrets = require('secrets.js-grempe')

module.exports = {
  pack: function packV1 (secret) {
    return secret
  },
  unpack: function unpackV1 (secret) {
    return { secret }
  },
  share: function shareV1 (secret, numOfShards, quorum) {
    const hexSecret = secrets.str2hex(secret)
    return secrets.share(hexSecret, numOfShards, quorum)
  },
  combine: function combineV1 (shards) {
    const hex = secrets.combine(shards)
    return secrets.hex2str(hex)
  },
  verify: function verifyV1 (shards) {
    try {
      throw new Error("version 1.0.0 doesn't support secret verification")
    } catch (err) {
      return false
    }
  },
  validateShard: function validateShardV1 (shard) {
    try {
      secrets.extractShareComponents(shard)
    } catch (err) {
      return false
    }
    return true
  }
}
