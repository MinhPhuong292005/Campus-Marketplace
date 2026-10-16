# Build stage
FROM node:20-alpine AS build
WORKDIR /app

# Disable Husky during docker builds
ENV HUSKY=0

COPY package*.json ./
RUN npm ci --ignore-scripts

COPY . .

# Optional build arg for API base URL
ARG VITE_API_BASE_URL=/api/v1
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
