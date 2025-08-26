const axios = require("axios");

class ProductAPI {
  constructor(baseURL) {
    this.baseURL = baseURL;
  }

  async getProducts() {
    const response = await axios.get(`${this.baseURL}/products`, {
      headers: {
        Authorization: "Bearer some-token",
      },
    });
    return response.data;
  }
}

module.exports = ProductAPI;
