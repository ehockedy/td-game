#!/bin/bash
# Setup for server to run DOKV on nano EC2 instance
pwd
# Install node
yum install npm

# Allocate 4GB of swap memory. Nano instance has only 0.5GB of RAM, not enough to even withstand the
# npm package installation.
swapoff -a  # First remove any existing swap
dd if=/dev/zero of=/swapfile bs=128M count=32
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile

# Add to file to ensure swap applied if reboots
echo "/swapfile swap swap defaults 0 0" >> /etc/fstab

# install dependencies
npm ci
npm install