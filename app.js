const http = require('http');
const readline = require('readline');
const axios = require('axios');

const hostname = '127.0.0.1';
const port = 3001;
const skyScannerUrl = 'https://skyscanner-api.p.rapidapi.com/v3/flights/live/search/create';
const destinationPlaceMarket = 'US';

let originAirportCode = "TLV";
let destinationAirportCode = "DEL";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

const requestConfig = {
  method: 'POST',
  url: skyScannerUrl,
  data: {
    query: {
      market: destinationPlaceMarket,
      locale: 'en-GB',
      currency: 'EUR',
      queryLegs: [{
        originPlaceId: { iata: 'LHR' },
        destinationPlaceId: { iata: 'DXB' },
        date: { year: 2023, month: 9, day: 20 }
      }],
      cabinClass: 'CABIN_CLASS_ECONOMY',
      adults: 2,
      childrenAges: [3, 9]
    }
  },
  headers: {
    'X-RapidAPI-Key': 'a7e2ee614cmshe7c5245f811fecfp1d32f1jsndd3d0f93ae87',
    'X-RapidAPI-Host': 'skyscanner-api.p.rapidapi.com',
    'Content-Type': 'application/json'
  }
};

async function getUserInput() {
  const originCode = await askQuestion('Enter the origin airport code: ');
  const destinationCode = await askQuestion('Enter the destination airport code: ');

  return { originCode, destinationCode };
}

async function makeRequest() {
  try {
    const userInput = await getUserInput();
    originAirportCode = userInput.originCode;
    destinationAirportCode = userInput.destinationCode;

    requestConfig.data.query.queryLegs[0].originPlaceId.iata = originAirportCode;
    requestConfig.data.query.queryLegs[0].destinationPlaceId.iata = destinationAirportCode;

    const response = await axios.request(requestConfig);
    parsing(response);
  } catch (error) {
    console.error(error);
  } finally {
    rl.close();
  }
}

function parsing(response) {
  const key_1 = Object.keys(response.data.content.results.legs)[0];
  const key_2 = Object.keys(response.data.content.results.legs)[1];

  const flight_option_one = {
    originId: response.data.content.results.legs[key_1].originPlaceId,
    destinationId: response.data.content.results.legs[key_1].destinationPlaceId,
    date: response.data.content.results.legs[key_1].departureDateTime,
    price: response.data.content.results.itineraries[key_1].pricingOptions[0].price.amount,
  };

  const flight_option_two = {
    originId: response.data.content.results.legs[key_2].originPlaceId,
    destinationId: response.data.content.results.legs[key_2].destinationPlaceId,
    date: response.data.content.results.legs[key_2].departureDateTime,
    price: response.data.content.results.itineraries[key_2].pricingOptions[0].price.amount,
  };

  console.log(`Looking for flight from ${originAirportCode} to ${destinationAirportCode}`);
  console.log('Flight Option 1:', flight_option_one);
  console.log('Flight Option 2:', flight_option_two);
}

function initializeServerAndGetData() {
  const server = http.createServer((req, res) => {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/plain');
    res.end('Hello World');
  });

  server.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}`);
    makeRequest();
  });
}

console.log(`Looking for flight from ${originAirportCode} to ${destinationAirportCode}`);
initializeServerAndGetData();
