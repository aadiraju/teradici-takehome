FROM node:16

# Create app directory
WORKDIR /usr/app

# copy package.json and package-lock.json into workdir
COPY package*.json .

# Install app dependencies (just express)
RUN npm install

# Copy app files to workdir
COPY . .

CMD ["npm", "run", "start"]
