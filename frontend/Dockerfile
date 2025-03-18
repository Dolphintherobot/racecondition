FROM node
WORKDIR /app

COPY package*.json ./

EXPOSE 8080
RUN npm install

COPY . .

CMD ["npm","start"]
