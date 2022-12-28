require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const port = 3000;

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const refreshTokens = []; //{userId, refreshToken}

app.get("/", async (req, res) => {
  if (req.headers.authorization) {
    const token = req.headers.authorization;
    // Роблю запит на дані користувача
    const response = await fetch("https://kpi.eu.auth0.com/userinfo", {
      headers: {
        Authorization: token,
      },
    });
    const user = await response.json();
    return res.json({
      username: user.name,
      logout: "http://localhost:3000/logout",
    });
  }
  res.sendFile(path.join(__dirname + "/index.html"));
});

app.get("/logout", (req, res) => {
  // sessions.destroy(req, res);
  res.cookie("refreshToken", "", { maxAge: 0, httpOnly: true });
  res.redirect("/");
});

app.post("/api/login", async (req, res) => {
  const { login, password } = req.body;

  const data = {
    audience: process.env.AUDIENCE,
    grant_type: process.env.GRANT_TYPE,
    client_id: process.env.CLIENT_ID,
    client_secret: process.env.CLIENT_SECRET,
    realm: process.env.REALM,
    scope: process.env.SCOPE,
    username: login,
    password: password,
  };

  const response = await fetch("https://kpi.eu.auth0.com/oauth/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(data),
  });

  if (response.status === 200) {
    const { access_token, refresh_token, expires_in } = await response.json();
    res.cookie("refreshToken", refresh_token, {
      maxAge: expires_in,
      httpOnly: true,
    });
    res.json({ success: true, access_token });
    return;
  }
  res.status(400).json(await response.json());
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
