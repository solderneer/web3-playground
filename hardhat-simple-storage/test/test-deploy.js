const { ethers } = require("hardhat");
const { expect, assert } = require("chai");

describe("SimpleStorage", function () {
  let simpleStorageFactory, simpleStorage;

  beforeEach(async function () {
    simpleStorageFactory = await ethers.getContractFactory("SimpleStorage");
    simpleStorage = await simpleStorageFactory.deploy();
  });

  it("Should start with a number of 0", async function () {
    const currentNumber = await simpleStorage.retrieve();
    const expectedValue = "0";

    assert.equal(currentNumber.toString(), expectedValue);
  });

  it("Should update when you call store", async function () {
    const expectValue = "25";

    const transactionResponse = await simpleStorage.addPerson("Patrick", 50);
    await transactionResponse.wait(1);

    const currentNumber = await simpleStorage.retrieve();
    assert.equal(currentNumber.toString(), expectValue);
  });
});
