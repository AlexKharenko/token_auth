require("dotenv").config();
const express = require("express");
const jwt = require("jsonwebtoken");
const bodyParser = require("body-parser");
var cors = require("cors");
const path = require("path");
const port = 3000;

const checkJwt = async (req, res, next) => {
  try {
    if (req.headers.authorization) {
      const response = await fetch("https://kpi.eu.auth0.com/pem");
      const publicKey = await response.text();

      const token = req.headers.authorization.split(" ")[1];
      jwt.verify(token, publicKey);
      next();
    }
  } catch (err) {
    res.status(403).json({ success: false, redirect: "/" });
  }
};

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(cors({ origin: "*" }));

app.get("/login", async (req, res) => {
  res.redirect(
    301,
    `https://kpi.eu.auth0.com/authorize?client_id=JIvCO5c2IBHlAe2patn6l6q5H35qxti0&redirect_uri=http://localhost:3000&response_type=code&response_mode=query&scope=${process.env.SCOPE}`
  );
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname + "/profile.html"));
});

app.get("/api/login", async (req, res) => {
  const { code } = req.query;
  const data = {
    code,
    grant_type: process.env.GRANT_TYPE,
    redirect_uri: "http://localhost:3000",
    client_id: process.env.CLIENT_ID,
    client_secret: process.env.CLIENT_SECRET,
  };

  const response = await fetch("https://kpi.eu.auth0.com/oauth/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(data),
  });
  if (response.status === 200) {
    const data = await response.json();
    const { access_token, refresh_token, expires_in } = data;
    res.cookie("refreshToken", refresh_token, {
      maxAge: expires_in,
      httpOnly: true,
    });
    res.json({ success: true, access_token });
    return;
  }
  res.json({ success: false, redirect: "/login" });
});

app.get("/api/profile", async (req, res) => {
  const token = req.headers.authorization;
  // Роблю запит на дані користувача
  const response = await fetch("https://kpi.eu.auth0.com/userinfo", {
    headers: {
      Authorization: token,
    },
  });
  const user = await response.json();
  return res.json({
    success: true,
    user,
  });
});

app.get("/logout", (req, res) => {
  // sessions.destroy(req, res);
  res.cookie("refreshToken", "", { maxAge: 0, httpOnly: true });
  res.redirect("/");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
