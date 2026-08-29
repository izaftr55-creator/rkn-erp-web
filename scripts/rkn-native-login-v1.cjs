const fs = require("node:fs");

const file = process.argv[2];

let src =
  fs.readFileSync(
    file,
    "utf8"
  );

if (
  !src.includes(
    "RKN_NATIVE_LOGIN_NAV_V1"
  )
) {
  const marker =
    "event.preventDefault();";

  if (!src.includes(marker)) {
    throw new Error(
      "LOGIN_SUBMIT_MARKER_NOT_FOUND"
    );
  }

  const replacement = `event.preventDefault();

    /*
     * RKN_NATIVE_LOGIN_NAV_V1
     *
     * Do not authenticate through browser fetch.
     * Submit as a real top-level HTTPS POST so
     * Safari receives the Better Auth session
     * cookie from the navigation response.
     */
    const nativeForm =
      event.currentTarget;

    nativeForm.action =
      "/api/rkn/native-login";

    nativeForm.method =
      "post";

    nativeForm.submit();

    return;`;

  src =
    src.replace(
      marker,
      replacement
    );
}

if (
  !src.includes(
    'name="username"'
  )
) {
  const usernameMarker =
    "ref={usernameRef}";

  if (
    !src.includes(
      usernameMarker
    )
  ) {
    throw new Error(
      "USERNAME_REF_NOT_FOUND"
    );
  }

  src =
    src.replace(
      usernameMarker,
      `name="username"
                ref={usernameRef}`
    );
}

if (
  !src.includes(
    'name="password"'
  )
) {
  const passwordMarker =
    "ref={passwordRef}";

  if (
    !src.includes(
      passwordMarker
    )
  ) {
    throw new Error(
      "PASSWORD_REF_NOT_FOUND"
    );
  }

  src =
    src.replace(
      passwordMarker,
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
  "LOGIN_NATIVE_FORM_PATCH_PASS"
);