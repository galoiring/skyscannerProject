const iataJson = require("./iataSwap.json");
const skyScannerflightsUrl =
  "https://skyscanner-api.p.rapidapi.com/v3/flights/live/search/create";
const skyScannerHotelstsUrl =
  "https://skyscanner-api.p.rapidapi.com/v3e/hotels/live/search/create";
const destinationPlaceMarket = "US";
let originAirportCode = "TLV";
let destinationAirportCode = "DEL";
//enter 3 char or more for search
//this one will be converted with the autocomplete to iata airport code for requestConfig
let searchTerm = "Lond";
const currencyToType = require("./app.js");

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
      currency: currencyToType,
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
      currency: currencyToType,
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

const ChatGptConfig = {
  method: "POST",
  url: "https://chatgpt53.p.rapidapi.com/",
  headers: {
    "content-type": "application/json",
    "X-RapidAPI-Key": "9da54de026msh5bb0867e8c5b75ep1e76aajsnb2ca5fce3c19",
    "X-RapidAPI-Host": "chatgpt53.p.rapidapi.com",
  },
  data: {
    messages: [
      {
        role: "user",
        content: "Hello",
      },
    ],
    temperature: 1,
  },
};

let fromCurrencyCode = "USD";
let toCurrencyCode = "ILS";
let amount = 1;
const exchangeCurrencyConfig = {
  method: "GET",
  url: `https://ziff.p.rapidapi.com/exchangerates/${toCurrencyCode}`,
  headers: {
    "X-RapidAPI-Key": "ac7ed5ae62msh9a8ca2768c54390p1313f0jsn5b8bbecd966c",
    "X-RapidAPI-Host": "ziff.p.rapidapi.com",
  },
};

const iataCode = () => {
  const array = [];
  Object.keys(iataJson).forEach((country) => {
    if (country.includes(searchTerm) == true) {
      array.push(country);
    }
  });

  return array;
};

iataCode().forEach((item) => console.log(item));
console.log("****************************************************************");

module.exports = {
  flightRequestConfig,
  hotelsRequestConfig,
  ChatGptConfig,
  optionsForAutocomplete,
  iataCode,
  exchangeCurrencyConfig,
};
