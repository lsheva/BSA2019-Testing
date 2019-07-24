import CartParser from "./CartParser";
import fs, { readFileSync } from "fs";
import path from "path";

import v4 from "uuid";

let parser, parse, validate, parseLine;
jest.mock("uuid");
jest.mock("fs", () => ({
  readFileSync: jest.fn()
}));

describe("CartParser - unit tests", () => {
  beforeEach(() => {
    parser = new CartParser();
    parse = parser.parse.bind(parser);
    validate = parser.validate.bind(parser);
    parseLine = parser.parseLine.bind(parser);
  });

  beforeAll(() => {
    v4.mockReturnValue("1234");
  });

  describe("parse", () => {
    const fs = require("fs");
    it("should throw error if there is an empty row", () => {
      const contents = `Product name,Price,Quantity
			First product,9.22,2
			
			Second product,10.32,5
			last product,18.90,1`;
      readFileSync.mockReturnValueOnce(contents);
      const result = () => {
        return parse();
      };
      expect(result).toThrow(Error);
    });
    it("should return total price", () => {
      const contents = `Product name,Price,Quantity
			First product,9,2
			Second product,10,5
			last product,2,1`;
      fs.readFileSync.mockReturnValueOnce(contents);
      const { total } = parse();
      expect(total).toEqual(70);
    });
  });

  describe("validate", () => {
    it("should return empty array if schema is correct", () => {
      const contents = `Product name,Price,Quantity
			Name of the product,9.22,2
			Second product,10.32,5
			last product,18.90,1`;
      const errors = validate(contents);
      expect(errors.length).toEqual(0);
    });
    it("should return error type 'header' if one header cell is named wrong", () => {
      const contents = `Product surname,Price,Quantity
			Name of the product,9.22,2
			Second product,10.32,5
			last product,18.90,1`;
      const errors = validate(contents);
      expect(errors[0].type).toEqual("header");
    });
    it("should return error type 'row' if there is 2 cells in a row", () => {
      const contents = `Product name,Price,Quantity
			potato,9.22
			cabbage,10.32,5
			onion,18.90,1`;
      const errors = validate(contents);
      expect(errors[0].type).toEqual("row");
    });
    it("should return error type 'cell' if NUMBER_POSITIVE field is negative", () => {
      const contents = `Product name,Price,Quantity
			Name of the product,9.22,-2
			Name of the product2,1,1
			Second product,10.32,5
			last product,18.90,1`;
      const errors = validate(contents);
      expect(errors[0].type).toEqual("cell");
    });
    it("should return error if NUMBER_POSITIVE field is empty", () => {
      const contents = `Product name,Price,Quantity
			Name of the product,9.22,2
			Name of the product2,,1
			Second product,10.32,5
			last product,18.90,1`;
      const errors = validate(contents);
      expect(errors.length).toEqual(1);
    });
    it("should return error if NUMBER_POSITIVE field is Infinity", () => {
      const contents = `Product name,Price,Quantity
			Name of the product,9.22,2
			Name of the product2,Infinity,1
			Second product,10.32,5
			last product,18.90,1`;
      const errors = validate(contents);
      expect(errors.length).toEqual(1);
    });
    it("should return error type cell if STRING field is empty", () => {
      const contents = `Product name,Price,Quantity
			First product,9.22,2
			,5,1
			Second product,10.32,5
			last product,18.90,1`;
      const errors = validate(contents);
      expect(errors[0].type).toEqual("cell");
    });
  });
  describe("parseLine", () => {
    it("should return a valid json object", () => {
      const csvLine = `Potato,9.22,2`;
      const item = parseLine(csvLine);
      expect(item).toEqual({
        id: "1234",
        name: "Potato",
        price: 9.22,
        quantity: 2
      });
    });
    it("should return null if csv line is empty", () => {
      const csvLine = "  ";
      const item = parseLine(csvLine);
      expect(item).toEqual({});
    });
  });
});

describe("CartParser - integration test", () => {
  it("should return a correct json object", () => {
    const absPath = path.resolve(__dirname, "../samples/test.csv");
    const contents = `Product name,Price,Quantity
		Potato,9.00,2
		Garlic,10,1
		Cucumber,18,1`;

    const actualFn = jest.requireActual("fs").readFileSync;
    fs.readFileSync.mockImplementationOnce(actualFn);

    const result = parse(absPath);
    const expectedResult = {
      items: [
        {
          id: "1234",
          name: "Potato",
          price: 9,
          quantity: 2
        },
        {
          id: "1234",
          name: "Garlic",
          price: 10,
          quantity: 1
        },
        {
          id: "1234",
          name: "Cucumber",
          price: 18,
          quantity: 1
        }
      ],
      total: 46
    };

    expect(result).toEqual(expectedResult);
  });
});
