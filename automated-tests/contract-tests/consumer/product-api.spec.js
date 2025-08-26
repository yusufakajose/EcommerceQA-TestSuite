const { Pact } = require("@pact-foundation/pact");
const ProductAPI = require("./product-api");
const { eachLike, somethingLike } = require("@pact-foundation/pact").Matchers;

describe("API Pact test", () => {
  beforeAll(() => pact.setup());
  afterAll(() => pact.finalize());

  describe("retrieving products", () => {
    test("products exists", async () => {
      const interaction = {
        state: "products exist",
        uponReceiving: "a request to get all products",
        withRequest: {
          method: "GET",
          path: "/products",
          headers: {
            Authorization: "Bearer some-token",
          },
        },
        willRespondWith: {
          status: 200,
          headers: {
            "Content-Type": "application/json; charset=utf-8",
          },
          body: eachLike({
            id: somethingLike(1),
            name: somethingLike("Product 1"),
            price: somethingLike(100),
          }),
        },
      };
      await pact.addInteraction(interaction);
      const productAPI = new ProductAPI(pact.mockService.baseUrl);
      const products = await productAPI.getProducts();
      expect(products).toBeInstanceOf(Array);
    });
  });
});
