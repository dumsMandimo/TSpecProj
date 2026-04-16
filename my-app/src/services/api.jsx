const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors()); //cross origin resource sharing

app.options("*", (req, res, next) =>{
    res.header('Access-Control-Allow-Origin', "*")
    res.header('Access-Control-Allow-Origin', "GET, PUT, POST,OPTIONS")
    res.header('Access-Control-Allow-Origin', "Authorization, Content-Length, X-Requested-With")
    res.send(200);
});

app.use(express.json());

app.use(express.urlencoded({ extended: false}))

app.use((req, res, next) => {
    console.log(`${req.method} ${req.path} - ${req.ip}`);
    next();
})

app.get('/', (req, res) => {
    res.sendFile(__dirname + "/index.js");

})

app.get('/form', (req, res) => {
    res.sendFile(__dirname + "/views/form.html");
});

app.get('/:word/echo', (req, res) => {
    res.json({ "echo": req.params.word })
});

app.all('*', (req, res) => {
    res.send("Invalid route");
});

app.listen(PORT, () => console.log(`Listening on ${PORT}`));

