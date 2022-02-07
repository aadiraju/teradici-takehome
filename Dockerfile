FROM node:16

# Create app directory
WORKDIR /app

# copy package.json and package-lock.json into workdir
COPY package*.json ./

# Install app dependencies
RUN npm install

# Copy app files to workdir
COPY . ./

CMD ["npm", "run", "start"]
