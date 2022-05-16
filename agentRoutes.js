// agentRoutes.js
const express = require("express");
const { pipeline, Transform } = require("stream");
const busboy = require("connect-busboy");
const util = require("promisfy");
const Dialogflow = require("@google-cloud/dialogflow");
const { v4: uuid } = require("uuid");
const Path = require("path");

const bodyParser = require("body-parser");

const app = express();

var jsonParser = bodyParser.json();
var urlencodedParser = bodyParser.urlencoded({ extended: false });

app.use(
  busboy({
    immediate: true,
  })
);

app.post("/voice-input", jsonParser, (req, res) => {
  console.log("Now running voice input route content...");
  const sessionClient = new Dialogflow.SessionsClient({
    keyFilename: Path.join(__dirname, "./key.json"),
  });
  const sessionPath = sessionClient.projectAgentSessionPath("hku-ra", uuid());

  // transform into a promise
  const pump = util.promisfy(pipeline);

  const audioRequest = {
    session: sessionPath,
    queryInput: {
      audioConfig: {
        audioEncoding: "AUDIO_ENCODING_UNSPECIFIED",
        // sampleRateHertz: "16000",
        languageCode: "zh-HK",
      },
      singleUtterance: true,
    },
  };

  let streamData = null;
  const detectStream = sessionClient
    .streamingDetectIntent()
    .on("error", (error) => console.log(error))
    .on("data", (data) => {
      streamData = data.queryResult;
      if (streamData) console.log(streamData.queryText);
    })
    .on("end", (data) => {
      res
        .status(200)
        .send({
          data: streamData.fulfillmentText,
          inputtext: streamData.queryText,
        });
    });

  detectStream.write(audioRequest);

  console.log("trying...");

  try {
    req.busboy.on("file", (_, file, filename) => {
      //   console.log(file);
      //   console.log(filename);
      pump(
        file,
        new Transform({
          objectMode: true,
          transform: (obj, _, next) => {
            next(null, { inputAudio: obj });
          },
        }),
        detectStream
      );
    });
  } catch (e) {
    console.log(`error  : ${e}`);
  }
});

module.exports = app;
