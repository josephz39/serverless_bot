// Sift is a small routing library that abstracts away details like starting a
// listener on a port, and provides a simple function (serve) that has an API
// to invoke a function for a specific path.
import {
    json,
    serve,
    validateRequest,
} from "https://deno.land/x/sift@0.6.0/mod.ts";
// TweetNaCl is a cryptography library that we use to verify requests
// from Discord.
import nacl from "https://esm.sh/tweetnacl@v1.0.3?dts";
  
// For all requests to "/" endpoint, we want to invoke home() handler.
serve({
    "/SERVERLESS_DB": home,
});
  
// The main logic of the Discord Slash Command is defined in this function.
async function home(request: Request) {
    // validateRequest() ensures that a request is of POST method and
    // has the following headers.
    const { error } = await validateRequest(request, {
        POST: {
            headers: ["X-Signature-Ed25519", "X-Signature-Timestamp"],
        },
    });
    if (error) {
        return json({ error: error.message }, { status: error.status });
    }
  
    // verifySignature() verifies if the request is coming from Discord.
    // When the request's signature is not valid, we return a 401 and this is
    // important as Discord sends invalid requests to test our verification.
    const { valid, body } = await verifySignature(request);
    if (!valid) {
        return json(
            { error: "Invalid request" },
            {
            status: 401,
            },
        );
    }
  
const { type = 0, data = { options: [] } } = JSON.parse(body);
    // Discord performs Ping interactions to test our application.
    // Type 1 in a request implies a Ping interaction.
    if (type === 1) {
        return json({
            type: 1, // Type 1 in a response is a Pong interaction response type.
        });
    }
  
    // Type 2 in a request is an ApplicationCommand interaction.
    // It implies that a user has issued a command.
    if (type === 2) {
        const { value } = data.options.find((option) => option.name === "name");
        return json({
            // Type 4 responds with the below message retaining the user's
            // input at the top.
            type: 4,
            data: {
            content: `Hello, ${value}!`,
            },
        });
    }
  
    // We will return a bad request error as a valid Discord request
    // shouldn't reach here.
    return json({ error: "bad request" }, { status: 400 });
}
  
/** Verify whether the request is coming from Discord. */
async function verifySignature(
request: Request,
): Promise<{ valid: boolean; body: string }> {
    const PUBLIC_KEY = "b5a30c18e969d830b2d39502d3db91236ef76c4b6fc5a1ed8bc76ea7afc1d43b";
    // Discord sends these headers with every request.
    const signature = request.headers.get("X-Signature-Ed25519")!;
    const timestamp = request.headers.get("X-Signature-Timestamp")!;
    const body = await request.text();
    const valid = nacl.sign.detached.verify(
    new TextEncoder().encode(timestamp + body),
    hexToUint8Array(signature),
    hexToUint8Array(PUBLIC_KEY),
    );
    return { valid, body };
  }
  
/** Converts a hexadecimal string to Uint8Array. */
function hexToUint8Array(hex: string) {
    return new Uint8Array(
      hex.match(/.{1,2}/g)!.map((val) => parseInt(val, 16)),
    );
}
  