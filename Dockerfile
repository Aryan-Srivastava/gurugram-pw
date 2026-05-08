# ── Build Stage: Copy static assets ──────────────────────────
FROM nginx:alpine

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy our custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy static app files from public/ into nginx serve directory
COPY public/ /usr/share/nginx/html/

# Cloud Run expects the container to listen on PORT env var (default 8080)
EXPOSE 8080

# Start nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
