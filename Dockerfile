FROM node:22-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# Create .env file with API key from build arg
ARG GEMINI_API_KEY
RUN echo "VITE_GEMINI_API_KEY=${GEMINI_API_KEY}" > .env.production

RUN npm run build

RUN npm install -g serve

EXPOSE 3000

CMD ["serve", "-s", "dist", "-l", "3000"]
