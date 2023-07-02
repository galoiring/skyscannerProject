const http = require("http");
const readline = require("readline");
const axios = require("axios");
const Validator = require("jsonschema").Validator;
const valid = new Validator();
const skyScannerFlightSchema = require("./skyScannerFlightResponseSchema.json");
const skyScannerHotelSchema = require("./skyScannerHotelResponseSchema.json");
const fs = require("fs");
// const express = require("express");

const hostname = "127.0.0.1";
const port = 3001;
const url = hostname + port;

let limit = 4;
let currencyToType = "ILS";

// JSON format of the request configuration for axios
const {
  flightRequestConfig,
  hotelsRequestConfig,
  optionsForAutocomplete,
  ChatGptConfig,
} = require("./configVariables");

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
  fs.writeFile(
    `${fileName}.json`,
    JSON.stringify(response, null, "\t"),
    (error) => {
      // in case of a writing problem
      if (error) {
        console.error(error);
        throw error;
      }
    }
  );
};

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
    return { flightsResponse, hotelsResponse };
  } catch (err) {
    console.error(err);
  }
};

// make the request from JSON file and return the response
const requestFromFile = () => {
  const flightsResponse = readRequestFromFile("flightResponse");
  const hotelsResponse = readRequestFromFile("hotelsResponse");

  return { flightsResponse, hotelsResponse };
};

// make request and send to print
const makeRequest = (searchResponse, readFromServer) => {
  let flightsArr;
  let hotelArr;
  if (readFromServer == true) {
    requestFromServer(searchResponse).then(
      ({ flightsResponse, hotelsResponse }) => {
        try {
          flightsArr = parsingFlights(flightsResponse.data);
          hotelArr = parsingHotels(hotelsResponse.data);
          writeResponseToJSONFile(flightsResponse.data, "flightResponse");
          console.log("successed to write flights response into file");
          writeResponseToJSONFile(hotelsResponse.data, "hotelsResponse");
          console.log("successed to write hotels response into file");
        } catch (err) {
          console.log(err + " failed to write or parse");
        }
      }
    );
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

  return { flightsArr, hotelArr };
};

// use Validator to validate the response
const validateResponse = (response, schemaToValid, serverType) => {
  const responseToValidate = response;
  const ValidatorResult = valid.validate(responseToValidate, schemaToValid, {
    throwFirst: true,
  });
  console.log(`${serverType} valid: ${ValidatorResult.valid}`);
};
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
}

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
      originName: `${places[legs[key].originPlaceId].name} - ${
        places[legs[key].originPlaceId].iata
      }`,
      destinationName: `${places[legs[key].destinationPlaceId].name} - ${
        places[legs[key].destinationPlaceId].iata
      }`,
      date: legs[key].departureDateTime,
      price: `${itineraries[key].pricingOptions[0].price.amount} ${currencyToType}`,
    };
    console.log();
    console.log(`Flight Option ${i + 1}:`);
    console.log(flightOption);
    flightsArr.push(flightOption);
  }

  return flightsArr;
};

const makeChatGptRequest = async (message) => {
  ChatGptConfig.data.query = message;
  try {
    const response = await axios.request(ChatGptConfig);
    console.log(response.data.response);
  } catch (error) {
    console.error(error);
  }
};

// init the program, pass true to makeRequest for get response from server, and false for file
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

// initializeServerAndGetData();
makeChatGptRequest(
  (message =
    "considering london, paris, new york and delhi. what are the best destination to travel in february 2024 if i want a warm and sunny weather? ")
);
