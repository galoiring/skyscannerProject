// To run use: "node app.js" on your terminal
// Visit http://localhost:3000

const http = require('http');
const hostname = '127.0.0.1';
const port = 3000;

//add axios and build request for skyscanner
const axios = require('axios');
const url = 'http://' + hostname + ':' + port;
const destinationPlaceMarket = 'UK';
const skyScannerUrl = 'https://skyscanner-api.p.rapidapi.com/v3/flights/live/search/create';
const skyscannerBody = { query: { market: destinationPlaceMarket, locale: "en-GB", currency: "EUR", 
  queryLegs: [ { originPlaceId: { iata: "LHR" }, destinationPlaceId: { iata: "DXB" }, 
  date: { year: 2023, month: 9, day: 20 } } ], cabinClass: "CABIN_CLASS_ECONOMY", 
  adults: 2, childrenAges: [ 3, 9 ] } };

const request1 = {
  method:"POST",
  url: skyScannerUrl,
  data: skyscannerBody,
  headers :{
    "X-RapidAPI-Key":"a7e2ee614cmshe7c5245f811fecfp1d32f1jsndd3d0f93ae87",
    "X-RapidAPI-Host":"skyscanner-api.p.rapidapi.com",
    "content-type":"application/json"
  }
}


const server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  res.end('Hello World');
});

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});


// create axios request to server
axios.get(url).then(() => {
  console.log('success');
});

// create async function to skyscanner
const firstTry = async() => {
  try {
    const response = await axios.request(request1);
    // console.log(response.data);
  } catch (error) {
    console.error(error);
  }
};
firstTry().then( () => {
  console.log('after first try');
})

