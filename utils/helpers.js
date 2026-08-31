const { v4: uuidv4 } = require('uuid');

// CERA-XXXXXX format (6 alphanumeric chars)
function generateCeraId() {
  return 'CERA-' + uuidv4().replace(/-/g, '').slice(0, 6).toUpperCase();
}

// TXN-XXXXXXXXXX format
function generateTxId() {
  return 'TXN-' + uuidv4().replace(/-/g, '').slice(0, 10).toUpperCase();
}

// Demo crypto addresses — static placeholders per user index
function generateDemoAddresses(index) {
  const pad = String(index).padStart(6, '0');
  return {
    btc:  `bc1qcera${pad}xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`,
    eth:  `0xCERA${pad}XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX`,
    sol:  `CERAso1${pad}XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX`,
    bnb:  `bnb1cera${pad}xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`,
    usdt: `TCERA${pad}XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX`,
    usdc: `0xCERAusdc${pad}XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX`,
  };
}

module.exports = { generateCeraId, generateTxId, generateDemoAddresses };
