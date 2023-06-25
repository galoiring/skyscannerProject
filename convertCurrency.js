const axios = require('axios');
const {exchangeCurrencyConfig} = require('./configVariables');

const convertCurrency = async () => {
    try {
        const response = await axios.request(exchangeCurrencyConfig);
        console.log(response.data);
        const rate = Object.keys(response.data.exchangerates.pairs).forEach((item) => {if(item.includes("USD") == true){return item}})
        return rate;
    } catch (error) {
        console.log(error.message + "ERROR:");
    }
}

module.exports = convertCurrency;