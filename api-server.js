const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");
const authConfig = require("./src/auth_config.json");
const jwt = require("express-jwt");
const jwksRsa = require("jwks-rsa");
const jwtAuthz = require("express-jwt-authz");

const app = express();

const port = process.env.API_PORT || 3001;
const appPort = process.env.SERVER_PORT || 3000;
const appOrigin = authConfig.appOrigin || `http://localhost:${appPort}`;

if (!authConfig.domain || !authConfig.audience) {
  throw new Error(
    "Please make sure that auth_config.json is in place and populated"
  );
}

const authorizeAccessToken = jwt({
  secret:jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri:'https://${authConfig.domain}/.well-known/jwks.json'
  }),
  audience: 'http://quickstart/api',//authConfig.audience,
  issuer:'https://dev-xxydsuqxksva0tlu.us.auth0.com/',//'https://${authConfig.domain}/',
  algorithms: ["RS256"]
});

const checkPermissions = jwtAuthz(["read:messages","read:appointments"], {
  customScopeKey: "permissions",
  checkAllScopes:true
});

app.use(morgan("dev"));
app.use(helmet());
app.use(cors({ origin: appOrigin }));

app.get("/api/public", (req, res) => {
  res.send({
    msg: "You called the public API!"
  });
});

app.get("/api/protected", authorizeAccessToken, (req, res) => {
  res.send({
    msg: "You called the protected API!"
  });
});

app.get("/api/role", authorizeAccessToken, checkPermissions, (req, res) => {
  res.send({
    msg: "You called the role API!"
  });
});

app.listen(port, () => console.log(`API Server listening on port ${port}`));
