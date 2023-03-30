//imports
const { MongoClient } = require("mongodb");
const axios =require('axios');
require("dotenv").config();
const moment=require('moment');
const { trackedCoinData, untrackedCoinData } = require("./coinData");

//mongodb setup
const options = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
};
const endpoint = 'https://api.coingecko.com/api/v3/coins/markets?vs_currency=cad&order=market_cap_desc&per_page=100&page=1&sparkline=false';
require("dotenv").config();
const { MONGO_URI } = process.env;

//function to add untracked coins
const addCrypto = async (req, res) => {
    const coins =untrackedCoinData;
    const client = new MongoClient(MONGO_URI, options);
    try {
        await client.connect();
        const db = client.db("CryptoPrice");
        for(i=0;i<coins.length;i++){
            const newPost = {
                id: coins[i],
                symbol: null,
                name: null,
                price: [],
                last_update: null,
                tracked: false,
            };
            await db.collection("CryptoList").findOneAndUpdate(
                { id: coins[i] },
                { $set: newPost },
                { upsert: true }
            );
        }
    } catch (error) {
        console.error(error);
    } finally {
        await client.close();
    }
};

//function to add 5 tracked coins
const addDefaultCrypto = async () => {
    const coin =trackedCoinData;
    const params = {
        vs_currency: 'cad',
        order: 'market_cap_desc',
        per_page: 5,
        page: 1,
        sparkline: false,
        ids: coin
    };
    const client = new MongoClient(MONGO_URI, options);
    try {
        const response = await axios.get(endpoint, { params });
        const coins = response.data;
        await client.connect();
        const db = client.db("CryptoPrice");

        for (const coin of coins) {
            const newPost = {
                id: coin.id,
                symbol: coin.symbol,
                name: coin.name,
                price: [(coin.current_price).toString()],
                last_update: moment.utc().format('YYYY-MM-DD HH:mm:ss'),
                tracked: true,
            };
            await db.collection("CryptoList").findOneAndUpdate({ id: coin.id },{ $set: newPost },{ upsert: true }
            );
        }
        await client.close();
        return {
            status: 200,
            message: "Success"
        };
    } catch (error) {
        console.error(error);
        throw error;
    } finally {
        await client.close();
    }
};
//deletes all coins in the database when the program starts
const deleteCrypto= async(req,res)=>{
    const client = new MongoClient(MONGO_URI, options);
    try {
        await client.connect();
        const db = client.db("CryptoPrice");
        await db.collection("CryptoList").deleteMany({});
    } catch (error) {
        console.error(error);
    } finally {
        await client.close();
    }
}
module.exports = {
    addCrypto,addDefaultCrypto,
    deleteCrypto
};