import { assert, expect } from "chai";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { network, deployments, ethers, getNamedAccounts } from "hardhat";
import { FundMe, MockV3Aggregator } from "../../typechain";

describe("FundMe", async function () {
  let fundMe: FundMe;
  let mockV3Aggregator: MockV3Aggregator;
  let deployer: SignerWithAddress;

  beforeEach(async () => {
    const accounts = await ethers.getSigners();
    deployer = accounts[0];
    await deployments.fixture(["all"]);
    fundMe = await ethers.getContract("FundMe", deployer);
    mockV3Aggregator = await ethers.getContract("MockV3Aggregator");
  });

  describe("constructor", function () {
    it("sets the aggregator addresses correctly", async () => {
      const response = await fundMe.priceFeed();
      assert.equal(response, mockV3Aggregator.address);
    });
  });

  describe("fund", function () {
    it("fails if you don't send enough eth", async () => {
      await expect(fundMe.fund()).to.be.revertedWith(
        "Didn't send enough funds"
      );
    });

    // we could be even more precise here by making sure exactly $50 works
    // but this is good enough for now
    it("Updates the amount funded data structure", async () => {
      await fundMe.fund({ value: ethers.utils.parseEther("1") });
      const response = await fundMe.addressToAmountFunded(deployer.address);
      assert.equal(
        response.toString(),
        ethers.utils.parseEther("1").toString()
      );
    });

    it("Adds funder to array of funders", async () => {
      await fundMe.fund({ value: ethers.utils.parseEther("1") });
      const response = await fundMe.funders(0);
      assert.equal(response, deployer.address);
    });
  });
  describe("withdraw", function () {
    it("is allows us to withdraw with multiple funders", async () => {
      // Arrange
      const accounts = await ethers.getSigners();
      await fundMe
        .connect(accounts[1])
        .fund({ value: ethers.utils.parseEther("1") });
      await fundMe
        .connect(accounts[2])
        .fund({ value: ethers.utils.parseEther("1") });
      await fundMe
        .connect(accounts[3])
        .fund({ value: ethers.utils.parseEther("1") });
      await fundMe
        .connect(accounts[4])
        .fund({ value: ethers.utils.parseEther("1") });
      await fundMe
        .connect(accounts[5])
        .fund({ value: ethers.utils.parseEther("1") });
      // Act
      const startingFundMeBalance = await fundMe.provider.getBalance(
        fundMe.address
      );
      const startingDeployerBalance = await fundMe.provider.getBalance(
        deployer.address
      );
      const transactionResponse = await fundMe.withdraw();
      const transactionReceipt = await transactionResponse.wait();
      const { gasUsed, effectiveGasPrice } = transactionReceipt;
      const withdrawGasCost = gasUsed.mul(effectiveGasPrice);
      const endingFundMeBalance = await fundMe.provider.getBalance(
        fundMe.address
      );
      const endingDeployerBalance = await fundMe.provider.getBalance(
        deployer.address
      );
      // Assert
      assert.equal(
        startingFundMeBalance.add(startingDeployerBalance).toString(),
        endingDeployerBalance.add(withdrawGasCost).toString()
      );
      await expect(fundMe.funders(0)).to.be.reverted;
      assert.equal(
        (await fundMe.addressToAmountFunded(accounts[1].address)).toString(),
        "0"
      );
      assert.equal(
        (await fundMe.addressToAmountFunded(accounts[2].address)).toString(),
        "0"
      );
      assert.equal(
        (await fundMe.addressToAmountFunded(accounts[3].address)).toString(),
        "0"
      );
      assert.equal(
        (await fundMe.addressToAmountFunded(accounts[4].address)).toString(),
        "0"
      );
      assert.equal(
        (await fundMe.addressToAmountFunded(accounts[5].address)).toString(),
        "0"
      );
    });

    it("only allows owner to withdraw", async () => {
      const accounts = await ethers.getSigners();
      const fundMeConnectedContract = fundMe.connect(accounts[1]);
      await expect(fundMeConnectedContract.withdraw()).to.be.revertedWith(
        "NotOwner"
      );
    });
  });
});
