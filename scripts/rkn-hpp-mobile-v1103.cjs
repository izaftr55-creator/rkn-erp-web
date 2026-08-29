const fs =
  require("node:fs");

const file =
  process.argv[2];

let source =
  fs.readFileSync(
    file,
    "utf8"
  );


/*
 * ==============================================
 * MANUAL HPP STATE
 * ==============================================
 */

const stateRegex =
  /const\s*\[\s*manualHpp,\s*setManualHpp,\s*\]\s*=\s*useState\(0\);/;

if (
  stateRegex.test(source)
) {
  source =
    source.replace(
      stateRegex,
`const [
    manualHpp,
    setManualHpp,
  ] = useState<number | "">("");`
    );
}


/*
 * Existing reset values:
 * zero -> empty input.
 */
source =
  source.replace(
    /setManualHpp\(0\);/g,
    'setManualHpp("");'
  );


/*
 * Existing saved HPP values.
 */
source =
  source.replace(
    /setManualHpp\(\s*Number\(\s*saved\.manual_hpp\s*\)\s*\|\|\s*0\s*\);/g,
`setManualHpp(
      Number(saved.manual_hpp) > 0
        ? Number(saved.manual_hpp)
        : ""
    );`
  );


/*
 * effectiveHpp must always be numeric.
 */
source =
  source.replace(
    /const\s+effectiveHpp\s*=\s*method\s*===\s*"MANUAL"\s*\?\s*manualHpp\s*:\s*calculatedHpp\s*;/,
`const effectiveHpp =
    method === "MANUAL"
      ? Number(manualHpp) || 0
      : calculatedHpp;`
  );


/*
 * Manual input handler.
 * Empty string remains empty while typing.
 */
const oldInput = `                  onChange={(event) =>
                    setManualHpp(
                      Math.max(
                        0,
                        Number(
                          event.target
                            .value
                        ) || 0
                      )
                    )
                  }`;

const newInput = `                  onChange={(event) => {
                    const raw =
                      event.target.value;

                    if (raw === "") {
                      setManualHpp("");
                      return;
                    }

                    const next =
                      Number(raw);

                    setManualHpp(
                      Number.isFinite(next)
                        ? Math.max(0, next)
                        : ""
                    );
                  }`;

if (
  source.includes(oldInput)
) {
  source =
    source.replace(
      oldInput,
      newInput
    );
}
else if (
  !source.includes(
    'if (raw === "")'
  )
) {
  throw new Error(
    "MANUAL_HPP_INPUT_HANDLER_NOT_FOUND"
  );
}


/*
 * Save payload can remain number/string,
 * but explicitly normalize before API.
 */
source =
  source.replace(
    /(\s+)manualHpp,\s*\n(\s+)components,/,
`$1manualHpp:
                  Number(manualHpp) || 0,
$2components,`
  );


fs.writeFileSync(
  file,
  source,
  "utf8"
);

console.log(
  "MANUAL_HPP_BLANK_INPUT_PASS"
);