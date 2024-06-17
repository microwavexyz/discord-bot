const config = require('../config.json');

let currentProxyIndex = 0;

function getNextProxy() {
    const proxy = config.proxies[currentProxyIndex];
    currentProxyIndex = (currentProxyIndex + 1) % config.proxies.length;
    return proxy;
}

module.exports = {
    getNextProxy
};
