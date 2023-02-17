#!/bin/bash 
trap 'exit 0' SIGINT SIGQUIT SIGTERM
npx hardhat node