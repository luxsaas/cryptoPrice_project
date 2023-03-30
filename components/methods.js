//imports
const { MongoClient } = require("mongodb");
require("dotenv").config();
const jsonrpc = require('jsonrpc-lite');
const moment=require('moment');
const { trackedCoinData, untrackedCoinData } = require("./coinData");

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
        let allowedParams;
        let extraParams;
        switch (method) {
            //METHOD A
            case 'getCoinInfo':
                let preresult = [];
                const { description } = params;
                if (typeof description!=='string') {
                    const error = new jsonrpc.JsonRpcError(`Invalid Parameter`, -32000);
                    const errorResponse = jsonrpc.error(id, error);
                    return res.status(400).send(errorResponse);
                    }

                allowedParams = ['description'];
                extraParams = Object.keys(params).filter(key => !allowedParams.includes(key));

                if (extraParams.length > 0) {
                const error = new jsonrpc.JsonRpcError(`Invalid parameter(s): ${extraParams.join(', ')}`, -32000);
                const errorResponse = jsonrpc.error(id, error);
                return res.status(400).send(errorResponse);
                }
                const coinIds = description ? description.split(',') : null;
            
                if (coinIds === null || coinIds.length === 0) {
                    preresult = await db.collection('CryptoList').find().toArray();
                } else {
                    const query = { id: { $in: coinIds } };
                    const projection = { id: 1, name: 1, symbol: 1, price: 1, last_update: 1, tracked: 1 };
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
                    let name=coin.name;
                    if(coin.name!=null){
                        name=coin.name.toUpperCase();
                    }
                    if(coin.last_update==null){
                        return { id: coin.id, name: name, symbol: coin.symbol, tracked: coin.tracked };
                    }
                    else{
                        return { id: coin.id, name: name, symbol: coin.symbol, price: latestPrice, last_synced: coin.last_update, tracked:coin.tracked };
                    }
                });
                break;
            //METHOD B
            case 'getHistoricalInfo':
                const { cId, limit, sort } = params;

                allowedParams = ['cId', 'limit', 'sort'];
                extraParams = Object.keys(params).filter(key => !allowedParams.includes(key));

                if (extraParams.length > 0) {
                const error = new jsonrpc.JsonRpcError(`Invalid parameter(s): ${extraParams.join(', ')}`, -32000);
                const errorResponse = jsonrpc.error(id, error);
                return res.status(400).send(errorResponse);
                }
                if(cId==null||typeof cId!='string'){
                    const error = new jsonrpc.JsonRpcError('Missing/Invalid Coin Id', -32000);
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
                let name=coin.name;
                if(coin[0].name!==null){
                    name=coin[0].name.toUpperCase();
                }
                else{
                    name=null;
                }
                let sortedPrice = coin[0].price.reverse();
                if (limit) {
                    sortedPrice = sortedPrice.slice(0, limit);
                } else {
                    sortedPrice = sortedPrice.slice(0, Math.min(sortedPrice.length, 10));
                }
                if (sortedPrice.length < limit) {
                    sortedPrice = sortedPrice.slice(0, Math.min(sortedPrice.length, 50));
                }
                if (coin[0].tracked == false) {
                    if (!coin[0].price) {
                        sortedPrice = [];
                    } else {
                        sortedPrice = sortedPrice.slice(-10);
                    }
                }
                if(sort){
                    if (sort === 'descending') {}
                    else if(sort ==='ascending'){
                        sortedPrice = sortedPrice.reverse();
                    }
                    else{
                        const error = new jsonrpc.JsonRpcError('The sort parameter is invalid', -32000);
                        const errorResponse = jsonrpc.error(id, error);
                        return res.status(400).send(errorResponse);
                    }
                }

                result = {
                    id: coin[0].id,
                    name: name,
                    price: sortedPrice.join(),
                    synced_on: moment.utc().format('LLLL')
                };
                break;
            //METHOD C
            case 'ToggleTracked':
                const { coinId, tracked } = params;

                allowedParams = ['coinId', 'tracked'];
                extraParams = Object.keys(params).filter(key => !allowedParams.includes(key));

                if (extraParams.length > 0) {
                const error = new jsonrpc.JsonRpcError(`Invalid parameter(s): ${extraParams.join(', ')}`, -32000);
                const errorResponse = jsonrpc.error(id, error);
                return res.status(400).send(errorResponse);
                }
                if(!coinId||tracked===undefined||typeof coinId!='string'||typeof tracked!='boolean'){
                    const error = new jsonrpc.JsonRpcError('A required parameter is missing/invalid', -32000);
                    const errorResponse = jsonrpc.error(id, error);
                    return res.status(400).send(errorResponse);
                }
                if (!trackedCoinData.includes(coinId) && !untrackedCoinData.includes(coinId)) {
                    const error = new jsonrpc.JsonRpcError('This coinId does not exist', -32000);
                    const errorResponse = jsonrpc.error(id, error);
                    return res.status(400).send(errorResponse);
                }
                const filter = { id: coinId };
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
                const error = new Error(`Method ${method} not found`);
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