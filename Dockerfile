FROM node:22-slim

# Install Python 3 and Pillow dependencies for certificate generation
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    python3-pil \
    fonts-dejavu-core \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package manifests & install
COPY package*.json ./
RUN npm install

# Copy source code and compile
COPY . .
RUN node ./node_modules/typescript/bin/tsc

EXPOSE 3000

# Run with self-healing watchdog
CMD ["npm", "run", "start:watchdog"]
