import { networkConfig, developmentChains } from "../helper-hardhat-config";

// Typescript types
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

import verify from "../utils/verify";

const deployFundme: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  // @ts-ignore
  const { getNamedAccounts, deployments, network } = hre;
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId: number = network.config.chainId!;

  let ethUsdPriceFeedAddress: string;
  if (chainId === 31337) {
    const ethUsdAggregator = await deployments.get("MockV3Aggregator");
    ethUsdPriceFeedAddress = ethUsdAggregator.address;
  } else {
    ethUsdPriceFeedAddress = networkConfig[network.name].ethUsdPriceFeed!;
  }

  log("----------------------------------------------------");
  log("Deploying FundMe and waiting for confirmations...");

  // When going for localhost and hardhat, use mocks for chainlink
  const fundMe = await deploy("FundMe", {
    from: deployer,
    args: [ethUsdPriceFeedAddress],
    log: true,
    waitConfirmations: networkConfig[network.name]?.blockConfirmations || 0,
  });

  log(`FundMe deployed at ${fundMe.address}`);

  // Upload and verify on etherscan
  if (
    !developmentChains.includes(network.name) &&
    process.env.ETHERSCAN_API_KEY
  ) {
    await verify(fundMe.address, [ethUsdPriceFeedAddress]);
  }
};

export default deployFundme;
deployFundme.tags = ["all", "fundme"];
