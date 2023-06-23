import { BigNumber, utils } from "ethers"
const toEther = (val: any): BigNumber => utils.parseEther(String(val))

const OUTPUT_FILE = "./scripts/deployment/output/arbitrum-goerli.json"
const TX_CONFIRMATIONS = 1
const ETHERSCAN_BASE_URL = "https://goerli.arbiscan.io/address"

const CONTRACT_UPGRADES_ADMIN = "0x19596e1D6cd97916514B5DBaA4730781eFE49975"
const SYSTEM_PARAMS_ADMIN = "0x19596e1D6cd97916514B5DBaA4730781eFE49975"
const TREASURY_WALLET = "0x19596e1D6cd97916514B5DBaA4730781eFE49975"

// Updated 06/20/2023 from Gravita-Protocol/layer-zero branch gravita-proxy file deployments/arbitrum-goerli/GravitaDebtToken.json commit 1564b4d
const GRAI_TOKEN_ADDRESS = "0x18e981161b2021392B3F2D844793eE50A52f8232"

// from https://docs.chain.link/data-feeds/l2-sequencer-feeds
const SEQUENCER_UPTIME_FEED_ADDRESS = "0x4da69F028a5790fCCAfe81a75C0D24f46ceCDd69"

const COLLATERAL = [
	{
		name: "wETH",
		address: "0xE8BAde28E08B469B4EeeC35b9E48B2Ce49FB3FC9", // Mock ERC20
		oracleAddress: "0x1A0A7c9008Aa351cf8150a01b21Ff2BB98D70D2D", // Mock Aggregator
		oracleTimeoutMinutes: 1440,
		oracleIsEthIndexed: false,
		MCR: toEther(1.111),
		CCR: toEther(1.4),
		minNetDebt: toEther(300),
		gasCompensation: toEther(30),
		mintCap: toEther(5_000_000),
	},
]

module.exports = {
	COLLATERAL,
	CONTRACT_UPGRADES_ADMIN,
	ETHERSCAN_BASE_URL,
	GRAI_TOKEN_ADDRESS,
	OUTPUT_FILE,
	SEQUENCER_UPTIME_FEED_ADDRESS,
	SYSTEM_PARAMS_ADMIN,
	TREASURY_WALLET,
	TX_CONFIRMATIONS,
}
