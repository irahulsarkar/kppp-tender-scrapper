FROM ghcr.io/puppeteer/puppeteer:24.4.0

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY . .

EXPOSE 5000

CMD ["node", "src/server.js"]
