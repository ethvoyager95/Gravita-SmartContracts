const { ZERO_ADDRESS } = require("@openzeppelin/test-helpers/src/constants")

const CoreDeploymentHelper = require("../utils/deploymentHelper-core.js")
const { Deployer } = require("./deployer-common.js")

/**
 * Exported deployment script, invoked from hardhat tasks defined on hardhat.config.js
 */
class CoreDeployer extends Deployer {
	constructor(hre, targetNetwork) {
		super(hre, targetNetwork)
		this.helper = new CoreDeploymentHelper(this.hre, this.config, this.deployerWallet)
	}

	async run() {
		console.log(`Deploying Gravita Core on ${this.targetNetwork}...`)

		await this.printDeployerBalance()

		const { contracts, allUpgraded } = await this.helper.loadOrDeployOrUpgradeCoreContracts()

		if (allUpgraded) {
			console.log(`All contracts have been upgraded, setting parameters...`)
			this.coreContracts = contracts
			await this.addCollaterals()
			await this.toggleContractSetupInitialization(contracts.adminContract)
			await this.helper.verifyCoreContracts()
			// await this.transferContractsOwnerships(contracts)
		}

		await this.printDeployerBalance()
	}

	async addCollaterals() {
		console.log("Adding Collateral...")
		for (const coll of this.config.COLLATERAL) {
			if (!coll.address || coll.address == "") {
				console.log(`[${coll.name}] WARNING: No address setup for collateral`)
				continue
			}
			if (!coll.oracleAddress || coll.oracleAddress == "") {
				console.log(`[${coll.name}] WARNING: No price feed oracle address setup for collateral`)
				continue
			}
			await this.addPriceFeedOracle(coll)
			await this.addCollateral(coll)
			await this.setCollateralParams(coll)
			if (coll.name == "wETH") {
				// use the same oracle for wETH and ETH
				await this.addPriceFeedOracle({ ...coll, name: "ETH", address: ZERO_ADDRESS })
			}
		}
	}

	async addPriceFeedOracle(coll) {
		const oracleRecord = await this.coreContracts.priceFeed.oracleRecords(coll.address)
		if (!oracleRecord.exists) {
			const owner = await this.coreContracts.priceFeed.owner()
			if (owner != this.deployerWallet.address) {
				console.log(
					`[${coll.name}] NOTICE: Cannot call PriceFeed.setOracle(): deployer = ${this.deployerWallet.address}, owner = ${owner}`
				)
				return
			}
			console.log(`[${coll.name}] PriceFeed.setOracle()`)
			await this.helper.sendAndWaitForTransaction(
				this.coreContracts.priceFeed.setOracle(
					coll.address,
					coll.oracleAddress,
					coll.oraclePriceDeviation.toString(),
					coll.oracleIsEthIndexed
				)
			)
			console.log(`[${coll.name}] Oracle Price Feed has been set @ ${coll.oracleAddress}`)
		} else {
			if (oracleRecord.chainLinkOracle == coll.oracleAddress) {
				console.log(`[${coll.name}] Oracle Price Feed had already been set @ ${coll.oracleAddress}`)
			} else {
				console.log(
					`[${coll.name}] WARNING: another oracle had already been set, please update via Timelock.setOracle()`
				)
			}
		}
	}

	async addCollateral(coll) {
		const collExists = (await this.coreContracts.adminContract.getMcr(coll.address)).gt(0)

		if (collExists) {
			console.log(`[${coll.name}] NOTICE: collateral has already been added before`)
		} else {
			const decimals = 18
			console.log(`[${coll.name}] AdminContract.addNewCollateral() ...`)
			await this.helper.sendAndWaitForTransaction(
				this.coreContracts.adminContract.addNewCollateral(coll.address, coll.gasCompensation, decimals)
			)
			console.log(`[${coll.name}] Collateral added @ ${coll.address}`)
		}
	}

	async setCollateralParams(coll) {
		const isActive = await this.coreContracts.adminContract.getIsActive(coll.address)
		if (isActive) {
			console.log(`[${coll.name}] NOTICE: collateral params have already been set`)
		} else {
			console.log(`[${coll.name}] Setting collateral params...`)
			const defaultPercentDivisor = await this.coreContracts.adminContract.PERCENT_DIVISOR_DEFAULT()
			const defaultBorrowingFee = await this.coreContracts.adminContract.BORROWING_FEE_DEFAULT()
			const defaultRedemptionFeeFloor = await this.coreContracts.adminContract.REDEMPTION_FEE_FLOOR_DEFAULT()
			await this.helper.sendAndWaitForTransaction(
				this.coreContracts.adminContract.setCollateralParameters(
					coll.address,
					defaultBorrowingFee,
					coll.CCR,
					coll.MCR,
					coll.minNetDebt,
					coll.mintCap,
					defaultPercentDivisor,
					defaultRedemptionFeeFloor
				)
			)
			console.log(`[${coll.name}] AdminContract.setCollateralParameters() -> ok`)
		}
	}
}

module.exports = CoreDeployer
