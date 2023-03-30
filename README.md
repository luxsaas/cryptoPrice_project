# CryptoPrice
CryptoPrice is an API that updates every minute with the latest price information of cryptocurrencies.

## Requirements
Docker should be installed on Desktop

## Setup 

1) Create a file .env in the root repository and paste the API key from email 
2) cd into root repository
3) Use the command "docker build -t dockerapi ." to create the docker image
4) Use the command "docker-compose up" to start the program
5) Use your method of choice to query the API  with JSON-RPC specifications

## Other Information
Data Provider: CoinGenko 
Programming Language: Node.js , Version: 19.8.1
Database: MongoDB

Available CryptoCurrencies: 
- bitcoin,
- ethereum, 
- tether, 
- luxy, 
- uhive,
- xbn,
- solana,
- adadao,
- akoin,
- scrap, 
- imov,
- nextdao,
- nexon,
- amber,
- treeb,
- hbg,
- uerii,
- ryo,
- a-nation,
- idle

## Methods

### getCoinInfo 
This method will serve up coin information for some or all coins tracked by the API.

Parameters: 

description - id of the coin (choose from the list above)

### getHistoricalInfo

This method serves up historical coin information for a specific coin from the time the request is made.

Parameters: 

- cId - id of the coin (choose from the list above)
- limit - the number of historical datapoints to return 
- sort- Whether the result should be sorted by date


### ToggleTracked
This method allows the requestor to instruct your API to enable/disable tracking for a specific coin.

Parameters: 

- coinId - id of the coin (choose from the list above)
- tracked - whether the coin should be tracked or untracked