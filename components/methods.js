//imports
const { MongoClient } = require("mongodb");
require("dotenv").config();
const jsonrpc = require('jsonrpc-lite');
const moment=require('moment');

//setup mongodb
const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
};
const { MONGO_URI } = process.env;
const client = new MongoClient(MONGO_URI, options);


//handles endpoints of api
const getDataFromMongoDB = async (req, res) => {
    const { id, method, params } = req.body;
    if (!method || !params) {
        const errorResponse = jsonrpc.error(id, new Error('Invalid Request'));
        return res.status(400).send(errorResponse);
    }
    try {
        await client.connect();
        const db = client.db('CryptoPrice');
        let result;
        switch (method) {
            //METHOD A
            case 'getCoinInfo':
                let preresult;
                if (params.description == undefined || params.description.length == 0) {
                    preresult = await db.collection('CryptoList').find().toArray();
                } else {
                    const { description } = params;
                    const query = { id: description };
                    const projection = { id: 1, name: 1, symbol: 1, price: 1, last_updated: 1 };
                    preresult = await db.collection('CryptoList').find(query).project(projection).toArray();
                }
                if (preresult.length === 0) {
                    const error = new jsonrpc.JsonRpcError('This coin Id is invalid', -32000);
                    const errorResponse = jsonrpc.error(id, error);
                    return res.status(400).send(errorResponse);
                }
                result = preresult.map(coin => {
                    let latest=coin.price.length;
                    let latestPrice = coin.price[latest-1];
                    if(coin.last_update==null){
                        return { id: coin.id, name: coin.name.toUpperCase(), symbol: coin.symbol, tracked:coin.tracked };
                    }
                    else{
                        return { id: coin.id, name: coin.name.toUpperCase(), symbol: coin.symbol, price: latestPrice, last_synced: coin.last_update, tracked:coin.tracked };
                    }
                });
                break;
            //METHOD B
            case 'getHistoricalInfo':
                const { cId, limit, sort } = params;
                if(cId==null||typeof cId!='string'){
                    const error = new jsonrpc.JsonRpcError('Missing Coin Id', -32000);
                    const errorResponse = jsonrpc.error(id, error);
                    return res.status(400).send(errorResponse);
                }
                const query2 = { id: cId };
                let cursor = db.collection('CryptoList').find(query2);
                const coin = await cursor.toArray();
                if (coin.length === 0) {
                    const error = new jsonrpc.JsonRpcError('This coin Id is invalid', -32000);
                    const errorResponse = jsonrpc.error(id, error);
                    return res.status(400).send(errorResponse);
                }

                let sortedPrice = coin[0].price;
                if(sort){
                    if (sort === 'descending') {
                        sortedPrice = coin[0].price.reverse();
                    }
                    else if(sort!='ascending' || sort !='descending'){
                        const error = new jsonrpc.JsonRpcError('The sort parameter is invalid', -32000);
                        const errorResponse = jsonrpc.error(id, error);
                        return res.status(400).send(errorResponse);
                    }
                }
                if (limit) {
                    sortedPrice = sortedPrice.slice(0, limit);
                }
                else{
                    sortedPrice = sortedPrice.slice(0, 10);
                }
                if(coin[0].tracked==false){
                    if(!coin[0].price){
                        sortedPrice=[]
                    }
                    else{
                        sortedPrice.slice(-10);
                    }
                }
                const maxLimit = Math.min(limit || 10, 50);
                sortedPrice = sortedPrice.limit(maxLimit);
                result = {
                    id:coin[0].id,
                    name:coin[0].name.toUpperCase(),
                    price: sortedPrice.join(),
                    synced_on: moment.utc().format('LLLL')
                };
                break;
            //METHOD C
            case 'isTracked':
                const { coinid, tracked } = params;
                if(!coinid||!tracked||typeof coinid!='string'||typeof tracked!='boolean'){
                    const error = new jsonrpc.JsonRpcError('A required parameter is missing/invalid', -32000);
                    const errorResponse = jsonrpc.error(id, error);
                    return res.status(400).send(errorResponse);
                }
                const filter = { id: coinid };
                const update = {
                    $set: {
                        tracked:tracked,
                    },
                };
                const options = { upsert: true };
                result = await db.collection("CryptoList").findOneAndUpdate(filter, update, options);
                result = { message: 'ok' };
                break;
            default:
                const error = new Error('Method ${method} not found');
                const errorResponse = jsonrpc.error(id, error);
                return res.status(404).send(errorResponse);
        }
        const successResponse = jsonrpc.success(id, result);
        res.send(successResponse);
        client.close();
    } catch (error) {
        console.error(error); 
        const errorResponse = jsonrpc.error(id, error);
        res.status(500).send(errorResponse);
    }
}

module.exports = {
    getDataFromMongoDB
};