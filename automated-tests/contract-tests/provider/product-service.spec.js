const { Verifier } = require("@pact-foundation/pact");
const path = require("path");

describe("Pact Verification", () => {
  it("validates the expectations of ProductService", () => {
    const opts = {
      providerBaseUrl: "http://localhost:8081",
      pactUrls: [
        path.resolve(
          process.cwd(),
          "pacts",
          "EcommerceWebApp-ProductService.json"
        ),
      ],
    };

    return new Verifier(opts).verifyProvider().then((output) => {
      console.log("Pact Verification Complete!");
      console.log(output);
    });
  });
});
