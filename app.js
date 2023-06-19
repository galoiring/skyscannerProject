const http = require('http');
const readline = require('readline');
const axios = require('axios');

const hostname = '127.0.0.1';
const port = 3001;
const skyScannerUrl = 'https://skyscanner-api.p.rapidapi.com/v3/flights/live/search/create';
const destinationPlaceMarket = 'US';

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
  const airportCode = await askQuestion('Enter the airport code: ');
  return airportCode;
}

async function makeRequest() {
  try {
    const airportCode = await getUserInput();
    requestConfig.data.query.queryLegs[0].originPlaceId.iata = airportCode;
    const response = await axios.request(requestConfig);
    const itineraries = response.data.content.results.itineraries;
    console.log(itineraries);
  } catch (error) {
    console.error(error);
  } finally {
    rl.close();
  }
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

initializeServerAndGetData();
