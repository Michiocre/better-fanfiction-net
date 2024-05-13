FROM node

USER root

COPY package*.json ./
RUN npm install --omit=dev

COPY . .

CMD [ "npm", "start"]