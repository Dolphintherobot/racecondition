FROM node
WORKDIR /app
EXPOSE 8080
RUN  npm install express body-parser loadtest mysql2 cors multer fs cluster
RUN mkdir -p /app/files
COPY *.js /app

CMD ["node","server.js"]
