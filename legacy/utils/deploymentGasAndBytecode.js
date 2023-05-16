// Hardhat script
const SortedVessels = artifacts.require("./SortedVessels.sol")
const VesselManager = artifacts.require("./VesselManager.sol")
const PriceFeed = artifacts.require("./PriceFeed.sol")
const VUSDToken = artifacts.require("./VUSDToken.sol")
const ActivePool = artifacts.require("./ActivePool.sol");
const DefaultPool = artifacts.require("./DefaultPool.sol");
const StabilityPool = artifacts.require("./StabilityPool.sol")
const FunctionCaller = artifacts.require("./FunctionCaller.sol")
const BorrowerOperations = artifacts.require("./BorrowerOperations.sol")

const GRVTStaking = artifacts.require("./GRVT/GRVTStaking.sol")
const GRVTToken = artifacts.require("./GRVT/GRVTToken.sol")
const CommunityIssuance = artifacts.require("./GRVT/CommunityIssuance.sol")
const HintHelpers = artifacts.require("./HintHelpers.sol")

const CommunityIssuanceTester = artifacts.require("./GRVT/CommunityIssuanceTester.sol")
const ActivePoolTester = artifacts.require("./ActivePoolTester.sol")
const DefaultPoolTester = artifacts.require("./DefaultPoolTester.sol")
const GravityMathTester = artifacts.require("./GravityMathTester.sol")
const BorrowerOperationsTester = artifacts.require("./BorrowerOperationsTester.sol")
const VesselManagerTester = artifacts.require("./VesselManagerTester.sol")
const VUSDTokenTester = artifacts.require("./VUSDTokenTester.sol")

const { TestHelper: th } = require("../utils/testHelpers.js")

const dh = require("./deploymentHelpers.js")
const ARBITRARY_ADDRESS = "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419"   // placeholder for the LPrewards bounty addresses

const coreContractABIs = [
  BorrowerOperations,
  PriceFeed,
  VUSDToken,
  SortedVessels,
  VesselManager,
  ActivePool,
  StabilityPool,
  DefaultPool,
  FunctionCaller,
  HintHelpers,
]

const GRVTContractABIs = [
  GRVTStaking,
  GRVTToken,
  CommunityIssuance
]

const TesterContractABIs = [
  CommunityIssuanceTester,
  ActivePoolTester,
  DefaultPoolTester,
  GravityMathTester,
  BorrowerOperationsTester,
  VesselManagerTester,
  VUSDTokenTester,
]

const getGasFromContractDeployment = async (contractObject, name) => {
  const txHash = contractObject.transactionHash
  // console.log(`tx hash  of ${name} deployment is is: ${txHash}`)
  const receipt = await ethers.provider.getTransactionReceipt(txHash)
  const gas = receipt.gasUsed
  console.log(`${name}: ${gas}`)
  return gas
}

const getBytecodeSize = (contractABI) => {
  const bytecodeLength = (contractABI.bytecode.length / 2) - 1
  const deployedBytecodeLength = (contractABI.deployedBytecode.length / 2) - 1
  console.log(`${contractABI.contractName}: ${bytecodeLength}`)
  // console.log(`${contractABI.contractName} deployed bytecode length: ${deployedBytecodeLength}`)
}

const getUSDCostFromGasCost = (deploymentGasTotal, gasPriceInGwei, ETHPrice) => {
  const dollarCost = (deploymentGasTotal * gasPriceInGwei * ETHPrice) / 1e9
  console.log(`At gas price ${gasPriceInGwei} GWei, and ETH Price $${ETHPrice} per ETH, the total cost of deployment in USD is: $${dollarCost}`)
}

const logContractDeploymentCosts = async (contracts) => {
  console.log(`Gas costs for deployments: `)
  let totalGasCost = 0
  for (contractName of Object.keys(contracts)) {
    const gasCost = await getGasFromContractDeployment(contracts[contractName], contractName);
    totalGasCost = totalGasCost + Number(gasCost)
  }
  console.log(`Total deployment gas costs: ${totalGasCost}`)
  getUSDCostFromGasCost(totalGasCost, 200, 1850)
}

const logContractObjects = async (contracts) => {
  console.log(`Contract objects addresses:`)
  let totalGasCost = 0
  for (contractName of Object.keys(contracts)) {
    const gasCost = await getGasFromContractDeployment(contracts[contractName], contractName);
    totalGasCost = totalGasCost + Number(gasCost)
  }
}

const logContractBytecodeLengths = (contractABIs) => {
  console.log(`Contract bytecode lengths:`)
  for (abi of contractABIs) {
    getBytecodeSize(abi)
  }
}

// Run script: log deployment gas costs and bytecode lengths for all contracts
async function main() {
  const coreContracts = await dh.deployLiquityCoreHardhat()
  const GRVTContracts = await dh.deployGRVTContractsHardhat(accounts[0])
  const testerContracts = await dh.deployTesterContractsHardhat()

  await dh.connectCoreContracts(coreContracts, GRVTContracts)
  await dh.connectGRVTContractsToCore(GRVTContracts, coreContracts)


  console.log(`\n`)
  console.log(`GRVT CONTRACTS`)
  await logContractDeploymentCosts(GRVTContracts)
  console.log(`\n`)
  logContractBytecodeLengths(GRVTContractABIs)
  console.log(`\n`)

  console.log(`CORE CONTRACTS`)
  await logContractDeploymentCosts(coreContracts)
  console.log(`\n`)
  logContractBytecodeLengths(coreContractABIs)
  console.log(`\n`)

  console.log(`TESTER CONTRACTS`)
  await logContractDeploymentCosts(testerContracts)
  console.log(`\n`)
  logContractBytecodeLengths(TesterContractABIs)
  console.log(`\n`)

}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
