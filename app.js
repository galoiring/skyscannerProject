const http = require('http');
const readline = require('readline');
const axios = require('axios');
const Validator = require('jsonschema').Validator;
const valid = new Validator();
const skyScannerFlightSchema = require('./skyScannerResponseSchema.json');

const hostname = '127.0.0.1';
const port = 3001;
const skyScannerUrl = 'https://skyscanner-api.p.rapidapi.com/v3/flights/live/search/create';
const url = hostname + port;
const skyScannerflightsUrl = 'https://skyscanner-api.p.rapidapi.com/v3/flights/live/search/create';
const skyScannerHotelstsUrl = 'https://skyscanner-api.p.rapidapi.com/v3e/hotels/live/search/create';
const destinationPlaceMarket = 'US';

let originAirportCode = "TLV";
let destinationAirportCode = "DEL";
let limit = 10;

//enter 3 char or more for search
//this one will be converted with the autocomplete to iata airport code for requestConfig
let searchTerm = 'Lond';
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
      market: 'US',
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
    'X-RapidAPI-Host': 'skyscanner-api.p.rapidapi.com',
    'Content-Type': 'application/json'
  }
};

const optionsForAutocomplete = {
  method: 'POST',
  url: 'https://skyscanner-api.p.rapidapi.com/v3/autosuggest/flights',
  headers: {
    'content-type': 'application/json',
    'X-RapidAPI-Key': '9da54de026msh5bb0867e8c5b75ep1e76aajsnb2ca5fce3c19',
    'X-RapidAPI-Host': 'skyscanner-api.p.rapidapi.com'
  },
  data: {
    query: {
      market: 'UK',
      locale: 'en-GB',
      searchTerm: searchTerm
    }
  }
};

const makeSearchRequest = async () => {
  try {
    const response = await axios.request(optionsForAutocomplete);
    return parseSearch(response)
  } catch (error) {
    console.error(error);
  }
}

//TODO: might need to improve the name so it will be the city name but the relevant airport iata Code
// TODO: ask Refael if full city name needed for the hotels search or iata code is fine.
const parseSearch = (response) => {
  for (let i = 0; i < limit; ++i) {
    if(response.data.places[i].type === 'PLACE_TYPE_AIRPORT'){
      const name = response.data.places[0].cityName
      const iataCode = response.data.places[i].iataCode
      const hirarchy = response.data.places[i].hierarchy
      return {name, iataCode, hirarchy}
    }
  }
}

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

const makeFlightRequest = async (searchResponse) => {
// make request and send to print
const makeRequest = async () => {
  try {
    // const userInput = await getUserInput();
    // originAirportCode = userInput.originCode;
    // destinationAirportCode = userInput.destinationCode;
    // limit = userInput.limit;
    //
    // requestConfig.data.query.queryLegs[0].originPlaceId.iata = originAirportCode;
    // requestConfig.data.query.queryLegs[0].destinationPlaceId.iata = destinationAirportCode;

    requestConfig.data.query.queryLegs[0].originPlaceId.iata = searchResponse.iataCode;

    const response = await axios.request(requestConfig);
    parsing(response);
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

const initializeServerAndGetData = () => {
  const server = http.createServer((req, res) => {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/plain');
    res.end('Hello World');
  });
  //
  // server.listen(port, hostname, () => {
  //   console.log(`Server running at http://${hostname}:${port}`);
    makeSearchRequest().then((respones)=>{
      makeFlightRequest(respones);
        })
  }
// )}
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



initializeServerAndGetData();
// makeSearchRequest()