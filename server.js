const express = require("express");
const app = express();
const cors = require("cors");
const axios = require("axios");
require("dotenv").config();

var tj = require("@mapbox/togeojson"),
  fs = require("fs"),
  // node doesn't have xml parsing or a dom. use xmldom
  DOMParser = require("xmldom").DOMParser;

const fsPromises = fs.promises;
// eslint-disable-next-line no-undef
const port = process.env.PORT || 7000;
app.use(express.json());
app.use(cors());

async function walk(dir) {
  let files = await fs.readdir(dir);
  files = await Promise.all(
    files.map(async (file) => {
      const filePath = path.join(dir, file);
      const stats = await fs.stat(filePath);
      if (stats.isDirectory()) return walk(filePath);
      else if (stats.isFile()) return filePath;
    })
  );

  return files.reduce((all, folderContents) => all.concat(folderContents), []);
}

async function getFiles(path) {
  //   let files = [];

  return await fsPromises.readdir(path);

  //   return files;
}

app.get("/", async (req, res) => {
  //   try {
  await axios
    .get(process.env.BASE_URL + "Postcode%20lookup", {
      headers: {
        Authorization: `Bearer ${process.env.API_KEY}`,
      },
    })
    .then((data) => {
      // console.log("result", data.data.offset);
      let newData = data.data.records.map((record) => {
        return {
          id: record["id"],
          countryCode: record["fields"]["Country Code (from Geotarget)"][0],
          canonicalName: record["fields"]["Canonical Name (from Geotarget)"][0],
          name: record["fields"]["Name (from Geotarget)"][0],
        };
      });
      res.send({ records: newData, offset: data.data.offset });
    });
});
function transformData(arr) {
  let newData = arr.map((record) => {
    return {
      id: record["id"],
      countryCode: record["fields"]["Country Code (from Geotarget)"][0],
      canonicalName: record["fields"]["Canonical Name (from Geotarget)"][0],
      name: record["fields"]["Name (from Geotarget)"][0],
      targetType: record["fields"]["Target Type (from Geotarget)"][0],
    };
  });

  return newData;
}

app.get("/all", async (req, res) => {
  // let cityKml = new DOMParser().parseFromString(
  //   fs.readFileSync(__dirname + "/kml/Cities.kml", "utf8")
  // );

  // var convertedWithStylesCity = tj.kml(cityKml, { styles: true });

  // console.log(convertedWithStylesCity["features"][2]);
  // console.log(convertedWithStylesCity["features"][0]["geometry"]);
  // console.log("ewqqq", newW);

  let returnArray = [];
  async function getData(offset = "") {
    let newOffset = "";

    if (offset !== "") {
      newOffset = `?offset=${offset}`;
    }
    return axios
      .get(`${process.env.BASE_URL}Postcode%20lookup${newOffset}`, {
        headers: {
          Authorization: `Bearer ${process.env.API_KEY}`,
        },
      })
      .then(function (response) {
        returnArray = returnArray.concat(transformData(response.data.records));
        if (response.data.offset !== undefined) {
          return getData(response.data.offset);
        }
        throw Error("Final page");
      })
      .catch(function () {
        return returnArray;
      });
  }
  let airtableData = await getData();

  let kmlFilenames = [];
  let geoJSONArr = [];
  let arr = fs.readdirSync("./kml/", (err, files) => {
    files.forEach((file) => {
      kmlFilenames = kmlFilenames.concat(file);
    });
  });
  for (let i = 0; i < arr.length; i++) {
    var kml = new DOMParser().parseFromString(
      fs.readFileSync(__dirname + `/kml/${arr[i]}`, "utf8")
    );
    var convertedWithStyles = tj.kml(kml, { styles: true });

    geoJSONArr = geoJSONArr.concat(convertedWithStyles["features"]);
  }

  let arr1 = geoJSONArr.map((postcode) => {
    if (postcode["properties"]["tcity15nm"] !== undefined) {
      console.log("OH NICE", postcode["properties"]);
      console.log("OH NICE", postcode);
      if (postcode["geometry"]["type"] !== "GeometryCollection") {
        return {
          type: postcode["type"],
          coordinates: postcode.geometry.coordinates[0].map(
            (coordinatePair) => {
              return { lng: coordinatePair[0], lat: coordinatePair[1] };
            }
          ),
          properties: {
            ...postcode["properties"],
            name: postcode["properties"]["tcity15nm"],
          },
        };
      } else {
        return {
          type: postcode["type"],
          coordinates: [],
          properties: {
            ...postcode["properties"],
            name: postcode["properties"]["tcity15nm"],
          },
        };
      }
    } else if (postcode["geometry"]["type"] === "Polygon") {
      return {
        type: postcode["type"],
        coordinates: postcode.geometry.coordinates[0].map((coordinatePair) => {
          return { lng: coordinatePair[0], lat: coordinatePair[1] };
        }),
        properties: postcode["properties"],
      };
    } else {
      return {
        type: postcode["type"],
        coordinates: [],
        properties: postcode["properties"],
      };
    }
  });
  let kmlArrIDs = new Set(returnArray.map((properties) => properties.name));
  console.log;
  const compareArr = [
    ...arr1.filter(({ properties }) => {
      return kmlArrIDs.has(properties.name);
    }),
  ];

  res.send({ postcode: compareArr });
});

app.get("/getAllKml", async (req, res) => {
  let kmlFilenames = [];
  let geoJSONArr = [];
  let arr = fs.readdirSync("./kml/", (err, files) => {
    files.forEach((file) => {
      kmlFilenames = kmlFilenames.concat(file);
    });
  });
  for (let i = 0; i < arr.length; i++) {
    var kml = new DOMParser().parseFromString(
      fs.readFileSync(__dirname + `/kml/${arr[i]}`, "utf8")
    );
    var convertedWithStyles = tj.kml(kml, { styles: true });

    geoJSONArr = geoJSONArr.concat(convertedWithStyles["features"]);
  }

  let returnArray = [];
  async function getData(offset = "") {
    let newOffset = "";

    if (offset !== "") {
      newOffset = `?offset=${offset}`;
    }
    return axios
      .get(`${process.env.BASE_URL}Postcode%20lookup${newOffset}`, {
        headers: {
          Authorization: `Bearer ${process.env.API_KEY}`,
        },
      })
      .then(function (response) {
        returnArray = returnArray.concat(transformData(response.data.records));
        if (response.data.offset !== undefined) {
          return getData(response.data.offset);
        }
      });
  }
  await getData();

  let arr1 = geoJSONArr.map((postcode) => {
    if (postcode["geometry"]["type"] === "Polygon") {
      return {
        type: postcode["type"],
        coordinates: postcode.geometry.coordinates[0].map((coordinatePair) => {
          return { lng: coordinatePair[0], lat: coordinatePair[1] };
        }),
        properties: postcode["properties"],
      };
    } else {
      return {
        type: postcode["type"],
        coordinates: [],
        properties: postcode["properties"],
      };
    }
  });
  let kmlArrIDs = new Set(returnArray.map((properties) => properties.name));

  const compareArr = [
    ...arr1.filter(({ properties }) => {
      return !kmlArrIDs.has(properties.name);
    }),
  ];

  res.send({ postcode: compareArr });
});

app.get("/:id", (req, res) => {
  let [letter, num] = req.params.id.split(/([0-9]+)/);
  var kml = new DOMParser().parseFromString(
    fs.readFileSync(__dirname + `/kml/${letter}.kml`, "utf8")
  );

  var converted = tj.kml(kml);

  var convertedWithStyles = tj.kml(kml, { styles: true });

  res.send({
    postcode: convertedWithStyles["features"]
      .filter((area) => area["properties"]["name"] === `${letter}${num}`)
      .map((postcode) => {
        // console.log("coordinates", postcode);
        return {
          type: postcode["type"],
          coordinates: postcode.geometry.coordinates[0].map(
            (coordinatePair) => {
              return { lng: coordinatePair[0], lat: coordinatePair[1] };
            }
          ),
          properties: postcode["properties"],
        };
      })[0],
  });
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`));
