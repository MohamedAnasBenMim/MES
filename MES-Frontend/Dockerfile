# Stage 1: Build Angular application
FROM node:25-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build -- --configuration production

# Stage 2: Serve using Nginx
FROM nginx:alpine

# Copy built Angular static assets to Nginx web root
COPY --from=build /app/dist/coreui-free-angular-admin-template/browser /usr/share/nginx/html

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
