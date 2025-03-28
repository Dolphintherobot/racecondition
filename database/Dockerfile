FROM node
WORKDIR /app
EXPOSE 8080
RUN  npm install express body-parser loadtest mysql2 nano cors multer
RUN mkdir -p /app/files
COPY server.js /app

CMD ["node","server.js"]
