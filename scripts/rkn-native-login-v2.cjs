const fs = require("node:fs");
const ts = require("typescript");

const file = process.argv[2];

let src =
  fs.readFileSync(file, "utf8");

/*
 * Remove obsolete client auth/router imports.
 */
src = src.replace(
  /^import\s+\{\s*useRouter\s*\}\s+from\s+"next\/navigation";\s*\r?\n/m,
  ""
);

src = src.replace(
  /^import\s+\{\s*authClient\s*\}\s+from\s+"@\/lib\/auth-client";\s*\r?\n/m,
  ""
);

src = src.replace(
  /^\s*const\s+router\s*=\s*useRouter\(\);\s*\r?\n/m,
  ""
);

/*
 * Parse TSX and find the existing login submit handler.
 */
const sourceFile =
  ts.createSourceFile(
    file,
    src,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX
  );

let target = null;

function visit(node) {
  if (
    ts.isFunctionDeclaration(node) &&
    node.name &&
    node.parameters.length >= 1
  ) {
    const parameter =
      node.parameters[0];

    const typeText =
      parameter.type
        ? parameter.type.getText(sourceFile)
        : "";

    if (
      typeText.includes(
        "FormEvent<HTMLFormElement>"
      )
    ) {
      target = node;
      return;
    }
  }

  ts.forEachChild(node, visit);
}

visit(sourceFile);

if (!target) {
  throw new Error(
    "LOGIN_HANDLER_NOT_FOUND"
  );
}

const handlerName =
  target.name.text;

const replacement = `function ${handlerName}(
    event: FormEvent<HTMLFormElement>
  ) {
    /*
     * RKN_NATIVE_LOGIN_V2
     *
     * Do not prevent native submission.
     * Browser performs a top-level POST.
     */
    void event;
    setMessage("");
  }`;

src =
  src.slice(
    0,
    target.getStart(sourceFile)
  ) +
  replacement +
  src.slice(target.end);

/*
 * Add native action/method to the first login form.
 */
if (
  !src.includes(
    'action="/api/rkn/native-login"'
  )
) {
  const formRegex =
    /<form\b([\s\S]*?)>/;

  if (!formRegex.test(src)) {
    throw new Error(
      "LOGIN_FORM_NOT_FOUND"
    );
  }

  src = src.replace(
    formRegex,
    (match, attrs) =>
      `<form${attrs}
        action="/api/rkn/native-login"
        method="post">`
  );
}

/*
 * Ensure native form fields have names.
 */
if (
  !src.includes(
    'name="username"'
  )
) {
  if (
    !src.includes(
      "ref={usernameRef}"
    )
  ) {
    throw new Error(
      "USERNAME_INPUT_NOT_FOUND"
    );
  }

  src = src.replace(
    "ref={usernameRef}",
    `name="username"
                ref={usernameRef}`
  );
}

if (
  !src.includes(
    'name="password"'
  )
) {
  if (
    !src.includes(
      "ref={passwordRef}"
    )
  ) {
    throw new Error(
      "PASSWORD_INPUT_NOT_FOUND"
    );
  }

  src = src.replace(
    "ref={passwordRef}",
    `name="password"
                ref={passwordRef}`
  );
}

fs.writeFileSync(
  file,
  src,
  "utf8"
);

console.log(
  "LOGIN_HANDLER_REPLACED_PASS"
);

console.log(
  "NATIVE_FORM_ACTION_PASS"
);

console.log(
  "LOGIN_CLIENT_AUTH_REMOVED_PASS"
);