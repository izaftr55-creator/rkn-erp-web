import Database from "better-sqlite3";
import { betterAuth } from "better-auth";
import { username } from "better-auth/plugins";
import { randomBytes } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const db = new Database("./data/rkn-erp.sqlite");

db.pragma("foreign_keys = ON");
db.pragma("busy_timeout = 5000");

const stamp = new Date()
  .toISOString()
  .replaceAll(":", "-")
  .replaceAll(".", "-");

const backupPath =
  "./data/rkn-erp.before-users-" + stamp + ".sqlite";

await db.backup(backupPath);

const auth = betterAuth({
  database: db,
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,

  emailAndPassword: {
    enabled: true,
    disableSignUp: false,
    minPasswordLength: 10,
    maxPasswordLength: 128,
    autoSignIn: false,
  },

  plugins: [
    username({
      minUsernameLength: 3,
      maxUsernameLength: 30,
    }),
  ],
});

const people = [
  {
    key: "FATUR",
    name: "LUTFIRZA FATURAHMAN",
    username: "fatur",
    email: "fatur@rkn.invalid",
  },
  {
    key: "DISA",
    name: "DISA ADITYA KIRANA",
    username: "disa",
    email: "disa@rkn.invalid",
  },
  {
    key: "MUMUH",
    name: "MUMUH MUHTAR",
    username: "mumuh",
    email: "mumuh@rkn.invalid",
  },
  {
    key: "KOKO",
    name: "KOKO INDRIYANTO",
    username: "koko",
    email: "koko@rkn.invalid",
  },
];

const findUser = db.prepare(`
  SELECT id, name, username, email
  FROM user
  WHERE username = ?
     OR email = ?
  LIMIT 1
`);

const credentials = [];

for (const person of people) {
  let user = findUser.get(
    person.username,
    person.email
  );

  if (!user) {
    const password =
      randomBytes(18).toString("base64url");

    await auth.api.signUpEmail({
      body: {
        name: person.name,
        email: person.email,
        password,
        username: person.username,
        displayUsername: person.username,
      },
    });

    user = findUser.get(
      person.username,
      person.email
    );

    if (!user) {
      throw new Error(
        "USER_CREATE_FAILED: " + person.key
      );
    }

    credentials.push({
      name: person.name,
      username: person.username,
      password,
    });
  }
}

if (credentials.length > 0) {
  const credentialPath =
    "./data/private/initial-credentials-" +
    stamp +
    ".txt";

  const text = credentials
    .flatMap((item) => [
      item.name,
      "Username: " + item.username,
      "Temporary Password: " + item.password,
      "",
    ])
    .join("\r\n");

  fs.writeFileSync(
    credentialPath,
    text,
    "utf8"
  );

  console.log(
    "CREDENTIAL_FILE=" +
    path.resolve(credentialPath)
  );
}

const users = db.prepare(`
  SELECT name, username
  FROM user
  ORDER BY username
`).all();

console.log("AUTH_USERS_BOOTSTRAP_OK");
console.log("USERS=" + users.length);
console.table(users);
console.log("DATABASE_BACKUP=" + path.resolve(backupPath));

db.close();