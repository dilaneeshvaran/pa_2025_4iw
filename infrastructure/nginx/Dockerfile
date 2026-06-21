FROM nginx:1.25-alpine

COPY nginx.conf /etc/nginx/nginx.conf

RUN mkdir -p /var/www/certbot && \
    touch /var/log/nginx/access_log.json && \
    chown -R nginx:nginx /var/log/nginx /var/www/certbot

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]
