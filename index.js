
//imports
const express = require('express');
const moment=require('moment');
const bodyParser = require('body-parser');
const { MongoClient } = require("mongodb");
const axios =require('axios');
require("dotenv").config();
const port = 5000;
const {
    addCrypto,addDefaultCrypto,deleteCrypto} = require("./handlers.js");
const {
    getDataFromMongoDB}=require('./handlers.cryptoprice');


//mongodb setup
const options = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
};
const endpoint = 'https://api.coingecko.com/api/v3/coins/markets?vs_currency=cad&order=market_cap_desc&per_page=100&page=1&sparkline=false';
const { MONGO_URI } = process.env;
const client = new MongoClient(MONGO_URI,options);

//when program starts , the database is reset 
deleteCrypto();
addDefaultCrypto();
addCrypto();

const updatePrices = async (req, res) => {
let ids = [];
try {
    await client.connect();
    const db = client.db("CryptoPrice");
    const cursor = db.collection("CryptoList").find({ tracked: true }, { projection: { _id: 0, id: 1 } });
    await cursor.forEach((doc) => {
        ids.push(doc.id);
    });
    const result = ids.join(",");
    const params = {
        vs_currency: "cad",
        order: "market_cap_desc",
        per_page: 20,
        page: 1,
        sparkline: false,
        ids: result,
    };
    axios
        .get(endpoint, { params })
        .then(async (response) => {
        for (const coin of response.data) {
            const filter = { id: coin.id };
            const update = {
                $push: {
                    price: { $each: [(coin.current_price).toString()], $slice: -50 },
                },
                $set: {
                    name:coin.name,
                    symbol:coin.symbol,
                    last_update: moment.utc().format('YYYY-MM-DD HH:mm:ss'),
                },
            };
            const options = { upsert: true };
            try {
                await client.connect();
                const result = await db.collection("CryptoList").findOneAndUpdate(filter, update, options);
                console.log(`Crypto Updated: ${result.value.last_update}`);
            } catch (error) {
                console.error(error);
            }
        }
        })
        .catch((error) => {
            console.error(error);
        });
    } catch (error) {
        console.error(error);
        throw error;
    } finally {
        await client.close();
    }
};

setInterval(() => {
    updatePrices();
}, 30000);

express()
.use(bodyParser.json())
.post('/',getDataFromMongoDB) 

.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})

