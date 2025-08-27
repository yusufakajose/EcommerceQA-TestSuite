/* eslint-disable no-redeclare */
const { Pact } = require('@pact-foundation/pact');
const path = require('path');
const ProductAPI = require('./product-api');
const { eachLike, somethingLike } = require('@pact-foundation/pact').Matchers;

describe('API Pact test', () => {
  // Initialize a Pact mock service per suite (avoid name 'pact' to prevent redeclare warnings)
  let provider;
  beforeAll(() => {
    provider = new Pact({
      port: 1234,
      log: path.resolve(process.cwd(), 'logs', 'pact.log'),
      dir: path.resolve(process.cwd(), 'pacts'),
      spec: 2,
      consumer: 'EcommerceWebApp',
      provider: 'ProductService',
    });
    return provider.setup();
  });
  afterAll(() => provider.finalize());

  describe('retrieving products', () => {
    test('products exists', async () => {
      const interaction = {
        state: 'products exist',
        uponReceiving: 'a request to get all products',
        withRequest: {
          method: 'GET',
          path: '/products',
          headers: {
            Authorization: 'Bearer some-token',
          },
        },
        willRespondWith: {
          status: 200,
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
          },
          body: eachLike({
            id: somethingLike(1),
            name: somethingLike('Product 1'),
            price: somethingLike(100),
          }),
        },
      };
      await provider.addInteraction(interaction);
      const productAPI = new ProductAPI(provider.mockService.baseUrl);
      const products = await productAPI.getProducts();
      expect(products).toBeInstanceOf(Array);
    });
  });
});
