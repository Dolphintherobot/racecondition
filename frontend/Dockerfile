FROM node
WORKDIR /app/frontend

COPY package*.json ./

EXPOSE 8080
RUN npm install


COPY ./src ./src

CMD ["npm","start"]
