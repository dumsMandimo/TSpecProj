const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000; //weusenvironmentvariablefordeployment

/* app.use(cors()); //cross origin resource sharing

app.options("*", (req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Origin", "GET, PUT, POST,OPTIONS");
  res.header(
    "Access-Control-Allow-Origin",
    "Authorization, Content-Length, X-Requested-With",
  );
  res.send(200);
});

app.use(express.json());

app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - ${req.ip}`);
  next();
});

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.jsx");
});

app.get("/form", (req, res) => {
  res.sendFile(__dirname + "/views/form.html");
});

app.get("/:word/echo", (req, res) => {
  res.json({ echo: req.params.word });
});

app.all("*", (req, res) => {
  res.send("Invalid route");
}); */

//app.listen(PORT, () => console.log(`Listening on ${PORT}`));

//api to fetch vacancies from saqa

/*async function searchApplications(vacancy) {
  try {
    const response = await fetch(`https://saqa.org.za/vacancies/`);

    if (!response.ok) {
      throw new Error("No opportunities found");
    }

    const data = await response.json();
  } catch (err) {
    errorMessage.textContent;
  }
} */

/* const ref = db.ref("nqfLevels");

db.collection('nqfLevels').get().then((snapshot) => {
    const dropdown = document.getElementById("");
    getInfo(snapshot.docs);
});

    var html = "";

  (function () {
    fetch("http://localhost:8080/")
        .then(response => response.json())
        .then(data => {
            const dropdown = document.getElementById("userIdDropdown");
            data.forEach(user => {
                const option = document.createElement("option");
                option.value = user.userId;
                option.textContent = user.userId;
                dropdown.appendChild(option);
            });
        })
        .catch(err => console.error("Error:", err));
})();

  var html = "";
  function getInfo(data){
    data.forEach(doc => {
        var info = doc.data();
        html += "...";


    }

    <label for

    document.getElementById();

    });
  }



  ref.orderByChild("").on('child_added', (snapshot) => {
  console.log(snapshot.key + ' was ' + snapshot.val().height + ' meters tall');
});

*/
