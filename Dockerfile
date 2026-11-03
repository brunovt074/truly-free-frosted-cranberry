FROM nginx:1.27-alpine
COPY deploy/security-headers.conf /etc/nginx/security-headers.conf
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY site/ /usr/share/nginx/html/
