const fs =
  require("node:fs");
const file =
  process.argv[2];
let source =
  fs.readFileSync(
    file,
    "utf8"
  );
function fail(message) {
  console.error(message);
  process.exit(1);
}
if (
  source.includes(
    "RKN_LOGIN_ERROR_FEEDBACK_V1"
  )
) {
  console.log(
    "LOGIN_FEEDBACK_ALREADY_PRESENT"
  );
  process.exit(0);
}
/*
 * Add useEffect to existing React imports.
 */
if (
  !source.includes(
    "useEffect,"
  )
) {
  const importAnchor =
`import {
  FormEvent,
  useRef,
  useState,
} from "react";`;
  const importReplacement =
`import {
  FormEvent,
  useEffect,
  useRef,
  useState,
} from "react";`;
  if (
    !source.includes(
      importAnchor
    )
  ) {
    fail(
      "REACT_IMPORT_ANCHOR_NOT_FOUND"
    );
  }
  source =
    source.replace(
      importAnchor,
      importReplacement
    );
}
/*
 * Insert URL feedback reader immediately
 * before handleSubmit().
 */
const handlerAnchor =
`  function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {`;
if (
  !source.includes(
    handlerAnchor
  )
) {
  fail(
    "HANDLE_SUBMIT_ANCHOR_NOT_FOUND"
  );
}
const feedback =
`  /*
   * RKN_LOGIN_ERROR_FEEDBACK_V1
   *
   * Native login redirects back with:
   * /login?auth=<reason>
   *
   * Read it after mount so the native
   * top-level login flow remains untouched.
   */
  useEffect(() => {
    const params =
      new URLSearchParams(
        window.location.search
      );
    const reason =
      params.get("auth");
    if (!reason) {
      return;
    }
    if (reason === "invalid") {
      setMessage(
        "Username atau kata sandi tidak valid."
      );
    }
    else if (reason === "required") {
      setMessage(
        "Username dan kata sandi wajib diisi."
      );
    }
    else if (reason === "cookie") {
      setMessage(
        "Sesi login tidak dapat dibuat. Silakan coba lagi."
      );
    }
    else {
      setMessage(
        "Login tidak dapat diproses. Silakan coba lagi."
      );
    }
    /*
     * Remove error query from address bar
     * after the message has been captured.
     */
    window.history.replaceState(
      {},
      "",
      "/login"
    );
  }, []);
`;
source =
  source.replace(
    handlerAnchor,
    feedback +
      handlerAnchor
  );
fs.writeFileSync(
  file,
  source,
  "utf8"
);
console.log(
  "LOGIN_FEEDBACK_SOURCE_PASS"
);