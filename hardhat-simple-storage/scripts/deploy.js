// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  // We get the contract to deploy
  const SimpleStorageFactory = await hre.ethers.getContractFactory(
    "SimpleStorage"
  );

  console.log("Deploying contract...");

  const simpleStorage = await SimpleStorageFactory.deploy();
  await simpleStorage.deployed();

  console.log("SimpleStorage deployed to:", simpleStorage.address);

  // Don't want to verify on local network
  if (hre.network.config.chainId === 4 && process.env.ETHERSCAN_API_KEY) {
    console.log("Waiting for blk confirmations...");
    await simpleStorage.deployTransaction.wait(6);
    verify(simpleStorage.address, []);
  }

  const currentNumber = await simpleStorage.retrieve();
  console.log(`Current Value is: ${currentNumber}`);

  console.log("Adding a patrick...");
  const transactionResponse = await simpleStorage.addPerson("Patrick", 50);
  await transactionResponse.wait(1);

  const updatedValue = await simpleStorage.retrieve();
  console.log(`Updated Value is: ${updatedValue}`);
}

async function verify(contractAddress, args) {
  console.log("Verifying...");
  try {
    await run("verify:verify", {
      address: contractAddress,
      constructorArguments: args,
    });
  } catch (e) {
    if (e.message.toLowerCase().includes("already verified")) {
      console.log("Already verified");
    } else {
      console.log(e);
    }
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
