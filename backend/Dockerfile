FROM node

USER root

COPY package*.json ./
RUN npm install --production

COPY . .

CMD [ "npm", "start"]