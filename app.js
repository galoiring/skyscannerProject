const http = require("http");
const readline = require("readline");
const axios = require("axios");
const Validator = require("jsonschema").Validator;
const valid = new Validator();
const skyScannerFlightSchema = require("./skyScannerFlightResponseSchema.json");
const skyScannerHotelSchema = require("./skyScannerHotelResponseSchema.json");
const fs = require("fs");
const e = require("express");

const hostname = "127.0.0.1";
const port = 3001;
const url = hostname + port;
const skyScannerflightsUrl =
  "https://skyscanner-api.p.rapidapi.com/v3/flights/live/search/create";
const skyScannerHotelstsUrl =
  "https://skyscanner-api.p.rapidapi.com/v3e/hotels/live/search/create";
const destinationPlaceMarket = "US";

let originAirportCode = "TLV";
let destinationAirportCode = "DEL";
let limit = 4;

//enter 3 char or more for search
//this one will be converted with the autocomplete to iata airport code for requestConfig
let searchTerm = "Lond";

// JSON format of the request configuration for axios
const flightRequestConfig = {
  method: "POST",
  url: skyScannerflightsUrl,
  headers: {
    "Content-Type": "application/json",
    "X-RapidAPI-Key": "a7e2ee614cmshe7c5245f811fecfp1d32f1jsndd3d0f93ae87",
    "X-RapidAPI-Host": "skyscanner-api.p.rapidapi.com",
  },
  data: {
    query: {
      market: "US",
      locale: "en-GB",
      currency: "EUR",
      queryLegs: [
        {
          originPlaceId: { iata: originAirportCode },
          destinationPlaceId: { iata: destinationAirportCode },
          date: { year: 2023, month: 9, day: 20 },
        },
      ],
      cabinClass: "CABIN_CLASS_ECONOMY",
      adults: 2,
      childrenAges: [3, 9],
    },
  },
};

const hotelsRequestConfig = {
  method: "POST",
  url: skyScannerHotelstsUrl,
  headers: {
    "content-type": "application/json",
    "X-RapidAPI-Key": "a7e2ee614cmshe7c5245f811fecfp1d32f1jsndd3d0f93ae87",
    "X-RapidAPI-Host": "skyscanner-api.p.rapidapi.com",
  },
  data: {
    query: {
      market: destinationPlaceMarket,
      locale: "en-GB",
      currency: "GBP",
      adults: 2,
      placeId: {
        entityId: "27539564",
      },
      checkInDate: {
        year: 2023,
        month: 9,
        day: 3,
      },
      checkOutDate: {
        year: 2023,
        month: 9,
        day: 12,
      },
      rooms: 1,
      childrenAges: [4, 2],
      sortBy: "RELEVANCE_DESC",
    },
  },
};

const optionsForAutocomplete = {
  method: "POST",
  url: "https://skyscanner-api.p.rapidapi.com/v3/autosuggest/flights",
  headers: {
    "content-type": "application/json",
    "X-RapidAPI-Key": "9da54de026msh5bb0867e8c5b75ep1e76aajsnb2ca5fce3c19",
    "X-RapidAPI-Host": "skyscanner-api.p.rapidapi.com",
  },
  data: {
    query: {
      market: "UK",
      locale: "en-GB",
      searchTerm: searchTerm,
    },
  },
};

const makeSearchRequest = async () => {
  try {
    const response = await axios.request(optionsForAutocomplete);
    return parseSearch(response);
  } catch (error) {
    console.error(error);
  }
};

//TODO: might need to improve the name so it will be the city name but the relevant airport iata Code
// TODO: ask Refael if full city name needed for the hotels search or iata code is fine.
const parseSearch = (response) => {
  const places = response.data.places;
  for (let i = 0; i < limit; ++i) {
    if (places[i].type === "PLACE_TYPE_AIRPORT") {
      const name = places[0].cityName;
      const iataCode = places[i].iataCode;
      const hirarchy = places[i].hierarchy;
      return { name, iataCode, hirarchy };
    }
  }
};

// convert response to JSON and writing to a file
const writeResponseToJSONFile = (response, fileName) => {
  fs.writeFile(`${fileName}.json`, JSON.stringify(response, null, "\t"), (error) => {
    // in case of a writing problem
    if (error) {
      console.error(error);
      throw error;
    }
  })
}

// generic function to read the response from JSON file
function readRequestFromFile(fileName) {
  let response = fs.readFileSync(`${fileName}.json`, "utf-8", (error) => {
    if (error) {
      console.error(error);
    }
  });
  try {
    response = JSON.parse(response);
  } catch (err) {
    console.error(err);
  }
  console.log(`successed to read ${fileName}`);

  return response;
}

// make the request from server and return the response
const requestFromServer = async (searchResponse) => {
  flightRequestConfig.data.query.queryLegs[0].originPlaceId.iata =
    searchResponse.iataCode;

  try {
    const flightsResponse = await axios.request(flightRequestConfig);
    const hotelsResponse = await axios.request(hotelsRequestConfig);
    return { flightsResponse, hotelsResponse }

  } catch (err) {
    console.error(err);
  }
}

// make the request from JSON file and return the response
const requestFromFile = () => {
  const flightsResponse = readRequestFromFile('flightResponse');
  const hotelsResponse = readRequestFromFile('hotelsResponse');

  return { flightsResponse, hotelsResponse }
}

// make request and send to print
const makeRequest = (searchResponse, readFromServer) => {
  let flightsArr;
  let hotelArr;
  if (readFromServer == true) {
    requestFromServer(searchResponse).then(({ flightsResponse, hotelsResponse }) => {
      try {
        flightsArr = parsingFlights(flightsResponse.data);
        hotelArr = parsingHotels(hotelsResponse.data);
        writeResponseToJSONFile(flightsResponse.data, 'flightResponse');
        console.log("successed to write flights response into file")
        writeResponseToJSONFile(hotelsResponse.data, 'hotelsResponse');
        console.log("successed to write hotels response into file")
      } catch (err) {
        console.log(err + " failed to write or parse");
      }
    })
  } else {
    const { flightsResponse, hotelsResponse } = requestFromFile();
    try {
      flightsArr = parsingFlights(flightsResponse);
      hotelArr = parsingHotels(hotelsResponse);
    } catch (err) {
      {
        console.log(err + " failed from catch");
      }
    }
  }

  return { flightsArr, hotelArr }
};

// use Validator to validate the response
const validateResponse = (response, schemaToValid, serverType) => {
  const responseToValidate = response;
  const ValidatorResult = valid.validate(responseToValidate, schemaToValid, {
    throwFirst: true,
  });
  console.log(`${serverType} valid: ${ValidatorResult.valid}`);
}
// parse the hotels response and print on CLI
function parsingHotels(response) {
  validateResponse(response, skyScannerHotelSchema, "hotel");
  const hotels = response.content.results.hotels;

  if (Object.keys(hotels).length == 0) {
    throw new Error(`hotels is empty`);
  }

  const hotelArr = [];
  for (let i = 0; i < limit; ++i) {
    const key = hotels[i];
    const hotelOption = {
      hotelName: key.name,
      rate: key.numberOfStars,
      price: `${key.priceInfo.price}$`,
    };
    console.log();
    console.log(`hotel option ${i + 1}:`);
    console.log(hotelOption);
    hotelArr.push(hotelOption);
  }

  return hotelArr;
};

// parse the flights response and print on CLI
const parsingFlights = (response) => {
  validateResponse(response, skyScannerFlightSchema, "flight");
  const { legs, itineraries, places } = response.content.results;
  const legsArr = Object.keys(response.content.results.legs);
  const flightsArr = [];

  if (Object.keys(legs).length == 0 || Object.keys(itineraries).length == 0) {
    throw new Error(`legs/itineraries is empty, ${response.status}`);
  }

  for (let i = 0; i < limit; ++i) {
    const key = legsArr[i];
    const flightOption = {
      originName: `${places[legs[key].originPlaceId].name} - ${places[legs[key].originPlaceId].iata
        }`,
      destinationName: `${places[legs[key].destinationPlaceId].name} - ${places[legs[key].destinationPlaceId].iata
        }`,
      date: legs[key].departureDateTime,
      price: itineraries[key].pricingOptions[0].price.amount,
    };
    console.log();
    console.log(`Flight Option ${i + 1}:`);
    console.log(flightOption);
    flightsArr.push(flightOption);
  }

  return flightsArr;
};

const initializeServerAndGetData = () => {
  const server = http.createServer((req, res) => {
    res.statusCode = 200;
    res.setHeader("Content-Type", "text/plain");
    res.end("Hello World");
  });
  //
  // server.listen(port, hostname, () => {
  //   console.log(`Server running at http://${hostname}:${port}`);
  makeSearchRequest().then((respones) => {
    makeRequest(respones, false);
  });
};

// const server = http.createServer((req, res) => {
//   res.statusCode = 200;
//   res.setHeader('Content-Type', 'text/plain');
//   res.end('Hello World');
// });
// server.listen(port, hostname, () => {
//   console.log(`Server running at http://${hostname}:${port}`);
// });

initializeServerAndGetData();
