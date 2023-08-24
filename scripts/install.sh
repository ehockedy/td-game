# Setup for server to run DOKV on nano EC2 instance

# Install node
yarn install npm

# Allocate 4GB of swap memory. Nano instance has only 0.5GB of RAM, not enough to even withstand the
# npm package installation.
sudo dd if=/dev/zero of=/swapfile bs=128M count=32
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Add to file to ensure swap applied if reboots
sudo echo "/swapfile swap swap defaults 0 0" >> /etc/fstab

# install dependencies
npm install