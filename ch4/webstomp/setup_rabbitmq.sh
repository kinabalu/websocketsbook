#!/bin/bash

cat >> /etc/apt/sources.list <<EOT
deb http://www.rabbitmq.com/debian/ testing main
EOT

wget http://www.rabbitmq.com/rabbitmq-signing-key-public.asc
apt-key add rabbitmq-signing-key-public.asc

apt-get update

apt-get install -q -y screen htop vim curl wget
apt-get install -q -y rabbitmq-server

# RabbitMQ Plugins
service rabbitmq-server stop
rabbitmq-plugins enable rabbitmq_management
rabbitmq-plugins enable rabbitmq_web_stomp
#rabbitmq-plugins enable rabbitmq_web_stomp_examples
service rabbitmq-server start

# Create our websockets user and remove guest
rabbitmqctl delete_user guest
rabbitmqctl add_user websockets rabbitmq
rabbitmqctl set_user_tags websockets administrator
rabbitmqctl set_permissions -p / websockets ".*" ".*" ".*"


rabbitmq-plugins list
