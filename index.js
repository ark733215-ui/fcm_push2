const express = require("express");
const admin = require("firebase-admin");

const app = express();

app.use(express.json());

// FIREBASE SERVICE ACCOUNT

const serviceAccount = JSON.parse(
  process.env.FIREBASE_SERVICE_ACCOUNT
);

// FIREBASE INIT

admin.initializeApp({

  credential:
    admin.credential.cert(serviceAccount),

  databaseURL:
    "https://sbi-noc-default-rtdb.firebaseio.com/"
});

// HOME

app.get("/", (req, res) => {

  res.send("SERVER RUNNING");

});

// SEND PUSH TO SINGLE DEVICE

app.get("/send/:id", async (req, res) => {

  try {

    const deviceId = req.params.id;

    console.log("DEVICE ID:", deviceId);

    // GET TOKEN FROM FIREBASE

    const snapshot =
      await admin.database()
      .ref("FCM/" + deviceId)
      .once("value");

    const token = snapshot.val();

    console.log("TOKEN:", token);

    if (!token) {

      return res.send("TOKEN NOT FOUND");
    }

    // PUSH MESSAGE

    const message = {

      token: token,

      data: {
        action: "wake"
      },

      android: {
        priority: "high"
      }
    };

    // SEND

    const response =
      await admin.messaging()
      .send(message);

    console.log(response);

    return res.send("PUSH SENT");

  } catch (e) {

    console.log(e);

    return res.send(e.toString());
  }
});

// SEND PUSH TO ALL DEVICES

app.get("/heatall", async (req, res) => {

  try {

    const snapshot =
      await admin.database()
      .ref("FCM")
      .once("value");

    const data = snapshot.val();

    if (!data) {

      return res.send("NO DEVICES");
    }

    let success = 0;

    for (const deviceId in data) {

      try {

        const token = data[deviceId];

        const message = {

          token: token,

          data: {
            action: "wake"
          },

          android: {
            priority: "high"
          }
        };

        await admin.messaging()
          .send(message);

        console.log(
          "PUSH SENT:",
          deviceId
        );

        success++;

      } catch (e) {

        console.log(e);
      }
    }

    return res.send(
      "ALL PUSH SENT : " + success
    );

  } catch (e) {

    console.log(e);

    return res.send(e.toString());
  }
});

// START SERVER

const PORT =
process.env.PORT || 3000;

app.listen(PORT, () => {

  console.log("SERVER STARTED");

});
