FROM node:19.8.1

WORKDIR /app

COPY package*.json ./
RUN yarn install

COPY . .

ENV MONGO_URI=mongodb+srv://luxsaas:yOEDVPSPEePstYks@cryptoprice.e8kfqss.mongodb.net/?retryWrites=true&w=majority

CMD ["yarn", "start"]