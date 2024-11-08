**Commands**

Deploy Token Factory:
```
yarn hardhat deploy --network saigon --tags TokenFactory
```

Create a new token from this factory based on the informations in `config/token-config.json`
```
yarn hardhat run scripts/deploy_new_token.ts --network saigon
```

Deposit tokens into the pool token
```
yarn hardhat run scripts/deposit_pool.ts --network saigon
```

Check pool status and create LP + Open airdrop claims
```
yarn hardhat run scripts/check_pool.ts --network saigon
```
