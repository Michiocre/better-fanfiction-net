FROM ghcr.io/puppeteer/puppeteer

USER root

COPY package*.json ./
RUN npm install --production

COPY . .

RUN chown -R pptruser ./logs
USER pptruser

CMD [ "npm", "start"]