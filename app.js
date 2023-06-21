const http = require('http');
const readline = require('readline');
const axios = require('axios');
const Validator = require('jsonschema').Validator;
const valid = new Validator();
const skyScannerFlightSchema = require('./skyScannerResponseSchema.json');

const hostname = '127.0.0.1';
const port = 3001;
const url = hostname + port;
const skyScannerflightsUrl = 'https://skyscanner-api.p.rapidapi.com/v3/flights/live/search/create';
const skyScannerHotelstsUrl = 'https://skyscanner-api.p.rapidapi.com/v3e/hotels/live/search/create';
const destinationPlaceMarket = 'US';

let originAirportCode = "TLV";
let destinationAirportCode = "DEL";
let limit = 4;

// JSON format of the request configuration for axios
const flightRequestConfig = {
  method: 'POST',
  url: skyScannerflightsUrl,
  headers: {
    'Content-Type': 'application/json',
    'X-RapidAPI-Key': 'a7e2ee614cmshe7c5245f811fecfp1d32f1jsndd3d0f93ae87',
    'X-RapidAPI-Host': 'skyscanner-api.p.rapidapi.com'
  },
  data: {
    query: {
      market: destinationPlaceMarket,
      locale: 'en-GB',
      currency: 'EUR',
      queryLegs: [{
        originPlaceId: { iata: originAirportCode },
        destinationPlaceId: { iata: destinationAirportCode },
        date: { year: 2023, month: 9, day: 20 }
      }],
      cabinClass: 'CABIN_CLASS_ECONOMY',
      adults: 2,
      childrenAges: [3, 9]
    }
  }
};

const hotelsRequestConfig = {
  method: 'POST',
  url: skyScannerHotelstsUrl,
  headers: {
    'content-type': 'application/json',
    'X-RapidAPI-Key': 'a7e2ee614cmshe7c5245f811fecfp1d32f1jsndd3d0f93ae87',
    'X-RapidAPI-Host': 'skyscanner-api.p.rapidapi.com'
  },
  data: {
    query: {
      market: destinationPlaceMarket,
      locale: 'en-GB',
      currency: 'GBP',
      adults: 2,
      placeId: {
        entityId: '27539564'
      },
      checkInDate: {
        year: 2023,
        month: 9,
        day: 3
      },
      checkOutDate: {
        year: 2023,
        month: 9,
        day: 12
      },
      rooms: 1,
      childrenAges: [4, 2],
      sortBy: 'RELEVANCE_DESC'
    }
  }
};

// make request and send to print
const makeRequest = async () => {
  try {
    const responseFlights = await axios.request(flightRequestConfig);
    const responseHotels = await axios.request(hotelsRequestConfig);
    const hotelArr = parsingHotels(responseHotels);
    const flightsArr = parsingFlights(responseFlights);
    console.log(hotelArr, flightsArr);
  } catch (error) {
    console.error(error);
  }
}

// parse the hotels response and print on CLI
const parsingHotels = (response) => {
  const hotels = response.data.content.results.hotels;
  const hotelArr = []
  for (let i = 0; i < limit; ++i) {
    const key = hotels[i];
    const hotelOption = {
      hotelName: key.name,
      reate: key.numberOfStars,
      price: key.priceInfo.price,
    }
    console.log();
    console.log(`hotel option ${i + 1}:`);
    console.log(hotelOption);
    hotelArr.push(hotelOption);
  }

  return hotelArr;
}

// parse the flights response and print on CLI
const parsingFlights = (response) => {
  const responseToValidate = response.data;
  if(valid.validate(responseToValidate,skyScannerFlightSchema,{throwFirst:true}).valid = false){
    throw new Error(responseToValidate);
  }
  const {legs,itineraries,places}=response.data.content.results;
  const legsArr = Object.keys(response.data.content.results.legs);
  const flightsArr = [];

  for (let i = 0; i < limit; ++i) {
    const key = legsArr[i];
    const flightOption = {
      originName: `${places[legs[key].originPlaceId].name} - ${places[legs[key].originPlaceId].iata}` ,
      destinationName: `${places[legs[key].destinationPlaceId].name} - ${places[legs[key].destinationPlaceId].iata}`,
      date: legs[key].departureDateTime,
      price: itineraries[key].pricingOptions[0].price.amount,
    }
    console.log();
    console.log(`Flight Option ${i + 1}:`);
    console.log(flightOption);
    flightsArr.push(flightOption);
  }

  return flightsArr;
}

makeRequest();
// const server = http.createServer((req, res) => {
//   res.statusCode = 200;
//   res.setHeader('Content-Type', 'text/plain');
//   res.end('Hello World');
// });
// server.listen(port, hostname, () => {
//   console.log(`Server running at http://${hostname}:${port}`);
// });


