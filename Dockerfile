FROM nginx:alpine

# Default port for Cloud Run
ENV PORT=8080

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy the nginx template
# The official nginx image automatically processes files in /etc/nginx/templates/ using envsubst
COPY default.conf.template /etc/nginx/templates/default.conf.template

# Copy static app files
COPY public/ /usr/share/nginx/html/

# Expose the port (informative)
EXPOSE $PORT

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
