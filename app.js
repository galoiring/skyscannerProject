const http = require('http');
const readline = require('readline');
const axios = require('axios');

const hostname = '127.0.0.1';
const port = 3001;
const skyScannerUrl = 'https://skyscanner-api.p.rapidapi.com/v3/flights/live/search/create';
const destinationPlaceMarket = 'US';

let originAirportCode = "TLV";
let destinationAirportCode = "DEL";
let limit = 10;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const requestConfig = {
  method: 'POST',
  url: skyScannerUrl,
  data: {
    query: {
      market: destinationPlaceMarket,
      locale: 'en-GB',
      currency: 'EUR',
      queryLegs: [{
        originPlaceId: { iata: 'TLV' },
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

const askQuestion = (question) => {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

const getUserInput = async () => {
  const originCode = await askQuestion('Enter the origin airport code: ');
  const destinationCode = await askQuestion('Enter the destination airport code: ');
  const limit = await askQuestion('Enter the limit of flight: ');

  return { originCode, destinationCode, limit };
}

const makeRequest = async () => {
  try {
    // const userInput = await getUserInput();
    // originAirportCode = userInput.originCode;
    // destinationAirportCode = userInput.destinationCode;
    // limit = userInput.limit;
    //
    // requestConfig.data.query.queryLegs[0].originPlaceId.iata = originAirportCode;
    // requestConfig.data.query.queryLegs[0].destinationPlaceId.iata = destinationAirportCode;

    const response = await axios.request(requestConfig);
    parsing(response);
  } catch (error) {
    console.error(error);
  } finally {
    rl.close();
  }
}

const parsing = (response) => {
  const legsArr = Object.keys(response.data.content.results.legs);
  const legs = response.data.content.results.legs;
  const itineraries = response.data.content.results.itineraries;
  const places = response.data.content.results.places;

  for (let i = 0; i < limit; ++i) {
    const key = legsArr[i];
    const flight_option = {
      originName: `${places[legs[key].originPlaceId].name} - ${places[legs[key].originPlaceId].iata}` ,
      destinationName: `${places[legs[key].destinationPlaceId].name} - ${places[legs[key].destinationPlaceId].iata}`,
      date: legs[key].departureDateTime,
      price: itineraries[key].pricingOptions[0].price.amount,
    }
    console.log(`Flight Option ${i + 1}:`);
    console.log();
    console.log(flight_option);
  }
}

const initializeServerAndGetData = () => {
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
