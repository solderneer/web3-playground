import { ethers } from "ethers";
import fs from "fs";
import "dotenv/config";

async function main() {
  let key: string;
  let rpc_url: string;

  if (process.env["PRIVATE_KEY"] == undefined) throw "No PRIVATE_KEY";
  else key = process.env["PRIVATE_KEY"];
  if (process.env["RPC_URL"] == undefined) throw "No RPC_URL";
  else rpc_url = process.env["RPC_URL"];

  const provider = new ethers.providers.JsonRpcProvider(rpc_url);
  const wallet = new ethers.Wallet(key, provider);
  const abi = fs.readFileSync(
    "./build/SimpleStorage_sol_SimpleStorage.abi",
    "utf-8"
  );
  const bin = fs.readFileSync(
    "./build/SimpleStorage_sol_SimpleStorage.bin",
    "utf-8"
  );

  const contractFactory = new ethers.ContractFactory(abi, bin, wallet);
  console.log("Deploying... please wait");

  const contract = await contractFactory.deploy();
  let transactionReceipt = await contract.deployTransaction.wait(1);

  console.log("Here is the transaction response:");
  console.log(contract.deployTransaction);

  console.log("Here is the transaction receipt");
  console.log(transactionReceipt);

  /* Deplying manually with tx
  console.log("Let's deploy with only transaction data");
  const nonce = await wallet.getTransactionCount();
  const tx = {
    nonce: nonce,
    gasPrice: 200000000,
    gasLimit: 1000000,
    to: null,
    value: 0,
    data: "0x00",
    chainIf: 1337,
  };

  const sentTxResponse = await wallet.sendTransaction(tx);
  await sentTxResponse.wait(1);
  console.log(sentTxResponse);
  */

  let currentNumber = await contract.retrieve();
  console.log(`Current Number: ${currentNumber}`);

  const transactionResponse = await contract.addPerson("Patrick", "50");
  transactionReceipt = transactionResponse.wait(1);
  currentNumber = await contract.retrieve();
  console.log(`Updated Number: ${currentNumber}`);

  return;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
