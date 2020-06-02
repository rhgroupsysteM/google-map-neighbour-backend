// const axios = require("axios");

// const BASE_URL =
//   "https://api.airtable.com/v0/appM9wYfeVlWOvD9k/Postcode%20lookup?api_key=key6dquGrHjATucZg";
// // Mock implementation, for the snippet to work:
// let data = [];

// function transformData(arr) {
//   let newData = arr.map((record) => {
//     return {
//       id: record["id"],
//       countryCode: record["fields"]["Country Code (from Geotarget)"][0],
//       canonicalName: record["fields"]["Canonical Name (from Geotarget)"][0],
//       name: record["fields"]["Name (from Geotarget)"][0],
//     };
//   });

//   return newData;
// }

// var returnArray = [];

// function getData(offset = "") {
//   let newOffset = "";

//   if (offset !== "") {
//     newOffset = `&offset=${offset}`;
//   }
//   return axios
//     .get(`${BASE_URL}${newOffset}`)
//     .then(function (response) {
//       returnArray = returnArray.concat(transformData(response.data.records));
//       console.log("offset", `${BASE_URL}${newOffset}`);
//       if (response.data.offset !== undefined) {
//         return getData(response.data.offset);
//       }
//       throw Error("Final page");
//     })
//     .catch(function () {
//       return returnArray;
//     });
// }

// (async () => {
//   await getData();
//   console.log("final arr", returnArray);
// })();
