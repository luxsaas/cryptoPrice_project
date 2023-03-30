# CryptoPrice

# Requirements
Docker should be installed on Desktop

# Setup 

1) Create a file .env in the root repository and past the APIkey from email 
2) cd into root repository
3) Use the command docker-compose up -d to start the program

# Other Information
Data Provider: CoinGenko 
Programming Language: Node.js , Version: 19.8.1

Available CryptoCurrencies: 
bitcoin,
ethereum, 
tether, 
luxy, 
uhive,
xbn,
solana,
adadao,
akoin,
scrap, 
imov,
nextdao,
nexon,
amber,
treeb,
hbg,
uerii,
ryo,
a-nation,
idle

# Methods

getCoinInfo - This method will serve up coin information for some or all coins tracked by the API.

Parameters: 

OPTIONAL, description - id of the coin (choose from the list above)
STRING or null - Comma delimited list of coins

If you add a parameter, the method will return information of the specified cryptocurrencies.

If there are no paramater, the method will return information of all 20 cryptocurrencies.

getHistoricalInfo - This method serves up historical coin information for a specific coin from the time the request is made.

isTracked- This method allows the requestor to instruct your API to enable/disable tracking for a specific coin.
