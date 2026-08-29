const fs = require("node:fs");

const file =
  process.argv[2];

let source =
  fs.readFileSync(
    file,
    "utf8"
  );

if (
  !source.includes(
    "RKN_HPP_CLOSE_ICON_V1104"
  )
) {
  const oldBlock =
`              <button
                type="button"
                className={styles.close}
                onClick={() =>
                  setEditorOpen(
                    false
                  )
                }
              >
                ×
              </button>`;

  const newBlock =
`              <button
                type="button"
                className={styles.close}
                onClick={() =>
                  setEditorOpen(
                    false
                  )
                }
                aria-label="Tutup editor HPP"
              >
                {/* RKN_HPP_CLOSE_ICON_V1104 */}
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.9"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="m6 6 12 12" />
                  <path d="m18 6-12 12" />
                </svg>
              </button>`;

  if (
    !source.includes(
      oldBlock
    )
  ) {
    throw new Error(
      "CLOSE_BUTTON_BLOCK_NOT_FOUND"
    );
  }

  source =
    source.replace(
      oldBlock,
      newBlock
    );
}

fs.writeFileSync(
  file,
  source,
  "utf8"
);

console.log(
  "CLOSE_BUTTON_PATCH_PASS"
);