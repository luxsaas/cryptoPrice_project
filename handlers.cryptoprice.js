//imports
const { MongoClient } = require("mongodb");
require("dotenv").config();
const jsonrpc = require('jsonrpc-lite');

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
                if(params.description==undefined ){
                    result = await db.collection('CryptoList').find().toArray();
                }
                else if(params.description.length==0){
                    result = await db.collection('CryptoList').find().toArray();
                }
                else{
                    const {description} = params;
                    const query = { id:description};
                    result = await db.collection('CryptoList').findOne(query);
                }
                break;
            //METHOD B
            case 'getHistoricalInfo':
                const { id, limit, sort } = params;
                const query2 = { id: id };
                let cursor = db.collection('CryptoHistory').find(query2).limit(limit || 30);
                if (sort === 'desc') {
                    cursor = cursor.sort({ date: -1 });
                }
                result = await cursor.toArray();
                break;
            //METHOD C
            case 'isTracked':
                const { coinid, tracked } = params;
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