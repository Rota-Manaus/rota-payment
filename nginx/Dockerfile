FROM ubuntu/nginx
RUN apt-get update
RUN apt-get install vim
RUN apt install -y certbot python3-certbot-nginx
COPY default.conf /etc/nginx/conf.d/default.conf
COPY /certs /etc/nginx/certs